# APIs: qué necesito y cómo me las pasas

## Resumen

| # | API | ¿Necesito credencial? | Estado | Para qué la uso |
|---|---|---|---|---|
| 1 | **NASA Open APIs** (`api.nasa.gov`) | ✅ **Sí — una key** | ⏳ pendiente | DONKI (clima espacial), Mars Rover Photos, InSight |
| 2 | **OSDR** (`osdr.nasa.gov/osdr/data/search`) | ❌ No | ✅ probada, funciona | Estudios reales de salud/biología |
| 3 | **RadLab** (OSDR dosimetry) | ❓ Depende del endpoint | ❓ **no lo encontré público** | Dosis real medida (ISS) |
| 4 | **Mars Trek** (`trek.nasa.gov/tiles/...`) | ❌ No | ✅ probada, funciona | Imágenes reales de Marte |
| 5 | **NASA Image Library** (`images-api.nasa.gov`) | ❌ No | ✅ probada, funciona | Fotos reales para ventanas/exterior |

---

## 1. NASA API key (la única realmente imprescindible)

**Cómo obtenerla (2 minutos):**

1. Entra a <https://api.nasa.gov/>
2. Rellena el formulario *"Generate API Key"*: nombre, apellido y correo.
3. Te llega la key al instante en pantalla y por correo (algo como `AbCdEf123456...`).

**Cómo me la pasas (elige una):**

- **Opción A (recomendada):** crea un archivo `.env.local` en la raíz del proyecto con:
  ```
  NASA_API_KEY=tu_key_aqui
  ```
  Ese archivo ya está en `.gitignore`, así que **no se sube a GitHub**.
- **Opción B:** pégamela en el chat y yo creo el `.env.local`.

> ⚠️ No la subas al repo ni la pongas en el código. El proxy del servidor la lee de la variable
> de entorno y el navegador nunca la ve.

**Límites:** 1.000 requests/hora por key (la `DEMO_KEY` compartida es de ~30/h y se agota).

---

## 2. OSDR — no necesito nada

Su API de búsqueda es abierta:

```
GET https://osdr.nasa.gov/osdr/data/search?term=radiation&size=20
```

Ya la probé: devuelve estudios reales (por ejemplo `1064` resultados para "radiation").
**Ojo:** bloquea CORS, así que la consulto desde el servidor. No necesito key.

Si tienen acceso a un endpoint más específico (por ejemplo búsqueda por `accession` o
descarga de metadatos), pásenmelo y lo aprovecho.

---

## 3. RadLab — **esto sí necesito que me lo pases tú**

Es el único que no pude localizar por mi cuenta. Necesito **una** de estas tres cosas:

1. **La URL base del servicio** (ej. `https://radlab.xxxx.nasa.gov/api/...`) y, si tiene,
   la documentación de endpoints.
2. **Un ejemplo de respuesta** (un JSON de muestra o una captura del formato).
3. Si es una herramienta web sin API: **el link** y con qué botón se exportan los datos
   (CSV/JSON). Con eso puedo dejar un importador.

Mientras tanto el juego **no se bloquea**: uso el valor de referencia real de MSL/RAD
(0,64 mSv/día) y lo etiqueto como `Dato de referencia · NASA MSL/RAD`. Cuando llegue RadLab,
solo cambio el adaptador `src/lib/nasa/radlab.ts`.

---

## 4. Mars Trek — no necesito nada

Los tiles ya responden y con CORS abierto:

```
https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{x}/{y}.jpg
```

Si el equipo tiene una **zona concreta** preferida (Jejero, Gale, Arcadia Planitia), pásenmela
y centro el mapa ahí. Si no, uso el mosaico global y marco el sitio con coordenadas reales.

---

## 5. Variables de entorno finales

```env
NASA_API_KEY=...          # obligatoria para datos en vivo
RADLAB_BASE_URL=          # opcional hasta que llegue
RADLAB_API_KEY=           # opcional
OSDR_BASE_URL=https://osdr.nasa.gov/osdr/data/search
DATA_MODE=auto            # auto | live | historico
```

Con `DATA_MODE=auto` el servidor intenta la API real; si falla (sin red, cuota agotada),
cae a un **snapshot real ya descargado** y lo indica en pantalla como
`Archivo real (sin conexión)`. La demo nunca se queda en blanco.
