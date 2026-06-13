// Waves — Gulf Coast Beach Safety
// Static configuration: beaches, flag legend, API endpoints, and the five
// visual "editions" (themes) — palettes matched to the sibling Almanac project.

// ---------------------------------------------------------------------------
// Beaches. Each has coordinates (weather / marine / NWS alerts) plus NOAA
// CO-OPS station ids for tide predictions and live water temperature.
// ---------------------------------------------------------------------------
export const BEACHES = [
  { id: "galveston-tx",    name: "Galveston Island",            state: "TX", lat: 29.2891, lon: -94.7947, tideStation: "8771450", waterTempStation: "8771013" },
  { id: "port-aransas-tx", name: "Port Aransas / Mustang Is.",  state: "TX", lat: 27.8339, lon: -97.0611, tideStation: "8775237", waterTempStation: "8775237" },
  { id: "south-padre-tx",  name: "South Padre Island",          state: "TX", lat: 26.1118, lon: -97.1681, tideStation: "8779748", waterTempStation: "8779748" },
  { id: "grand-isle-la",   name: "Grand Isle",                  state: "LA", lat: 29.2366, lon: -89.9873, tideStation: "8761724", waterTempStation: "8761724" },
  { id: "gulf-shores-al",  name: "Gulf Shores / Dauphin Is.",   state: "AL", lat: 30.2466, lon: -87.7008, tideStation: "8735180", waterTempStation: "8735180" },
  { id: "pensacola-fl",    name: "Pensacola Beach",             state: "FL", lat: 30.3269, lon: -87.1384, tideStation: "8729840", waterTempStation: "8729840" },
  { id: "destin-fl",       name: "Destin",                      state: "FL", lat: 30.3935, lon: -86.4958, tideStation: "8729210", waterTempStation: "8729210" },
  { id: "panama-city-fl",  name: "Panama City Beach",           state: "FL", lat: 30.1766, lon: -85.8055, tideStation: "8729210", waterTempStation: "8729210" },
  { id: "clearwater-fl",   name: "Clearwater Beach",            state: "FL", lat: 27.9775, lon: -82.8271, tideStation: "8726724", waterTempStation: "8726724" },
  { id: "st-pete-fl",      name: "St. Pete Beach",              state: "FL", lat: 27.7253, lon: -82.7412, tideStation: "8726520", waterTempStation: "8726520" },
  { id: "naples-fl",       name: "Naples",                      state: "FL", lat: 26.1420, lon: -81.7948, tideStation: "8725110", waterTempStation: "8725110" },
];

// Beach flag warning system (United States Lifesaving Association colors).
export const BEACH_FLAGS = [
  { color: "#16a34a", name: "Green",      meaning: "Low hazard",            detail: "Calm conditions. Still exercise caution — conditions change fast." },
  { color: "#eab308", name: "Yellow",     meaning: "Medium hazard",         detail: "Moderate surf and/or currents. Weak swimmers should stay out." },
  { color: "#dc2626", name: "Red",        meaning: "High hazard",           detail: "Strong surf or rip currents. Swimming is dangerous for most." },
  { color: "#7c2d12", name: "Double Red", meaning: "Water closed",          detail: "Water is closed to the public. Do not enter the water." },
  { color: "#7c3aed", name: "Purple",     meaning: "Dangerous marine life", detail: "Jellyfish, stingrays, or other hazardous sea life present." },
];

// Endpoints (all free, no API key required).
export const API = {
  forecast: "https://api.open-meteo.com/v1/forecast",
  marine: "https://marine-api.open-meteo.com/v1/marine",
  tides: "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
  nwsAlerts: "https://api.weather.gov/alerts/active",
  radarIndex: "https://api.rainviewer.com/public/weather-maps.json",
};

// ---------------------------------------------------------------------------
// Map data sources (OpenFreeMap vector tiles + AWS terrarium elevation DEM).
// ---------------------------------------------------------------------------
export const MAP = {
  tiles: "https://tiles.openfreemap.org/planet",
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  dem: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
  // Gulf overview, used before a beach is chosen.
  overview: { center: [-89.5, 26.8], zoom: 5.2, pitch: 35, bearing: 0 },
  // Camera when a beach is selected.
  beachView: { zoom: 10.6, pitch: 58, bearing: -14 },
};

// ---------------------------------------------------------------------------
// Five editions. Each entry carries:
//   - label    : switcher text
//   - serif    : true for the Antique book-print feel
//   - map       : paint colors for the MapLibre style (see js/mapStyle.js)
// The UI-side CSS custom properties live in css/styles.css (body.theme-*),
// matched to the Almanac palettes; the map-side colors live here.
// ---------------------------------------------------------------------------
export const THEMES = {
  antique: {
    label: "Antique", serif: true,
    map: { bg:"#efe5cd", water:"#a4bdb9", coast:"#7e9f9c", road:"#e6c089",
           land:"#e3d6b5", sand:"#e8d39b", label:"#4a3a26", halo:"#efe5cd",
           shadow:"#8a7a57", highlight:"#fbf3dc",
           sky:"#d9c9a3", horizon:"#e9dcbe", fog:"#efe5cd", exaggeration:1.3 },
  },
  hydro: {
    label: "Hydro", serif: false,
    map: { bg:"#070a10", water:"#0e85c8", coast:"#56c4f2", road:"#242f3c",
           land:"#0b121c", sand:"#122230", label:"#bcd6e8", halo:"#06080d",
           shadow:"#04070d", highlight:"#155a82",
           sky:"#061018", horizon:"#0e3a55", fog:"#070a10", exaggeration:1.4 },
  },
  relief: {
    label: "Relief", serif: false,
    map: { bg:"#eee9da", water:"#3787ab", coast:"#2d7298", road:"#dcd1b2",
           land:"#d7d8bf", sand:"#d9c79a", label:"#33382f", halo:"#f0ece0",
           shadow:"#8f9a83", highlight:"#fbfaf2",
           sky:"#bcd0d6", horizon:"#cfe0e4", fog:"#eef0ec", exaggeration:2.0 },
  },
  topo: {
    label: "Topo", serif: false,
    map: { bg:"#f4f1e8", water:"#b7d3e3", coast:"#7fa9c4", road:"#ded8c4",
           land:"#e6e0cd", sand:"#e3d3a7", label:"#433d2c", halo:"#f4f1e8",
           shadow:"#b0a98f", highlight:"#fffdf6",
           sky:"#dfe7ea", horizon:"#ecefe9", fog:"#f4f1e8", exaggeration:2.0 },
  },
};

export const DEFAULT_THEME = "antique";
