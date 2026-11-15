# Datos verificados y veredicto sobre el "25 %"

> **AVISO DE REVISIÓN:** solo está verificada aquí la cita directa de Spirit de la sección 1.
> Las fórmulas y cifras de la simulación anterior no están validadas para una base humana
> y no se usan como datos reales en la nueva demo. Consulta `REDISENO.md`.

> Este archivo existe para que el jurado (y el equipo) pueda auditar cada cifra del juego.
> Toda cifra que aparezca en pantalla debe poder rastrearse hasta aquí.

---

## 1. El "25 % de recuperación de energía" — VEREDICTO

**La afirmación tal como está en el brief no es correcta.** El 25 % existe, pero significa
otra cosa.

| Afirmación | Veredicto | Qué dice realmente la fuente |
|---|---|---|
| "Los paneles recuperan un 25 % de energía" | ❌ **Falso** | No hay ningún dato NASA que diga eso. |
| "El 25 % de la luz solar atravesaba el polvo" | ✅ **Correcto** | Antes de la limpieza del **sol 1812** del rover Spirit, **solo el 25 % de la luz** que llegaba al panel lograba pasar el polvo. Tras la limpieza subió al **28 %**. |
| "Una limpieza puede subir la energía ~14 %" | ✅ **Correcto** | Ese mismo evento subió la producción de **210 Wh a 240 Wh** (+30 Wh, ≈ +14 %). |
| "La eficiencia de las celdas era ~25 %" | ⚠️ **Cercano** | Las celdas de triple unión del MER tenían una eficiencia de conversión de ≈26 %. Es otra cosa distinta. |

**Fuente primaria (NASA Photojournal PIA11799):**
> *"Before the Sol 1812 cleaning, only 25 percent of sunlight hitting the array was getting
> past the dust to be used by the photovoltaic cells. That factor improved to 28 percent after
> the cleaning event."*
> — <https://science.nasa.gov/photojournal/spirit-solar-panel-on-sol-1813-still-very-dusty/>

### Cómo lo implementamos en el juego

Modelamos **transmitancia**, no "recuperación mágica":

```
generación_solar = 30 kWh × (1 − polvo × 0,85) × factor_tormenta
```

- El polvo sube ≈ **0,2 % por sol** en calma (estimaciones publicadas para MER: 0,1–0,3 %/sol).
- Limpiar a mano devuelve **25 puntos porcentuales** de transmitancia y cuesta **2 kWh**.
- Un remolino de polvo (real) puede limpiar solo.
- Una tormenta global puede llevar la generación a **×0,15**.

Así el jugador **siente** el dato real sin que le mientan con un porcentaje inventado.

---

## 2. Cifras reales usadas por el motor

| Dato | Valor | Fuente |
|---|---|---|
| Potencia eléctrica del MMRTG | **≈100 W continuos** | NASA, *Mars Rover Power* — <https://science.nasa.gov/resource/mars-rover-power/> |
| Producción del array solar del MER al inicio | **≈800–900 Wh/sol** | NASA/JPL vía PDS Geosciences Node |
| Producción tras 90 soles (polvo + estación) | **≈600 Wh/sol** | Diseño y operación del array solar MER (NTRS 20090026397) |
| Eficiencia de celdas MER | **≈26 %** (triple unión) | NTRS 20090026397 |
| Irradiancia solar en Marte | **≈590 W/m²** (≈43 % de la Tierra) | NASA Mars Facts |
| Dosis absorbida en superficie | **0,21 mGy/día** | MSL/RAD, Hassler et al. (2014) |
| Dosis equivalente en superficie | **0,64 ± 0,12 mSv/día** | MSL/RAD, Hassler et al. (2014) |
| Fin de Opportunity | **10 de junio de 2018**, tormenta global de polvo | NASA, *Mars Exploration Rovers* |
| Récord de distancia (dato curioso) | Perseverance superó a Opportunity el **11 de octubre de 2026** | NASA, *Mars Exploration Rovers* |

### Nota sobre la dosis

0,64 mSv/día × 900 soles ≈ **576 mSv**, es decir **≈96 % del límite de carrera de 600 mSv**.
Ese es el dato que hace que la mecánica funcione: en una misión larga **no hay margen para
errores**. En el juego, la barra de dosis avanza despacio (es honesto) y el **informe final
proyecta a 900 soles**, que es donde el número se vuelve dramático y comprensible.

---

## 3. Lo que NO vamos a decir

- ❌ "Los paneles se recargan un 25 %" → **eliminado del brief**.
- ❌ "El marciano daña el sistema de oxígeno" → **eliminado**: ahora es un easter egg de ficción
  que solo ensucia los paneles y se espanta. La radiación y el O₂ solo cambian por causas reales.
- ❌ "Área de desintoxicación de radiación" → **eliminado**: no existe. Se reemplaza por
  *módulo de recuperación* con contramedidas respaldadas por estudios OSDR.
- ❌ "Datos en tiempo real" para OSDR, RadLab o el clima de Marte → **son históricos** y así se etiquetan.

---

## 4. Etiquetas de procedencia (copiar tal cual en la UI)

```
🟢 REAL EN VIVO     → DONKI (últimos 7 días)
🔵 ARCHIVO REAL     → OSDR, RadLab, Mars Trek, Mars Rover Photos
🟠 HISTÓRICO REAL   → InSight (2018–2020)
⚪ REFERENCIA       → páginas de ciencia NASA (potencia, dosis, retardo)
🔴 SIMULADO         → cuerpo del astronauta y estado de la base
```
