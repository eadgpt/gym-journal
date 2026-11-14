/* Gym Journal v3 — Apple-style. All data stays on this device (IndexedDB). */
(() => {
"use strict";

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = (n) => String(n).padStart(2, "0");
const dkey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d || 1); };
const todayKey = () => dkey(new Date());
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmt = (k, opt) => parseKey(k).toLocaleDateString(undefined, opt);
const round1 = (n) => Math.round(n * 10) / 10;
const round2 = (n) => Math.round(n * 100) / 100;
const weekStart = (k) => { const d = parseKey(k); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dkey(d); };
const MORNING_START = 4, MORNING_END = 12; // weigh-in + photos happen in the morning
const GOAL = { sets: 12, fuel: 5, water: 8, weight: null }; // ring goals (changeable in Settings); weight goal in kg

let urls = [];
const url = (blob) => { if (!blob) return ""; const u = URL.createObjectURL(blob); urls.push(u); return u; };
const freeUrls = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls = []; };

/* ---------- icons ---------- */
const P = {
  today: '<path d="M12 21s-7.5-4.6-7.5-10.4A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7.5 2.6C19.5 16.4 12 21 12 21z"/>',
  train: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  photo: '<path d="M4 8.5h3l1.8-3h6.4l1.8 3h3V19H4z"/><circle cx="12" cy="13.2" r="3.4"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  prog: '<path d="M4 19.5h16"/><path d="M5 15l4-4.5 3.5 3L19 6.5"/><path d="M15 6.5h4v4"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  food: '<path d="M7 3v7.5M4.8 3v4.8a2.2 2.2 0 0 0 4.4 0V3M7 10.5V21M17 21V3c-2.2 1.2-3.3 4-3.3 7.5H17"/>',
  drink: '<path d="M6 4h12l-1.6 16H7.6z"/><path d="M6.6 9.5h10.8"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M8.7 10a4.2 4.2 0 0 1 6.6 0"/><path d="M12 12.5l1.6-2.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  left: '<path d="M14.5 6l-6 6 6 6"/>',
  right: '<path d="M9.5 6l6 6-6 6"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  checkc: '<circle cx="12" cy="12" r="9"/><path d="M8 12.3l2.8 2.8L16.2 9.6"/>',
  star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18z"/><path d="M12 11v5M9.8 13.6L12 11l2.2 2.6"/>',
  restore: '<path d="M7 18h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.6 1.5A3.3 3.3 0 0 0 7 18z"/><path d="M12 16v-5M9.8 13.4L12 16l2.2-2.6"/>',
  flip: '<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  lib: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9.5" r="1.6"/><path d="M20 15l-4.5-4.5L6 20"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13"/>',
  timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
  drag: '<path d="M9 7l-4 5 4 5M15 7l4 5-4 5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  unit: '<path d="M4 7h16M4 12h10M4 17h6"/>',
  drop: '<path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z"/>',
  minus: '<path d="M5 12h14"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  wand: '<path d="M4 20L15 9M14 4v2M19 9h2M17.5 5.5L19 4M11 3l.6 1.4L13 5l-1.4.6L11 7l-.6-1.4L9 5l1.4-.6z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2h.01"/>',
  play: '<path d="M8 5.5v13l10-6.5z"/>'
};
const icon = (n, cls = "i") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

function toast(msg, ic = "checkc") {
  const t = $("#toast"); t.innerHTML = `${icon(ic)}<span>${esc(msg)}</span>`; t.hidden = false;
  t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
  clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2000);
}
const buzz = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} };

/* ---------- database ---------- */
let db;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("gymjournal", 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore("food", { keyPath: "id" }).createIndex("date", "date");
      d.createObjectStore("weight", { keyPath: "date" });
      const s = d.createObjectStore("sets", { keyPath: "id" });
      s.createIndex("date", "date"); s.createIndex("ex", "ex");
      d.createObjectStore("photos", { keyPath: "id" }).createIndex("date", "date");
      d.createObjectStore("meta", { keyPath: "key" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const store = (name, mode = "readonly") => db.transaction(name, mode).objectStore(name);
const all = (name) => req(store(name).getAll());
const byDate = (name, d) => name === "weight" ? get("weight", d).then((x) => (x ? [x] : [])) : req(store(name).index("date").getAll(d));
const inRange = (name, a, b) => {
  const kr = IDBKeyRange.bound(a, b);
  return req(name === "weight" ? store(name).getAll(kr) : store(name).index("date").getAll(kr));
};
const get = (name, key) => req(store(name).get(key));
const put = (name, val) => req(store(name, "readwrite").put(val));
const del = (name, key) => req(store(name, "readwrite").delete(key));
const clear = (name) => req(store(name, "readwrite").clear());
const meta = async (key, val) => (val === undefined ? (await get("meta", key))?.val : put("meta", { key, val }));

/* water: glasses per day, kept in the settings store as "water:YYYY-MM-DD" */
const getWater = async (d) => (await meta("water:" + d)) || 0;
const setWater = (d, n) => (n > 0 ? meta("water:" + d, n) : del("meta", "water:" + d));

/* per-day summary: w = weigh-in, f = food+drink entries, t = sets, p = photos, wa = water glasses */
async function marks(a, b) {
  const [w, f, s, p, wa] = await Promise.all([inRange("weight", a, b), inRange("food", a, b), inRange("sets", a, b), inRange("photos", a, b), req(store("meta").getAll(IDBKeyRange.bound("water:" + a, "water:" + b)))]);
  const m = {};
  const at = (d) => (m[d] ||= { w: null, f: 0, t: 0, p: [], wa: 0 });
  w.forEach((x) => (at(x.date).w = x));
  f.forEach((x) => at(x.date).f++);
  s.forEach((x) => at(x.date).t++);
  p.forEach((x) => at(x.date).p.push(x));
  wa.forEach((x) => (at(x.key.slice(6)).wa = x.val));
  return m;
}
const fuelVal = (f, wa) => GOAL.water ? (Math.min(1, f / GOAL.fuel) + Math.min(1, (wa || 0) / GOAL.water)) / 2 : f / GOAL.fuel;
const ringVals = (k) => !k ? [0, 0, 0] : [((k.w ? 1 : 0) + Math.min(3, k.p.length)) / 4, k.t / GOAL.sets, fuelVal(k.f, k.wa)];

/* ---------- rings ---------- */
const RING_COLS = ["var(--indigo)", "var(--pink)", "var(--orange)"];
const RING_PREV = {};
function ringsSVG(vals, size = 136, sw = 17, gap = 3, rk = "", label = "") {
  const c = size / 2; let out = "";
  vals.forEach((v, i) => {
    const r = c - sw / 2 - i * (sw + gap); if (r <= 0) return;
    const C = 2 * Math.PI * r, p = Math.max(0, Math.min(1, v));
    out += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${RING_COLS[i]}" stroke-opacity=".2" stroke-width="${sw}"/>`;
    if (p > 0) out += `<circle class="ring-arc" ${rk ? `data-rk="${rk}-${i}" data-c="${C.toFixed(1)}"` : ""} cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${RING_COLS[i]}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - p)).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>`;
  });
  return `<svg viewBox="0 0 ${size} ${size}" ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'}>${out}</svg>`;
}
const miniRings = (k) => ringsSVG(ringVals(k), 36, 4, 1.2);

/* ---------- state ---------- */
const S = {
  tab: "today", date: todayKey(), area: null, range: "week", unit: "kg", focus: [], cmpAngle: "front",
  calMonth: todayKey().slice(0, 7), calMode: "rings", calSel: todayKey(), bodyView: "front",
  closed: {}, celebrate: null
};
const animOn = () => document.documentElement.dataset.anim !== "off";
const wait = (ms) => new Promise((r) => setTimeout(r, animOn() ? ms : 0));
const toUnit = (kg) => (S.unit === "lb" ? kg * 2.20462 : kg);
const fromUnit = (v) => (S.unit === "lb" ? v / 2.20462 : v);
const wFmt = (kg) => round1(toUnit(kg)).toFixed(1);
function goalLine(kg) {
  if (!GOAL.weight || kg == null) return "";
  const diff = round1(toUnit(kg - GOAL.weight)), abs = Math.abs(diff);
  if (abs < 0.15) return `<div class="note goalnote">${icon("target")}Goal weight reached</div>`;
  return `<div class="note goalnote">${icon("target")}${abs.toFixed(1)} ${S.unit} to ${diff > 0 ? "lose" : "gain"} to reach ${wFmt(GOAL.weight)}</div>`;
}
const deltaHTML = (d) => `<span class="delta ${d < 0 ? "down" : d > 0 ? "up" : "same"}">${d > 0 ? "▲" : d < 0 ? "▼" : "="} ${Math.abs(d).toFixed(1)}</span>`;

/* ---------- images: shrunk on the phone (location data removed) ---------- */
function loadImage(blob) {
  return new Promise((res, rej) => {
    const img = new Image(); const u = URL.createObjectURL(blob);
    img.onload = () => { URL.revokeObjectURL(u); res(img); };
    img.onerror = () => { URL.revokeObjectURL(u); rej(new Error("Could not read image")); };
    img.src = u;
  });
}
function shrink(src, w, h, maxSide, quality) {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob(res, "image/jpeg", quality));
}
async function compress(fileOrBlob) {
  const img = await loadImage(fileOrBlob);
  const w = img.naturalWidth, h = img.naturalHeight;
  return { full: await shrink(img, w, h, 1080, 0.75), thumb: await shrink(img, w, h, 320, 0.7) };
}

/* ---------- shell ---------- */
const TABS = [
  { id: "today", name: "Today", ic: "today" },
  { id: "train", name: "Train", ic: "train" },
  { id: "photos", name: "Photos", ic: "photo" },
  { id: "calendar", name: "Calendar", ic: "cal" },
  { id: "progress", name: "Progress", ic: "prog" }
];
$("#tabs").innerHTML = TABS.map((t) => `<button data-tab="${t.id}" class="${t.id === S.tab ? "on" : ""}">${icon(t.ic)}${t.name}</button>`).join("");
$("#tabs").querySelectorAll("button").forEach((b) => (b.onclick = () => go(b.dataset.tab)));
function go(tab) {
  if (tab === S.tab && tab === "train") S.area = null;
  const from = TABS.findIndex((t) => t.id === S.tab), to = TABS.findIndex((t) => t.id === tab);
  $("#main").dataset.dir = to > from ? "1" : to < from ? "-1" : "0";
  S.tab = tab; if (tab !== "train") S.area = null;
  $("#tabs").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.tab === tab));
  render(true); window.scrollTo(0, 0);
}
const onScroll = () => $("#nav").classList.toggle("solid", window.scrollY > 36);
addEventListener("scroll", onScroll, { passive: true });

function titles() {
  const t = todayKey(), isToday = S.date === t;
  const dateLine = fmt(S.date, { weekday: "long", day: "numeric", month: "long" });
  if (S.tab === "today") return { eyebrow: dateLine, h1: isToday ? "Today" : S.date === addDays(t, -1) ? "Yesterday" : fmt(S.date, { weekday: "long" }) };
  if (S.tab === "train") return { eyebrow: isToday ? "Logging for today" : `Logging for ${fmt(S.date, { weekday: "short", day: "numeric", month: "short" })}`, h1: S.area ? AREAS.find((a) => a.id === S.area).name : "Train" };
  if (S.tab === "photos") return { eyebrow: isToday ? "Every morning · 3 angles" : `For ${fmt(S.date, { weekday: "short", day: "numeric", month: "short" })}`, h1: "Photos" };
  if (S.tab === "calendar") return { eyebrow: "Every day at a glance", h1: "Calendar" };
  return { eyebrow: "How your body is changing", h1: "Progress" };
}
function renderNav(tt) {
  const isToday = S.date === todayKey();
  const back = S.tab === "train" && S.area;
  const showToday = !isToday && ["today", "train", "photos"].includes(S.tab) && !back;
  $("#navLeft").innerHTML = back ? `<button class="pillbtn" id="nBack">${icon("left")}Train</button>` : showToday ? `<button class="pillbtn" id="nToday">${icon("sun")}Today</button>` : "";
  $("#navMini").textContent = tt.h1;
  $("#navActs").innerHTML = `${S.tab === "today" ? `<button class="circ" id="nAdd" aria-label="Add entry">${icon("plus")}</button>` : ""}<button class="circ" id="nHelp" aria-label="Help guide">${icon("help")}</button><button class="circ" id="nSet" aria-label="Settings">${icon("gear")}</button>`;
  $("#nSet").onclick = openSettings;
  $("#nHelp").onclick = () => startHelp(false);
  $("#nAdd") && ($("#nAdd").onclick = openAddMenu);
  $("#nBack") && ($("#nBack").onclick = () => { S.area = null; render(true); window.scrollTo(0, 0); });
  $("#nToday") && ($("#nToday").onclick = () => { S.date = todayKey(); render(); });
}

