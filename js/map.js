// Waves — map layer. Wraps MapLibre GL: terrain map, beach markers (tinted by
// rip risk), themeable style, camera moves, and two optional overlays —
// an animated RainViewer radar loop and NWS alert polygons. `maplibregl` is
// loaded globally from the CDN in index.html.

import { MAP, BEACHES, API } from "./config.js";
import { makeStyle } from "./mapStyle.js";

let map = null;
let markers = new Map(); // beach id -> { marker, el }
let onSelect = null;

// Overlay state (persists across theme/style swaps).
const overlay = {
  radar: false,
  alerts: false,
  radarFrames: [],
  radarHost: "",
  radarIdx: 0,
  radarTimer: null,
  alertData: { type: "FeatureCollection", features: [] },
};

const ALERT_COLORS = {
  extreme: "#7c2d12", severe: "#dc2626", moderate: "#ea580c", minor: "#ca8a04",
};
const alertColor = (sev) => ALERT_COLORS[(sev || "").toLowerCase()] || "#0ea5e9";

export function initMap(themePalette, selectHandler) {
  onSelect = selectHandler;
  map = new maplibregl.Map({
    container: "map",
    style: makeStyle(themePalette),
    center: MAP.overview.center,
    zoom: MAP.overview.zoom,
    pitch: MAP.overview.pitch,
    bearing: MAP.overview.bearing,
    minZoom: 3,
    maxZoom: 16,
    maxPitch: 75,
    attributionControl: { compact: true },
    hash: false,
  });

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

  map.on("load", () => {
    addBeachMarkers();
    map.resize();
  });

  return map;
}

function addBeachMarkers() {
  for (const b of BEACHES) {
    const el = document.createElement("button");
    el.className = "beach-marker";
    el.type = "button";
    el.setAttribute("aria-label", `${b.name}, ${b.state}`);
    el.innerHTML = `<span class="bm-dot"></span><span class="bm-label">${b.name}</span>`;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onSelect && onSelect(b.id);
    });
    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([b.lon, b.lat])
      .addTo(map);
    markers.set(b.id, { marker, el });
  }
}

export function setActiveBeach(id) {
  for (const [bid, { el }] of markers) el.classList.toggle("active", bid === id);
}

// Tint a marker by rip-current risk: "LOW" | "MODERATE" | "HIGH".
export function setMarkerRisk(id, level) {
  const m = markers.get(id);
  if (m) m.el.dataset.risk = level || "";
}

export function flyToBeach(beach) {
  if (!map) return;
  map.flyTo({
    center: [beach.lon, beach.lat],
    zoom: MAP.beachView.zoom, pitch: MAP.beachView.pitch, bearing: MAP.beachView.bearing,
    speed: 0.9, curve: 1.5, essential: true,
  });
}

// Re-skin the map. setStyle replaces sources/layers, so any active overlays are
// re-added once the new style settles. DOM markers persist on their own.
export function applyMapTheme(themePalette) {
  if (!map) return;
  const wasRadar = overlay.radar;
  const wasAlerts = overlay.alerts;
  map.setStyle(makeStyle(themePalette));
  map.once("idle", () => {
    if (wasRadar) addRadarToMap();
    if (wasAlerts) addAlertsToMap();
  });
}

export function resizeMap() { map && map.resize(); }

// ---------------------------------------------------------------------------
// Radar overlay (RainViewer animated loop)
// ---------------------------------------------------------------------------
function radarTileURL(frame) {
  // color 4 = "The Weather Channel"; 1_1 = smooth + show snow.
  return `${overlay.radarHost}${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;
}

function addRadarToMap() {
  if (!map || !overlay.radarFrames.length) return;
  const frame = overlay.radarFrames[overlay.radarIdx] || overlay.radarFrames[overlay.radarFrames.length - 1];
  if (!map.getSource("radar")) {
    map.addSource("radar", { type: "raster", tiles: [radarTileURL(frame)], tileSize: 256 });
  }
  if (!map.getLayer("radar-layer")) {
    const before = map.getLayer("place-labels") ? "place-labels" : undefined;
    map.addLayer({
      id: "radar-layer", type: "raster", source: "radar",
      paint: { "raster-opacity": 0.7 },
    }, before);
  }
  startRadarAnimation();
}

function startRadarAnimation() {
  stopRadarAnimation();
  overlay.radarTimer = setInterval(() => {
    overlay.radarIdx = (overlay.radarIdx + 1) % overlay.radarFrames.length;
    const src = map.getSource("radar");
    if (src) src.setTiles([radarTileURL(overlay.radarFrames[overlay.radarIdx])]);
  }, 700);
}
function stopRadarAnimation() {
  if (overlay.radarTimer) { clearInterval(overlay.radarTimer); overlay.radarTimer = null; }
}

export async function toggleRadar(on) {
  overlay.radar = on;
  if (!on) {
    stopRadarAnimation();
    if (map.getLayer("radar-layer")) map.removeLayer("radar-layer");
    if (map.getSource("radar")) map.removeSource("radar");
    return;
  }
  if (!overlay.radarFrames.length) {
    try {
      const data = await (await fetch(API.radarIndex)).json();
      overlay.radarHost = data.host;
      const past = data.radar?.past || [];
      const nowcast = data.radar?.nowcast || [];
      overlay.radarFrames = [...past, ...nowcast];
      overlay.radarIdx = Math.max(0, past.length - 1);
    } catch {
      overlay.radar = false;
      return;
    }
  }
  addRadarToMap();
}

// ---------------------------------------------------------------------------
// Alert polygons (NWS)
// ---------------------------------------------------------------------------
function addAlertsToMap() {
  if (!map) return;
  if (!map.getSource("alerts")) {
    map.addSource("alerts", { type: "geojson", data: overlay.alertData });
  } else {
    map.getSource("alerts").setData(overlay.alertData);
  }
  if (!map.getLayer("alerts-fill")) {
    const before = map.getLayer("place-labels") ? "place-labels" : undefined;
    map.addLayer({
      id: "alerts-fill", type: "fill", source: "alerts",
      paint: { "fill-color": ["get", "color"], "fill-opacity": 0.22 },
    }, before);
    map.addLayer({
      id: "alerts-line", type: "line", source: "alerts",
      paint: { "line-color": ["get", "color"], "line-width": 1.5, "line-opacity": 0.8 },
    }, before);
  }
}

// Store alert features (decorated with a paint color) for the overlay.
export function setAlertData(features) {
  overlay.alertData = {
    type: "FeatureCollection",
    features: (features || []).map((f) => ({
      ...f,
      properties: { ...f.properties, color: alertColor(f.properties?.severity) },
    })),
  };
  if (overlay.alerts && map.getSource("alerts")) map.getSource("alerts").setData(overlay.alertData);
}

export function toggleAlerts(on) {
  overlay.alerts = on;
  if (!on) {
    if (map.getLayer("alerts-fill")) map.removeLayer("alerts-fill");
    if (map.getLayer("alerts-line")) map.removeLayer("alerts-line");
    if (map.getSource("alerts")) map.removeSource("alerts");
    return;
  }
  addAlertsToMap();
}
