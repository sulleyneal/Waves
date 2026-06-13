// Waves — Gulf Coast Beach Safety dashboard.
// Orchestration + rendering. A full-screen MapLibre map is the canvas; the
// safety dashboard rides on top as a glassy overlay panel. Five editions
// (themes) restyle both the UI and the map. Each data source is fetched
// independently so a single outage never blanks the page.

import { BEACHES, BEACH_FLAGS, THEMES, DEFAULT_THEME } from "./config.js";
import { fetchWeather, fetchMarine, fetchTides, fetchWaterTemp, fetchAlerts } from "./api.js";
import { initMap, setActiveBeach, flyToBeach, applyMapTheme, resizeMap } from "./map.js";

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

let activeBeach = null;
let currentTheme = DEFAULT_THEME;

// --- WMO weather code -> label + emoji -------------------------------------
const WEATHER_CODES = {
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],
  55:["Heavy drizzle","🌧️"],61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],
  71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],80:["Rain showers","🌦️"],
  81:["Rain showers","🌧️"],82:["Violent showers","⛈️"],95:["Thunderstorm","⛈️"],
  96:["Storm w/ hail","⛈️"],99:["Severe storm","⛈️"],
};
const weatherInfo = (code) => WEATHER_CODES[code] || ["—", "🌊"];

const COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const degToCompass = (d) => (d == null ? "—" : COMPASS[Math.round(d / 22.5) % 16]);

// --- Rip current risk -------------------------------------------------------
function ripCurrentRisk(alerts, marine, weather) {
  const official = alerts.find((a) => /rip current/i.test(a.event || ""));
  if (official) return { level: "HIGH", label: "High", official: true, note: official.headline };

  const highSurf = alerts.find((a) => /high surf/i.test(a.event || ""));
  const waveFt = marine?.current?.wave_height ?? null;
  const period = marine?.current?.wave_period ?? null;
  const windMph = weather?.current?.wind_speed_10m ?? 0;

  let score = 0;
  if (waveFt != null) {
    if (waveFt >= 4) score += 3;
    else if (waveFt >= 2.5) score += 2;
    else if (waveFt >= 1.5) score += 1;
  }
  if (period != null && period >= 8) score += 1;
  if (windMph >= 20) score += 2;
  else if (windMph >= 13) score += 1;
  if (highSurf) score += 2;

  let level = "LOW", label = "Low";
  if (score >= 5) { level = "HIGH"; label = "High"; }
  else if (score >= 3) { level = "MODERATE"; label = "Moderate"; }

  return {
    level, label, official: false,
    note: waveFt == null
      ? "Estimated from wind (surf data unavailable for this spot)."
      : "Estimated from surf height, swell period, and wind. Not an official NWS forecast.",
  };
}

function uvAdvice(uv) {
  if (uv == null) return ["—", "", "var(--ink-soft)"];
  if (uv < 3) return ["Low", "Minimal protection needed.", "#16a34a"];
  if (uv < 6) return ["Moderate", "SPF 30+, hat, shade midday.", "#ca8a04"];
  if (uv < 8) return ["High", "Reapply SPF often. Seek shade 10am–4pm.", "#ea580c"];
  if (uv < 11) return ["Very High", "Cover up. Limit midday sun exposure.", "#dc2626"];
  return ["Extreme", "Avoid sun 10am–4pm. Burns in minutes.", "#7c3aed"];
}

function alertColor(sev) {
  switch ((sev || "").toLowerCase()) {
    case "extreme": return "#7c2d12";
    case "severe": return "#dc2626";
    case "moderate": return "#ea580c";
    case "minor": return "#ca8a04";
    default: return "#0ea5e9";
  }
}

// ===========================================================================
// Rendering
// ===========================================================================
function renderThemeNav() {
  const nav = $("#editions");
  nav.innerHTML = "";
  for (const [key, t] of Object.entries(THEMES)) {
    const b = el("button", "edition", t.label);
    b.dataset.theme = key;
    b.addEventListener("click", () => setTheme(key));
    nav.appendChild(b);
  }
}

function renderBeachPicker() {
  const sel = $("#beach-select");
  sel.innerHTML = "";
  for (const b of BEACHES) {
    const opt = el("option");
    opt.value = b.id;
    opt.textContent = `${b.name}, ${b.state}`;
    sel.appendChild(opt);
  }
}

function setLoading(on) {
  $("#panel").classList.toggle("loading", on);
  $("#refresh-btn").disabled = on;
}

function renderHeaderBeach(beach) {
  $("#beach-name").textContent = beach.name;
  $("#beach-sub").textContent = `${beach.state} · Gulf of Mexico`;
}

const fmtTemp = (t) => (t == null ? "—" : `${Math.round(t)}°`);

