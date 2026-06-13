# 🌊 Waves — Gulf Coast Beach Safety

A single-page beach-safety dashboard for Gulf of Mexico / "Gulf of America" beach
trips. It pulls together the things you actually want to know before you get in
the water: **rip current risk, active weather warnings, surf, tides, UV, water
temperature, sun times**, and plain-language safety guidance.

This is a beach-focused reimagining of an almanac-style weather dashboard —
same "everything on one screen" idea, retooled for the sand instead of the
backyard.

## Features

- **Rip current risk** — shows the official NWS *Rip Current Statement* when one
  is active (badged **NWS OFFICIAL**); otherwise a transparent estimate computed
  from surf height, swell period, and wind (badged **ESTIMATE**).
- **Weather warnings** — live National Weather Service active alerts for the
  spot (tropical, thunderstorm, high surf, heat, etc.), color-coded by severity.
- **Current conditions** — air & water temp, wind/gusts with direction, humidity.
- **Surf** — wave height, period, swell, and direction.
- **Tides** — next high/low times and heights from the nearest NOAA station.
- **UV index** — current and daily peak with sun-protection advice.
- **Sun** — sunrise / sunset.
- **5-day outlook** — high/low and rain chance.
- **Beach flag legend** — USLA color-coded warning flag meanings.
- **"Good to know" tips** — rip current escape, lightning, jellyfish/Man o' War,
  stingray shuffle, heat, and sun safety.
- **Presets + geolocation** — 11 popular Gulf beaches plus a "Near me" button
  that snaps to the closest one.

## Running it

No build step, no API keys. It's plain static files.

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works in most browsers, though a local
server avoids any module/CORS quirks.

## Data sources (all free, no key)

| Data | Source |
|------|--------|
| Weather, UV, sun times, 5-day | [Open-Meteo](https://open-meteo.com/) |
| Surf / waves / sea-surface temp | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) |
| Tides & live water temperature | [NOAA Tides & Currents](https://api.tidesandcurrents.noaa.gov/api/prod/) |
| Official alerts | [NWS api.weather.gov](https://www.weather.gov/documentation/services-web-api) |

## Project layout

```
index.html        # markup + layout
css/styles.css     # ocean-themed styling, responsive
js/config.js       # beach presets (coords + NOAA station ids), flag legend, endpoints
js/api.js          # fetch wrappers; each degrades to null on failure
js/app.js          # orchestration, rip-current logic, rendering
```

## Notes & limitations

- The marine model has gaps in very shallow nearshore Gulf cells; surf may read
  "no data" at some spots. The dashboard degrades gracefully — one source being
  down never blanks the page.
- Rip current **estimates** are a heuristic, not a forecast. Always defer to
  lifeguards, posted flags, and official NWS statements.
- **Waves is an informational aid, not a substitute for lifeguards or official
  guidance. When in doubt, don't go out.**
