# NASA data and resources actually used by the application

Only the resources below are genuinely used by the code. URLs verified and returning `200`.

Items 1 and 3 are JSON API endpoints (raw text in a browser is expected). The rest open as normal
pages or images.

| # | Resource | URL | Where used |
|---|---|---|---|
| 1 | NASA DONKI - CME API (space weather) | https://api.nasa.gov/DONKI/CME?startDate=2024-05-01&endDate=2024-05-15&api_key=DEMO_KEY | Server request in `/api/nasa` (last 30 days + May 2024 archive) |
| 2 | NASA Open APIs - home | https://api.nasa.gov/ | API base (`DEMO_KEY`) |
| 3 | NASA OSDR - study search API | https://osdr.nasa.gov/osdr/data/search?term=radiation&size=6 | Server request in `/api/nasa` |
| 4 | NASA OSDR - study OSD-73 | https://osdr.nasa.gov/bio/repo/data/studies/OSD-73 | Link in CAM 04 and victory screen |
| 5 | NASA OSDR - study OSD-489 | https://osdr.nasa.gov/bio/repo/data/studies/OSD-489 | Link in CAM 04 and victory screen |
| 6 | NASA OSDR - study OSD-158 | https://osdr.nasa.gov/bio/repo/data/studies/OSD-158 | Link in CAM 04 and victory screen |
| 7 | NASA Mars Trek - orbital tile | https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2/1/1.jpg | Real Mars image in CAM 01 |
| 8 | NASA DONKI CCMC - SOL 1 record | https://ccmc.gsfc.nasa.gov/DONKI/events/30589/2/ | "View record" link in `/creditos` |
| 9 | NASA DONKI CCMC - SOL 2 record | https://ccmc.gsfc.nasa.gov/DONKI/events/23900/2/ | "View record" link in `/creditos` |
| 10 | NASA DONKI CCMC - SOL 3 record | https://ccmc.gsfc.nasa.gov/DONKI/events/19567/1/ | "View record" link in `/creditos` |

---

## Reference values cited in the game (not fetched, not linked)

These numbers are used in the game text and labels. Their source pages live in `docs/` only and are
**not** listed as API resources on purpose.

| Value | Source |
|---|---|
| Surface dose 0.64 mSv/sol | MSL-RAD on Curiosity (Hassler et al., 2014) |
| Career limit 600 mSv | NASA crew exposure standard |
| Solar transmittance 25% -> 28% (Spirit, Sol 1812) | NASA PIA11799 |
| Solar irradiance ~590 W/m2 | NASA Mars Facts |

---

## Deliberately excluded

- `https://osdr.nasa.gov/bio/studies/OSD-xxx` - returns **404**. The valid path includes
  `/bio/repo/data/`.
- `https://visualization.osdr.nasa.gov/radlab/gui/data-api/` - RadLab data API, returns **500** and
  is not consumed by the project.
- `https://ccmc.gsfc.nasa.gov/tools/DONKI/`, `https://osdr.nasa.gov/bio/`, `https://trek.nasa.gov/mars/`,
  and the `science.nasa.gov` reference pages: documentation only, not used by the app.

---

## Project links

- Demo: https://nasa-space-apps-simulador-black-spa.vercel.app
- Code: https://github.com/tanketiger/NASA-Space-Apps-Simulador_BlackSpace
