# AURORA — Puesto Avanzado en Marte

Simulador web para niños de 7 a 12 años donde cada sol repartes energía limitada entre
**sobrevivir, protegerte, comunicarte y hacer ciencia**, con datos reales de la NASA.

> **La frase del juego:** *cada sol tienes energía limitada; el clima real de Marte decide
> si tu plan funciona.*

---

## Arrancar

```bash
npm install
cp .env.example .env.local   # pega tu NASA_API_KEY
npm run dev                  # http://localhost:3000
```

La app funciona **sin key** con los snapshots incluidos (datos reales ya descargados),
pero se marca como archivo. Con key, el clima espacial se consulta en vivo.

```bash
npm run snapshots   # regenera los snapshots con datos reales de DONKI/OSDR
npm run build       # build de producción
npm test            # tests del motor de simulación
```

---

## Cómo está organizado

```
src/
  app/
    page.tsx              → entrada
    api/spaceweather/     → DONKI (proxy + cache + snapshot)
    api/osdr/             → estudios reales (proxy: OSDR bloquea CORS)
    api/radlab/           → dosimetría (adaptador configurable)
    api/mars/             → imágenes reales de la NASA
  components/             → las 3 salas + HUD + informes
  lib/
    sim/                  → motor puro: tipos, constantes, escenarios, endSol()
    nasa/                 → clientes de las APIs
    data/snapshots/       → datos reales descargados (fallback de la demo)
  store/game.ts           → estado + acciones (Zustand + localStorage)
docs/
  ESPECIFICACION.md       → el documento del proyecto, ajustado
  DATOS-VERIFICADOS.md    → cada cifra y su fuente + veredicto del "25 %"
  APIS.md                 → qué API se usa y cómo entregar las credenciales
```

---

## Las tres salas

| Sala | Qué se hace |
|---|---|
| **Control** | Reparto de energía (4 deslizadores), monitores de O₂, dosis, batería, clima espacial real y dos ventanas con fotos reales. |
| **Exterior** | Paneles que se llenan de polvo, limpieza, rover, invernadero, reparaciones y mapa real de Marte. |
| **Vitales** | Dosímetro con proyección a 900 soles, cartas de ciencia reales de OSDR y bitácora. |

---

## Procedencia de los datos

| Etiqueta | Significado |
|---|---|
| 🟢 **EN VIVO** | DONKI, últimos 10 días, consultado al abrir |
| 🔵 **ARCHIVO REAL** | OSDR, Mars Trek, fotos NASA |
| 🟠 **HISTÓRICO REAL** | InSight 2018–2020 |
| ⚪ **REFERENCIA** | constantes de páginas de ciencia NASA (MSL/RAD, MMRTG) |
| 🔴 **MODELO** | cuerpo del astronauta y estado de la base |

Regla: **el ambiente es real, el cuerpo es un modelo, y se dice en pantalla.**

---

## Cumplimiento

- Sin logos, banderas, parches ni tipografía de la NASA. Identidad propia.
- Sin imágenes generadas por IA: se usan fotos reales de misiones NASA + SVG propio.
- Sin cuentas, sin descargas, sin base de datos.

---

## Estado

- [x] Motor de simulación puro y testeable
- [x] Tres salas jugables
- [x] Snapshots reales de OSDR
- [x] Proxy de DONKI + fallback
- [ ] `NASA_API_KEY` real → snapshots en vivo (pedir al equipo)
- [ ] Endpoint de RadLab (pedir al equipo)
- [ ] Tests del motor