function renderConditions(weather, water) {
  const c = weather?.current;
  const grid = $("#conditions-grid");
  grid.innerHTML = "";
  if (!c) { grid.appendChild(el("p", "muted", "Weather data unavailable right now.")); return; }
  const [label, emoji] = weatherInfo(c.weather_code);
  const items = [
    { k: "Air", v: fmtTemp(c.temperature_2m), s: `Feels ${fmtTemp(c.apparent_temperature)}` },
    { k: "Water", v: water != null ? `${Math.round(water)}°` : "—", s: water != null ? "live buoy" : "no reading" },
    { k: "Wind", v: `${Math.round(c.wind_speed_10m)}`, s: `mph ${degToCompass(c.wind_direction_10m)} · gust ${Math.round(c.wind_gusts_10m)}` },
    { k: "Humidity", v: `${Math.round(c.relative_humidity_2m)}%`, s: "rel." },
    { k: "Sky", v: emoji, s: label },
  ];
  for (const it of items) {
    const card = el("div", "stat");
    card.appendChild(el("div", "stat-val", it.v));
    card.appendChild(el("div", "stat-key", it.k));
    card.appendChild(el("div", "stat-sub", it.s));
    grid.appendChild(card);
  }
}

function renderRip(risk) {
  const box = $("#rip-card");
  box.dataset.level = risk.level;
  $("#rip-level").textContent = risk.label;
  $("#rip-badge").textContent = risk.official ? "NWS OFFICIAL" : "ESTIMATE";
  $("#rip-badge").className = `badge ${risk.official ? "badge-official" : "badge-est"}`;
  $("#rip-note").textContent = risk.note || "";
  const pct = { LOW: 33, MODERATE: 66, HIGH: 100 }[risk.level] || 0;
  $("#rip-meter-fill").style.width = `${pct}%`;
}

function renderAlerts(alerts) {
  const wrap = $("#alerts");
  wrap.innerHTML = "";
  const heading = $("#alerts-heading");
  if (!alerts.length) {
    heading.textContent = "All clear";
    wrap.appendChild(el("p", "muted", "✅ No active NWS alerts for this location right now."));
    return;
  }
  heading.textContent = `${alerts.length} active`;
  for (const a of alerts) {
    const card = el("div", "alert");
    card.style.borderLeftColor = alertColor(a.severity);
    card.appendChild(el("div", "alert-title", `⚠️ ${a.event}`));
    if (a.headline) card.appendChild(el("div", "alert-headline", a.headline));
    const desc = (a.description || "").trim().split("\n\n")[0];
    if (desc) card.appendChild(el("div", "alert-desc", desc));
    card.appendChild(el("div", "alert-meta", `${a.severity || "Unknown"} severity · ${a.senderName || "NWS"}`));
    wrap.appendChild(card);
  }
}

function renderSurf(marine) {
  const box = $("#surf-grid");
  box.innerHTML = "";
  const c = marine?.current;
  if (!c || c.wave_height == null) {
    box.appendChild(el("p", "muted", "Surf model has no data for this nearshore cell."));
    return;
  }
  const items = [
    { k: "Wave height", v: `${c.wave_height?.toFixed(1)} ft` },
    { k: "Wave period", v: c.wave_period != null ? `${Math.round(c.wave_period)} s` : "—" },
    { k: "Swell", v: c.swell_wave_height != null ? `${c.swell_wave_height.toFixed(1)} ft` : "—" },
    { k: "Direction", v: degToCompass(c.wave_direction) },
  ];
  for (const it of items) {
    const card = el("div", "stat");
    card.appendChild(el("div", "stat-val", it.v));
    card.appendChild(el("div", "stat-key", it.k));
    box.appendChild(card);
  }
}

function renderTides(tides) {
  const box = $("#tides-list");
  box.innerHTML = "";
  if (!tides || !tides.length) {
    box.appendChild(el("p", "muted", "Tide predictions unavailable for this station."));
    return;
  }
  const now = Date.now();
  const upcoming = tides
    .map((t) => ({ ...t, ts: new Date(t.t.replace(" ", "T")).getTime() }))
    .filter((t) => t.ts >= now - 3600 * 1000)
    .slice(0, 4);
  for (const t of upcoming) {
    const high = t.type === "H";
    const row = el("div", "tide-row");
    row.appendChild(el("span", "tide-type", high ? "🔼 High" : "🔽 Low"));
    row.appendChild(el("span", "tide-time", new Date(t.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })));
    row.appendChild(el("span", "tide-ht", `${Number(t.v).toFixed(1)} ft`));
    box.appendChild(row);
  }
}

function renderSun(weather) {
  const d = weather?.daily;
  if (!d) return;
  const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  $("#sunrise").textContent = fmt(d.sunrise[0]);
  $("#sunset").textContent = fmt(d.sunset[0]);
}

function renderUV(weather) {
  const uv = weather?.current?.uv_index;
  const max = weather?.daily?.uv_index_max?.[0];
  const [label, advice, color] = uvAdvice(uv);
  $("#uv-val").textContent = uv != null ? uv.toFixed(1) : "—";
  $("#uv-val").style.color = color;
  $("#uv-label").textContent = label;
  $("#uv-label").style.color = color;
  $("#uv-advice").textContent = advice;
  $("#uv-max").textContent = max != null ? `Peak today: ${max.toFixed(1)}` : "";
}

