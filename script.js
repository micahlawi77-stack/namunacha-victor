/* =========================================================
   Namunacha & Victor — Wedding Website
   Vanilla JavaScript (ES6+)
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   Configuration
--------------------------------------------------------- */
const CONFIG = {
  weddingDate: new Date("2026-12-05T10:00:00+01:00"),
  weddingEndDate: new Date("2026-12-05T18:00:00+01:00"),
  timezone: "Africa/Lagos",
  adminPassword: "wedding2026",
  accountNumber: "0821247156",
  storageKeys: {
    guests: "wed_guests",
    payments: "wed_payments",
    theme: "wed_theme",
    wishes: "wed_wishes"
  }
};

/* ---------------------------------------------------------
   Small DOM helpers
--------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ---------------------------------------------------------
   localStorage data layer
--------------------------------------------------------- */
const Store = {
  read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  },
  write(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (err) {
      console.error("Storage write failed:", err);
      toast("Could not save data in this browser.", "error");
    }
  },
  guests: () => Store.read(CONFIG.storageKeys.guests),
  payments: () => Store.read(CONFIG.storageKeys.payments),
  wishes: () => Store.read(CONFIG.storageKeys.wishes),
  saveGuests: (data) => Store.write(CONFIG.storageKeys.guests, data),
  savePayments: (data) => Store.write(CONFIG.storageKeys.payments, data),
  saveWishes: (data) => Store.write(CONFIG.storageKeys.wishes, data)
};

/* ---------------------------------------------------------
   Shared helpers
--------------------------------------------------------- */
function syncBodyScrollLock() {
  const navOpen = $("#nav-links")?.classList.contains("open");
  const modalOpen = !!$(".modal-overlay.open");
  const lightboxOpen = $("#lightbox")?.classList.contains("open");
  document.body.classList.toggle("no-scroll", navOpen || modalOpen || lightboxOpen);
}

function getFocusable(container) {
  return $$(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    container
  ).filter((el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed");
}

function trapFocus(event, container) {
  if (event.key !== "Tab") return;
  const focusable = getFocusable(container);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/* HTML escape for table rendering */
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/* Sanitise plain text — strip tags, hard-cap length */
function sanitiseText(raw) {
  return String(raw ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 2000);
}

/* Format ISO date-time for display */
function formatDateTime(isoString) {
  if (!isoString) return "—";
  const d = new Date(isoString);
  return d.toLocaleString("en-NG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });
}

/* =========================================================
   1. LOADER
========================================================= */
window.addEventListener("load", () => {
  setTimeout(() => $("#loader")?.classList.add("hide"), 700);
});

/* =========================================================
   2. TOAST NOTIFICATIONS
========================================================= */
function toast(message, type = "info") {
  const container = $("#toast-container");
  if (!container) return;
  const icons = { success: "✅", error: "⚠️", info: "💛" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || ""}</span><span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add("hide");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 3600);
}

/* =========================================================
   3. CONFIRM DIALOG
========================================================= */
function confirmDialog(message = "This action cannot be undone.", title = "Are you sure?") {
  return new Promise((resolve) => {
    const overlay = $("#confirm-overlay");
    const okBtn = $("#confirm-ok");
    const cancelBtn = $("#confirm-cancel");
    const previousFocus = document.activeElement;

    $("#confirm-title").textContent = title;
    $("#confirm-message").textContent = message;

    const cleanup = (result) => {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      overlay.removeEventListener("click", onOverlayClick);
      document.removeEventListener("keydown", onKeydown);
      syncBodyScrollLock();
      previousFocus?.focus?.();
      resolve(result);
    };

    const onOk = () => cleanup(true);
    const onCancel = () => cleanup(false);
    const onOverlayClick = (e) => { if (e.target === overlay) cleanup(false); };
    const onKeydown = (e) => {
      if (e.key === "Escape") cleanup(false);
      trapFocus(e, overlay);
    };

    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    syncBodyScrollLock();

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    overlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", onKeydown);
    setTimeout(() => okBtn.focus(), 0);
  });
}

/* =========================================================
   4. NAVBAR
========================================================= */
const navbar = $("#navbar");
const hamburger = $("#hamburger");
const navLinks = $("#nav-links");
const backToTop = $("#back-to-top");
const sections = $$("main section[id]");

function closeMenu() {
  navLinks.classList.remove("open");
  hamburger.classList.remove("open");
  hamburger.setAttribute("aria-expanded", "false");
  syncBodyScrollLock();
}

function updateActiveNav() {
  let current = sections[0]?.id || "";
  const position = window.scrollY + 140;
  sections.forEach((section) => {
    if (position >= section.offsetTop) current = section.id;
  });
  $$(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}

function handleScroll() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
  backToTop.classList.toggle("show", window.scrollY > 500);
  updateActiveNav();
}

window.addEventListener("scroll", handleScroll);
window.addEventListener("resize", () => { if (window.innerWidth > 900) closeMenu(); });

hamburger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  hamburger.classList.toggle("open", open);
  hamburger.setAttribute("aria-expanded", String(open));
  syncBodyScrollLock();
});

$$(".nav-link").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && navLinks.classList.contains("open")) closeMenu();
});

handleScroll();

/* =========================================================
   5. THEME TOGGLE
========================================================= */
const themeToggle = $("#theme-toggle");

