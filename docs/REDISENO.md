# Aurora: demo de turno en tiempo real

## Objetivo

Juego web para niños de 7 a 12 años: desde una cabina en primera persona, vigilar cuatro cámaras y llegar a las 06:00 sin agotar batería, oxígeno ni integridad. Un turno dura 60 segundos. Se puede pausar y repetir.

## Demo implementada

- Cámara 01: horizonte, tres fases de aproximación de polvo e impacto.
- Cámara 02: paneles, polvo y limpieza con costo de batería.
- Cámara 03: sensor solar y referencia histórica DONKI.
- Cámara 04: invernadero y oxígeno ficticio.
- Cubierta contra polvo y escudo ante el evento solar; cada uno consume batería mientras está activo. La cubierta bloquea la generación solar.
- Visitante marciano cómico: personaje ficticio, se puede espantar; no modifica datos científicos.
- Sonidos sintetizados con Web Audio API y opción para silenciarlos.

## Qué es real y qué no

La imagen PIA24921 y el mosaico de Mars Trek son imágenes históricas. El registro DONKI `2024-05-08T05:36:00-CME-001` es una eyección real observada el 8 de mayo de 2024; no es un aviso vigente ni demuestra que haya alcanzado Marte. En el juego se usa solo como referencia mostrada en cámara 03.

Todo el estado de la base, consumo, daños, fases y tiempos son reglas **ficticias**, no datos medidos ni un modelo validado. El turno no predice el clima ni la dosis de un astronauta. Las cámaras son ilustraciones y composiciones, no transmisiones reales. El escudo es un mecanismo narrativo; su costo y eficacia no son valores NASA. El evento de polvo no reproduce un registro climático concreto.

El 25 % de Spirit se refiere a la luz que atravesaba el polvo, no a una recuperación universal de energía. Véase la fuente PIA11799 enlazada en créditos.

## Funcionamiento sin red

Las imágenes y el registro están en `public/images/` y `src/lib/data/solar-event.json`. La partida no solicita claves ni consulta servicios remotos. Para abrir la app desde un servidor remoto por primera vez se requiere conexión; ejecutada localmente, la partida no necesita internet. Los enlaces a las fuentes sí requieren conexión. No se ha configurado un service worker para uso fuera de línea tras visitar un sitio remoto.

## Pendiente

Selección y verificación de datos adicionales de RadLab, OSDR y clima marciano; más noches; pruebas con jugadores y adaptación educativa. Ninguna de estas funciones se presenta como implementada.
