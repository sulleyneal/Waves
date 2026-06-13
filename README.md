# 🌊 Waves — Gulf Coast Beach Safety

A beach-safety dashboard for Gulf of Mexico / "Gulf of America" trips, built as a
**living 3-D map**. The Gulf coast is the canvas; the safety information rides on
top as a glassy overlay panel. It surfaces the things you actually want to know
before you get in the water: **rip current risk, active weather warnings, surf,
tides, UV, water temperature, sun times**, and plain-language safety guidance.

Styled as a companion to the [Almanac](https://github.com/sulleyneal/almanac)
project — same MapLibre 3-D terrain map and the same **five editions**
(Antique · Midnight · Hydro · Relief · Topo), each reskinning both the UI and
the map's water/land/road/label colors.

## Features

- **Beautiful maps** — full-screen, pitched 3-D MapLibre GL map of the Gulf with
  terrain relief, themed water/coastline, and clickable beach markers.
- **Five editions** — switch the whole look (UI + map) between Antique, Midnight,
  Hydro, Relief, and Topo. Your choice is remembered.
- **Rip current risk** — shows the official NWS *Rip Current Statement* when one
  is active (badged **NWS OFFICIAL**); otherwise a transparent estimate from
  surf height, swell period, and wind (badged **ESTIMATE**), plus an escape guide.
- **Weather warnings** — live NWS active alerts, color-coded by severity.
- **Current conditions** — air & water temp, wind/gusts + direction, humidity.
- **Surf** — wave height, period, swell, and direction.
- **Tides** — next high/low times and heights from the nearest NOAA station.
- **UV index** — current and daily peak with sun-protection advice.
- **Sun** — sunrise / sunset.
- **5-day outlook** — high/low and rain chance.
- **Beach flag legend** — USLA color-coded warning flag meanings.
- **"Good to know" tips** — rip currents, lightning, jellyfish/Man o' War, the
  stingray shuffle, heat, and sun safety.
- **Presets + geolocation** — 11 Gulf beaches plus a 📍 button that snaps to the
  closest one.

## Running it

No build step, no API keys. Plain static files.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Data sources (all free, no key)

| Data | Source |
|------|--------|
| Weather, UV, sun times, 5-day | [Open-Meteo](https://open-meteo.com/) |
| Surf / waves / sea-surface temp | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) |
| Tides & live water temperature | [NOAA Tides & Currents](https://api.tidesandcurrents.noaa.gov/api/prod/) |
| Official alerts | [NWS api.weather.gov](https://www.weather.gov/documentation/services-web-api) |
| Base map tiles | [OpenFreeMap](https://openfreemap.org/) / OpenStreetMap |
| Terrain elevation | AWS Terrain Tiles (USGS/NASA SRTM) |
| Map rendering | [MapLibre GL JS](https://maplibre.org/) |

## Project layout

```
index.html        # map canvas, topbar, edition switcher, overlay panel
css/styles.css     # five editions (theme vars) + layout, markers, cards
js/config.js       # beaches, flag legend, endpoints, themes + map palettes
js/mapStyle.js     # makeStyle(theme) -> MapLibre style (water/land/terrain/sky)
js/map.js          # map init, beach markers, theming, camera moves
js/api.js          # fetch wrappers; each degrades to null on failure
js/app.js          # orchestration, rip-current logic, rendering, theme switching
```

## Notes & limitations

- The marine model has gaps in very shallow nearshore Gulf cells; surf may read
  "no data" at some spots. The dashboard degrades gracefully — one source being
  down never blanks the page.
- Rip current **estimates** are a heuristic, not a forecast. Always defer to
  lifeguards, posted flags, and official NWS statements.
- **Waves is an informational aid, not a substitute for lifeguards or official
  guidance. When in doubt, don't go out.**
