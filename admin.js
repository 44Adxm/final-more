const loginPanel = document.querySelector("#login-panel");
const editorPanel = document.querySelector("#editor-panel");
const loginForm = document.querySelector("#login-form");
const menuForm = document.querySelector("#menu-form");
const daysEditor = document.querySelector("#days-editor");
const loginMessage = document.querySelector("#login-message");
const saveMessage = document.querySelector("#save-message");
const addDayButton = document.querySelector("#add-day");

const emptyDay = {
  day: "",
  date: "",
  soup: "",
  main: "",
  alt: "",
  dessert: "",
  price: ""
};

function showEditor(show) {
  loginPanel.classList.toggle("is-hidden", show);
  editorPanel.classList.toggle("is-hidden", !show);
}

function dayTemplate(day = emptyDay, index = 0) {
  return `
    <article class="day-editor" data-index="${index}">
      <div class="day-editor-head">
        <strong>Deň ${index + 1}</strong>
        <button class="icon-button remove-day" type="button" aria-label="Odstrániť deň">×</button>
      </div>
      <div class="form-row two">
        <label>Deň <input name="day" value="${escapeHtml(day.day)}" placeholder="Pondelok"></label>
        <label>Dátum <input name="date" value="${escapeHtml(day.date)}" placeholder="08.07."></label>
      </div>
      <label>Polievka <input name="soup" value="${escapeHtml(day.soup)}"></label>
      <label>Hlavné jedlo <textarea name="main" rows="2">${escapeHtml(day.main)}</textarea></label>
      <label>Alternatíva <textarea name="alt" rows="2">${escapeHtml(day.alt)}</textarea></label>
      <div class="form-row two">
        <label>Dezert <input name="dessert" value="${escapeHtml(day.dessert)}"></label>
        <label>Cena <input name="price" value="${escapeHtml(day.price)}" placeholder="7,90 EUR"></label>
      </div>
    </article>
  `;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderDays(days) {
  daysEditor.innerHTML = days.map(dayTemplate).join("");
}

function collectMenu() {
  const root = new FormData(menuForm);
  const days = [...daysEditor.querySelectorAll(".day-editor")].map((card) => {
    const data = new FormData();
    card.querySelectorAll("input, textarea").forEach((input) => data.set(input.name, input.value));
    return Object.fromEntries(data.entries());
  });

  return {
    weekLabel: root.get("weekLabel"),
    note: root.get("note"),
    days
  };
}

async function loadMenu() {
  const response = await fetch("/api/menu");
  const menu = await response.json();
  menuForm.elements.weekLabel.value = menu.weekLabel || "";
  menuForm.elements.note.value = menu.note || "";
  renderDays(menu.days?.length ? menu.days : [{ ...emptyDay }]);
}

async function checkSession() {
  const response = await fetch("/api/me");
  const data = await response.json();
  showEditor(data.authenticated);
  if (data.authenticated) await loadMenu();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";
  const password = new FormData(loginForm).get("password");
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const data = await response.json();
    loginMessage.textContent = data.error || "Prihlásenie zlyhalo.";
    return;
  }

  showEditor(true);
  await loadMenu();
});

menuForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveMessage.textContent = "Ukladám...";
  const response = await fetch("/api/menu", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(collectMenu())
  });

  if (!response.ok) {
    const data = await response.json();
    saveMessage.textContent = data.error || "Ukladanie zlyhalo.";
    return;
  }

  saveMessage.textContent = "Menu je uložené.";
  await loadMenu();
});

addDayButton.addEventListener("click", () => {
  const days = [...daysEditor.querySelectorAll(".day-editor")].map((card) => {
    const day = {};
    card.querySelectorAll("input, textarea").forEach((input) => {
      day[input.name] = input.value;
    });
    return day;
  });
  days.push({ ...emptyDay });
  renderDays(days);
});

daysEditor.addEventListener("click", (event) => {
  if (!event.target.closest(".remove-day")) return;
  const cards = [...daysEditor.querySelectorAll(".day-editor")];
  if (cards.length === 1) return;
  event.target.closest(".day-editor").remove();
  const days = [...daysEditor.querySelectorAll(".day-editor")].map((card) => {
    const day = {};
    card.querySelectorAll("input, textarea").forEach((input) => {
      day[input.name] = input.value;
    });
    return day;
  });
  renderDays(days);
});

checkSession();
