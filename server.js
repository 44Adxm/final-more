import crypto from "node:crypto";
import { createServer } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const dataFile = path.join(__dirname, "data", "menu.json");
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "elpaso2026";
const sessions = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, payload, headers = {}) {
  send(res, status, JSON.stringify(payload), {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...headers
  });
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) {
      throw new Error("Payload is too large.");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)])
  );
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie);
  return Boolean(cookies.admin_session && sessions.has(cookies.admin_session));
}

function cleanText(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 240);
}

function normalizeMenu(input) {
  const days = Array.isArray(input.days) ? input.days : [];
  return {
    weekLabel: cleanText(input.weekLabel, "Tento týždeň"),
    note: cleanText(input.note, "Menu podávame od 11:00 do vypredania."),
    days: days.slice(0, 7).map((day) => ({
      day: cleanText(day.day, "Deň"),
      date: cleanText(day.date),
      soup: cleanText(day.soup),
      main: cleanText(day.main),
      alt: cleanText(day.alt),
      dessert: cleanText(day.dessert),
      price: cleanText(day.price, "7,90 EUR")
    }))
  };
}

async function getMenu() {
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function saveMenu(menu) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(menu, null, 2)}\n`, "utf8");
}

async function serveStatic(req, res, url) {
  const requested = decodeURIComponent(url.pathname);
  const safePath = requested === "/" ? "/index.html" : requested;
  const filePath = path.normalize(path.join(publicDir, safePath));

  if (!filePath.startsWith(publicDir)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const finalPath = stat.isDirectory() ? path.join(filePath, "index.html") : filePath;
    const ext = path.extname(finalPath).toLowerCase();
    const content = await fs.readFile(finalPath);
    send(res, 200, content, {
      "content-type": mimeTypes[ext] || "application/octet-stream",
      "cache-control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });
  } catch {
    send(res, 404, "Not found", { "content-type": "text/plain; charset=utf-8" });
  }
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/menu") {
      sendJson(res, 200, await getMenu());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/me") {
      sendJson(res, 200, { authenticated: isAuthenticated(req) });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/login") {
      const body = await readJsonBody(req);
      if (body.password !== adminPassword) {
        sendJson(res, 401, { error: "Nespravne heslo." });
        return;
      }

      const token = crypto.randomBytes(24).toString("hex");
      sessions.set(token, Date.now());
      sendJson(res, 200, { ok: true }, {
        "set-cookie": `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/logout") {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.admin_session) sessions.delete(cookies.admin_session);
      sendJson(res, 200, { ok: true }, {
        "set-cookie": "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
      });
      return;
    }

    if (req.method === "PUT" && url.pathname === "/api/menu") {
      if (!isAuthenticated(req)) {
        sendJson(res, 401, { error: "Najprv sa prihlas." });
        return;
      }

      const body = await readJsonBody(req);
      const menu = normalizeMenu(body);
      await saveMenu(menu);
      sendJson(res, 200, menu);
      return;
    }

    sendJson(res, 404, { error: "API endpoint neexistuje." });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Serverova chyba." });
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  await serveStatic(req, res, url);
}).listen(port, () => {
  console.log(`El Paso menu site running at http://localhost:${port}`);
  console.log("Menu management password: set ADMIN_PASSWORD in production.");
});