function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  themeToggle.textContent = dark ? "☀️" : "🌙";
  themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.setAttribute("title", dark ? "Switch to light mode" : "Switch to dark mode");
}

applyTheme(localStorage.getItem(CONFIG.storageKeys.theme) || "light");

themeToggle.addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(CONFIG.storageKeys.theme, next);
  applyTheme(next);
});

/* =========================================================
   6. COUNTDOWN TIMER
========================================================= */
let countdownInterval = null;

function updateCountdown() {
  const countdown = $("#countdown");
  if (!countdown) return;
  const diff = CONFIG.weddingDate.getTime() - Date.now();
  if (diff <= 0) {
    countdown.innerHTML = `<p style="font-size:1.4rem">🎉 We're married! Thank you for celebrating with us.</p>`;
    if (countdownInterval) clearInterval(countdownInterval);
    return;
  }
  const pad = (n) => String(n).padStart(2, "0");
  $("#cd-days").textContent = pad(Math.floor(diff / 86400000));
  $("#cd-hours").textContent = pad(Math.floor((diff % 86400000) / 3600000));
  $("#cd-mins").textContent = pad(Math.floor((diff % 3600000) / 60000));
  $("#cd-secs").textContent = pad(Math.floor((diff % 60000) / 1000));
}

updateCountdown();
countdownInterval = setInterval(updateCountdown, 1000);

/* =========================================================
   7. DYNAMIC CONTENT DATA
========================================================= */
const scheduleData = [
  { icon: "💒", time: "10:00 AM", event: "Wedding Ceremony", venue: "Main Hall", desc: "Exchange of vows and blessings." },
  { icon: "📸", time: "1:00 PM", event: "Photo Session", venue: "Garden Terrace", desc: "Capturing beautiful moments." },
  { icon: "🍽️", time: "2:00 PM", event: "Reception & Lunch", venue: "Garden Pavilion", desc: "Feasting, toasts and speeches." }
];

const galleryImages = [
  "Mr Victor (1).jpg", "Mr Victor (2).jpg", "Mr Victor (3).jpg",
  "Mr Victor (4).jpg", "Mr Victor (5).jpg", "Mr Victor (6).jpg",
  "Mr Victor (7).jpg", "Mr Victor (8).jpg", "Mr Victor (9).jpg",
  "Mr Victor (10).jpg"
];

const faqData = [
  { q: "What is the dress code?", a: "We kindly request formal attire. Please celebrate with us in Burgundy, Gold, Pearl, or White. Kindly avoid wearing all-white, as it is reserved for the bride." },
  { q: "Can I bring a plus-one?", a: "Please indicate the exact number of guests in your RSVP so we can plan seating accordingly." },
  { q: "Is there parking at the venue?", a: "Yes, parking is available for guests at the venue." },
  { q: "Are children welcome?", a: "We love your little ones. Kindly include them in your guest count when registering." },
  { q: "How do I send a gift?", a: "Your presence is the greatest gift. If you would like to support us further, our bank details are available in the Payment section." }
];

/* =========================================================
   8. RENDER DYNAMIC SECTIONS
========================================================= */
function renderSchedule() {
  $("#schedule-grid").innerHTML = scheduleData.map((s) => `
    <div class="glass schedule-card reveal">
      <div class="schedule-icon">${s.icon}</div>
      <div class="schedule-time">${s.time}</div>
      <h4>${s.event}</h4>
      <p class="schedule-venue">${s.venue}</p>
      <p>${s.desc}</p>
    </div>`).join("");
}

function renderGallery() {
  $("#gallery-grid").innerHTML = galleryImages.map((src, i) => `
    <div class="gallery-item reveal ${i % 3 === 0 ? "tall" : ""}" data-index="${i}">
      <img src="${src}" alt="Wedding gallery photo ${i + 1}" loading="lazy" />
    </div>`).join("");
}

function renderFAQ() {
  $("#faq-list").innerHTML = faqData.map((f, i) => `
    <div class="glass faq-item">
      <button type="button" class="faq-q" aria-expanded="false" aria-controls="faq-a-${i}">
        ${f.q}
        <span class="icon">+</span>
      </button>
      <div class="faq-a" id="faq-a-${i}">
        <p>${f.a}</p>
      </div>
    </div>`).join("");
}

renderSchedule();
renderGallery();
renderFAQ();

