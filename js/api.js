// Waves — data layer.
// Thin wrappers around the free public APIs. Every function returns plain
// data (or null on failure) so the UI layer can degrade gracefully when one
// source is down without taking the whole dashboard with it.

import { API } from "./config.js";

async function getJSON(url, { headers } = {}) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// --- Batched conditions for marker coloring --------------------------------
// One forecast call + one marine call covering every beach (Open-Meteo accepts
// comma-separated coordinates and returns an array). Used to tint markers by
// rip-current risk without 11 separate round-trips.
export async function fetchBatchConditions(beaches) {
  const lats = beaches.map((b) => b.lat).join(",");
  const lons = beaches.map((b) => b.lon).join(",");

  const fParams = new URLSearchParams({
    latitude: lats, longitude: lons,
    current: "wind_speed_10m", wind_speed_unit: "mph", timezone: "auto",
  });
  const mParams = new URLSearchParams({
    latitude: lats, longitude: lons,
    current: "wave_height,wave_period", length_unit: "imperial", timezone: "auto",
  });

  const [wind, waves] = await Promise.all([
    getJSON(`${API.forecast}?${fParams}`).catch(() => null),
    getJSON(`${API.marine}?${mParams}`).catch(() => null),
  ]);

  // Normalize: single-location responses are objects, multi are arrays.
  const asArr = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  const w = asArr(wind), m = asArr(waves);

  return beaches.map((b, i) => ({
    id: b.id,
    windMph: w[i]?.current?.wind_speed_10m ?? null,
    waveFt: m[i]?.current?.wave_height ?? null,
    period: m[i]?.current?.wave_period ?? null,
  }));
}

// --- NWS alert geometries (for map polygons) -------------------------------
// Active alerts for a state, keeping only those that carry a drawable shape.
export async function fetchAlertShapes(stateAbbr) {
  const params = new URLSearchParams({ area: stateAbbr, status: "actual" });
  try {
    const data = await getJSON(`${API.nwsAlerts}?${params}`, {
      headers: { Accept: "application/geo+json" },
    });
    return (data.features || []).filter((f) => f.geometry);
  } catch {
    return [];
  }
}

// --- Open-Meteo: weather, UV, sun times ------------------------------------

export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,is_day," +
      "precipitation,weather_code,wind_speed_10m,wind_gusts_10m," +
      "wind_direction_10m,uv_index",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,uv_index_max," +
      "precipitation_probability_max,sunrise,sunset,wind_speed_10m_max",
    hourly: "precipitation_probability,uv_index,temperature_2m",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    precipitation_unit: "inch",
    timezone: "auto",
    forecast_days: "5",
  });
  return getJSON(`${API.forecast}?${params}`);
}

// --- Open-Meteo Marine: waves / surf / sea-surface temp ---------------------

export async function fetchMarine(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "wave_height,wave_period,wave_direction,swell_wave_height," +
      "swell_wave_period,sea_surface_temperature",
    hourly: "wave_height",
    length_unit: "imperial",
    timezone: "auto",
    forecast_days: "2",
  });
  try {
    return await getJSON(`${API.marine}?${params}`);
  } catch {
    // Marine model has gaps in shallow Gulf cells; surf is optional.
    return null;
  }
}

// --- NOAA Tides & Currents: tide predictions + water temp -------------------

function todayRange() {
  const now = new Date();
  const begin = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const end = new Date(now.getTime() + 36 * 3600 * 1000);
  const endStr = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}`;
  return { begin, end: endStr };
}
const pad = (n) => String(n).padStart(2, "0");

export async function fetchTides(station) {
  const { begin, end } = todayRange();
  const params = new URLSearchParams({
    product: "predictions",
    application: "waves-beach-safety",
    begin_date: begin,
    end_date: end,
    datum: "MLLW",
    station,
    time_zone: "lst_ldt",
    units: "english",
    interval: "hilo",
    format: "json",
  });
  try {
    const data = await getJSON(`${API.tides}?${params}`);
    return data.predictions || null;
  } catch {
    return null;
  }
}

export async function fetchWaterTemp(station) {
  const params = new URLSearchParams({
    product: "water_temperature",
    application: "waves-beach-safety",
    date: "latest",
    station,
    time_zone: "lst_ldt",
    units: "english",
    format: "json",
  });
  try {
    const data = await getJSON(`${API.tides}?${params}`);
    const reading = data?.data?.[0];
    return reading ? Number(reading.v) : null;
  } catch {
    return null;
  }
}

// --- NWS: official active alerts (rip current, surf, storms, heat) ----------

export async function fetchAlerts(lat, lon) {
  const params = new URLSearchParams({
    point: `${lat.toFixed(4)},${lon.toFixed(4)}`,
    status: "actual",
  });
  try {
    const data = await getJSON(`${API.nwsAlerts}?${params}`, {
      headers: { Accept: "application/geo+json" },
    });
    return (data.features || []).map((f) => f.properties);
  } catch {
    return [];
  }
}
