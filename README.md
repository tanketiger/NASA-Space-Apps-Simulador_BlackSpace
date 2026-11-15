# Aurora Outpost · Tu primer turno en Marte

Juego web para niños de 7 a 12 años, inspirado en los juegos de vigilancia por turnos. Desde una cabina en primera persona sube el escudo a tiempo, vigila cuatro cámaras y sobrevive hasta las 06:00 AM. Un turno dura 60 segundos. No requiere cuenta ni descarga, y funciona aunque no haya internet (usa un respaldo local).

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
- **LUZ (switch amarillo):** enciende un haz sobre el ventanal durante 3 segundos y baja solo. Sirve para ver si hay polvo en el aire; cada pulsación actualiza el diagnóstico de Michi.
- **CÁMARAS (switch azul):** abre la tablet CCTV con 4 pestañas (Superficie, Paneles Solares, Clima Espacial y Dosis, Invernadero y Ciencia). Al cerrarla, el switch baja.
- **OXÍGENO (switch verde):** sube un instante (+25 % de oxígeno, −10 % de batería) y vuelve a bajar solo.
- **LIMPIAR PANELES (puerta izquierda o botón dentro de CAM 02):** limpieza mecánica instantánea con aire comprimido: −8 % de batería y −25 puntos de polvo. Si no hay batería suficiente, avisa.
- **CRT (derecha):** muestra el SOL, la hora (12:00 AM → 06:00 AM) y «SISTEMAS OK» / «¡ALERTA!». Sube el escudo cuando marque alerta.
- **Batería:** cada sistema activo (escudo, luz, cámaras) consume energía. Apágalos cuando no los necesites.
- **Michi Marciano (abajo a la izquierda):** guía del juego (ficción). Se puede minimizar con el botón `?` y leer en voz alta con el botón 🔊.

## Estructura

- `src/app/page.tsx`: el juego completo en primera persona (fondo `cabina.jpg`, switches, barras, CRT, tablet CCTV de 4 cámaras, limpieza de paneles, Michi Marciano).
- `src/app/api/nasa/route.ts`: endpoint propio con los datos reales de NASA (DONKI + OSDR) y respaldo local (`revalidate = 3600`).
- `src/lib/game/nasa.ts`: tipos, constantes físicas de referencia y respaldos reales del feed de la NASA.
- `src/lib/game/engine.ts`: tipos y reglas del turno (reloj, batería, oxígeno, tormenta, llamarada).
- `src/lib/game/sound.ts`: efectos sintetizados con Web Audio API.
- `src/lib/game/sols.ts`: lee los soles precargados.
- `src/data/mars_sols.json`: datos de cada sol, incluido el registro histórico real de NASA DONKI.
- `public/images/michi_guia.png`: retrato del guía, generado con IA.
- `src/app/creditos/`: fuentes, avisos de ficción y declaración de IA.

## Datos y transparencia

El juego consulta dos fuentes reales a través de su propio endpoint `/api/nasa`. Si no hay internet o se agota la cuota, cae automáticamente a un respaldo local y lo marca como archivo o histórico (nunca como dato en vivo):

- **NASA DONKI** (clima espacial): eyecciones de masa coronal recientes con su identificador, fecha y velocidad medida. Se muestran en la cámara 03 con la etiqueta «Datos reales en vivo · NASA DONKI» o «Registro histórico · NASA DONKI».
- **NASA OSDR** (radiación y biología): estudios reales `OSD-xxx`. Se muestran en la cámara 04 y en la pantalla de victoria con la etiqueta «Estudio real · NASA OSDR».

Datos de referencia citados: la dosis de superficie (~0,64 mSv/sol, MSL-RAD), el caso de polvo del rover Spirit en el Sol 1812 (NASA PIA11799), la tesela orbital de NASA Mars Trek y el límite de carrera de 600 mSv.

**Las reglas son ficticias:** el reloj de 60 segundos, la tormenta de polvo, el nivel de la llamarada, el consumo de batería y oxígeno, el escudo, las luces, las cámaras, la limpieza de paneles, el polvo y el mini-rover son reglas y escenas de diseño, no mediciones ni pronósticos de NASA. Michi Marciano es un personaje de ficción. La app no es una herramienta de entrenamiento o seguridad. Los detalles y fuentes están en `/creditos`.

## IA

El código, estilos y textos se crearon con asistencia de IA. La mayoría de las ilustraciones son gráficos vectoriales (SVG) y CSS; el retrato de Michi (`public/images/michi_guia.png`) es una imagen generada con IA y se identifica como tal. Los sonidos se sintetizan por código con Web Audio API (no hay archivos de audio); la lectura en voz alta opcional usa la síntesis de voz del navegador. La interfaz no usa logotipos ni identificadores gráficos de NASA.
