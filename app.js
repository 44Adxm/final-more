const menuList = document.querySelector("#menu-list");
const menuDaysNav = document.querySelector("#menu-days-nav");
const weekLabel = document.querySelector("#week-label");
const menuNote = document.querySelector("#menu-note");
const todaySpecial = document.querySelector("#today-special");

const dayNames = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];

document.documentElement.classList.add("reveal-ready");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function isToday(day) {
  const today = dayNames[new Date().getDay()];
  return day.day?.toLowerCase() === today.toLowerCase();
}

function formatDish(text, tag, price, today) {
  if (!text) return "";
  const commaIndex = text.indexOf(",");
  let name = text;
  let desc = "";
  if (commaIndex !== -1) {
    name = text.substring(0, commaIndex).trim();
    desc = text.substring(commaIndex + 1).trim();
    if (desc) {
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    }
  } else {
    if (tag === "Polievka") desc = "Čerstvo uvarená polievka k dennému menu.";
    else if (tag === "Hlavné jedlo") desc = "Poctivé a teplé hlavné jedlo dňa.";
    else if (tag === "Alternatíva") desc = "Skvelá bezmäsitá alebo ľahšia alternatíva.";
    else if (tag === "Dezert") desc = "Sladká bodka na záver dňa.";
  }

  let displayPrice = price;
  if (tag === "Polievka" || tag === "Dezert") {
    displayPrice = "V cene menu";
  }

  return `
    <article class="dish-card ${today ? "is-highlighted" : ""}">
      <div class="dish-card-header">
        <span class="dish-tag">${escapeHtml(tag)}</span>
        ${today ? '<span class="dish-today-badge">Dnes</span>' : ""}
      </div>
      <div class="dish-card-body">
        <h3 class="dish-title">${escapeHtml(name)}</h3>
        <p class="dish-desc">${escapeHtml(desc)}</p>
      </div>
      <div class="dish-card-footer">
        <span class="dish-price">${escapeHtml(displayPrice)}</span>
        <a href="tel:+421911233431" class="button primary dish-cta">Objednať</a>
      </div>
    </article>
  `;
}