async function render(animate) {
  freeUrls();
  const tt = titles(); renderNav(tt);
  const m = $("#main");
  const view = { today: viewToday, train: viewTrain, photos: viewPhotos, calendar: viewCalendar, progress: viewProgress }[S.tab];
  const body = await view();
  m.innerHTML = `<div class="lt"><div class="eyebrow">${esc(tt.eyebrow)}</div><h1>${esc(tt.h1)}</h1></div>${body}`;
  if (animate && animOn()) {
    m.classList.remove("enter"); void m.offsetWidth; m.classList.add("enter");
    [...m.querySelectorAll(":scope > .lt, .col > *, :scope > :not(.lt):not(.cols)")].slice(0, 14).forEach((el, i) => { el.style.setProperty("--i", i); el.classList.add("rise"); });
  }
  bind(m); onScroll(); motion(m);
}

/* ---------- motion helpers ---------- */
const COUNT_PREV = {};
function motion(root) {
  // rings fill from where they were
  root.querySelectorAll(".ring-arc[data-rk]").forEach((el) => {
    const key = el.dataset.rk + S.date, target = parseFloat(el.getAttribute("stroke-dashoffset")), C = parseFloat(el.dataset.c);
    const from = RING_PREV[key] ?? C;
    RING_PREV[key] = target;
    if (!animOn() || from === target) return;
    el.style.transition = "none"; el.style.strokeDashoffset = from; void el.getBoundingClientRect();
    requestAnimationFrame(() => { el.style.transition = ""; el.style.strokeDashoffset = target; });
  });
  // numbers count from their last value
  root.querySelectorAll("[data-count]").forEach((el) => {
    const raw = el.dataset.count, to = parseFloat(raw), dec = (raw.split(".")[1] || "").length;
    const key = el.dataset.ck + S.date, from = COUNT_PREV[key] ?? (dec ? to : 0);
    COUNT_PREV[key] = to;
    if (!animOn() || from === to) return;
    const t0 = performance.now(), dur = 700;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (from + (to - from) * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(step); else { el.textContent = raw; if (from !== to) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); } }
    };
    requestAnimationFrame(step);
  });
  // a ring just closed
  if (S.celebrate) {
    const name = S.celebrate; S.celebrate = null;
    const card = $("#hRings", root);
    if (card) { card.classList.remove("celebrate"); void card.offsetWidth; card.classList.add("celebrate"); }
    setTimeout(() => toast(`${name} ring closed. Nice work!`, "star"), animOn() ? 650 : 0);
  }
}

/* segmented controls: sliding thumb */
function initSegs(root) {
  root.querySelectorAll(".seg").forEach((seg) => {
    const btns = [...seg.children];
    seg.style.setProperty("--n", btns.length);
    seg.style.setProperty("--i", Math.max(0, btns.findIndex((b) => b.classList.contains("on"))));
  });
}
function segMove(btn) {
  const seg = btn.closest(".seg"); if (!seg) return;
  const btns = [...seg.children];
  btns.forEach((b) => b.classList.toggle("on", b === btn));
  seg.style.setProperty("--i", btns.indexOf(btn));
}

/* iPhone-style question box (replaces the browser's plain confirm) */
function ask(title, message, okLabel = "OK", danger = false) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "alert-wrap";
    wrap.innerHTML = `<div class="alert" role="alertdialog" aria-modal="true" aria-labelledby="alT">
      <div class="alert-body"><h4 id="alT">${esc(title)}</h4>${message ? `<p>${esc(message)}</p>` : ""}</div>
      <div class="alert-btns"><button data-a="0">Cancel</button><button data-a="1" class="${danger ? "danger" : "strong"}">${esc(okLabel)}</button></div></div>`;
    const done = (v) => { wrap.classList.add("out"); setTimeout(() => wrap.remove(), animOn() ? 180 : 0); resolve(v); };
    wrap.querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => done(b.dataset.a === "1")));
    wrap.onkeydown = (e) => { if (e.key === "Escape") done(false); };
    document.body.appendChild(wrap);
    $("[data-a='1']", wrap).focus();
  });
}

/* ---------- sheet ---------- */
function openSheet({ title, left, right, body, onOpen }) {
  const w = $("#sheetWrap"), s = $("#sheet");
  s.innerHTML = `<div class="sbar"><button class="l" data-sb="l">${left || ""}</button><div class="ttl">${esc(title)}</div><button class="r" data-sb="r">${right || ""}</button></div>${body}`;
  w.hidden = false; s.scrollTop = 0;
  if (!left) $("[data-sb=l]", s).style.visibility = "hidden";
  if (left === "Cancel") $("[data-sb=l]", s).onclick = closeSheet;
  if (right === "Done") $("[data-sb=r]", s).onclick = () => { closeSheet(); render(); };
  s.classList.remove("closing"); $("#sheetBg").classList.remove("closing");
  initSegs(s);
  // drag the top bar down to close, like iOS
  const bar = $(".sbar", s); let y0 = null, dy = 0;
  bar.addEventListener("touchstart", (e) => { if (e.target.closest("button") || innerWidth >= 900) return; y0 = e.touches[0].clientY; dy = 0; s.style.transition = "none"; }, { passive: true });
  bar.addEventListener("touchmove", (e) => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); s.style.transform = `translateY(${dy}px)`; }, { passive: true });
  bar.addEventListener("touchend", () => { if (y0 === null) return; y0 = null; s.style.transition = ""; s.style.transform = ""; if (dy > 110) closeSheet(); });
  onOpen && onOpen(s);
}
function closeSheet() {
  const w = $("#sheetWrap"), s = $("#sheet");
  if (w.hidden) return;
  const finish = () => { w.hidden = true; s.innerHTML = ""; s.classList.remove("closing"); $("#sheetBg").classList.remove("closing"); };
  if (!animOn()) return finish();
  s.classList.add("closing"); $("#sheetBg").classList.add("closing");
  setTimeout(finish, 240);
}
$("#sheetBg").onclick = closeSheet;

/* ---------- + menu ---------- */
function openAddMenu() {
  const bg = document.createElement("div"); bg.className = "menu-bg";
  const m = document.createElement("div"); m.className = "menu"; m.setAttribute("role", "menu");
  const items = [["weigh", "Morning weigh-in", "scale", "c-indigo"], ["water", "Glass of water", "drop", "c-cyan"], ["food", "Food", "food", "c-orange"], ["drink", "Other drink", "drink", "c-cyan"], ["train", "Workout", "train", "c-pink"], ["photos", "Photos", "photo", "c-purple"]];
  m.innerHTML = items.map(([id, n, ic, c]) => `<button data-add="${id}" role="menuitem"><span>${n}</span><span class="${c}">${icon(ic)}</span></button>`).join("");
  const close = () => { bg.remove(); m.remove(); };
  bg.onclick = close;
  m.querySelectorAll("button").forEach((b) => (b.onclick = () => {
    close(); const a = b.dataset.add;
    if (a === "weigh") weighSheet(); else if (a === "water") addWater(1); else if (a === "food" || a === "drink") foodSheet(a); else go(a);
  }));
  document.body.append(bg, m);
}

/* ======================================================================
   TODAY
   ====================================================================== */
async function suggestArea() {
  const sets = await inRange("sets", addDays(todayKey(), -30), todayKey());
  const last = {}; sets.forEach((s) => { if (!last[s.area] || s.date > last[s.area]) last[s.area] = s.date; });
  const pool = AREAS.filter((a) => a.id !== "cardio");
  const ranked = pool.map((a) => ({ a, days: last[a.id] ? daysBetween(last[a.id], todayKey()) : 99, focus: S.focus.includes(a.id) }))
    .sort((x, y) => (y.focus - x.focus) || (y.days - x.days));
  return ranked[0];
}

async function upNext(day, w, photos, sets, food) {
  if (S.date !== todayKey()) return "";
  const h = new Date().getHours();
  const card = (act, data, color, ic, k, t, s) => `<button class="upnext" id="hNext" data-act="${act}" ${data}><span class="sq ${color}">${icon(ic)}</span><span><span class="k">${k}</span><br><span class="t">${t}</span>${s ? `<br><span class="s">${s}</span>` : ""}</span>${icon("right", "i go")}</button>`;
  if (h >= MORNING_START && h < MORNING_END) {
    if (!w) return card("weigh", "", "bg-indigo", "scale", "Up next · Morning check-in", "Step on the scale", "After the toilet, before food or water");
    const missing = ANGLES.find((a) => !photos.some((p) => p.angle === a.id));
    if (!photos.length) return card("handsfree", "", "bg-purple", "wand", "Up next · Morning photos", "Take all 3 hands-free", "Prop the phone up and follow the voice");
    if (missing) return card("shoot", `data-angle="${missing.id}"`, "bg-purple", "photo", `Up next · Photo ${photos.length + 1} of 3`, `Take your ${missing.name.toLowerCase()} photo`, missing.tip);
  }
  if (!sets.length && h < 22) {
    const sg = await suggestArea();
    const why = sg.focus ? "Your focus area" : sg.days >= 99 ? "Not trained yet" : `Last trained ${sg.days === 1 ? "yesterday" : `${sg.days} days ago`}`;
    return card("area", `data-id="${sg.a.id}"`, "bg-pink", "train", "Up next · Workout", `Train ${sg.a.name.toLowerCase()}`, why);
  }
  const meal = h >= 11 && h < 15 ? ["lunch", 11] : h >= 17 && h < 22 ? ["dinner", 17] : h >= 6 && h < 11 ? ["breakfast", 6] : null;
  if (meal && !food.some((f) => f.kind === "food" && Number(f.time.slice(0, 2)) >= meal[1])) {
    return card("addFood", 'data-kind="food"', "bg-orange", "food", "Up next", `Log ${meal[0]}`, "A quick note or a photo is enough");
  }
  return "";
}

