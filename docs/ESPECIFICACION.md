# AURORA — Puesto Avanzado en Marte

> **DOCUMENTO ANTERIOR, NO VIGENTE.** El rediseño vigente está en `REDISENO.md`.
> Las cifras de energía, blindaje, dosis y riesgos de abajo eran parámetros del prototipo,
> no mediciones verificadas de una base marciana. No deben presentarse como datos NASA.
### Documento maestro del proyecto (versión ajustada)

> **Estado:** especificación v0.2 — lista para construir.
> Este documento reemplaza la sección "Proyecto / Funciones / Restricciones" del brief original
> y añade lo que faltaba: economía de recursos con cifras reales, distinción entre datos
> **en vivo** e **históricos**, y el alcance exacto del prototipo.

---

## 1. Pitch en una frase

**AURORA** es un simulador web donde un niño de 7 a 12 años dirige un puesto avanzado en Marte
y descubre, jugando, que **la energía es finita y que el clima real del espacio decide si tu plan funciona**.

Cada sol (día marciano) reparte la misma energía entre cuatro cosas que compiten:
**sobrevivir, protegerse, comunicarse y hacer ciencia**. No hay opción gratis.

---

## 2. Los dos públicos

| Público | Qué se lleva |
|---|---|
| **Niños 7–12** | Un juego claro, con 3 medidores grandes, decisiones de 30 segundos y consecuencias visibles al final del sol. |
| **Astronautas / planificadores** | Un modelo de disyuntivas con cifras trazables a fuentes NASA, útil para explicar por qué una decisión "segura" consume el margen de la siguiente. |

**Regla de oro:** si una decisión no tiene costo, no entra al juego.

---

## 3. La frase de diseño (no negociable)

> **"Cada sol tienes energía limitada; el clima real de Marte decide si tu plan funciona."**

Todo lo demás —las tres salas, los minijuegos, el marciano— está al servicio de esa frase.

---

## 4. Bucle de juego (un sol ≈ 90 segundos)

```
┌─ BRIEFING ───────────────────────────────────────────────┐
│ Clima espacial real (DONKI) + estado de la base           │
└───────────────────────────┬───────────────────────────────┘
                            ▼
┌─ REPARTO DE ENERGÍA ─────────────────────────────────────┐
│ 4 deslizadores (kWh):                                     │
│   • Soporte vital   (obligatorio: 12 kWh)                 │
│   • Escudo          (0–15 kWh → 0–100 %)                  │
│   • Comunicaciones  (3 kWh → pronóstico del próximo sol)  │
│   • Ciencia         (5 kWh → 1 punto + estudio real OSDR) │
└───────────────────────────┬───────────────────────────────┘
                            ▼
┌─ ACCIONES ───────────────────────────────────────────────┐
│ Limpiar paneles · Reparar · Expedición del rover ·        │
│ Cosechar · Descansar la tripulación                       │
└───────────────────────────┬───────────────────────────────┘
                            ▼
┌─ RESOLUCIÓN DEL SOL ─────────────────────────────────────┐
│ Generación solar real (polvo + tormenta) → consumo →      │
│ dosis de radiación → eventos → O₂, comida, batería        │
└───────────────────────────┬───────────────────────────────┘
                            ▼
                    Bitácora científica
              (estudios reales desbloqueados)
```

**Condición de derrota:** O₂ a 0 o batería a 0 con sistemas críticos apagados.
**Condición de victoria:** completar los soles de la misión con la tripulación viva y al menos
un estudio científico desbloqueado.

---

## 5. Economía de recursos (cifras con fuente)

Todas las cifras de esta tabla son **reales y citables**. Ver `DATOS-VERIFICADOS.md`.

| Parámetro | Valor en el juego | Base real |
|---|---|---|
| Planta solar | **30 kWh/sol** nominal (24 m²) | Irradiancia marciana ≈ 590 W/m² (43 % de la Tierra); celdas tipo MER de triple unión |
| Batería | **60 kWh** | Almacenamiento de un sol completo |
| Generador RTG | **2,4 kWh/sol** constante (100 W) | MMRTG de Curiosity: ~100 W eléctricos continuos |
| Demanda de soporte vital | **12 kWh/sol** | Orden de magnitud de un hábitat presurizado pequeño |
| Escudo de radiación | **15 kWh/sol → 100 %** | Costo energético de un blindaje activo/pasivo |
| Comunicaciones | **3 kWh/sol** | Da el pronóstico del sol siguiente |
| Ciencia | **5 kWh/sol → 1 punto** | Desbloquea un estudio real de OSDR |
| Invernadero | **4 kWh/sol → +1 día de comida** | Producción de alimentos en hábitat |
| Dosis base en superficie | **0,64 mSv/sol** | MSL/RAD (Hassler et al., 2014): 0,21 mGy/día → 0,64 ± 0,12 mSv/día |
| Límite de carrera | **600 mSv** | Estándar de exposición de la tripulación NASA |
| Proyección didáctica | **900 soles** | Duración de referencia de una estancia en superficie |