function menuRow(day, index) {
  const today = isToday(day);
  const dayNameLower = (day.day || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

  const cardsHtml = [
    formatDish(day.soup, "Polievka", day.price, today),
    formatDish(day.main, "Hlavné jedlo", day.price, today),
    formatDish(day.alt, "Alternatíva", day.price, today),
    formatDish(day.dessert, "Dezert", day.price, today)
  ].filter(Boolean).join("");

  return `
    <div class="menu-day-row ${today ? "is-today" : ""}" id="day-${dayNameLower}" data-reveal style="--delay:${index * 60}ms">
      <div class="menu-day-header">
        <div class="day-info">
          <span class="day-name">${escapeHtml(day.day || "Deň")}</span>
          <span class="day-date">${escapeHtml(day.date || "")}</span>
          ${today ? '<span class="today-badge">Dnes</span>' : ""}
        </div>
        <div class="day-price">${escapeHtml(day.price || "")}</div>
      </div>
      <div class="menu-day-content">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function renderDayNav(days) {
  if (!menuDaysNav) return;

  // Find which day is today
  const todayDayIndex = new Date().getDay();
  const todayDayName = dayNames[todayDayIndex];
  
  // Set default active day row: today if it exists in the list, else the first available day
  let defaultActiveDay = days.find((d) => d.day?.toLowerCase() === todayDayName.toLowerCase());
  if (!defaultActiveDay && days.length > 0) {
    defaultActiveDay = days[0];
  }

  const defaultActiveId = defaultActiveDay
    ? `day-${(defaultActiveDay.day || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")}`
    : "";

  menuDaysNav.innerHTML = days.map((day) => {
    const today = isToday(day);
    const dayNameLower = (day.day || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
    
    const targetId = `day-${dayNameLower}`;
    const isActive = targetId === defaultActiveId;

    return `
      <button type="button" class="day-nav-btn ${isActive ? 'is-active' : ''} ${today ? 'is-today' : ''}" data-target="${targetId}">
        <span>${escapeHtml(day.day)}</span>
        <small>${escapeHtml(day.date || "")}</small>
      </button>
    `;
  }).join("");

  const rows = menuList.querySelectorAll(".menu-day-row");
  rows.forEach((row) => {
    if (row.id === defaultActiveId) {
      row.classList.add("is-active");
    } else {
      row.classList.remove("is-active");
    }
  });

  menuDaysNav.querySelectorAll(".day-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const targetEl = document.getElementById(targetId);

      // Remove is-active class from all buttons and rows
      menuDaysNav.querySelectorAll(".day-nav-btn").forEach((b) => b.classList.remove("is-active"));
      rows.forEach((r) => r.classList.remove("is-active"));

      // Add is-active class to clicked button and corresponding row
      btn.classList.add("is-active");
      if (targetEl) {
        targetEl.classList.add("is-active");
        
        // Trigger reveal elements to make sure animated content inside the newly active tab displays correctly
        revealElements();

        // Optional scroll to the top of the menu container on mobile so the user sees the start of the card
        const menuEl = document.getElementById("menu");
        if (menuEl && window.innerWidth < 768) {
          const header = document.querySelector("#main-header");
          const mobileLogoHeader = document.querySelector(".mobile-logo-header");
          let navbarHeight = 0;
          if (mobileLogoHeader && window.getComputedStyle(mobileLogoHeader).display !== "none") {
            const styles = window.getComputedStyle(mobileLogoHeader);
            if (styles.position === "fixed") {
              const logoImg = mobileLogoHeader.querySelector("img");
              const logoHeight = logoImg ? logoImg.offsetHeight : 110;
              navbarHeight = 24 + logoHeight;
            }
          }
          const targetPosition = menuEl.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
          });
        }
      }
    });
  });
}

function revealElements() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
}

revealElements();

function setTodaySpecial(days) {
  if (!todaySpecial) return;
  const today = dayNames[new Date().getDay()];
  const current = days.find((day) => day.day?.toLowerCase() === today.toLowerCase()) || days[0];
  todaySpecial.textContent = current?.main || "Aktuálne menu už čoskoro";
}

function orderMenuDays(days) {
  // Chronological order: Pondelok to Piatok
  return days;
}

function renderMenuData(menu) {
  const days = menu.days || [];
  weekLabel.textContent = menu.weekLabel || "Denné menu";
  menuNote.textContent = menu.note || "";
  
  // Render list
  menuList.innerHTML = orderMenuDays(days).map(menuRow).join("");
  
  // Render quick-jump day buttons
  renderDayNav(days);
  
  setTodaySpecial(days);
  revealElements();
}

function setHeroOpeningHours() {
  const hoursEl = document.querySelector("#hero-today-hours");
  if (!hoursEl) return;
  const day = new Date().getDay();
  let hours = "10:00 - 22:00";
  if (day === 5) {
    hours = "10:00 - 00:00";
  } else if (day === 6) {
    hours = "11:00 - 00:00";
  } else if (day === 0) {
    hours = "11:00 - 20:00";
  }
  hoursEl.textContent = hours;
}

setHeroOpeningHours();

async function loadMenu() {
  try {
    const response = await fetch("/api/menu");
    if (!response.ok) throw new Error("API not available");
    const menu = await response.json();
    renderMenuData(menu);
  } catch (error) {
    console.warn("API menu loading failed, trying fallbacks:", error);
    const fallbacks = ["../data/menu.json", "data/menu.json"];
    for (const path of fallbacks) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const menu = await response.json();
          renderMenuData(menu);
          return;
        }
      } catch (err) {
        console.warn(`Fallback path '${path}' failed:`, err);
      }
    }
    menuList.innerHTML = "<p>Menu sa nepodarilo načítať. Skúste to prosím neskôr.</p>";
    revealElements();
  }
}

loadMenu();