async function viewToday() {
  const t = todayKey();
  const ws = weekStart(S.date), we = addDays(ws, 6);
  const [food, w, sets, photos, mk, allW] = await Promise.all([
    byDate("food", S.date), get("weight", S.date), byDate("sets", S.date), byDate("photos", S.date), marks(ws, we), all("weight")
  ]);
  const water = await getWater(S.date);
  const prev = allW.filter((x) => x.date < S.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const k = mk[S.date] || { w, f: food.length, t: sets.length, p: photos, wa: water };
  const [mv, tv, fv] = ringVals(k);
  const isToday = S.date === t, hour = new Date().getHours();

  /* week strip */
  const days = [...Array(7)].map((_, i) => addDays(ws, i));
  const week = `
    <div class="weekwrap"><div class="weeknav">
      <button class="circ sm" data-act="week" data-d="-7" aria-label="Previous week">${icon("left")}</button>
      <span>${ws === weekStart(t) ? "This week" : `Week of ${fmt(ws, { day: "numeric", month: "short" })}`}</span>
      <button class="circ sm" data-act="week" data-d="7" ${we >= t ? "disabled" : ""} aria-label="Next week">${icon("right")}</button>
    </div>
    <div class="week" id="hWeek">${days.map((d) => `<button class="wd${d === S.date ? " on" : ""}${d === t ? " today" : ""}" data-act="day" data-k="${d}" ${d > t ? "disabled" : ""} aria-label="${fmt(d, { weekday: "long", day: "numeric", month: "long" })}">
      <span class="l">${fmt(d, { weekday: "narrow" })}</span>${d > t ? `<span style="height:36px"></span>` : miniRings(mk[d])}</button>`).join("")}</div></div>`;

  /* rings */
  const rings = `<div class="card ringcard" id="hRings">
    ${ringsSVG([mv, tv, fv], 136, 17, 3, "today", `Morning ${Math.round(mv * 4)} of 4, Train ${sets.length} of ${GOAL.sets} sets, Fuel ${food.length} of ${GOAL.fuel} and ${water} of ${GOAL.water} glasses of water`)}
    <div class="ringleg">
      <div><div class="k indigo">Morning</div><div class="v"><span data-count="${(w ? 1 : 0) + Math.min(3, photos.length)}" data-ck="m">${(w ? 1 : 0) + Math.min(3, photos.length)}</span><small>/4</small></div></div>
      <div><div class="k pink">Train</div><div class="v"><span data-count="${sets.length}" data-ck="t">${sets.length}</span><small>/${GOAL.sets} sets</small></div></div>
      <div><div class="k orange">Fuel</div><div class="v"><span data-count="${food.length}" data-ck="f">${food.length}</span><small>/${GOAL.fuel}</small></div><div class="ringsub c-cyan">${icon("drop")}<span data-count="${water}" data-ck="wa">${water}</span>/${GOAL.water} water</div></div>
    </div></div>`;

  const next = await upNext(S.date, w, photos, sets, food);

  /* tiles */
  const d = w && prev ? round1(toUnit(w.kg - prev.kg)) : null;
  let wNote;
  if (w) wNote = d !== null ? `${deltaHTML(d)} <span class="note">since ${fmt(prev.date, { weekday: "short" })}</span>` : `<span class="note">First weigh-in</span>`;
  const morningOpen = isToday && hour >= MORNING_START && hour < MORNING_END;
  const wTile = `<button class="tile" data-act="weigh">
      <div class="top c-indigo">${icon("scale")}Weight<span class="tm">${w?.time ? esc(w.time) : ""}${icon("right")}</span></div>
      ${w ? `<div class="val"><span class="big" data-count="${wFmt(w.kg)}" data-ck="w">${wFmt(w.kg)}</span><span class="u">${S.unit}</span>${wNote}</div>${goalLine(w.kg)}`
          : `<div class="val"><span class="note">${!isToday ? "No weigh-in this morning" : morningOpen ? "Weigh in before noon" : hour < MORNING_START ? "Weigh in when you wake up" : "Missed this morning · tap to log anyway"}</span></div>`}
    </button>`;

  const names = [...new Set(sets.sort((a, b) => a.at - b.at).map((s) => s.ex))];
  const tTile = `<button class="tile" data-act="goTab" data-tab="train">
      <div class="top c-pink">${icon("train")}Workout<span class="tm">${sets.length ? hhmm(new Date(sets[0].at)) : ""}${icon("right")}</span></div>
      ${sets.length ? `<div class="val"><span class="big">${sets.length}</span><span class="u">sets</span><span class="note">${names.length} exercise${names.length > 1 ? "s" : ""}</span></div><div class="note">${esc(names.slice(0, 3).join(", "))}${names.length > 3 ? "…" : ""}</div>`
        : `<div class="val"><span class="note">No workout yet</span></div>`}
    </button>`;

  const meals = food.filter((f) => f.kind === "food").length, drinks = food.length - meals;
  const lastF = [...food].sort((a, b) => b.time.localeCompare(a.time))[0];
  const fTile = `<button class="tile" data-act="addFood" data-kind="food">
      <div class="top c-orange">${icon("food")}Food &amp; drink<span class="tm">${lastF ? esc(lastF.time) : ""}${icon("plus")}</span></div>
      ${food.length ? `<div class="val"><span class="big">${meals}</span><span class="u">food</span><span class="big" style="margin-left:8px">${drinks}</span><span class="u">drink${drinks === 1 ? "" : "s"}</span></div><div class="note">Last: ${esc(lastF.text || (lastF.kind === "drink" ? "Drink" : "Meal"))}</div>`
        : `<div class="val"><span class="note">Nothing logged yet</span></div>`}
    </button>`;

  const shown = Math.min(16, Math.max(GOAL.water, water));
  const waterTile = `<div class="tile watertile" id="hWater">
      <div class="top c-cyan">${icon("drop")}Water<span class="tm">${water >= GOAL.water ? `${icon("check")}Goal reached` : `${GOAL.water - water} to go`}</span></div>
      <div class="glasses" role="group" aria-label="${water} of ${GOAL.water} glasses">${[...Array(shown)].map((_, i) => `<button class="glass${i < water ? " full" : ""}${i === water - 1 && S.waterJust ? " just" : ""}" data-act="waterSet" data-n="${i + 1 === water ? i : i + 1}" aria-label="${i < water ? `Remove glass ${i + 1}` : `Fill glass ${i + 1}`}"><i></i></button>`).join("")}</div>
      <div class="wbtns"><span class="big num" data-count="${water}" data-ck="wa2">${water}</span><span class="u">/ ${GOAL.water} glasses</span><button class="btn fill" data-act="water" data-d="1">${icon("plus")}Glass</button></div>
    </div>`;
  S.waterJust = false;

  const pTile = `<button class="tile" data-act="goTab" data-tab="photos">
      <div class="top c-purple">${icon("photo")}Photos<span class="tm">${photos.length}/3${icon("right")}</span></div>
      <div class="thumbs">${ANGLES.map((a) => { const p = photos.find((x) => x.angle === a.id); return p ? `<img src="${url(p.thumb)}" alt="${a.name}">` : `<span aria-hidden="true"></span>`; }).join("")}</div>
    </button>`;

  /* timeline */
  const items = [];
  if (w) items.push({ tm: w.time || "07:00", html: `<div class="row tlrow"><span class="tmc">${esc(w.time || "")}</span><span class="dotc bg-indigo"></span><div class="main"><div class="t">Weighed <span class="num">${wFmt(w.kg)} ${S.unit}</span></div></div></div>` });
  food.forEach((f) => items.push({ tm: f.time, html: `<button class="row tlrow" data-act="editFood" data-id="${f.id}"><span class="tmc">${esc(f.time)}</span><span class="dotc ${f.kind === "drink" ? "bg-cyan" : "bg-orange"}"></span><div class="main"><div class="t">${esc(f.text) || (f.kind === "drink" ? "Drink" : "Meal")}</div><div class="s">${f.kind === "drink" ? "Drink" : "Food"}</div></div>${f.photo ? `<img class="thumb" src="${url(f.thumb || f.photo)}" alt="">` : ""}</button>` }));
  if (sets.length) { const tm = hhmm(new Date(sets[0].at)); items.push({ tm, html: `<button class="row tlrow" data-act="goTab" data-tab="train"><span class="tmc">${tm}</span><span class="dotc bg-pink"></span><div class="main"><div class="t">Workout · ${sets.length} sets</div><div class="s">${esc(names.join(", "))}</div></div></button>` }); }
  if (photos.length) { const tm = hhmm(new Date(Math.min(...photos.map((p) => p.at || Date.now())))); items.push({ tm, html: `<button class="row tlrow" data-act="goTab" data-tab="photos"><span class="tmc">${tm}</span><span class="dotc bg-purple"></span><div class="main"><div class="t">Progress photos</div><div class="s">${photos.length} of 3 angles</div></div></button>` }); }
  items.sort((a, b) => a.tm.localeCompare(b.tm));

  /* banners */
  let notes = "";
  const standalone = navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  const last = await meta("lastBackup");
  const count = (await req(store("food").count())) + (await req(store("weight").count())) + (await req(store("sets").count()));
  if (!standalone || (count > 5 && (!last || Date.now() - last > 7 * 864e5))) {
    notes = `<div class="grouplabel">Keep your journal safe</div><div class="group">
      ${!standalone ? `<div class="row ico"><span class="sq bg-gray">${icon("phone")}</span><div class="main"><div class="t">Add to Home Screen</div><div class="s">In Safari tap Share, then “Add to Home Screen”. Safari then can't clear your journal.</div></div></div>` : ""}
      ${count > 5 && (!last || Date.now() - last > 7 * 864e5) ? `<button class="row ico" data-act="settings"><span class="sq bg-cyan">${icon("cloud")}</span><div class="main"><div class="t">Save a backup</div><div class="s">${last ? `Last one ${Math.floor((Date.now() - last) / 864e5)} days ago` : "You haven't saved one yet"}</div></div>${icon("right", "i chev")}</button>` : ""}
    </div>`;
  }

  // ring-closed celebration
  const closedNow = [mv >= 1, tv >= 1, fv >= 1];
  const prevClosed = S.closed[S.date];
  if (prevClosed && isToday) { const names = ["Morning", "Train", "Fuel"]; const hit = closedNow.findIndex((c, i) => c && !prevClosed[i]); if (hit >= 0) S.celebrate = names[hit]; }
  S.closed[S.date] = closedNow;

  return `<div class="cols tgrid"><div class="col ca">${week}${rings}${next}</div><div class="col cb">
    <div class="sh"><h2>Summary</h2></div>
    <div class="tiles" id="hTiles">${wTile}${waterTile}${tTile}${fTile}${pTile}</div>
    </div><div class="col cc"><div class="sh"><h2>Your day</h2><span class="aside gray">${items.length ? `${items.length} entr${items.length > 1 ? "ies" : "y"}` : ""}</span></div>
    <div class="group" id="hDay">${items.length ? items.map((i) => i.html).join("") : `<div class="empty">${isToday ? "Your day fills in as you log. Start with the <b>morning weigh-in</b>, then add meals and drinks as you go." : "Nothing was logged on this day. You can still add entries with +."}</div>`}</div>
    ${notes}</div></div>`;
}

function setText(s) {
  if (s.min != null) return `${s.min} min`;
  if (s.sec != null) return `${s.sec}s`;
  return s.kg ? `${wFmt(s.kg).replace(/\.0$/, "")} ${S.unit} × ${s.reps}` : `${s.reps} reps`;
}

/* weigh-in sheet */
async function weighSheet() {
  const w = await get("weight", S.date);
  const allW = await all("weight");
  const prev = allW.filter((x) => x.date < S.date).sort((a, b) => b.date.localeCompare(a.date))[0];
  const h = new Date().getHours(), isToday = S.date === todayKey();
  const late = isToday && (h >= MORNING_END || h < MORNING_START);
  openSheet({
    title: "Morning weigh-in", left: "Cancel", right: w ? "Save" : "Add",
    body: `
      <div class="card bigentry">
        <input type="number" inputmode="decimal" step="0.1" id="wIn" placeholder="${prev ? wFmt(prev.kg) : "0.0"}" value="${w ? wFmt(w.kg) : ""}" aria-label="Weight in ${S.unit}"><span class="u">${S.unit}</span>
        <div class="muted" style="font-size:15px;margin-top:4px">${prev ? `Last time ${wFmt(prev.kg)} ${S.unit} · ${fmt(prev.date, { weekday: "short", day: "numeric", month: "short" })}` : "Your first weigh-in"}</div>
      </div>
      <div class="foot">${late ? "It's outside the morning. Weights later in the day read higher, so compare with care." : "Same time each morning: after the toilet, before food or water."}</div>
      ${w ? `<div class="group" style="margin-top:22px"><button class="row center danger" id="wDel">Remove weigh-in</button></div>` : ""}`,
    onOpen: (s) => {
      const inp = $("#wIn", s);
      setTimeout(() => inp.focus(), 350);
      const save = async () => {
        const v = parseFloat(inp.value);
        if (!v || v < 20 || v > 400) { toast("Enter your weight", "x"); return; }
        await put("weight", { date: S.date, kg: round2(fromUnit(v)), time: w?.time || (isToday ? hhmm() : "07:00") });
        closeSheet(); buzz(15); render(); toast("Weigh-in saved");
      };
      $("[data-sb=r]", s).onclick = save;
      inp.onkeydown = (e) => { if (e.key === "Enter") save(); };
      $("#wDel", s) && ($("#wDel", s).onclick = async () => { if (await ask("Remove this weigh-in?", "", "Remove", true)) { await del("weight", S.date); closeSheet(); render(); toast("Weigh-in removed", "trash"); } });
    }
  });
}

/* food sheet */
function foodSheet(kind, existing) {
  const f = existing || { id: uid(), date: S.date, kind, text: "", time: S.date === todayKey() ? hhmm() : "12:00" };
  let photo = f.photo || null, thumb = f.thumb || null, k = f.kind;
  openSheet({
    title: existing ? "Edit entry" : k === "drink" ? "New drink" : "New food", left: "Cancel", right: existing ? "Save" : "Add",
    body: `
      <div class="seg" id="fKind">${["food", "drink"].map((x) => `<button class="${k === x ? "on" : ""}" data-k="${x}">${x === "food" ? "Food" : "Drink"}</button>`).join("")}</div>
      <div class="field"><textarea id="fText" placeholder="${k === "drink" ? "Protein shake, 2 glasses of water, black coffee" : "Chicken rice, 2 eggs and toast"}">${esc(f.text)}</textarea></div>
      <div class="group">
        <label class="row ico"><span class="sq bg-gray">${icon("clock")}</span><div class="main"><div class="t">Time</div></div><input type="time" id="fTime" value="${f.time}" style="width:auto;background:var(--fill);padding:6px 10px;font-size:17px"></label>
        <button class="row ico" id="fPhotoBtn"><span class="sq bg-purple">${icon("photo")}</span><div class="main"><div class="t" id="fPhotoLbl">${photo ? "Change photo" : "Add a photo"}</div></div>${icon("right", "i chev")}</button>
      </div>
      <div class="field" id="fPhotoBox" style="margin-top:12px"></div>
      <input type="file" accept="image/*" class="hidden-input" id="fFile">
      ${existing ? `<div class="group" style="margin-top:10px"><button class="row center danger" id="fDel">Delete entry</button></div>` : ""}`,
    onOpen: (s) => {
      s.querySelectorAll("#fKind button").forEach((b) => (b.onclick = () => {
        k = b.dataset.k; segMove(b);
        if (!existing) $(".sbar .ttl", s).textContent = k === "drink" ? "New drink" : "New food";
      }));
      const box = $("#fPhotoBox", s);
      const showPhoto = () => { box.innerHTML = photo ? `<img class="preview" src="${url(photo)}" alt="">` : ""; $("#fPhotoLbl", s).textContent = photo ? "Change photo" : "Add a photo"; };
      showPhoto();
      $("#fPhotoBtn", s).onclick = () => $("#fFile", s).click();
      $("#fFile", s).onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        try { const c = await compress(file); photo = c.full; thumb = c.thumb; showPhoto(); } catch { toast("Couldn't read that photo", "x"); }
      };
      $("[data-sb=r]", s).onclick = async () => {
        const text = $("#fText", s).value.trim();
        if (!text && !photo) { toast("Write a note or add a photo", "x"); return; }
        await put("food", { ...f, text, time: $("#fTime", s).value || hhmm(), kind: k, photo, thumb });
        closeSheet(); buzz(12); render(); toast(existing ? "Saved" : k === "drink" ? "Drink added" : "Food added");
      };
      if (existing) $("#fDel", s).onclick = async () => { if (await ask("Delete this entry?", "It will be removed from your day.", "Delete", true)) { await del("food", f.id); closeSheet(); render(); toast("Deleted", "trash"); } };
      if (!existing) setTimeout(() => $("#fText", s).focus(), 350);
    }
  });
}

/* ======================================================================
   TRAIN
   ====================================================================== */
const BODY = {
  front: [
    ["shoulders", '<ellipse cx="61" cy="90" rx="19" ry="14"/>', '<ellipse cx="139" cy="90" rx="19" ry="14"/>'],
    ["chest", '<rect x="72" y="80" width="27" height="44" rx="13"/>', '<rect x="101" y="80" width="27" height="44" rx="13"/>'],
    ["arms", '<rect x="35" y="100" width="20" height="64" rx="10"/>', '<rect x="145" y="100" width="20" height="64" rx="10"/>', '<rect x="29" y="168" width="19" height="62" rx="9.5"/>', '<rect x="152" y="168" width="19" height="62" rx="9.5"/>'],
    ["core", '<rect x="76" y="128" width="48" height="74" rx="13"/>'],
    ["legs", '<rect x="72" y="230" width="27" height="88" rx="13.5"/>', '<rect x="101" y="230" width="27" height="88" rx="13.5"/>', '<rect x="74" y="324" width="23" height="78" rx="11.5"/>', '<rect x="103" y="324" width="23" height="78" rx="11.5"/>']
  ],
  back: [
    ["shoulders", '<ellipse cx="61" cy="90" rx="19" ry="14"/>', '<ellipse cx="139" cy="90" rx="19" ry="14"/>'],
    ["back", '<rect x="72" y="80" width="56" height="94" rx="15"/>', '<rect x="79" y="177" width="42" height="25" rx="10"/>'],
    ["arms", '<rect x="35" y="100" width="20" height="64" rx="10"/>', '<rect x="145" y="100" width="20" height="64" rx="10"/>', '<rect x="29" y="168" width="19" height="62" rx="9.5"/>', '<rect x="152" y="168" width="19" height="62" rx="9.5"/>'],
    ["glutes", '<rect x="72" y="205" width="27" height="38" rx="14"/>', '<rect x="101" y="205" width="27" height="38" rx="14"/>'],
    ["legs", '<rect x="72" y="247" width="27" height="72" rx="13.5"/>', '<rect x="101" y="247" width="27" height="72" rx="13.5"/>', '<rect x="74" y="324" width="23" height="78" rx="11.5"/>', '<rect x="103" y="324" width="23" height="78" rx="11.5"/>']
  ]
};
function bodySVG(view, load) {
  const lvl = (n) => (!n ? "" : n < 6 ? " l1" : n < 12 ? " l2" : " l3");
  const hips = view === "front" ? '<rect class="head" x="74" y="205" width="52" height="22" rx="10"/>' : "";
  return `<svg class="bodymap" viewBox="0 0 200 410" role="img" aria-label="Body map, ${view} view. Tap an area.">
    <circle class="head" cx="100" cy="38" r="22"/><rect class="head" x="90" y="58" width="20" height="16" rx="6"/>${hips}
    ${BODY[view].map(([id, ...shapes]) => `<g class="rg${lvl(load[id])}${S.focus.includes(id) ? " focus" : ""}" data-act="area" data-id="${id}" role="button" aria-label="${AREAS.find((a) => a.id === id).name}">${shapes.join("")}</g>`).join("")}
  </svg>`;
}
async function lastSetsFor(ex, beforeDate) {
  const rows = (await req(store("sets").index("ex").getAll(ex))).filter((s) => s.date < beforeDate);
  if (!rows.length) return null;
  const d = rows.reduce((m, s) => (s.date > m ? s.date : m), "");
  return { date: d, sets: rows.filter((s) => s.date === d).sort((a, b) => a.at - b.at) };
}

async function viewTrain() {
  const today = await byDate("sets", S.date);
  if (!S.area) {
    const recent = await inRange("sets", addDays(S.date, -6), S.date);
    const load = {}; recent.forEach((s) => (load[s.area] = (load[s.area] || 0) + 1));
    const counts = {}; today.forEach((s) => (counts[s.area] = (counts[s.area] || 0) + 1));
    const order = [...AREAS].sort((a, b) => S.focus.includes(b.id) - S.focus.includes(a.id));
    return `
    <div class="seg" id="hBodySeg">${["front", "back"].map((v) => `<button class="${S.bodyView === v ? "on" : ""}" data-act="bodyView" data-v="${v}">${v === "front" ? "Front" : "Back"}</button>`).join("")}</div>
    <div class="trainlay">
      <div class="bodywrap" id="hBody">${bodySVG(S.bodyView, load)}
        <div class="legend"><span class="sw" style="background:color-mix(in srgb, var(--pink) 35%, var(--body-fill))"></span><span class="sw" style="background:color-mix(in srgb, var(--pink) 65%, var(--body-fill))"></span><span class="sw" style="background:var(--pink)"></span><span>Sets, last 7 days</span></div>
      </div>
      <div class="group" id="hAreas">${order.map((a) => `<button class="row" data-act="area" data-id="${a.id}">
        <div class="main"><div class="t">${S.focus.includes(a.id) ? icon("star", "i star") + " " : ""}${a.name}</div><div class="s">${load[a.id] ? `${load[a.id]} sets this week` : `${a.ex.length} exercises`}</div></div>
        ${counts[a.id] ? `<span class="badge" aria-label="${counts[a.id]} sets today">${counts[a.id]}</span>` : icon("right", "i chev")}</button>`).join("")}</div>
    </div>`;
  }
  const area = AREAS.find((a) => a.id === S.area);
  const lasts = await Promise.all(area.ex.map((e) => lastSetsFor(e.n, S.date)));
  const isFocus = S.focus.includes(area.id);
  return `
  <div class="group">${area.ex.map((e, i) => {
    const done = today.filter((s) => s.ex === e.n).length, l = lasts[i];
    return `<button class="row" data-act="logEx" data-i="${i}">
      <div class="main"><div class="t">${esc(e.n)}</div><div class="s">${l ? `Last ${fmt(l.date, { day: "numeric", month: "short" })} · <span class="num">${l.sets.map(setText).join(", ")}</span>` : esc(e.eq)}</div></div>
      ${done ? `<span class="badge">${done}</span>` : icon("right", "i chev")}</button>`;
  }).join("")}</div>
  <div class="foot">Tap an exercise to see how to do it and log your sets.</div>
  <div class="group" style="margin-top:22px"><button class="row center" data-act="focus" data-id="${area.id}">${isFocus ? "Remove from focus areas" : `Make ${area.name.toLowerCase()} a focus area`}</button></div>
  <div class="foot">Focus areas show first and get suggested on Today.</div>`;
}

async function logSheet(areaId, exIdx) {
  const area = AREAS.find((a) => a.id === areaId), e = area.ex[exIdx];
  const last = await lastSetsFor(e.n, S.date);
  const todays = async () => (await req(store("sets").index("ex").getAll(e.n))).filter((s) => s.date === S.date).sort((a, b) => a.at - b.at);
  let cur = await todays();
  const seed = cur[cur.length - 1] || last?.sets[0];
  const wv = seed?.kg ? round1(toUnit(seed.kg)) : 0, rv = seed?.reps || 10, mv = seed?.min || 20, sv = seed?.sec || 30;
  const stepper = (id, val, label) => `<div class="field"><div class="grouplabel" style="margin:0 4px 6px">${label}</div><div class="stepper"><button data-step="${id}" data-d="-1" aria-label="Less">−</button><input type="number" inputmode="decimal" id="${id}" value="${val}" aria-label="${label}"><button data-step="${id}" data-d="1" aria-label="More">+</button></div></div>`;
  const inputs = e.t === "cardio" ? stepper("sMin", mv, "Minutes")
    : e.t === "time" ? stepper("sSec", sv, "Seconds")
    : stepper("sW", wv, `Weight (${S.unit})${e.t === "body" ? " · 0 = bodyweight" : ""}`) + stepper("sR", rv, "Reps");

  openSheet({
    title: e.n, right: "Done",
    body: `
      <div class="howto">${esc(e.h)}</div>
      ${last ? `<div class="group" style="margin-bottom:16px"><div class="row ico"><span class="sq bg-pink">${icon("clock")}</span><div class="main"><div class="t">Last time · ${fmt(last.date, { weekday: "short", day: "numeric", month: "short" })}</div><div class="s num">${last.sets.map(setText).join(" · ")}</div></div></div></div>` : ""}
      ${inputs}
      <button class="btn fill block" id="sAdd">${icon("plus")}Add set</button>
      <div class="grouplabel">Today's sets</div>
      <div class="group" id="sList"></div>`,
    onOpen: (s) => {
      const steps = { sW: S.unit === "lb" ? 5 : 2.5, sR: 1, sMin: 5, sSec: 10 };
      s.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => {
        const inp = $("#" + b.dataset.step, s);
        inp.value = Math.max(0, round1((parseFloat(inp.value) || 0) + steps[b.dataset.step] * Number(b.dataset.d)));
        buzz(6);
      }));
      const drawList = (newId) => {
        $("#sList", s).innerHTML = cur.length
          ? cur.map((x, i) => `<div class="row${x.id === newId ? " new" : ""}"><div class="setrow main"><span class="n">${i + 1}</span><span class="w">${setText(x)}</span><button class="x" data-del="${x.id}" aria-label="Delete set ${i + 1}">${icon("x")}</button></div></div>`).join("")
          : `<div class="empty">No sets yet. Set the numbers, then tap <b>Add set</b> after each one.</div>`;
        s.querySelectorAll("[data-del]").forEach((b) => (b.onclick = async () => { await del("sets", b.dataset.del); cur = await todays(); drawList(); }));
      };
      drawList();
      $("#sAdd", s).onclick = async () => {
        const row = { id: uid(), date: S.date, at: Date.now(), ex: e.n, area: area.id };
        if (e.t === "cardio") row.min = parseFloat($("#sMin", s).value) || 0;
        else if (e.t === "time") row.sec = parseFloat($("#sSec", s).value) || 0;
        else { row.kg = round2(fromUnit(parseFloat($("#sW", s).value) || 0)); row.reps = parseInt($("#sR", s).value) || 0; }
        if (!(row.min || row.sec || row.reps)) { toast("Enter a number first", "x"); return; }
        await put("sets", row); cur = await todays(); drawList(row.id); buzz(15);
        toast(`Set ${cur.length} saved`);
      };
    }
  });
}

/* ======================================================================
   PHOTOS
   ====================================================================== */
const ANGLES = [
  { id: "front", name: "Front", tip: "Face the camera, arms relaxed by your sides." },
  { id: "side", name: "Side", tip: "Turn left 90°, arms relaxed, stand tall." },
  { id: "back", name: "Back", tip: "Back to the camera. The 10 second timer helps." }
];
const SIL = '<svg class="sil" viewBox="0 0 60 120" fill="currentColor" aria-hidden="true"><circle cx="30" cy="12" r="9"/><rect x="17" y="24" width="26" height="44" rx="11"/><rect x="7" y="27" width="8" height="38" rx="4"/><rect x="45" y="27" width="8" height="38" rx="4"/><rect x="18" y="66" width="10" height="50" rx="5"/><rect x="32" y="66" width="10" height="50" rx="5"/></svg>';
async function prevPhoto(angle, before) {
  const rows = (await all("photos")).filter((p) => p.angle === angle && p.date < before);
  return rows.sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}
async function viewPhotos() {
  const [photos, everything] = await Promise.all([byDate("photos", S.date), all("photos")]);
  const pastDays = [...new Set(everything.filter((p) => p.date !== S.date).map((p) => p.date))].sort().reverse().slice(0, 14);
  return `
  <div class="cols"><div class="col">
  <button class="btn fill block handsbtn" id="hHands" data-act="handsfree">${icon("wand")}Take all 3 hands-free</button>
  <div class="foot" style="text-align:center;margin:8px 0 14px">Prop your phone up, tap, then step back. It tells you when to turn.</div>
  <div class="angles" id="hAngles">${ANGLES.map((a) => {
    const p = photos.find((x) => x.angle === a.id);
    return `<button class="angle" data-act="shoot" data-angle="${a.id}" aria-label="${p ? "Retake" : "Take"} ${a.name} photo">
      ${p ? `<img src="${url(p.thumb)}" alt=""><span class="tag">${icon("check")}${a.name}</span>` : `${SIL}<span>${a.name}</span>`}
    </button>`;
  }).join("")}</div>
  <div class="foot" style="text-align:center">${photos.length === 3 ? "All three done. Tap one to retake it." : `${3 - photos.length} left ${S.date === todayKey() ? "this morning" : "for this day"}`}</div>
  ${pastDays.length ? `<div class="sh"><h2>Recent</h2><span class="aside gray">Front</span></div>
    <div class="strip">${pastDays.map((d) => { const p = everything.find((x) => x.date === d && x.angle === "front") || everything.find((x) => x.date === d);
      return `<button data-act="day" data-k="${d}" data-to="photos"><img src="${url(p.thumb)}" alt="">${fmt(d, { day: "numeric", month: "short" })}</button>`; }).join("")}</div>` : ""}
  </div><div class="col"><div class="grouplabel">Private</div>
  <div class="group" id="hPrivate"><button class="row ico" data-act="settings"><span class="sq bg-green">${icon("lock")}</span><div class="main"><div class="t">Only in Gym Journal</div><div class="s">These photos won't show up in your iPhone's Photos gallery. Only this app can see them.</div></div>${icon("right", "i chev")}</button></div>
  <div class="grouplabel">Photos you can compare</div>
  <div class="group">
    <div class="row ico"><span class="sq bg-orange">${icon("sun")}</span><div class="main"><div class="t">Same spot, same light</div><div class="s">Every morning, before breakfast</div></div></div>
    <div class="row ico"><span class="sq bg-indigo">${icon("phone")}</span><div class="main"><div class="t">Prop the phone at chest height</div><div class="s">About 2 m away, use the timer</div></div></div>
    <div class="row ico"><span class="sq bg-purple">${icon("photo")}</span><div class="main"><div class="t">Line up with the faint outline</div><div class="s">Yesterday's photo shows through the camera</div></div></div>
  </div></div></div>`;
}

let camStream = null;
async function shootFlow(angle) {
  const a = ANGLES.find((x) => x.id === angle);
  const existing = await get("photos", `${S.date}_${angle}`);
  const ghost = await prevPhoto(angle, S.date);
  let facing = "user", timer = 10;
  const el = document.createElement("div");
  el.className = "cam";
  el.innerHTML = `
    <div class="cam-view mirror" id="cv">
      <video playsinline autoplay muted></video>
      ${ghost ? `<img class="ghost" src="${url(ghost.full)}" alt="">` : ""}
      <div class="guide"></div>
      <div class="cam-top"><button id="cClose">${icon("x")}Close</button><span>${a.name}</span><button id="cTimer">${icon("timer")}<span>10s</span></button></div>
      <div class="cam-count" id="cCount"></div>
    </div>
    <div class="cam-bar">
      <button class="side" id="cLib">${existing ? `${icon("trash")}Delete` : `${icon("lib")}Library`}</button>
      <button class="shutter" id="cShoot" aria-label="Take photo"></button>
      <button class="side right" id="cFlip">${icon("flip")}Flip</button>
    </div>
    <input type="file" accept="image/*" class="hidden-input" id="cFile">`;
  document.body.appendChild(el);
  const video = $("video", el), cv = $("#cv", el);
  const stop = () => { camStream?.getTracks().forEach((t) => t.stop()); camStream = null; };
  const close = () => { stop(); el.remove(); render(); };
  const start = async () => {
    stop();
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      video.srcObject = camStream; cv.classList.toggle("mirror", facing === "user");
    } catch {
      cv.querySelectorAll("video, .ghost, .guide").forEach((n) => n.remove());
      const msg = document.createElement("div");
      msg.className = "cam-msg";
      msg.innerHTML = `Camera isn't available.<br><br>Tap <b>Library</b> or the round button to pick a photo or use the Camera app.<br><br><span style="opacity:.75">${esc(a.tip)}</span>`;
      cv.appendChild(msg);
      if (existing) { const b = $("#cLib", el); b.dataset.lib = "1"; b.innerHTML = `${icon("lib")}Library`; }
    }
  };
  const save = async (blob) => {
    const c = await compress(blob);
    await put("photos", { id: `${S.date}_${angle}`, date: S.date, angle, full: c.full, thumb: c.thumb, at: Date.now() });
    buzz(20); toast(`${a.name} photo saved`); close();
  };
  $("#cClose", el).onclick = close;
  $("#cTimer", el).onclick = () => { timer = timer === 10 ? 3 : timer === 3 ? 0 : 10; $("#cTimer span", el).textContent = timer ? `${timer}s` : "Off"; };
  $("#cFlip", el).onclick = () => { facing = facing === "user" ? "environment" : "user"; start(); };
  $("#cLib", el).onclick = async () => {
    if (existing && !$("#cLib", el).dataset.lib) {
      if (await ask(`Delete this ${a.name.toLowerCase()} photo?`, "This can't be undone.", "Delete", true)) { await del("photos", existing.id); close(); }
      return;
    }
    $("#cFile", el).click();
  };
  $("#cFile", el).onchange = (e) => { const f = e.target.files[0]; if (f) save(f).catch(() => toast("Couldn't read that photo", "x")); };
  $("#cShoot", el).onclick = async () => {
    if (!camStream || !video.videoWidth) { $("#cFile", el).click(); return; }
    const count = $("#cCount", el);
    for (let i = timer; i > 0; i--) { count.textContent = i; buzz(5); await new Promise((r) => setTimeout(r, 1000)); if (!camStream) return; }
    count.textContent = "";
    const blob = await shrink(video, video.videoWidth, video.videoHeight, 1920, 0.92);
    stop(); save(blob);
  };
  toast(a.tip, "photo");
  start();
}