**La tensión está calculada:** la demanda nominal (12 + 15 + 3 + 5 + 4 = **39 kWh**) supera
la generación limpia (**30 kWh**). Con el escudo al 100 % **no alcanza**: hay que elegir.
Eso es exactamente lo que el jurado quiere ver.

---

## 6. Las tres salas (especificación cerrada)

### Sala 1 — Control de la base

Monitor central con seis paneles:

1. **Signos vitales** (modelo, no dato): frecuencia cardiaca, O₂ en sangre, temperatura.
2. **Oxígeno** del hábitat (%).
3. **Radiación**: dosis acumulada en mSv + tasa del sol actual.
4. **Energía**: batería, generación solar, consumo por sistema.
5. **Clima espacial**: chip con el evento real de DONKI (CME, flare, tormenta geomagnética).
6. **Reloj**: sol, hora local marciana y retardo de comunicación real (4–24 min).

Extras: **dos ventanas** con imagen real de Marte (Mars Trek / NASA Image Library),
**cámara exterior** y el **deslizador de escudo** (kWh → % de protección).

### Sala 2 — Exterior

- **Tres paneles solares** con acumulación de polvo visible. Limpiarlos cuesta **2 kWh**.
- **Tormenta de polvo**: la generación cae hasta un 85 %. Es el evento que mató a Opportunity
  en 2018 y el jugador lo vive.
- **Remolino de polvo** (evento real y positivo): puede limpiar los paneles solo. Ocurre de verdad.
- **Rover de expedición**: cuesta 8 kWh, da ciencia y **sube la dosis** según el clima del sol.
- **Mapa real de Marte** con tiles de Mars Trek (imagen de superficie auténtica).

### Sala 3 — Módulo de vitales

- **Dosímetro**: dosis acumulada vs. límite de carrera, con proyección a 900 soles.
- **Blindaje**: estado del escudo y su costo energético del sol.
- **Cartas de ciencia (OSDR)**: cada estudio real desbloqueado explica un efecto real del
  vuelo espacial (hueso, músculo, sueño, sistema inmune) y habilita una contramedida.
- **Contramedidas**: ejercicio, sueño, nutrición, antioxidantes. **No existe "desintoxicación"
  de radiación**: se renombra a *recuperación*, y cada carta cita su estudio.

---

## 7. Eventos

### 7.1 Eventos reales (datos NASA)

| Evento | Disparador | Efecto en el juego |
|---|---|---|
| **CME / tormenta solar** | DONKI: CME con velocidad alta o GST/SEP | La dosis del sol se multiplica ×4–×12 |
| **Tormenta de polvo** | Escenario histórico | Generación solar ×0,15 durante varios soles |
| **Remolino de polvo** | Aleatorio (real) | Limpia polvo de los paneles (¡ayuda!) |
| **Fallo de panel** | Aleatorio tras tormenta | Capacidad solar −20 % hasta reparar |
| **Fuga de O₂** | Aleatorio | Demanda de soporte vital +3 kWh hasta reparar |

### 7.2 El marciano (easter egg, no ciencia)

Se conserva el personaje cómico que pidió el equipo, **pero etiquetado como ficción**:

- Aparece ~1 de cada 10 soles.
- **Tira tierra a la ventana** → +8 % de polvo en los paneles.
- Hay que **salir a espantarlo** (clic repetido / miniacción de 3 s) y se va corriendo.
- No afecta la radiación ni el oxígeno: **no simula ciencia**, solo humor.
- En pantalla lleva la etiqueta `FICCIÓN · EASTER EGG` para que el jurado no lo confunda
  con un dato de la NASA.

---

## 8. Datos: en vivo vs. históricos (obligatorio en la UI)

Cada dato que aparece en pantalla lleva una etiqueta visible. **Nunca se presenta un dato
histórico como si fuera en vivo.**