function renderForecast(weather) {
  const wrap = $("#forecast");
  wrap.innerHTML = "";
  const d = weather?.daily;
  if (!d) return;
  for (let i = 0; i < d.time.length; i++) {
    const [label, emoji] = weatherInfo(d.weather_code[i]);
    const day = i === 0 ? "Today" : new Date(d.time[i] + "T12:00").toLocaleDateString([], { weekday: "short" });
    const card = el("div", "fc-day");
    card.appendChild(el("div", "fc-name", day));
    card.appendChild(el("div", "fc-emoji", emoji));
    card.title = label;
    card.appendChild(el("div", "fc-temp", `${Math.round(d.temperature_2m_max[i])}° / ${Math.round(d.temperature_2m_min[i])}°`));
    const pop = d.precipitation_probability_max?.[i];
    card.appendChild(el("div", "fc-pop", pop != null ? `💧 ${pop}%` : ""));
    wrap.appendChild(card);
  }
}

function renderFlags() {
  const wrap = $("#flags");
  if (wrap.childElementCount) return;
  for (const f of BEACH_FLAGS) {
    const row = el("div", "flag-row");
    const sw = el("span", "flag-sw");
    sw.style.background = f.color;
    row.appendChild(sw);
    const txt = el("div", "flag-txt");
    txt.appendChild(el("div", "flag-name", `${f.name} — ${f.meaning}`));
    txt.appendChild(el("div", "flag-detail", f.detail));
    row.appendChild(txt);
    wrap.appendChild(row);
  }
}

function renderUpdated() {
  $("#updated").textContent = `Updated ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

// ===========================================================================
// Theme handling
// ===========================================================================
function setTheme(key) {
  if (!THEMES[key]) return;
  currentTheme = key;
  document.body.className = `theme-${key}`;
  for (const b of document.querySelectorAll(".edition")) {
    b.classList.toggle("active", b.dataset.theme === key);
  }
  applyMapTheme(THEMES[key].map);
  try { localStorage.setItem("waves-theme", key); } catch {}
}

// ===========================================================================
// Beach selection + data load
// ===========================================================================
async function loadBeach(beach, { fly = true } = {}) {
  activeBeach = beach;
  $("#beach-select").value = beach.id;
  renderHeaderBeach(beach);
  setActiveBeach(beach.id);
  if (fly) flyToBeach(beach);
  setLoading(true);
  renderFlags();

  const [weather, marine, tides, water, alerts] = await Promise.all([
    fetchWeather(beach.lat, beach.lon).catch(() => null),
    fetchMarine(beach.lat, beach.lon),
    fetchTides(beach.tideStation),
    fetchWaterTemp(beach.waterTempStation),
    fetchAlerts(beach.lat, beach.lon),
  ]);

  const risk = ripCurrentRisk(alerts, marine, weather);
  renderConditions(weather, water);
  renderRip(risk);
  renderAlerts(alerts);
  renderSurf(marine);
  renderTides(tides);
  renderSun(weather);
  renderUV(weather);
  renderForecast(weather);
  renderUpdated();
  setLoading(false);
}

function selectBeachById(id) {
  const b = BEACHES.find((x) => x.id === id);
  if (b) loadBeach(b);
}

function nearestBeach(lat, lon) {
  let best = BEACHES[0], bestD = Infinity;
  for (const b of BEACHES) {
    const d = (b.lat - lat) ** 2 + (b.lon - lon) ** 2;
    if (d < bestD) { bestD = d; best = b; }
  }
  return best;
}

function useMyLocation() {
  if (!navigator.geolocation) return;
  const btn = $("#geo-btn");
  btn.textContent = "Locating…";
  navigator.geolocation.getCurrentPosition(
    (pos) => { loadBeach(nearestBeach(pos.coords.latitude, pos.coords.longitude)); btn.textContent = "📍"; },
    () => { btn.textContent = "📍"; alert("Couldn't get your location. Pick a beach from the list instead."); },
    { timeout: 8000 }
  );
}

function togglePanel() {
  const collapsed = document.body.classList.toggle("panel-collapsed");
  $("#panel-toggle").textContent = collapsed ? "‹" : "›";
  setTimeout(resizeMap, 320);
}

// ===========================================================================
// Boot
// ===========================================================================
function init() {
  // Restore saved edition.
  let saved = DEFAULT_THEME;
  try { saved = localStorage.getItem("waves-theme") || DEFAULT_THEME; } catch {}
  if (!THEMES[saved]) saved = DEFAULT_THEME;
  currentTheme = saved;
  document.body.className = `theme-${saved}`;

  renderThemeNav();
  renderBeachPicker();
  for (const b of document.querySelectorAll(".edition")) {
    b.classList.toggle("active", b.dataset.theme === saved);
  }

  initMap(THEMES[saved].map, selectBeachById);

  $("#beach-select").addEventListener("change", (e) => selectBeachById(e.target.value));
  $("#refresh-btn").addEventListener("click", () => activeBeach && loadBeach(activeBeach, { fly: false }));
  $("#geo-btn").addEventListener("click", useMyLocation);
  $("#panel-toggle").addEventListener("click", togglePanel);

  // Default beach.
  loadBeach(BEACHES[0]);
}

document.addEventListener("DOMContentLoaded", init);