/* Observe newly rendered .reveal elements */
function observeRevealEls() {
  $$(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
}

/* FAQ accordion */
$("#faq-list").addEventListener("click", (e) => {
  const q = e.target.closest(".faq-q");
  if (!q) return;
  const item = q.closest(".faq-item");
  const answer = $(".faq-a", item);
  const isOpen = item.classList.toggle("open");
  q.setAttribute("aria-expanded", String(isOpen));
  answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : "0";
});

/* =========================================================
   9. GALLERY LIGHTBOX
========================================================= */
const lightbox = $("#lightbox");
const lightboxImg = $("#lightbox-img");
const lightboxCloseBtn = $(".lightbox-close");
let currentImg = 0;
let lastLightboxTrigger = null;

function openLightbox(index, triggerEl = null) {
  currentImg = index;
  lastLightboxTrigger = triggerEl || document.activeElement;
  lightboxImg.src = galleryImages[index];
  lightboxImg.alt = `Wedding gallery photo ${index + 1}`;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  setTimeout(() => lightboxCloseBtn.focus(), 0);
}

function closeLightbox() {
  if (!lightbox.classList.contains("open")) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  syncBodyScrollLock();
  lastLightboxTrigger?.focus?.();
}

function navLightbox(direction) {
  currentImg = (currentImg + direction + galleryImages.length) % galleryImages.length;
  lightboxImg.src = galleryImages[currentImg];
  lightboxImg.alt = `Wedding gallery photo ${currentImg + 1}`;
}

$("#gallery-grid").addEventListener("click", (e) => {
  const item = e.target.closest(".gallery-item");
  if (!item) return;
  openLightbox(Number(item.dataset.index), item);
});

lightboxCloseBtn.addEventListener("click", closeLightbox);
$(".lightbox-prev").addEventListener("click", () => navLightbox(-1));
$(".lightbox-next").addEventListener("click", () => navLightbox(1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowRight") navLightbox(1);
  if (e.key === "ArrowLeft") navLightbox(-1);
  trapFocus(e, lightbox);
});

/* =========================================================
   10. ADD TO CALENDAR
========================================================= */
const CALENDAR_EVENT = {
  title: "Namunacha & Victor's Wedding",
  description: "Join us as we celebrate our love. Ceremony starts at 10:00 AM in Jalingo, Taraba, Nigeria.\nDress Code: Burgundy, Gold, Pearl, or White.",
  location: "Redeemed People's Mission (Alheri Branch), Opp. Coca Cola Depot, Jalingo, Taraba, Nigeria",
  start: CONFIG.weddingDate,
  end: CONFIG.weddingEndDate,
  url: window.location.href.split("#")[0]
};

function formatUTCDateForCalendar(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return [date.getUTCFullYear(), pad(date.getUTCMonth() + 1), pad(date.getUTCDate())].join("") +
    "T" + [pad(date.getUTCHours()), pad(date.getUTCMinutes()), pad(date.getUTCSeconds())].join("") + "Z";
}

function escapeICS(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

$("#add-google-cal").addEventListener("click", () => {
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", CALENDAR_EVENT.title);
  url.searchParams.set("dates", `${formatUTCDateForCalendar(CALENDAR_EVENT.start)}/${formatUTCDateForCalendar(CALENDAR_EVENT.end)}`);
  url.searchParams.set("details", CALENDAR_EVENT.description);
  url.searchParams.set("location", CALENDAR_EVENT.location);
  url.searchParams.set("ctz", CONFIG.timezone);
  window.open(url.toString(), "_blank", "noopener");
  toast("Opening Google Calendar…", "info");
});

$("#add-ical").addEventListener("click", () => {
  const icsContent = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Namunacha & Victor//Wedding Invite//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${Date.now()}@namunachaandvictor.com`,
    `DTSTAMP:${formatUTCDateForCalendar(new Date())}`,
    `DTSTART:${formatUTCDateForCalendar(CALENDAR_EVENT.start)}`,
    `DTEND:${formatUTCDateForCalendar(CALENDAR_EVENT.end)}`,
    `SUMMARY:${escapeICS(CALENDAR_EVENT.title)}`,
    `DESCRIPTION:${escapeICS(CALENDAR_EVENT.description)}`,
    `LOCATION:${escapeICS(CALENDAR_EVENT.location)}`,
    `URL:${escapeICS(CALENDAR_EVENT.url)}`,
    "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "namunacha-victor-wedding-invite.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
  toast("Calendar invite downloaded.", "success");
});

/* =========================================================
   11. COPY ACCOUNT NUMBER
========================================================= */
$("#copy-acct").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(CONFIG.accountNumber);
    toast("Account number copied!", "success");
  } catch {
    const tmp = document.createElement("textarea");
    tmp.value = CONFIG.accountNumber;
    document.body.appendChild(tmp);
    tmp.select();
    document.execCommand("copy");
    tmp.remove();
    toast("Account number copied!", "success");
  }
});

/* =========================================================
   12. FORM VALIDATION HELPERS
========================================================= */
const Validate = {
  required: (v) => String(v).trim() !== "" || "This field is required.",
  name: (v) => /^[a-zA-Z\s.'-]{2,60}$/.test(String(v).trim()) || "Enter a valid name.",
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()) || "Enter a valid email address.",
  phone: (v) => /^[0-9+\-\s()]{7,20}$/.test(String(v).trim()) || "Enter a valid phone number.",
  guests: (v) => {
    const n = Number(v);
    return (Number.isInteger(n) && n >= 0 && n <= 10) || "Enter a guest count between 0 and 10.";
  },
  amount: (v) => (Number.isFinite(Number(v)) && Number(v) > 0) || "Enter a valid amount.",
  date: (v) => String(v).trim() !== "" || "Please select a date."
};

function setError(input, msg) {
  const group = input?.closest(".form-group");
  if (!group) return;
  group.classList.toggle("invalid", !!msg);
  const errorEl = $(".error-msg", group);
  if (errorEl) errorEl.textContent = msg || "";
}