/* ---------- hands-free: front, side, back in one go, with voice + beeps ---------- */
async function handsFree() {
  const STEPS = [
    { id: "front", say: "Get into position. Face the camera. Front photo in 10 seconds.", wait: 10, label: "Face the camera" },
    { id: "side", say: "Now turn to your left.", wait: 5, label: "Turn to your left" },
    { id: "back", say: "Now turn around, back to the camera.", wait: 6, label: "Turn around" }
  ];
  const ghosts = {};
  for (const st of STEPS) ghosts[st.id] = await prevPhoto(st.id, S.date);
  let facing = "user", running = false, cancelled = false, audio = null;
  const el = document.createElement("div");
  el.className = "cam hands";
  el.innerHTML = `
    <div class="cam-view mirror" id="cv">
      <video playsinline autoplay muted></video>
      <img class="ghost" alt="" hidden>
      <div class="guide"></div>
      <div class="cam-flash"></div>
      <div class="cam-top"><button id="cClose">${icon("x")}Close</button><span id="hfTitle">Hands-free</span><span style="width:84px"></span></div>
      <div class="hf-steps">${STEPS.map((st, i) => `<span data-i="${i}">${ANGLES.find((a) => a.id === st.id).name}</span>`).join("")}</div>
      <div class="cam-count" id="cCount"></div>
      <div class="hf-say" id="hfSay">Prop your phone at chest height, about 2 m away. Tap Start, then step back.</div>
    </div>
    <div class="cam-bar">
      <button class="side" id="cFlip">${icon("flip")}Flip</button>
      <button class="hf-start" id="hfStart">Start</button>
      <span></span>
    </div>`;
  document.body.appendChild(el);
  const video = $("video", el), cv = $("#cv", el), ghost = $(".ghost", el), count = $("#cCount", el), sayEl = $("#hfSay", el);
  let stream = null;
  const stop = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; };
  const close = () => { cancelled = true; try { speechSynthesis.cancel(); } catch {} stop(); try { audio?.close(); } catch {} el.remove(); render(); };
  const speak = (t) => { sayEl.textContent = t; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.rate = 1; speechSynthesis.speak(u); } catch {} };
  const beep = (f = 880, ms = 110) => { try { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = f; o.connect(g); g.connect(audio.destination); g.gain.setValueAtTime(0.18, audio.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + ms / 1000); o.start(); o.stop(audio.currentTime + ms / 1000); } catch {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const showStep = (i) => {
    el.querySelectorAll(".hf-steps span").forEach((x, k) => x.className = k < i ? "done" : k === i ? "on" : "");
    const g = ghosts[STEPS[i]?.id];
    if (g) { ghost.src = url(g.full); ghost.hidden = false; } else ghost.hidden = true;
  };
  const start = async () => {
    stop();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
      video.srcObject = stream; cv.classList.toggle("mirror", facing === "user");
    } catch {
      sayEl.textContent = "Camera isn't available here. Use the camera on each photo instead, or open the app from your Home Screen.";
      $("#hfStart", el).disabled = true;
    }
  };
  showStep(0);
  $("#cClose", el).onclick = close;
  $("#cFlip", el).onclick = () => { if (running) return; facing = facing === "user" ? "environment" : "user"; start(); };
  $("#hfStart", el).onclick = async () => {
    if (running) { close(); return; }
    if (!stream || !video.videoWidth) return;
    running = true;
    const btn = $("#hfStart", el); btn.textContent = "Stop"; btn.classList.add("stop");
    $("#cFlip", el).style.visibility = "hidden";
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    const saved = [];
    for (let i = 0; i < STEPS.length; i++) {
      const st = STEPS[i];
      showStep(i); $("#hfTitle", el).textContent = `${i + 1} of 3 · ${ANGLES.find((a) => a.id === st.id).name}`;
      speak(st.say);
      for (let n = st.wait; n > 0; n--) {
        if (cancelled) return;
        count.textContent = n; count.classList.remove("tick"); void count.offsetWidth; count.classList.add("tick");
        if (n <= 3) beep(660, 90);
        await sleep(1000);
      }
      if (cancelled) return;
      count.textContent = ""; beep(1320, 160);
      const fl = $(".cam-flash", el); fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go");
      const blob = await shrink(video, video.videoWidth, video.videoHeight, 1920, 0.92);
      const c = await compress(blob);
      await put("photos", { id: `${S.date}_${st.id}`, date: S.date, angle: st.id, full: c.full, thumb: c.thumb, at: Date.now() });
      saved.push(c.thumb);
      sayEl.textContent = `${ANGLES.find((a) => a.id === st.id).name} photo saved`;
      await sleep(700);
    }
    showStep(3); speak("All done. Great job.");
    $("#hfTitle", el).textContent = "All done";
    count.innerHTML = `<div class="hf-done">${saved.map((b) => `<img src="${url(b)}" alt="">`).join("")}</div>`;
    btn.textContent = "Done"; btn.classList.remove("stop");
    btn.onclick = () => { close(); toast("All 3 photos saved", "checkc"); };
    stop();
  };
  speak("Prop your phone up, then tap Start.");
  start();
}

