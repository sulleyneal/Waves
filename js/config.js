// Waves — Gulf Coast Beach Safety
// Static configuration: preset beaches with coordinates and NOAA station IDs.
//
// Each beach has:
//   - lat/lon         : used for weather, marine, and NWS alert lookups
//   - tideStation     : NOAA CO-OPS station id for tide predictions
//   - waterTempStation: NOAA CO-OPS station id reporting water temperature
//                       (may differ from the tide station; falls back to
//                        marine model SST if the station has no live reading)

export const BEACHES = [
  {
    id: "galveston-tx",
    name: "Galveston Island",
    state: "TX",
    lat: 29.2891,
    lon: -94.7947,
    tideStation: "8771450",        // Galveston Pier 21
    waterTempStation: "8771013",   // Eagle Point / Galveston Bay entrance
  },
  {
    id: "port-aransas-tx",
    name: "Port Aransas / Mustang Island",
    state: "TX",
    lat: 27.8339,
    lon: -97.0611,
    tideStation: "8775237",        // Port Aransas
    waterTempStation: "8775237",
  },
  {
    id: "south-padre-tx",
    name: "South Padre Island",
    state: "TX",
    lat: 26.1118,
    lon: -97.1681,
    tideStation: "8779748",        // SPI Coast Guard Station
    waterTempStation: "8779748",
  },
  {
    id: "grand-isle-la",
    name: "Grand Isle",
    state: "LA",
    lat: 29.2366,
    lon: -89.9873,
    tideStation: "8761724",        // Grand Isle
    waterTempStation: "8761724",
  },
  {
    id: "gulf-shores-al",
    name: "Gulf Shores / Dauphin Island",
    state: "AL",
    lat: 30.2466,
    lon: -87.7008,
    tideStation: "8735180",        // Dauphin Island
    waterTempStation: "8735180",
  },
  {
    id: "pensacola-fl",
    name: "Pensacola Beach",
    state: "FL",
    lat: 30.3269,
    lon: -87.1384,
    tideStation: "8729840",        // Pensacola
    waterTempStation: "8729840",
  },
  {
    id: "destin-fl",
    name: "Destin",
    state: "FL",
    lat: 30.3935,
    lon: -86.4958,
    tideStation: "8729210",        // Panama City Beach (nearest)
    waterTempStation: "8729210",
  },
  {
    id: "panama-city-fl",
    name: "Panama City Beach",
    state: "FL",
    lat: 30.1766,
    lon: -85.8055,
    tideStation: "8729210",        // Panama City Beach
    waterTempStation: "8729210",
  },
  {
    id: "clearwater-fl",
    name: "Clearwater Beach",
    state: "FL",
    lat: 27.9775,
    lon: -82.8271,
    tideStation: "8726724",        // Clearwater Beach
    waterTempStation: "8726724",
  },
  {
    id: "st-pete-fl",
    name: "St. Pete Beach",
    state: "FL",
    lat: 27.7253,
    lon: -82.7412,
    tideStation: "8726520",        // St. Petersburg
    waterTempStation: "8726520",
  },
  {
    id: "naples-fl",
    name: "Naples",
    state: "FL",
    lat: 26.1420,
    lon: -81.7948,
    tideStation: "8725110",        // Naples
    waterTempStation: "8725110",
  },
];

// Beach flag warning system (United States Lifesaving Association colors).
export const BEACH_FLAGS = [
  {
    color: "#16a34a",
    name: "Green",
    meaning: "Low hazard",
    detail: "Calm conditions. Still exercise caution — conditions change fast.",
  },
  {
    color: "#eab308",
    name: "Yellow",
    meaning: "Medium hazard",
    detail: "Moderate surf and/or currents. Weak swimmers should stay out.",
  },
  {
    color: "#dc2626",
    name: "Red",
    meaning: "High hazard",
    detail: "Strong surf or rip currents. Swimming is dangerous for most.",
  },
  {
    color: "#7c2d12",
    name: "Double Red",
    meaning: "Water closed",
    detail: "Water is closed to the public. Do not enter the water.",
  },
  {
    color: "#7c3aed",
    name: "Purple",
    meaning: "Dangerous marine life",
    detail: "Jellyfish, stingrays, or other hazardous sea life present.",
  },
];

// Endpoints (all free, no API key required).
export const API = {
  forecast: "https://api.open-meteo.com/v1/forecast",
  marine: "https://marine-api.open-meteo.com/v1/marine",
  tides: "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
  nwsAlerts: "https://api.weather.gov/alerts/active",
};