function validateForm(form, rules) {
  let valid = true;
  const values = {};
  for (const [field, checks] of Object.entries(rules)) {
    const input = form.elements[field];
    if (!input) continue;
    const value = typeof input.value === "string" ? input.value.trim() : input.value;
    values[field] = value;
    let error = "";
    for (const check of checks) {
      const result = check(value);
      if (result !== true) { error = result; break; }
    }
    setError(input, error);
    if (error) valid = false;
  }
  return valid ? values : null;
}

$$("input, select, textarea").forEach((field) => {
  field.addEventListener("input", () => setError(field, ""));
  field.addEventListener("change", () => setError(field, ""));
});

/* =========================================================
   13. RSVP FORM
========================================================= */
const rsvpForm = $("#rsvp-form");
const rsvpSelect = $("#g-rsvp");
const guestsInput = $("#g-guests");

function syncRsvpGuestField() {
  const attending = rsvpSelect.value !== "Not Attending";
  guestsInput.disabled = !attending;
  guestsInput.min = attending ? "1" : "0";
  guestsInput.placeholder = attending ? "1" : "0";
  if (!attending) { guestsInput.value = "0"; setError(guestsInput, ""); }
  else if (guestsInput.value === "0") guestsInput.value = "1";
}

rsvpSelect.addEventListener("change", syncRsvpGuestField);
syncRsvpGuestField();

rsvpForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const submitBtn = $('button[type="submit"]', rsvpForm);
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  const values = validateForm(rsvpForm, {
    name: [Validate.required, Validate.name],
    phone: [Validate.required, Validate.phone],
    email: [Validate.required, Validate.email],
    rsvp: [Validate.required],
    guests: [Validate.required, Validate.guests]
  });

  if (!values) {
    toast("Please fix the errors in the form.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit RSVP";
    return;
  }

  const guestCount = Number(values.guests);
  if (values.rsvp === "Attending" && (guestCount < 1 || guestCount > 10)) {
    setError(guestsInput, "Attending guests must be between 1 and 10.");
    toast("Please fix the guest count.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit RSVP";
    return;
  }

  values.guests = values.rsvp === "Attending" ? guestCount : 0;
  values.requests = rsvpForm.elements.requests.value.trim();

  const guests = Store.guests();
  const existingIndex = guests.findIndex((g) =>
    String(g.email).toLowerCase() === values.email.toLowerCase() ||
    String(g.phone).trim() === values.phone.trim()
  );

  if (existingIndex >= 0) {
    guests[existingIndex] = { ...guests[existingIndex], ...values, updatedAt: new Date().toISOString() };
    Store.saveGuests(guests);
    toast("Your RSVP was updated successfully. 💛", "success");
  } else {
    guests.push({ ...values, id: Date.now(), createdAt: new Date().toISOString() });
    Store.saveGuests(guests);
    toast("Thank you! Your RSVP has been received. 💛", "success");
  }

  rsvpForm.reset();
  syncRsvpGuestField();
  refreshAdmin();
  submitBtn.disabled = false;
  submitBtn.textContent = "Submit RSVP";
});

/* =========================================================
   14. PAYMENT FORM
========================================================= */
const paymentForm = $("#payment-form");
const paymentDate = $("#p-date");

(function initPaymentDate() {
  const today = new Date().toISOString().split("T")[0];
  paymentDate.value = today;
  paymentDate.max = today;
})();

paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const submitBtn = $('button[type="submit"]', paymentForm);
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  const values = validateForm(paymentForm, {
    name: [Validate.required, Validate.name],
    phone: [Validate.required, Validate.phone],
    email: [Validate.required, Validate.email],
    amount: [Validate.required, Validate.amount],
    reference: [Validate.required],
    date: [Validate.date]
  });

  if (!values) {
    toast("Please fix the errors in the form.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Payment";
    return;
  }

  const payments = Store.payments();
  const duplicateRef = payments.some(
    (p) => String(p.reference).trim().toLowerCase() === values.reference.toLowerCase()
  );

  if (duplicateRef) {
    setError(paymentForm.elements.reference, "This payment reference has already been submitted.");
    toast("Duplicate payment reference detected.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm Payment";
    return;
  }

  payments.push({ ...values, amount: Number(values.amount), id: Date.now(), createdAt: new Date().toISOString() });
  Store.savePayments(payments);
  paymentForm.reset();
  paymentDate.value = new Date().toISOString().split("T")[0];
  toast("Payment recorded. Thank you so much! 🎉", "success");
  refreshAdmin();
  submitBtn.disabled = false;
  submitBtn.textContent = "Confirm Payment";
});

/* =========================================================
   15. WEDDING WISHES — GUEST SIDE
========================================================= */
const wishesForm = $("#wishes-form");
const wishesWall = $("#wishes-wall");

