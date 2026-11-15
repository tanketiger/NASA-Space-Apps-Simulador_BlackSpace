# Aurora Outpost: demo de turno en tiempo real

## Objetivo

Juego web para niños de 7 a 12 años: desde una cabina en primera persona, vigilar cuatro cámaras y llegar a las 06:00 AM sin agotar batería ni oxígeno. Un turno dura 60 segundos reales (10 segundos = 1 hora del turno). Se puede pausar y repetir, y hay tres soles con dificultad creciente.

## Demo implementada

- **Reloj del turno:** de 12:00 AM a 06:00 AM, un tick de motor por segundo real. Se gana al llegar a las 06:00 AM.
- **Cámara 01 · Horizonte:** se ve la tormenta de polvo acercarse (fases lejos → acercándose → ventana).
- **Cámara 02 · Paneles:** muestra el avance de la tormenta.
- **Cámara 03 · Órbita:** nivel de la llamarada solar (0 a 3) y el registro histórico real de NASA DONKI del sol en curso.
- **Cámara 04 · Invernadero:** oxígeno; manteniendo presionado el botón se bombea para recargarlo.
- **Compuertas:** la izquierda bloquea la tormenta de polvo; la derecha bloquea la llamarada solar durante el destello.
- **Luces:** mantén presionada una luz para ver qué hay detrás de la ventana correspondiente.
- **Batería:** cada sistema activo (compuerta, luz, monitor) consume energía; si llega a 0 hay apagón y se pierde.
- **Escritorio:** panel CRT con batería, uso y oxígeno, un ventilador decorativo y un mini-rover de juguete que rebota al tocarlo.
- **Sonidos:** sintetizados con Web Audio API y opción para silenciarlos.
- **Pantallas:** inicio con explicación, pausa, ayuda, victoria con confeti y derrota con un consejo según la causa.

## Qué es real y qué no

El único dato real que se muestra es el registro histórico de NASA DONKI de cada sol (CAM 03): son eyecciones de masa coronal realmente observadas (`2024-05-08T05:36:00-CME-001`, `2023-02-24T02:00:00-CME-001` y `2022-03-28T00:36:00-CME-001`). No son un aviso vigente ni demuestran que hayan alcanzado Marte; en el juego se usan solo como referencia.

Todo el estado de la base, el consumo, los daños, las fases y los tiempos son reglas **ficticias**, no datos medidos ni un modelo validado. El turno no predice el clima ni la dosis de un astronauta. Las cámaras son ilustraciones SVG y composiciones CSS, no transmisiones reales. Las compuertas, las luces y el bombeo son mecanismos narrativos; su costo y eficacia no son valores de NASA. Los parámetros de dificultad de cada sol están en `src/data/mars_sols.json` y son decisiones de diseño.

El 25 % de Spirit se refiere a la luz que atravesaba el polvo, no a una recuperación universal de energía. Véase la fuente PIA11799 enlazada en créditos.

## Funcionamiento sin red

El juego no solicita claves ni consulta servicios remotos: todo está precargado en el propio código y en `src/data/mars_sols.json`. Ejecutado localmente, la partida no necesita internet. Para abrir por primera vez una versión alojada en internet se requiere conexión; no se ha configurado un service worker para uso fuera de línea tras visitar un sitio remoto. Los enlaces a las fuentes sí requieren conexión.

## Pendiente

Selección y verificación de datos adicionales de RadLab, OSDR y clima marciano; más soles; pruebas con jugadores y adaptación educativa. Ninguna de estas funciones se presenta como implementada.