| Dato en pantalla | Fuente | Tipo | Etiqueta exacta |
|---|---|---|---|
| Clima espacial, CME, flares, tormentas geomagnéticas | **DONKI** | 🟢 **REAL EN VIVO** (últimos 7 días) | `Datos reales en vivo · NASA DONKI` |
| Terreno y mosaico de Marte | **Mars Trek** | 🔵 Archivo real (misiones pasadas) | `Imagen real de Marte · Mars Trek (archivo)` |
| Fotos de superficie | **Mars Rover Photos / NASA Image Library** | 🔵 Archivo real | `Foto real · NASA (archivo)` |
| Temperatura, viento y presión de Marte | **InSight** | 🟠 **HISTÓRICO REAL** (2018–2020) | `Clima real histórico · InSight 2018–2020` |
| Estudios de salud y biología | **OSDR** | 🔵 Archivo real | `Estudio real · OSDR {accession}` |
| Dosis de radiación medida | **RadLab** | 🔵 Archivo real (ISS) | `Dosis medida real · RadLab` |
| Potencia de paneles, límite de dosis, retardo de luz | **Páginas de ciencia NASA** | ⚪ Referencia real | `Dato de referencia · NASA` |
| Cuerpo del astronauta (pulso, SpO₂) | **Modelo del juego** | 🔴 **SIMULADO** | `Modelo del juego · no es dato NASA` |

> **Regla de honestidad:** el ambiente es real; el cuerpo humano es un modelo. Decirlo en
> pantalla es lo que separa un proyecto creíble de uno que el jurado descarta.

---

## 9. Rejugabilidad

Dos escenarios, ambos construidos con **ventanas de fechas reales**:

| Escenario | Ventana | Dificultad |
|---|---|---|
| **Calma en Jezero** | Ventana sin eventos solares relevantes | Aprender el sistema |
| **La tormenta** | Ventana histórica con actividad solar alta | Supervivencia |

El motor es el mismo. Cambia el clima real. Eso es rejugabilidad **sin inventar datos**.

---

## 10. Accesibilidad

- Botones de mínimo 48 px, contraste AA, sin dependencia de color (cada medidor tiene icono + número).
- Narración opcional con Web Speech API (lectura de textos).
- Textos en español simple; los términos técnicos se explican **en contexto**, no en un glosario.
- Sin cuenta, sin descarga, sin instalar nada: se abre en el navegador.
- Responsive; se recomienda horizontal en móvil.

---

## 11. Cumplimiento

- **Cero elementos de marca NASA**: sin logos, sin banderas, sin parches, sin tipografía institucional.
  Identidad propia (AURORA) y paleta propia.
- **Contenido generado por IA**: se declara en `/creditos` con marca de agua visible cuando aplique.
  Decisión del equipo: **usar imagen real de NASA + ilustración SVG propia** para minimizar riesgo.
- **Datos**: cada pantalla con datos tiene enlace a la fuente original verificable.

---

## 12. Alcance del prototipo

**Entra (MVP):**
- 3 salas navegables.
- Motor de simulación con 4 asignaciones de energía y 3 medidores núcleo.
- 2 escenarios reales.
- Limpieza de paneles + expedición del rover.
- 6 estudios OSDR reales como cartas.
- Panel de fuentes con enlaces y tipo de dato.
- Informe final de misión con proyección de dosis.

**No entra (fase 2):**
- Realidad virtual (mencionada en el brief como fase posterior).
- Multijugador, cuentas, ranking.
- Modelos 3D del hábitat.
- Audio doblado profesional.

---

## 13. Guion de demo (3 minutos para el jurado)

1. Abrir el juego, elegir **"La tormenta"**.
2. Mostrar el chip: `Datos reales en vivo · NASA DONKI` con un CME real y su velocidad.
3. Repartir energía con el escudo al 100 % → el sistema avisa que **no alcanza**.
4. Bajar el escudo, subir ciencia → desbloquear una carta OSDR real.
5. Llega el CME → la dosis se dispara. Mostrar el dosímetro.
6. Abrir el informe: **"si esta misión durara 900 soles, la tripulación acumularía X mSv"**.
7. Cerrar con la frase: *cada decisión tiene precio, y el precio se acumula*.

---

## 14. Stack

- **Next.js 15 + TypeScript + Tailwind CSS 4** (100 % web, deploy en Vercel).
- **Zustand** para estado; **motor de simulación puro** en `src/lib/sim` con tests.
- **Framer Motion** para transiciones; **Canvas** para el minijuego de polvo.
- **Route handlers** como proxy de datos (CORS + API key + caché + snapshots de respaldo).
- **localStorage** para guardar la partida. Sin base de datos.