/** Render the public wishes wall */
function renderWishesWall() {
  if (!wishesWall) return;
  const wishes = [...Store.wishes()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  /* Count badge */
  let badge = $(".wishes-count-badge");
  if (!badge) {
    badge = document.createElement("div");
    badge.className = "wishes-count-badge";
    wishesWall.insertAdjacentElement("beforebegin", badge);
  }
  badge.innerHTML = wishes.length > 0
    ? `<strong>${wishes.length}</strong> heartfelt ${wishes.length === 1 ? "wish" : "wishes"} shared 💛`
    : "";

  if (!wishes.length) {
    wishesWall.innerHTML = `
      <div class="wishes-empty">
        <span>💌</span>
        Be the first to leave a wedding wish!
      </div>`;
    return;
  }

  wishesWall.innerHTML = wishes.slice(0, 30).map((w) => `
    <article class="wish-card glass animate-in" aria-label="Wish from ${esc(w.name)}">
      <span class="wish-card-quote" aria-hidden="true">"</span>
      <p class="wish-card-message">${esc(sanitiseText(w.message))}</p>
      <footer class="wish-card-footer">
        <span class="wish-card-name">— ${esc(w.name)}</span>
        <time class="wish-card-date" datetime="${esc(w.createdAt)}">${formatDateTime(w.createdAt)}</time>
      </footer>
    </article>`).join("");
}

renderWishesWall();

/* Wishes form submission */
if (wishesForm) {
  wishesForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const submitBtn = $('button[type="submit"]', wishesForm);
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    const values = validateForm(wishesForm, {
      name: [Validate.required, Validate.name],
      message: [Validate.required]
    });

    const rawMsg = wishesForm.elements.message.value.trim();

    if (values && rawMsg.length < 5) {
      setError(wishesForm.elements.message, "Please write at least 5 characters.");
      toast("Your wish is too short — say a little more! 💬", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "💌 Send Your Wish";
      return;
    }

    if (!values) {
      toast("Please fill in all required fields.", "error");
      submitBtn.disabled = false;
      submitBtn.textContent = "💌 Send Your Wish";
      return;
    }

    const wishes = Store.wishes();
    wishes.push({
      id: Date.now(),
      name: sanitiseText(values.name),
      message: sanitiseText(rawMsg),
      createdAt: new Date().toISOString(),
      updatedAt: null
    });
    Store.saveWishes(wishes);

    wishesForm.reset();
    renderWishesWall();
    refreshAdmin();
    toast("Your wish has been sent! 💛 Thank you.", "success");

    submitBtn.disabled = false;
    submitBtn.textContent = "💌 Send Your Wish";

    setTimeout(() => wishesWall?.scrollIntoView({ behavior: "smooth", block: "start" }), 400);
  });
}

/* =========================================================
   16. ADMIN DASHBOARD
========================================================= */
const adminLogin = $("#admin-login");
const adminPanel = $("#admin-panel");
let isAdmin = false;

$("#admin-login-btn").addEventListener("click", () => {
  const input = $("#admin-pass");
  if (input.value === CONFIG.adminPassword) {
    isAdmin = true;
    adminLogin.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    setError(input, "");
    input.value = "";
    refreshAdmin();
    toast("Welcome back, Admin!", "success");
  } else {
    setError(input, "Incorrect password.");
    toast("Incorrect password.", "error");
  }
});

$("#admin-pass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("#admin-login-btn").click();
});

$("#admin-logout").addEventListener("click", () => {
  isAdmin = false;
  adminPanel.classList.add("hidden");
  adminLogin.classList.remove("hidden");
  toast("Logged out.", "info");
});

/* ---------- Helpers: sorted data ---------- */
function getSortedGuests() {
  return [...Store.guests()].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
  );
}
function getSortedPayments() {
  return [...Store.payments()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}
function getSortedWishes(order = "newest") {
  return [...Store.wishes()].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return order === "newest" ? tb - ta : ta - tb;
  });
}

/* ---------- Render stats ---------- */
function renderStats() {
  const guests = Store.guests();
  const payments = Store.payments();
  const attending = guests.filter((g) => g.rsvp === "Attending")
    .reduce((sum, g) => sum + Number(g.guests || 0), 0);
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  $("#stat-guests").textContent = attending;
  $("#stat-payments").textContent = payments.length;
  $("#stat-amount").textContent = "₦" + totalAmount.toLocaleString();
  $("#stat-wishes").textContent = Store.wishes().length;
}

/* ---------- Render guests table ---------- */
function renderGuestsTable(filter = "") {
  const tbody = $("#guests-table tbody");
  const q = filter.toLowerCase();
  const rows = getSortedGuests().filter((g) =>
    [g.name, g.phone, g.email, g.rsvp, g.requests].some((v) =>
      String(v ?? "").toLowerCase().includes(q)
    )
  );
  tbody.innerHTML = rows.length
    ? rows.map((g) => `
        <tr>
          <td>${esc(g.name)}</td>
          <td>${esc(g.phone)}</td>
          <td>${esc(g.email)}</td>
          <td>${esc(g.rsvp)}</td>
          <td>${esc(g.guests)}</td>
          <td>${esc(g.requests) || "—"}</td>
          <td>
            <button type="button" class="row-btn row-edit" data-id="${g.id}">Edit</button>
            <button type="button" class="row-btn row-del" data-id="${g.id}">Delete</button>
          </td>
        </tr>`).join("")
    : `<tr class="empty-row"><td colspan="7">No guests found.</td></tr>`;
}