/* ======================================================================
   CALENDAR
   ====================================================================== */
async function viewCalendar() {
  const t = todayKey();
  const first = S.calMonth + "-01";
  const fd = parseKey(first);
  const daysIn = new Date(fd.getFullYear(), fd.getMonth() + 1, 0).getDate();
  const last = `${S.calMonth}-${pad(daysIn)}`;
  const mk = await marks(first, last);
  const lead = (fd.getDay() + 6) % 7;
  const cells = [...Array(lead).fill(null), ...[...Array(daysIn)].map((_, i) => `${S.calMonth}-${pad(i + 1)}`)];
  while (cells.length % 7) cells.push(null);
  const dows = [...Array(7)].map((_, i) => fmt(addDays("2026-11-02", i), { weekday: "narrow" }));
  const nextMonth = dkey(new Date(fd.getFullYear(), fd.getMonth() + 1, 1)).slice(0, 7);
  const prevMonth = dkey(new Date(fd.getFullYear(), fd.getMonth() - 1, 1)).slice(0, 7);

  const cell = (d) => {
    if (!d) return `<span class="cd out" aria-hidden="true"></span>`;
    const k = mk[d], cls = ["cd"];
    if (d === t) cls.push("today"); if (d === S.calSel) cls.push("sel");
    let vis;
    if (d > t) vis = `<span style="height:36px"></span>`;
    else if (S.calMode === "rings") vis = miniRings(k);
    else if (S.calMode === "photos") { const p = k?.p.find((x) => x.angle === "front") || k?.p[0]; vis = p ? `<img class="ph" src="${url(p.thumb)}" alt="">` : `<span class="noph"></span>`; }
    else vis = `<span class="wv">${k?.w ? wFmt(k.w.kg) : ""}</span>`;
    return `<button class="${cls.join(" ")}" data-act="calSel" data-k="${d}" ${d > t ? "disabled" : ""} aria-label="${fmt(d, { weekday: "long", day: "numeric", month: "long" })}"><span class="n">${parseKey(d).getDate()}</span>${vis}</button>`;
  };

  const vals = Object.values(mk);
  const trainDays = vals.filter((v) => v.t).length;
  const weighs = vals.filter((v) => v.w).length;
  let streak = 0;
  for (let d = t; ; d = addDays(d, -1)) { if (!(await get("weight", d))) { if (d === t && streak === 0) continue; break; } streak++; }

  let peek = "";
  if (S.calSel && S.calSel.startsWith(S.calMonth)) {
    const k = mk[S.calSel];
    const sets = k?.t ? await byDate("sets", S.calSel) : [];
    const names = [...new Set(sets.map((s) => s.ex))];
    peek = `<div class="sh"><h2>${fmt(S.calSel, { weekday: "long", day: "numeric", month: "short" })}</h2><button class="aside" data-act="day" data-k="${S.calSel}" data-to="today">Open day</button></div>
    <div class="card peek">${ringsSVG(ringVals(k), 88, 11, 2.5)}
      <div>
        <div class="pr"><span class="k indigo">Morning</span> <b>${k ? (k.w ? 1 : 0) + Math.min(3, k.p.length) : 0}/4</b>${k?.w ? `<span>· ${wFmt(k.w.kg)} ${S.unit}</span>` : ""}</div>
        <div class="pr"><span class="k pink">Train</span> <b>${k?.t || 0} sets</b>${names.length ? `<span>· ${esc(names.slice(0, 2).join(", "))}${names.length > 2 ? "…" : ""}</span>` : ""}</div>
        <div class="pr"><span class="k orange">Fuel</span> <b>${k?.f || 0}/${GOAL.fuel}</b><span>· ${k?.wa || 0} water</span></div>
      </div></div>`;
  }

  return `<div class="cols"><div class="col">
  <div class="seg" id="hCalMode">${[["rings", "Rings"], ["photos", "Photos"], ["weight", "Weight"]].map(([id, n]) => `<button class="${S.calMode === id ? "on" : ""}" data-act="calMode" data-m="${id}">${n}</button>`).join("")}</div>
  <div class="card" id="hCal">
    <div class="calhead">
      <button class="circ" data-act="month" data-m="${prevMonth}" aria-label="Previous month">${icon("left")}</button>
      <h2>${fd.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
      <button class="circ" data-act="month" data-m="${nextMonth}" ${nextMonth > t.slice(0, 7) ? "disabled style='opacity:.3'" : ""} aria-label="Next month">${icon("right")}</button>
    </div>
    <div class="cal" id="hCalGrid">${dows.map((d) => `<span class="dow">${d}</span>`).join("")}${cells.map(cell).join("")}</div>
  </div></div><div class="col">
  ${peek}
  <div class="sh"><h2>This month</h2></div>
  <div class="stats3" id="hMonth">
    <div class="stat"><div class="v c-pink">${trainDays}</div><div class="k">Workout days</div></div>
    <div class="stat"><div class="v c-indigo">${weighs}</div><div class="k">Weigh-ins</div></div>
    <div class="stat"><div class="v">${streak}</div><div class="k">Weigh-in streak</div></div>
  </div></div></div>`;
}

