# Aurora Outpost · Tu primer turno en Marte

Juego web para niños de 7 a 12 años, inspirado en los juegos de vigilancia por turnos. Desde una cabina en primera persona sube el escudo a tiempo, vigila tres cámaras y sobrevive hasta las 06:00 AM. Un turno dura 60 segundos. No requiere cuenta, descarga ni clave de API para jugar.

## Iniciar

En PowerShell, desde esta carpeta:

```powershell
npm install
npm run dev
```

Abre <http://localhost:3000>. Para verificar la demo:

```powershell
npm test
npm run build
```

Si OneDrive produce un error `EINVAL` con la caché `.next`, se puede elegir una carpeta de compilación nueva antes de iniciar:

```powershell
$env:NEXT_DIST_DIR = ".next-aurora-dev"
npm run dev -- -p 3217
```

En ese caso abre <http://localhost:3217>. Utiliza un nombre de carpeta diferente si esa caché también da problemas.

## Cómo se juega

- **Barras (izquierda):** batería (verde), oxígeno (naranja) e integridad (celeste). Se vacían en tiempo real.
- **ESCUDO (switch naranja):** súbelo para bajar la compuerta blindada sobre el ventanal MARTE y bloquear la tormenta y la llamarada. Consume batería extra por segundo.
- **LUZ (switch amarillo):** enciende el exterior 2 segundos para ver si hay tormenta en el ventanal; vuelve a bajar solo.
- **CÁMARAS (switch azul):** abre la tablet CCTV con 3 pestañas (Radar, Paneles Solares, Invernadero). Al cerrarla, el switch baja.
- **OXÍGENO (switch verde):** sube un instante (+25 % de oxígeno, −10 % de batería) y vuelve a bajar solo.
- **EVA (puerta izquierda):** «Salir a paneles solares» limpia el polvo de los paneles a 0 % a cambio de −15 % de oxígeno.
- **CRT (derecha):** muestra el SOL, la hora (12:00 AM → 06:00 AM) y «SISTEMAS OK» / «¡ALERTA!». Sube el escudo cuando marque alerta.
- **Batería:** cada sistema activo (escudo, luz, cámaras) consume energía. Apágalos cuando no los necesites.

## Estructura

- `src/app/page.tsx`: el juego completo en primera persona (fondo `cabina.jpg`, switches, barras, CRT, tablet CCTV, EVA).
- `src/lib/game/engine.ts`: tipos y reglas del turno (reloj, batería, oxígeno, tormenta, llamarada).
- `src/lib/game/sound.ts`: efectos sintetizados con Web Audio API.
- `src/lib/game/sols.ts`: lee los soles precargados.
- `src/data/mars_sols.json`: datos de cada sol, incluido el registro histórico real de NASA DONKI.
- `src/app/creditos/`: fuentes, avisos de ficción y declaración de IA.

## Datos y transparencia

La demo funciona con datos precargados y **no solicita ninguna clave ni consulta APIs durante la partida**. Cada sol muestra en la pestaña CAM 01 · RADAR un registro histórico real de una eyección de masa coronal observada por NASA DONKI (`api.nasa.gov`). Ese registro es solo una referencia citada en pantalla: no determina el nivel de la llamarada del juego ni demuestra que haya alcanzado Marte.

**Las reglas son ficticias:** el reloj de 60 segundos, la tormenta de polvo, el nivel de la llamarada, el consumo de batería y oxígeno, el escudo, las luces, las cámaras, la salida EVA, el polvo de los paneles y el mini-rover son reglas y escenas de diseño, no mediciones ni pronósticos de NASA. La app no es una herramienta de entrenamiento o seguridad. Los detalles y fuentes están en `/creditos` y `docs/REDISENO.md`.

## IA

El código, estilos y textos se crearon con asistencia de IA. Todas las ilustraciones son gráficos vectoriales (SVG) y CSS; los sonidos se sintetizan por código con Web Audio API (no hay archivos de audio ni voces de IA). La interfaz no usa logotipos ni identificadores gráficos de NASA.
