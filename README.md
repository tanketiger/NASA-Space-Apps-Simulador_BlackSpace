# Aurora · Puesto avanzado en Marte

Demo educativa web inspirada en juegos de vigilancia: desde una cabina, administra energía, observa cuatro cámaras y llega a las 06:00. Un turno dura 60 segundos. No requiere cuenta ni clave de API para jugar.

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

## Datos y transparencia

Se incluye localmente una imagen histórica de Marte, un mosaico de Mars Trek y un registro histórico de DONKI. La demo no solicita datos a ninguna API durante la partida. Para abrir por primera vez una versión alojada en internet se necesita conexión; no se ha implementado instalación offline o service worker.

**Las reglas son ficticias:** ni las cámaras ni los daños, consumos, protecciones o tiempos de los eventos son mediciones o pronósticos de NASA. El registro DONKI no demuestra un impacto en Marte. La app no es una herramienta de entrenamiento o seguridad. Los detalles y fuentes están en `/creditos` y `docs/REDISENO.md`.

El prototipo de gestión por turnos permanece en el repositorio como código anterior; la página principal usa el nuevo motor en `src/lib/night/`.

## IA

El código, estilos y textos se crearon con asistencia de IA. Las imágenes de misiones NASA no se generaron con IA. Los efectos sonoros se sintetizan por código con Web Audio API.