/* ======================================================================
   PROGRESS
   ====================================================================== */
function periodKey(k, range) { return range === "day" ? k : range === "week" ? weekStart(k) : k.slice(0, 7); }
function periodLabel(p, range) {
  if (range === "day") return fmt(p, { weekday: "short", day: "numeric", month: "short" });
  if (range === "week") return `Week of ${fmt(p, { day: "numeric", month: "short" })}`;
  return parseKey(p + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

async function viewProgress() {
  const [weights, sets, food, photos] = await Promise.all([all("weight"), all("sets"), all("food"), all("photos")]);
  const r = S.range;
  const groups = new Map();
  const g = (k) => { const p = periodKey(k, r); if (!groups.has(p)) groups.set(p, { w: [], sets: 0, days: new Set(), food: 0, drink: 0, photo: null }); return groups.get(p); };
  weights.forEach((w) => g(w.date).w.push(w));
  sets.forEach((s) => { const x = g(s.date); x.sets++; x.days.add(s.date); });
  food.forEach((f) => (f.kind === "drink" ? g(f.date).drink++ : g(f.date).food++));
  photos.filter((p) => p.angle === "front").forEach((p) => { const x = g(p.date); if (!x.photo || p.date > x.photo.date) x.photo = p; });

  const keys = [...groups.keys()].sort().reverse();
  const avg = (arr) => (arr.length ? arr.reduce((s, w) => s + w.kg, 0) / arr.length : null);
  const series = keys.slice(0, r === "day" ? 30 : 12).reverse().map((k) => ({ k, v: avg(groups.get(k).w) })).filter((x) => x.v != null);
  const ws = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = ws[ws.length - 1];
  const change = ws.length > 1 ? round1(toUnit(latest.kg - ws[0].kg)) : null;
  const angPhotos = photos.filter((p) => p.angle === S.cmpAngle).sort((a, b) => a.date.localeCompare(b.date));
  const first = angPhotos[0], lastP = angPhotos[angPhotos.length - 1];

  return `<div class="cols"><div class="col">
  <div class="seg" id="hRange">${["day", "week", "month"].map((x) => `<button data-act="range" data-r="${x}" class="${r === x ? "on" : ""}">${x === "day" ? "D" : x === "week" ? "W" : "M"}</button>`).join("")}</div>

  <div class="card" id="hChart">
    <div class="tile" style="padding:0;background:none">
      <div class="top c-indigo">${icon("scale")}Weight<span class="tm">${r === "day" ? "Each morning" : r === "week" ? "Weekly average" : "Monthly average"}</span></div>
      <div class="val"><span class="big">${latest ? wFmt(latest.kg) : "–"}</span><span class="u">${S.unit}</span>${change !== null ? `${deltaHTML(change)}<span class="note">since you started</span>` : ""}</div>${latest ? goalLine(latest.kg) : ""}
    </div>
    ${series.length > 1 ? `<div class="chart" style="margin-top:10px">${chart(series, r, GOAL.weight)}</div>` : `<div class="empty" style="padding:10px 0 0">Weigh in on two or more ${r === "day" ? "mornings" : r + "s"} and your trend line appears here.</div>`}
  </div>

  <div id="hCompare"><div class="sh"><h2>Before and after</h2></div>
  <div class="seg">${ANGLES.map((a) => `<button class="${S.cmpAngle === a.id ? "on" : ""}" data-act="cmp" data-a="${a.id}">${a.name}</button>`).join("")}</div>
  ${first && lastP && first !== lastP ? `
    <div class="compare" id="cmpBox">
      <img src="${url(first.full)}" alt="First ${S.cmpAngle} photo"><img class="after" src="${url(lastP.full)}" alt="Latest ${S.cmpAngle} photo">
      <div class="bar"></div><div class="knob">${icon("drag")}</div>
      <span class="lbl l">${fmt(first.date, { day: "numeric", month: "short" })}</span><span class="lbl r">${fmt(lastP.date, { day: "numeric", month: "short" })}</span>
    </div>
    <input type="range" min="0" max="100" value="50" id="cmpRange" aria-label="Drag to compare before and after">`
    : `<div class="card empty">Take ${S.cmpAngle} photos on two different mornings to compare them.</div>`}
  </div></div><div class="col">
  <div class="sh"><h2>${r === "day" ? "Day by day" : r === "week" ? "Week by week" : "Month by month"}</h2></div>
  ${keys.length ? `<div class="group">${keys.map((k, i) => {
    const x = groups.get(k), a = avg(x.w), prev = keys[i + 1] ? avg(groups.get(keys[i + 1]).w) : null;
    const d = a != null && prev != null ? round1(toUnit(a - prev)) : null;
    const bits = [];
    if (x.days.size) bits.push(r === "day" ? `${x.sets} sets` : `${x.days.size} workout day${x.days.size > 1 ? "s" : ""}`);
    if (x.food + x.drink) bits.push(`${x.food + x.drink} food & drink`);
    return `<button class="row" data-act="day" data-k="${r === "month" ? k + "-01" : k}" data-to="${r === "month" ? "calendar" : "today"}" data-month="${r === "month" ? k : ""}">
      ${x.photo ? `<img class="thumb" src="${url(x.photo.thumb)}" alt="">` : `<span class="thumb" style="background:var(--fill);display:grid;place-items:center;color:var(--ink-2)">${icon("photo")}</span>`}
      <div class="main"><div class="t">${esc(periodLabel(k, r))}</div><div class="s">${bits.length ? bits.join(" · ") : "No workouts or meals"}</div></div>
      <div style="text-align:right"><div class="v" style="color:var(--ink);font-weight:600">${a != null ? `${wFmt(a)}` : ""}</div>${d !== null ? deltaHTML(d) : ""}</div></button>`;
  }).join("")}</div>` : `<div class="card empty">Your history builds here as you log.</div>`}</div></div>`;
}

function chart(series, r, goalKg) {
  const W = 340, H = 170, Pd = { l: 36, r: 10, t: 12, b: 24 };
  const vs = series.map((s) => toUnit(s.v));
  let mn = Math.min(...vs), mx = Math.max(...vs);
  const gv = goalKg ? toUnit(goalKg) : null;
  const showGoal = gv != null && gv > mn - 6 && gv < mx + 6;
  if (showGoal) { mn = Math.min(mn, gv - 0.3); mx = Math.max(mx, gv + 0.3); }
  if (mx - mn < 1) { mn -= 0.5; mx += 0.5; }
  const x = (i) => Pd.l + (i * (W - Pd.l - Pd.r)) / (series.length - 1);
  const y = (v) => Pd.t + ((mx - v) * (H - Pd.t - Pd.b)) / (mx - mn);
  const pts = vs.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const area = `M${pts[0]} L${pts.join(" L")} L${x(vs.length - 1)},${H - Pd.b} L${x(0)},${H - Pd.b} Z`;
  const lab = (k) => (r === "month" ? parseKey(k + "-01").toLocaleDateString(undefined, { month: "short" }) : fmt(k, { day: "numeric", month: "short" }));
  const li = vs.length - 1;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend from ${round1(vs[0])} to ${round1(vs[li])} ${S.unit}">
    <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--indigo)" stop-opacity=".25"/><stop offset="1" stop-color="var(--indigo)" stop-opacity="0"/></linearGradient></defs>
    ${[mx, (mx + mn) / 2, mn].map((v) => `<line x1="${Pd.l}" x2="${W - Pd.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--sep)"/><text x="${Pd.l - 7}" y="${y(v) + 4}" text-anchor="end">${round1(v)}</text>`).join("")}
    <path d="${area}" fill="url(#wg)"/>
    ${showGoal ? `<line x1="${Pd.l}" x2="${W - Pd.r}" y1="${y(gv)}" y2="${y(gv)}" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="5 4"/><text x="${W - Pd.r}" y="${y(gv) - 5}" text-anchor="end" style="fill:var(--green-t);font-weight:600">Goal ${round1(gv)}</text>` : ""}
    <polyline points="${pts.join(" ")}" fill="none" stroke="var(--indigo)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${vs.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="${i === li ? 5 : 2.5}" fill="var(--indigo)" stroke="var(--card)" stroke-width="${i === li ? 3 : 0}"/>`).join("")}
    <text x="${Pd.l}" y="${H - 5}">${lab(series[0].k)}</text>
    <text x="${W - Pd.r}" y="${H - 5}" text-anchor="end">${lab(series[li].k)}</text>
  </svg>`;
}

/* ---------- events ---------- */
function bind(m) {
  initSegs(m);
  m.querySelectorAll("[data-act]").forEach((el) => {
    const act = el.dataset.act;
    el.onclick = async (e) => {
      e.preventDefault();
      const d = el.dataset;
      if (el.parentElement?.classList.contains("seg")) { if (el.classList.contains("on")) return; segMove(el); await wait(220); }
      if (act === "addFood") foodSheet(d.kind);
      else if (act === "editFood") foodSheet(null, await get("food", d.id));
      else if (act === "weigh") weighSheet();
      else if (act === "goTab") go(d.tab);
      else if (act === "day") {
        if (d.month) { S.calMonth = d.month; S.calSel = null; go("calendar"); return; }
        S.date = d.k; d.to ? go(d.to) : render();
      }
      else if (act === "week") changeWeek(Number(d.d));
      else if (act === "area") { if (S.tab !== "train") { S.tab = "train"; $("#tabs").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x.dataset.tab === "train")); } S.area = d.id || null; render(true); window.scrollTo(0, 0); }
      else if (act === "focus") toggleFocus(d.id);
      else if (act === "water") addWater(Number(d.d));
      else if (act === "waterSet") setWaterTo(Number(d.n));
      else if (act === "handsfree") handsFree();
      else if (act === "bodyView") { S.bodyView = d.v; render(); }
      else if (act === "logEx") logSheet(S.area, Number(d.i));
      else if (act === "shoot") shootFlow(d.angle);
      else if (act === "range") { S.range = d.r; render(); }
      else if (act === "cmp") { S.cmpAngle = d.a; render(); }
      else if (act === "calMode") { S.calMode = d.m; render(); }
      else if (act === "calSel") { S.calSel = d.k; render(); }
      else if (act === "month") { S.calMonth = d.m; render(); }
      else if (act === "settings") openSettings();
    };
  });
  const wk = $("#hWeek", m);
  if (wk) {
    let x0 = null;
    wk.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    wk.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) changeWeek(dx < 0 ? 7 : -7); }, { passive: true });
  }
  const cmp = $("#cmpRange", m);
  if (cmp) cmp.oninput = () => $("#cmpBox", m).style.setProperty("--cut", cmp.value + "%");
}
async function setWaterTo(n) {
  const before = await getWater(S.date);
  await setWater(S.date, Math.max(0, n)); buzz(10);
  S.waterJust = n > before;
  await render();
  if (n >= GOAL.water && before < GOAL.water) toast("Water goal reached", "drop");
}
async function addWater(n) {
  const cur = await getWater(S.date), next = Math.max(0, cur + n);
  await setWaterTo(next);
  if (S.tab !== "today" || n > 0 && next < GOAL.water) toast(`Glass of water added · ${next}/${GOAL.water}`, "drop");
}
async function changeWeek(n) {
  let nd = addDays(S.date, n); if (nd > todayKey()) nd = todayKey();
  if (nd === S.date) return;
  const wk = $("#hWeek");
  if (wk && animOn()) { wk.classList.add(n > 0 ? "out-l" : "out-r"); await wait(160); }
  S.date = nd; await render();
  const nw = $("#hWeek"); if (nw && animOn()) { nw.classList.add(n > 0 ? "in-l" : "in-r"); }
}
async function toggleFocus(id) {
  S.focus = S.focus.includes(id) ? S.focus.filter((x) => x !== id) : [...S.focus, id];
  await meta("focus", S.focus); buzz(15); render();
  toast(S.focus.includes(id) ? "Added to focus areas" : "Removed from focus areas", "star");
}

/* ---------- theme ---------- */
const getTheme = () => { try { return localStorage.getItem("gj_theme") || "auto"; } catch { return "auto"; } };
function applyTheme(t) {
  try { t === "auto" ? localStorage.removeItem("gj_theme") : localStorage.setItem("gj_theme", t); } catch {}
  const root = document.documentElement;
  if (t === "auto") delete root.dataset.theme; else root.dataset.theme = t;
  const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => {
    if (t === "auto") { m.content = i ? "#0c0d0f" : "#eef0f3"; m.media = i ? "(prefers-color-scheme: dark)" : "(prefers-color-scheme: light)"; }
    else { m.content = dark ? "#0c0d0f" : "#eef0f3"; m.removeAttribute("media"); }
  });
}

/* ---------- settings / backup ---------- */
const blobToData = (b) => new Promise((res) => { if (!b) return res(null); const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); });
const dataToBlob = async (d) => (d ? (await fetch(d)).blob() : null);

async function openSettings() {
  let est = "";
  try { const e = await navigator.storage.estimate(); est = `${(e.usage / 1048576).toFixed(1)} MB`; } catch {}
  let persisted = false;
  try { persisted = await navigator.storage.persisted(); } catch {}
  const last = await meta("lastBackup");
  const [food, weight, sets, photos] = await Promise.all([all("food"), all("weight"), all("sets"), all("photos")]);
  const mb = (n) => (n / 1048576 < 0.1 && n > 0 ? "under 0.1" : (n / 1048576).toFixed(1));
  const bodyBytes = photos.reduce((t, p) => t + (p.full?.size || 0) + (p.thumb?.size || 0), 0);
  const foodPics = food.filter((f) => f.photo);
  const foodBytes = foodPics.reduce((t, f) => t + (f.photo?.size || 0) + (f.thumb?.size || 0), 0);
  const th = getTheme();
  openSheet({
    title: "Settings", right: "Done",
    body: `
      <div class="grouplabel">Appearance</div>
      <div class="seg" id="themeSeg" style="margin:0">${[["auto", "Auto"], ["light", "Light"], ["dark", "Dark"]].map(([id, n]) => `<button class="${th === id ? "on" : ""}" data-theme-pick="${id}">${n}</button>`).join("")}</div>
      <div class="foot">Auto follows your iPhone's light or dark setting.</div>
      <div class="group" style="margin-top:12px">
        <label class="row ico"><span class="sq bg-cyan">${icon("sun")}</span><div class="main"><div class="t">Glass look</div><div class="s">See-through frosted panels</div></div><input type="checkbox" class="switch" id="glassSw" role="switch" ${document.documentElement.dataset.glass !== "off" ? "checked" : ""}></label>
        <label class="row ico"><span class="sq bg-pink">${icon("play")}</span><div class="main"><div class="t">Animations</div><div class="s">Smooth movement and small touches</div></div><input type="checkbox" class="switch" id="animSw" role="switch" ${animOn() ? "checked" : ""}></label>
        <button class="row ico" id="helpRow"><span class="sq bg-indigo">${icon("help")}</span><div class="main"><div class="t">Show the help guide</div><div class="s">A quick tour of every button</div></div>${icon("right", "i chev")}</button>
      </div>

      <div class="grouplabel">Goals</div>
      <div class="group">
        <div class="row ico"><span class="sq bg-green">${icon("target")}</span><div class="main"><div class="t">Goal weight</div><div class="s">Shown on the chart and weight card</div></div>
          <input type="number" inputmode="decimal" step="0.1" id="gWeight" class="goalin" placeholder="None" value="${GOAL.weight ? wFmt(GOAL.weight) : ""}" aria-label="Goal weight in ${S.unit}"><span class="muted">${S.unit}</span></div>
        ${[["sets", "Sets per day", "Train ring", "bg-pink", "train", 1, 60], ["fuel", "Meals and drinks per day", "Fuel ring", "bg-orange", "food", 1, 20], ["water", "Glasses of water per day", "Fuel ring", "bg-cyan", "drop", 1, 20]].map(([key, t, sub, bg, ic, lo, hi]) => `
        <div class="row ico"><span class="sq ${bg}">${icon(ic)}</span><div class="main"><div class="t">${t}</div><div class="s">${sub}</div></div>
          <div class="ministep" data-goal="${key}" data-lo="${lo}" data-hi="${hi}"><button data-d="-1" aria-label="Less">${icon("minus")}</button><span class="num">${GOAL[key]}</span><button data-d="1" aria-label="More">${icon("plus")}</button></div></div>`).join("")}
      </div>
      <div class="foot">Your rings fill when you hit these. Change them any time.</div>

      <div class="grouplabel">Weight unit</div>
      <div class="seg" style="margin:0">${["kg", "lb"].map((u) => `<button class="${S.unit === u ? "on" : ""}" data-unit="${u}">${u}</button>`).join("")}</div>

      <div class="grouplabel">Where your data lives</div>
      <div class="group">
        <div class="row ico"><span class="sq bg-green">${icon("phone")}</span><div class="main"><div class="t">On this iPhone only</div><div class="s">Not on the internet, not in iCloud, not on GitHub.</div></div></div>
        <div class="row ico"><span class="sq bg-purple">${icon("lock")}</span><div class="main"><div class="t">Photos stay in this app</div><div class="s">They won't appear in your iPhone's Photos gallery. Each is saved smaller so they don't fill your phone.</div></div></div>
        <div class="row ico"><span class="sq bg-orange">${icon("photo")}</span><div class="main"><div class="t">${photos.length} body · ${foodPics.length} food photos</div><div class="s">${mb(bodyBytes)} MB and ${mb(foodBytes)} MB</div></div></div>
        <div class="row ico"><span class="sq bg-gray">${icon("unit")}</span><div class="main"><div class="t">${food.length + weight.length + sets.length} log entries</div><div class="s">${esc(est)} used in total</div></div></div>
        <div class="row ico"><span class="sq ${persisted ? "bg-green" : "bg-orange"}">${icon("lock")}</span><div class="main"><div class="t">${persisted ? "Safe from auto-clear" : "Not safe from auto-clear yet"}</div><div class="s">${persisted ? "Safari won't clear this to save space." : "Add the app to your Home Screen to fix this."}</div></div></div>
      </div>
      <div class="foot">Deleting Gym Journal from your Home Screen, or clearing Safari data, erases everything. Save a backup first.</div>

      <div class="grouplabel">Backup</div>
      <div class="group">
        <button class="row ico" id="bExp"><span class="sq bg-cyan">${icon("cloud")}</span><div class="main"><div class="t">Save backup</div><div class="s">${last ? `Last one ${new Date(last).toLocaleDateString(undefined, { day: "numeric", month: "long" })}` : "No backup yet"}</div></div>${icon("right", "i chev")}</button>
        <button class="row ico" id="bImp"><span class="sq bg-indigo">${icon("restore")}</span><div class="main"><div class="t">Restore from backup</div></div>${icon("right", "i chev")}</button>
      </div>
      <div class="foot">Backup makes one file with everything. Save it to iCloud Drive, Google Drive or Files.</div>
      <input type="file" accept=".json,application/json" class="hidden-input" id="bFile">

      <div class="group" style="margin-top:28px"><button class="row center danger" id="bWipe">Erase all data</button></div>`,
    onOpen: (s) => {
      s.querySelectorAll("[data-theme-pick]").forEach((b) => (b.onclick = () => { segMove(b); applyTheme(b.dataset.themePick); }));
      $("#animSw", s).onchange = (e) => {
        const on = e.target.checked; document.documentElement.dataset.anim = on ? "on" : "off";
        try { on ? localStorage.removeItem("gj_anim") : localStorage.setItem("gj_anim", "off"); } catch {}
        toast(on ? "Animations on" : "Animations off", on ? "play" : "checkc");
      };
      $("#helpRow", s).onclick = () => { closeSheet(); setTimeout(() => startHelp(false), animOn() ? 260 : 0); };
      $("#glassSw", s).onchange = (e) => {
        const on = e.target.checked; document.documentElement.dataset.glass = on ? "on" : "off";
        try { on ? localStorage.removeItem("gj_glass") : localStorage.setItem("gj_glass", "off"); } catch {}
        render(); // redraw so every panel picks up the new look
      };
      $("#gWeight", s).onchange = async (e) => {
        const v = parseFloat(e.target.value);
        GOAL.weight = v > 20 && v < 400 ? round2(fromUnit(v)) : null;
        if (!GOAL.weight) e.target.value = "";
        await meta("goals", { ...GOAL }); toast(GOAL.weight ? `Goal weight set to ${wFmt(GOAL.weight)} ${S.unit}` : "Goal weight removed", "target");
      };
      s.querySelectorAll(".ministep").forEach((ms) => ms.querySelectorAll("button").forEach((b) => (b.onclick = async () => {
        const key = ms.dataset.goal, v = Math.min(+ms.dataset.hi, Math.max(+ms.dataset.lo, GOAL[key] + Number(b.dataset.d)));
        GOAL[key] = v; $("span", ms).textContent = v;
        $("span", ms).classList.remove("bump"); void ms.offsetWidth; $("span", ms).classList.add("bump");
        await meta("goals", { ...GOAL });
      })));
      s.querySelectorAll("[data-unit]").forEach((b) => (b.onclick = async () => { segMove(b); S.unit = b.dataset.unit; await meta("unit", S.unit); }));
      $("#bExp", s).onclick = () => exportAll($("#bExp .t", s));
      $("#bImp", s).onclick = () => $("#bFile", s).click();
      $("#bFile", s).onchange = (e) => e.target.files[0] && importAll(e.target.files[0]);
      $("#bWipe", s).onclick = async () => {
        if (!(await ask("Erase all data?", "Every weigh-in, meal, workout and photo on this phone will be deleted. This can't be undone.", "Erase", true))) return;
        if (!(await ask("Are you sure?", "Save a backup first if you're not.", "Erase everything", true))) return;
        for (const n of ["food", "weight", "sets", "photos"]) await clear(n);
        closeSheet(); render(); toast("All data erased", "trash");
      };
    }
  });
}

async function exportAll(label) {
  label.textContent = "Preparing…";
  try {
    const [food, weight, sets, photos] = await Promise.all([all("food"), all("weight"), all("sets"), all("photos")]);
    const out = {
      app: "gym-journal", version: 2, exported: new Date().toISOString(), weight, sets,
      meta: (await all("meta")).filter((m) => m.key !== "lastBackup"),
      food: await Promise.all(food.map(async (f) => ({ ...f, photo: await blobToData(f.photo), thumb: await blobToData(f.thumb) }))),
      photos: await Promise.all(photos.map(async (p) => ({ ...p, full: await blobToData(p.full), thumb: await blobToData(p.thumb) })))
    };
    const name = `gym-journal-${todayKey()}.json`;
    const file = new File([JSON.stringify(out)], name, { type: "application/json" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: "Gym Journal backup" });
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
    await meta("lastBackup", Date.now());
    toast("Backup ready", "cloud");
  } catch (e) { if (e.name !== "AbortError") toast("Backup failed: " + e.message, "x"); }
  label.textContent = "Save backup";
}

async function importAll(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== "gym-journal") throw new Error("not a Gym Journal backup");
    if (!(await ask("Restore this backup?", "Entries from the same days will be replaced.", "Restore"))) return;
    for (const w of data.weight || []) await put("weight", w);
    for (const s of data.sets || []) await put("sets", s);
    for (const f of data.food || []) await put("food", { ...f, photo: await dataToBlob(f.photo), thumb: await dataToBlob(f.thumb) });
    for (const p of data.photos || []) await put("photos", { ...p, full: await dataToBlob(p.full), thumb: await dataToBlob(p.thumb) });
    for (const m of data.meta || []) if (m && typeof m.key === "string" && m.key !== "lastBackup") await put("meta", m);
    await loadPrefs();
    closeSheet(); render(); toast("Backup restored", "cloud");
  } catch (e) { toast("Restore failed: " + e.message, "x"); }
}

/* ======================================================================
   HELP GUIDE — spotlights each button with an arrow and a short note.
   Never opens by itself: tap ? (or Settings → Show the help guide).
   ====================================================================== */
const HELP = {
  today: [
    ["#hWeek", "Your week", "Each day shows its three rings. Tap a day to open it. Swipe sideways to change week."],
    ["#hRings", "Daily rings", "Blue: morning check-in (weigh-in and 3 photos). Pink: workout sets. Orange: food and drinks. Fill all three."],
    ["#hNext", "Up next", "Your next step, based on the time of day. Tap it to do it straight away."],
    ["#hWater", "Water", "Tap + Glass each time you finish a glass, or tap the glasses themselves. Counts toward your orange Fuel ring."],
    ["#hTiles", "Summary", "Weight, workout, food and photos at a glance. Tap a card to open or add more."],
    ["#hDay", "Your day", "Everything you logged today, in time order. Tap a meal or drink to change it."],
    ["#nAdd", "Add", "The quickest way to log a weigh-in, food, drink, workout or photos."],
    ["#nHelp", "Help", "Tap ? on any page to see this guide again."],
    ["#nSet", "Settings", "Light, dark or auto, animations, glass look, kg or lb, and backups."],
    ["#tabs", "Sections", "Move between Today, Train, Photos, Calendar and Progress."]
  ],
  train: [
    ["#hBodySeg", "Front or back", "Turn the body around to reach your back and glutes."],
    ["#hBody", "Body map", "Tap a muscle to see its exercises. Darker pink means more sets this week."],
    ["#hAreas", "Muscle groups", "The same areas as a list. The pink number shows sets logged today."],
    ["#nHelp", "Help", "Tap ? on any page to see its guide."]
  ],
  photos: [
    ["#hHands", "Hands-free", "Prop your phone up and tap this. It counts down, takes your front photo, then tells you when to turn for side and back."],
    ["#hAngles", "Three angles", "Front, side and back every morning. Tap one to open the camera with a 10 second timer."],
    ["#hPrivate", "Private", "Photos stay inside this app. They never show up in your iPhone's Photos gallery."],
    ["#nHelp", "Help", "Tap ? on any page to see its guide."]
  ],
  calendar: [
    ["#hCalMode", "What to show", "Rings, your front photo, or your weight on every day of the month."],
    ["#hCalGrid", "Pick a day", "Tap a day to see what you did. Use the arrows above to change month."],
    ["#hMonth", "This month", "Workout days, weigh-ins and how many mornings in a row you've weighed in."]
  ],
  progress: [
    ["#hRange", "Day, week or month", "Change how the weight chart and the list group your history."],
    ["#hChart", "Weight trend", "Your morning weight over time. Down arrows mean you're getting lighter."],
    ["#hCompare", "Before and after", "Drag the slider to compare your first and latest photo."]
  ]
};
let helpEl = null;
function startHelp(firstVisit) {
  if (helpEl) return;
  const steps = (HELP[S.tab] || []).filter(([sel]) => { const el = $(sel); return el && el.getClientRects().length; });
  if (firstVisit) steps.unshift([null, "Welcome to Gym Journal", "A private journal for your weight, workouts, food and progress photos. Everything stays on this phone. Here's a quick tour."]);
  if (!steps.length) return;
  let i = 0;
  const el = document.createElement("div");
  el.className = "coach"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true");
  el.innerHTML = `
    <div class="coach-hole"></div>
    <svg class="coach-arrow" aria-hidden="true"><defs><marker id="coachHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1L8 5L1 9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><path id="coachPath" marker-end="url(#coachHead)"/></svg>
    <div class="coach-tip" aria-live="polite">
      <div class="ct-dots"></div><h4></h4><p></p>
      <div class="ct-btns"><button class="ct-skip">Skip</button><span></span><button class="ct-back">Back</button><button class="ct-next">Next</button></div>
    </div>`;
  document.body.appendChild(el); helpEl = el;
  const hole = $(".coach-hole", el), tip = $(".coach-tip", el), path = $("#coachPath", el);
  const finish = () => {
    try { localStorage.setItem("gj_help_seen", "1"); } catch {}
    el.classList.add("out"); removeEventListener("resize", place); removeEventListener("keydown", keys);
    setTimeout(() => { el.remove(); helpEl = null; }, animOn() ? 220 : 0);
  };
  function place() {
    const [sel, title, text] = steps[i];
    $("h4", tip).textContent = title; $("p", tip).textContent = text;
    $(".ct-dots", tip).innerHTML = steps.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("");
    $(".ct-back", tip).style.visibility = i ? "visible" : "hidden";
    $(".ct-next", tip).textContent = i === steps.length - 1 ? "Done" : "Next";
    const vw = innerWidth, vh = innerHeight, pad = 8, gap = 56;
    const target = sel && $(sel);
    if (!target) {
      hole.style.cssText = `left:${vw / 2}px;top:${vh / 2}px;width:0;height:0;`;
      el.classList.add("nohole");
      tip.style.left = `${Math.max(16, (vw - Math.min(340, vw - 32)) / 2)}px`; tip.style.top = `${vh / 2 - 90}px`;
      path.setAttribute("d", ""); return;
    }
    el.classList.remove("nohole");
    let r = target.getBoundingClientRect();
    const top = Math.max(r.top, 6), bottom = Math.min(r.bottom, vh - 6);
    r = { left: r.left, right: r.right, top, bottom, width: r.width, height: Math.max(20, bottom - top) };
    const isTabs = sel === "#tabs";
    const radius = isTabs ? 34 : sel.startsWith("#n") ? 999 : 20;
    hole.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px;border-radius:${radius}px;`;
    const tw = Math.min(340, vw - 32);
    tip.style.width = tw + "px";
    const th = tip.offsetHeight;
    const cx = r.left + r.width / 2;
    const spaceBelow = vh - r.bottom, spaceAbove = r.top, spaceRight = vw - r.right;
    let tx, ty, ax, ay, bx, by;
    if (r.height > vh * 0.45 && spaceRight > tw + gap + 20) {
      // tall thing (side bar): note goes to the right
      tx = r.right + gap; ty = Math.min(Math.max(16, r.top + r.height / 2 - th / 2), vh - th - 16);
      ax = tx; ay = ty + th / 2; bx = r.right + pad + 4; by = ay;
    } else if (spaceBelow >= th + gap + 16 || spaceBelow > spaceAbove) {
      tx = Math.min(Math.max(16, cx - tw / 2), vw - tw - 16); ty = Math.min(r.bottom + pad + gap, vh - th - 16);
      ax = Math.min(Math.max(tx + 28, cx + (cx < vw / 2 ? 40 : -40)), tx + tw - 28); ay = ty; bx = cx; by = r.bottom + pad + 4;
    } else {
      tx = Math.min(Math.max(16, cx - tw / 2), vw - tw - 16); ty = Math.max(16, r.top - pad - gap - th);
      ax = Math.min(Math.max(tx + 28, cx + (cx < vw / 2 ? 40 : -40)), tx + tw - 28); ay = ty + th; bx = cx; by = r.top - pad - 4;
    }
    tip.style.left = tx + "px"; tip.style.top = ty + "px";
    // curved arrow from the note to the spotlight
    const mx = (ax + bx) / 2 + (ay === by ? 0 : (bx > ax ? -30 : 30)), my = (ay + by) / 2;
    path.setAttribute("d", `M${ax},${ay} Q${mx},${my} ${bx},${by}`);
    const len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = animOn() ? len : 0;
    if (animOn()) requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = 0; }));
  }
  async function show(k) {
    i = k;
    const sel = steps[i][0], t = sel && $(sel);
    tip.classList.remove("in"); void tip.offsetWidth; tip.classList.add("in");
    if (t && !sel.startsWith("#n") && sel !== "#tabs") {
      const r = t.getBoundingClientRect();
      if (r.top < 70 || r.bottom > innerHeight - 110) { t.scrollIntoView({ block: "center", behavior: animOn() ? "smooth" : "auto" }); await wait(420); }
    }
    place();
  }
  const keys = (e) => { if (e.key === "Escape") finish(); if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft" && i) show(i - 1); };
  const next = () => (i < steps.length - 1 ? show(i + 1) : finish());
  $(".ct-next", tip).onclick = next;
  $(".ct-back", tip).onclick = () => i && show(i - 1);
  $(".ct-skip", tip).onclick = finish;
  el.addEventListener("click", (e) => { if (e.target === el || e.target === hole) next(); });
  addEventListener("resize", place); addEventListener("keydown", keys);
  show(0);
  $(".ct-next", tip).focus();
}

async function loadPrefs() {
  S.unit = (await meta("unit")) || "kg";
  S.focus = (await meta("focus")) || [];
  Object.assign(GOAL, (await meta("goals")) || {});
}

/* ---------- start ---------- */
(async () => {
  applyTheme(getTheme());
  db = await openDB();
  S.unit = (await meta("unit")) || "kg";
  await loadPrefs();
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
  await render(true);
  let openedOn = todayKey();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (todayKey() !== openedOn) { if (S.date === openedOn) S.date = todayKey(); openedOn = todayKey(); }
    render(); // refresh "Up next" for the time of day
  });
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
})();
})();