/* ---------- Render payments table ---------- */
function renderPaymentsTable(filter = "") {
  const tbody = $("#payments-table tbody");
  const q = filter.toLowerCase();
  const rows = getSortedPayments().filter((p) =>
    [p.name, p.phone, p.email, p.reference].some((v) =>
      String(v ?? "").toLowerCase().includes(q)
    )
  );
  tbody.innerHTML = rows.length
    ? rows.map((p) => `
        <tr>
          <td>${esc(p.name)}</td>
          <td>${esc(p.phone)}</td>
          <td>${esc(p.email)}</td>
          <td>₦${Number(p.amount).toLocaleString()}</td>
          <td>${esc(p.reference)}</td>
          <td>${esc(p.date)}</td>
          <td>
            <button type="button" class="row-btn row-del" data-id="${p.id}">Delete</button>
          </td>
        </tr>`).join("")
    : `<tr class="empty-row"><td colspan="7">No payments found.</td></tr>`;
}

/* ---------- Render wishes table ---------- */
function renderWishesTable(filter = "", order = "newest") {
  const tbody = $("#wishes-table tbody");
  if (!tbody) return;
  const q = filter.toLowerCase();
  const rows = getSortedWishes(order).filter((w) =>
    [w.name, w.message].some((v) => String(v ?? "").toLowerCase().includes(q))
  );
  tbody.innerHTML = rows.length
    ? rows.map((w, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${esc(w.name)}</td>
          <td class="wish-text-cell">${esc(sanitiseText(w.message))}</td>
          <td>
            <time datetime="${esc(w.createdAt)}">${formatDateTime(w.createdAt)}</time>
            ${w.updatedAt
              ? `<br><small style="color:var(--gold-deep);font-size:0.72rem">edited ${formatDateTime(w.updatedAt)}</small>`
              : ""}
          </td>
          <td>
            <button type="button" class="row-btn row-edit" data-wish-id="${w.id}">Edit</button>
            <button type="button" class="row-btn row-del" data-wish-id="${w.id}">Delete</button>
          </td>
        </tr>`).join("")
    : `<tr class="empty-row"><td colspan="5">No wishes found.</td></tr>`;
}

/* ---------- Master refresh ---------- */
function refreshAdmin() {
  if (!isAdmin) return;
  renderGuestsTable($("#guest-search").value);
  renderPaymentsTable($("#payment-search").value);
  renderWishesTable(
    $("#wish-search")?.value || "",
    $("#wish-sort")?.value || "newest"
  );
  renderStats();
}

/* ---------- Search listeners ---------- */
$("#guest-search").addEventListener("input", (e) => renderGuestsTable(e.target.value));
$("#payment-search").addEventListener("input", (e) => renderPaymentsTable(e.target.value));
$("#wish-search")?.addEventListener("input", () => {
  renderWishesTable($("#wish-search").value, $("#wish-sort").value);
});
$("#wish-sort")?.addEventListener("change", () => {
  renderWishesTable($("#wish-search").value, $("#wish-sort").value);
});

/* Cross-tab sync */
window.addEventListener("storage", () => {
  renderWishesWall();
  if (isAdmin) refreshAdmin();
});

/* =========================================================
   17. GUEST TABLE ACTIONS (edit / delete)
========================================================= */
$("#guests-table").addEventListener("click", async (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  if (e.target.classList.contains("row-del")) {
    const ok = await confirmDialog("Delete this guest record permanently?");
    if (!ok) return;
    Store.saveGuests(Store.guests().filter((g) => g.id !== id));
    refreshAdmin();
    toast("Guest deleted.", "success");
  }
  if (e.target.classList.contains("row-edit")) openEditModal(id, e.target);
});

/* =========================================================
   18. PAYMENT TABLE ACTIONS (delete)
========================================================= */
$("#payments-table").addEventListener("click", async (e) => {
  const id = Number(e.target.dataset.id);
  if (!id || !e.target.classList.contains("row-del")) return;
  const ok = await confirmDialog("Delete this payment record permanently?");
  if (!ok) return;
  Store.savePayments(Store.payments().filter((p) => p.id !== id));
  refreshAdmin();
  toast("Payment deleted.", "success");
});

/* =========================================================
   19. WISHES TABLE ACTIONS (edit / delete)
========================================================= */
$("#wishes-table")?.addEventListener("click", async (e) => {
  const id = Number(e.target.dataset.wishId);
  if (!id) return;

  if (e.target.classList.contains("row-del")) {
    const ok = await confirmDialog("Delete this wish permanently?", "Delete Wish");
    if (!ok) return;
    Store.saveWishes(Store.wishes().filter((w) => w.id !== id));
    renderWishesWall();
    refreshAdmin();
    toast("Wish deleted.", "success");
  }

  if (e.target.classList.contains("row-edit")) openEditWishModal(id, e.target);
});

/* =========================================================
   20. EDIT GUEST MODAL
========================================================= */
const editOverlay = $("#edit-overlay");
const editName = $("#edit-name");
const editPhone = $("#edit-phone");
const editEmail = $("#edit-email");
const editRsvp = $("#edit-rsvp");
const editGuests = $("#edit-guests");
const editRequests = $("#edit-requests");

let editingId = null;
let lastEditTrigger = null;

function syncEditGuestsField() {
  const attending = editRsvp.value === "Attending";
  editGuests.disabled = !attending;
  editGuests.min = attending ? "1" : "0";
  if (!attending) editGuests.value = "0";
  else if (!editGuests.value || editGuests.value === "0") editGuests.value = "1";
}

editRsvp.addEventListener("change", syncEditGuestsField);

function openEditModal(id, trigger = null) {
  const guest = Store.guests().find((g) => g.id === id);
  if (!guest) return;
  editingId = id;
  lastEditTrigger = trigger || document.activeElement;
  editName.value = guest.name || "";
  editPhone.value = guest.phone || "";
  editEmail.value = guest.email || "";
  editRsvp.value = guest.rsvp || "Attending";
  editGuests.value = guest.guests ?? 1;
  editRequests.value = guest.requests || "";
  syncEditGuestsField();
  editOverlay.classList.add("open");
  editOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  setTimeout(() => editName.focus(), 0);
}

function closeEditModal() {
  editingId = null;
  editOverlay.classList.remove("open");
  editOverlay.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();
  lastEditTrigger?.focus?.();
}

$("#edit-cancel").addEventListener("click", closeEditModal);
editOverlay.addEventListener("click", (e) => { if (e.target === editOverlay) closeEditModal(); });

document.addEventListener("keydown", (e) => {
  if (!editOverlay.classList.contains("open")) return;
  if (e.key === "Escape") closeEditModal();
  trapFocus(e, editOverlay);
});

$("#edit-save").addEventListener("click", () => {
  if (editingId === null) return;
  const name = editName.value.trim();
  const phone = editPhone.value.trim();
  const email = editEmail.value.trim();
  const rsvp = editRsvp.value;
  const requests = editRequests.value.trim();
  let guests = Number(editGuests.value);

  if (Validate.name(name) !== true) { toast("Please enter a valid name.", "error"); return; }
  if (Validate.phone(phone) !== true) { toast("Please enter a valid phone number.", "error"); return; }
  if (Validate.email(email) !== true) { toast("Please enter a valid email address.", "error"); return; }
  if (rsvp === "Attending" && (!Number.isInteger(guests) || guests < 1 || guests > 10)) {
    toast("Attending guests must be between 1 and 10.", "error"); return;
  }
  if (rsvp === "Not Attending") guests = 0;

  Store.saveGuests(Store.guests().map((g) =>
    g.id === editingId
      ? { ...g, name, phone, email, rsvp, guests, requests, updatedAt: new Date().toISOString() }
      : g
  ));
  closeEditModal();
  refreshAdmin();
  toast("Guest updated.", "success");
});

/* =========================================================
   21. EDIT WISH MODAL
========================================================= */
const editWishOverlay = $("#edit-wish-overlay");
const editWishName = $("#edit-wish-name");
const editWishMessage = $("#edit-wish-message");

let editingWishId = null;
let lastWishEditTrigger = null;

function openEditWishModal(id, trigger = null) {
  const wish = Store.wishes().find((w) => w.id === id);
  if (!wish) return;
  editingWishId = id;
  lastWishEditTrigger = trigger || document.activeElement;
  editWishName.value = wish.name || "";
  editWishMessage.value = wish.message || "";
  setError(editWishName, "");
  setError(editWishMessage, "");
  editWishOverlay.classList.add("open");
  editWishOverlay.setAttribute("aria-hidden", "false");
  syncBodyScrollLock();
  setTimeout(() => editWishName.focus(), 0);
}

function closeEditWishModal() {
  editingWishId = null;
  editWishOverlay.classList.remove("open");
  editWishOverlay.setAttribute("aria-hidden", "true");
  syncBodyScrollLock();
  lastWishEditTrigger?.focus?.();
}

$("#edit-wish-cancel").addEventListener("click", closeEditWishModal);
editWishOverlay.addEventListener("click", (e) => { if (e.target === editWishOverlay) closeEditWishModal(); });

document.addEventListener("keydown", (e) => {
  if (!editWishOverlay?.classList.contains("open")) return;
  if (e.key === "Escape") closeEditWishModal();
  trapFocus(e, editWishOverlay);
});

$("#edit-wish-save").addEventListener("click", () => {
  if (editingWishId === null) return;
  const name = sanitiseText(editWishName.value);
  const message = sanitiseText(editWishMessage.value);
  let hasError = false;

  if (Validate.name(name) !== true) {
    setError(editWishName, "Please enter a valid name.");
    hasError = true;
  } else { setError(editWishName, ""); }

  if (!message || message.length < 5) {
    setError(editWishMessage, "Wish must be at least 5 characters.");
    hasError = true;
  } else { setError(editWishMessage, ""); }

  if (hasError) { toast("Please fix the errors before saving.", "error"); return; }

  Store.saveWishes(Store.wishes().map((w) =>
    w.id === editingWishId
      ? { ...w, name, message, updatedAt: new Date().toISOString() }
      : w
  ));
  closeEditWishModal();
  renderWishesWall();
  refreshAdmin();
  toast("Wish updated successfully.", "success");
});

/* =========================================================
   22. CSV EXPORT
========================================================= */
function downloadCSV(rows, headers, filename) {
  if (!rows.length) { toast("Nothing to export yet.", "error"); return; }
  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map((h) => h.label).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h.key])).join(","))
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast("CSV downloaded.", "success");
}

$("#export-guests").addEventListener("click", () =>
  downloadCSV(getSortedGuests(), [
    { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
    { key: "email", label: "Email" }, { key: "rsvp", label: "RSVP" },
    { key: "guests", label: "Guests" }, { key: "requests", label: "Special Requests" }
  ], "wedding-guests.csv")
);

$("#export-payments").addEventListener("click", () =>
  downloadCSV(getSortedPayments(), [
    { key: "name", label: "Name" }, { key: "phone", label: "Phone" },
    { key: "email", label: "Email" }, { key: "amount", label: "Amount" },
    { key: "reference", label: "Reference" }, { key: "date", label: "Date" }
  ], "wedding-payments.csv")
);

/* =========================================================
   23. PDF EXPORT — WISHES
========================================================= */
function escPDF(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/\n/g, "<br>");
}

$("#export-wishes-pdf")?.addEventListener("click", () => {
  const wishes = getSortedWishes("newest");
  if (!wishes.length) { toast("No wishes to export yet.", "error"); return; }
  toast("Preparing PDF…", "info");

  const generatedDate = new Date().toLocaleString("en-NG", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  const wishItems = wishes.map((w, i) => `
    <div class="wish-item">
      <div class="wish-number">${i + 1}</div>
      <div class="wish-body">
        <p class="wish-msg">"${escPDF(w.message)}"</p>
        <p class="wish-meta">
          <strong>${escPDF(w.name)}</strong> &nbsp;·&nbsp;
          <span>${formatDateTime(w.createdAt)}</span>
          ${w.updatedAt ? `<span class="edited-tag">(edited ${formatDateTime(w.updatedAt)})</span>` : ""}
        </p>
      </div>
    </div>`).join("");

  const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Wedding Wishes — Namunacha &amp; Victor</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;600&family=Great+Vibes&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Jost', 'Segoe UI', sans-serif; color: #2c2620; background: #fff; font-size: 11pt; }
    .pdf-header {
      background: linear-gradient(135deg, #a3801a 0%, #c9a227 50%, #e8c655 100%);
      color: #fff; text-align: center; padding: 48px 40px 36px;
    }
    .pdf-header .couple-names { font-family: 'Great Vibes', cursive; font-size: 52pt; line-height: 1.1; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.18); }
    .pdf-header .subtitle { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 16pt; font-style: italic; margin-top: 8px; opacity: 0.92; }
    .pdf-header .wedding-date { font-size: 11pt; letter-spacing: 4px; text-transform: uppercase; margin-top: 12px; opacity: 0.85; }
    .pdf-header .divider { width: 80px; height: 2px; background: rgba(255,255,255,0.6); margin: 18px auto 0; border-radius: 2px; }
    .pdf-meta { display: flex; justify-content: space-between; align-items: center; padding: 14px 40px; background: #fbf7ee; border-bottom: 1.5px solid #e8c655; font-size: 9pt; color: #6f665a; }
    .pdf-meta strong { color: #a3801a; }
    .wish-list { padding: 32px 40px 40px; }
    .wish-item { display: flex; gap: 18px; padding: 20px 0; border-bottom: 1px dashed #e8c655; page-break-inside: avoid; break-inside: avoid; }
    .wish-item:last-child { border-bottom: none; }
    .wish-number { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt; font-weight: 600; color: #c9a227; min-width: 36px; text-align: right; line-height: 1; padding-top: 2px; flex-shrink: 0; }
    .wish-body { flex: 1; }
    .wish-msg { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 13pt; font-style: italic; color: #2c2620; line-height: 1.7; margin-bottom: 8px; }
    .wish-meta { font-size: 9pt; color: #6f665a; }
    .wish-meta strong { color: #a3801a; font-size: 10pt; }
    .edited-tag { color: #c9a227; font-style: italic; margin-left: 4px; }
    .pdf-footer { text-align: center; padding: 18px 40px 28px; border-top: 1.5px solid #e8c655; font-size: 8.5pt; color: #6f665a; background: #fbf7ee; }
    .pdf-footer .script { font-family: 'Great Vibes', cursive; font-size: 22pt; color: #a3801a; display: block; margin-bottom: 4px; }
    @page { size: A4; margin: 0; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="pdf-header">
    <div class="couple-names">Namunacha &amp; Victor</div>
    <div class="subtitle">Wedding Wishes</div>
    <div class="wedding-date">05 · 12 · 2026 &nbsp;|&nbsp; Jalingo, Taraba, Nigeria</div>
    <div class="divider"></div>
  </div>
  <div class="pdf-meta">
    <span>Total wishes: <strong>${wishes.length}</strong></span>
    <span>Generated: <strong>${generatedDate}</strong></span>
  </div>
  <div class="wish-list">${wishItems}</div>
  <div class="pdf-footer">
    <span class="script">Namunacha &amp; Victor</span>
    Made with 💛 — 05 December 2026
  </div>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;";
  document.body.appendChild(iframe);
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(printHTML);
  iframeDoc.close();

  const doPrint = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
  };

  iframe.contentWindow.onload = () => setTimeout(doPrint, 600);
  setTimeout(() => { if (document.body.contains(iframe)) doPrint(); }, 2500);
});

/* =========================================================
   24. BACK TO TOP
========================================================= */
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* =========================================================
   25. SCROLL REVEAL
========================================================= */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

$$(".reveal").forEach((el) => revealObserver.observe(el));

/* Re-observe any .reveal elements added dynamically */
function observeRevealEls() {
  $$(".reveal:not(.visible)").forEach((el) => revealObserver.observe(el));
}

/* =========================================================
   26. FOOTER YEAR
========================================================= */
$("#year").textContent = new Date().getFullYear();