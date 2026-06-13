// Waves — map layer. Wraps MapLibre GL: terrain map, beach markers, theming,
// and camera moves. `maplibregl` is loaded globally from the CDN in index.html.

import { MAP, BEACHES } from "./config.js";
import { makeStyle } from "./mapStyle.js";

let map = null;
let markers = new Map(); // beach id -> { marker, el }
let onSelect = null;
let activeId = null;

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
  activeId = id;
  for (const [bid, { el }] of markers) {
    el.classList.toggle("active", bid === id);
  }
}

export function flyToBeach(beach) {
  if (!map) return;
  map.flyTo({
    center: [beach.lon, beach.lat],
    zoom: MAP.beachView.zoom,
    pitch: MAP.beachView.pitch,
    bearing: MAP.beachView.bearing,
    speed: 0.9,
    curve: 1.5,
    essential: true,
  });
}

export function flyToOverview() {
  if (!map) return;
  map.flyTo({ ...MAP.overview, center: MAP.overview.center, essential: true });
}

// Re-skin the map for a new edition. setStyle replaces sources/layers; the
// terrain + sky travel with the style object, and DOM markers persist.
export function applyMapTheme(themePalette) {
  if (!map) return;
  map.setStyle(makeStyle(themePalette));
}

export function resizeMap() {
  map && map.resize();
}
