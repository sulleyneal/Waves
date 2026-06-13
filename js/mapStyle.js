// Waves — hand-written MapLibre GL style, themed per edition.
// Built on the OpenMapTiles vector schema (OpenFreeMap planet tiles) with a
// terrarium-encoded elevation DEM for 3-D terrain, hillshade, and sky.

import { MAP } from "./config.js";

const FONT = ["Noto Sans Regular"];

// Build a complete style object for a given theme's map palette (`t`).
export function makeStyle(t) {
  return {
    version: 8,
    glyphs: MAP.glyphs,
    sources: {
      openmaptiles: { type: "vector", url: MAP.tiles },
      terrain: {
        type: "raster-dem",
        tiles: [MAP.dem],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 13,
      },
    },
    layers: [
      { id: "background", type: "background", paint: { "background-color": t.bg } },

      // Land cover — wood + sand give the coast character.
      {
        id: "landcover-wood", type: "fill", source: "openmaptiles",
        "source-layer": "landcover", filter: ["==", "class", "wood"],
        paint: { "fill-color": t.land, "fill-opacity": 0.45 },
      },
      {
        id: "landcover-sand", type: "fill", source: "openmaptiles",
        "source-layer": "landcover", filter: ["==", "class", "sand"],
        paint: { "fill-color": t.sand, "fill-opacity": 0.7 },
      },

      // Relief shading from the DEM (subtle, sits under the water).
      {
        id: "hillshade", type: "hillshade", source: "terrain",
        paint: {
          "hillshade-exaggeration": 0.4,
          "hillshade-shadow-color": t.shadow,
          "hillshade-highlight-color": t.highlight,
        },
      },

      // The Gulf — the star of the show.
      {
        id: "water", type: "fill", source: "openmaptiles",
        "source-layer": "water", paint: { "fill-color": t.water },
      },
      {
        id: "waterway", type: "line", source: "openmaptiles",
        "source-layer": "waterway",
        paint: {
          "line-color": t.coast,
          "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.6, 14, 1.8],
        },
      },

      // Roads.
      {
        id: "roads", type: "line", source: "openmaptiles",
        "source-layer": "transportation",
        filter: ["!", ["in", ["get", "class"], ["literal", ["ferry", "rail", "path"]]]],
        paint: {
          "line-color": t.road,
          "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.4, 11, 1.2, 15, 4],
          "line-opacity": 0.85,
        },
      },

      // State / national boundaries.
      {
        id: "boundary", type: "line", source: "openmaptiles",
        "source-layer": "boundary", filter: ["<=", ["get", "admin_level"], 4],
        paint: { "line-color": t.coast, "line-dasharray": [2, 2], "line-opacity": 0.4 },
      },

      // Place labels (cities / towns).
      {
        id: "place-labels", type: "symbol", source: "openmaptiles",
        "source-layer": "place",
        filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
        layout: {
          "text-field": ["get", "name"],
          "text-font": FONT,
          "text-size": ["interpolate", ["linear"], ["zoom"], 6, 11, 12, 16],
          "text-letter-spacing": 0.05,
          "text-max-width": 8,
        },
        paint: { "text-color": t.label, "text-halo-color": t.halo, "text-halo-width": 1.3 },
      },

      // Sea / bay labels along the coast.
      {
        id: "water-labels", type: "symbol", source: "openmaptiles",
        "source-layer": "water_name",
        layout: {
          "text-field": ["get", "name"],
          "text-font": FONT,
          "text-size": 12,
          "text-letter-spacing": 0.25,
          "symbol-placement": "line",
        },
        paint: { "text-color": t.coast, "text-halo-color": t.halo, "text-halo-width": 1 },
      },
    ],
    terrain: { source: "terrain", exaggeration: t.exaggeration },
    sky: {
      "sky-color": t.sky,
      "horizon-color": t.horizon,
      "fog-color": t.fog,
      "sky-horizon-blend": 0.6,
      "horizon-fog-blend": 0.6,
      "fog-ground-blend": 0.4,
      "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 0.9, 11, 0.25],
    },
  };
}
