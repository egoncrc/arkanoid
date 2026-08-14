# SPEC 01 — MVP jugable de Arkanoid

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-08-14
> **Objective:** Construir un MVP jugable de Arkanoid en el navegador — un nivel fijo con paleta, bola con física de rebote y bloques destructibles — reutilizando los assets existentes, sin persistencia ni power-ups.

---

## Scope

**In:**

- Página HTML única (`index.html`) con un `<canvas>` de 800x600px donde se renderiza todo el juego.
- Paleta controlable con teclado (flechas ←/→) y con mouse (sigue la posición horizontal del cursor sobre el canvas).
- Bola que arranca pegada a la paleta y se lanza al presionar espacio o hacer clic.
- Física de rebote: paredes y techo reflejan la bola en espejo; la paleta desvía el ángulo de salida según el punto de impacto (golpear cerca del borde desvía más, el centro devuelve casi vertical).
- Un único nivel fijo: grid de bloques de 10 columnas x 6 filas, cada fila de un color distinto (`red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`), usando el sprite `block_<color>` de `assets/spritesheet.js`.
- Sistema de puntuación: cada bloque roto suma 10 puntos, sin importar el color. El puntaje se muestra en pantalla durante la partida.
- Sistema de vidas: el jugador empieza con 3 vidas. Si la bola cae por debajo de la paleta, se pierde una vida y la bola se reposiciona pegada a la paleta a la espera de un nuevo lanzamiento.
- Pantalla de inicio ("presiona para empezar") antes de la primera partida.
- Pantalla de "¡Ganaste!" al romper los 10x6 = 60 bloques del nivel; termina el juego.
- Pantalla de "Game Over" al perder las 3 vidas, con opción de reiniciar la partida completa (vidas, puntaje y bloques) sin recargar la página.
- Efectos de sonido: `assets/sounds/ball-bounce.mp3` en cada rebote contra paredes, techo o paleta; `assets/sounds/break-sound.mp3` al destruir un bloque.
- Bloque destruido desaparece del estado y del render de forma instantánea (sin usar `EXPLOSION_FRAMES`).

**Out of scope (for future specs):**

- Power-ups (bolas extra, paleta más ancha, multi-bola, etc.).
- Múltiples niveles o progresión entre niveles.
- Persistencia de puntaje más alto (localStorage o cualquier otro storage).
- Sistema de combos o puntuación variable por color de bloque.
- Pausa durante la partida (tecla Esc).
- Animaciones de explosión (`EXPLOSION_FRAMES`) al romper bloques.
- Versión móvil / controles táctiles.
- Multijugador.

---

## Data model

```js
// Estado global del juego, en memoria (sin persistencia)
const state = {
  screen: 'start',      // 'start' | 'playing' | 'gameover' | 'win'
  score: 0,
  lives: 3,
  paddle: {
    x: 320,             // esquina superior izquierda, origen top-left
    y: 560,
    width: 162,          // dimensión nativa del sprite paddle
    height: 14,
    speed: 8,            // px/frame al mover con teclado
  },
  ball: {
    x: 393,
    y: 546,
    width: 16,            // dimensión nativa del sprite ball
    height: 16,
    dx: 0,
    dy: 0,
    speed: 5,             // magnitud de velocidad en px/frame mientras está en juego
    attached: true,       // true = pegada a la paleta, esperando lanzamiento
  },
  blocks: [
    // { x, y, width: 32, height: 16, color: 'red', alive: true }
  ],
};
```

Convenciones:

- Coordenadas: origen top-left del canvas (800x600).
- Velocidades en píxeles/frame, actualizadas en el loop de `requestAnimationFrame`.
- Grid de bloques: 10 columnas x 6 filas, bloque escalado a 76x28px en el destino del canvas (sprite nativo 32x16), con 4px de separación entre bloques y margen superior de 40px. Colores por fila, de arriba a abajo: `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`.
- `state.blocks` se genera una vez al iniciar/reiniciar la partida; romper un bloque marca `alive: false` y lo excluye del render y de las colisiones.

---

## Implementation plan

1. Crear `index.html` con el `<canvas id="game" width="800" height="600">`, un link a `styles.css`, y los `<script>` para `assets/spritesheet.js` y `game.js` (en ese orden). Test manual: abrir el archivo en el navegador y ver un canvas vacío sin errores en consola.
2. Crear `styles.css` con estilos básicos: fondo oscuro de página, canvas centrado con borde.
3. Crear `game.js`: definir el objeto `state`, llamar a `loadSpritesheet()` y, en su callback, dibujar la pantalla de inicio ("Presiona ESPACIO o clic para empezar") sobre el canvas. Test manual: recargar y ver la pantalla de inicio.
4. Implementar el loop principal (`requestAnimationFrame`) que limpia el canvas y dibuja según `state.screen`. En `'start'`, un listener de teclado (`Space`) y de click en el canvas cambia `state.screen` a `'playing'` e inicializa `state.blocks` con el grid de 10x6. Test manual: iniciar partida y ver el grid de bloques dibujado con `drawSprite`.
5. Dibujar y mover la paleta: listeners de `keydown`/`keyup` para flechas (mueve `paddle.x` según `paddle.speed`, con clamping a los bordes del canvas) y de `mousemove` sobre el canvas (centra la paleta en la posición X del cursor, con el mismo clamping). Test manual: mover la paleta con teclado y con mouse.
6. Dibujar la bola pegada a la paleta cuando `ball.attached` es `true`, siguiendo la posición X de la paleta. Al presionar espacio o hacer clic, fijar `ball.dx`/`ball.dy` iniciales (p. ej. ángulo de 45°) y poner `attached = false`. Test manual: lanzar la bola y verla moverse en línea recta.
7. Implementar colisión de la bola con paredes laterales y techo (rebote en espejo, invirtiendo `dx` o `dy`) y reproducir `ball-bounce.mp3` en cada rebote. Test manual: ver a la bola rebotar contra los bordes con sonido.
8. Implementar colisión de la bola con la paleta: calcular el punto de impacto relativo al centro de la paleta para variar el ángulo de salida (`dx` en función de la distancia al centro, `dy` siempre negativo tras el rebote), y reproducir `ball-bounce.mp3`. Test manual: golpear la bola en distintos puntos de la paleta y observar ángulos distintos.
9. Implementar colisión de la bola con bloques vivos: al impactar, marcar el bloque como `alive: false`, sumar 10 puntos a `state.score`, invertir `dy` (o `dx` según el lado golpeado) y reproducir `break-sound.mp3`. Mostrar el puntaje actualizado en el canvas. Test manual: romper bloques y ver el puntaje subir con sonido.
10. Implementar pérdida de vida: si `ball.y` supera la altura del canvas (cae debajo de la paleta), decrementar `state.lives`, resetear la bola a `attached: true` sobre la paleta. Si `state.lives` llega a 0, cambiar `state.screen` a `'gameover'` y dibujar la pantalla correspondiente con instrucción de reinicio. Test manual: dejar caer la bola 3 veces y ver la pantalla de Game Over.
11. Implementar reinicio desde `'gameover'`: un listener de teclado/clic en esa pantalla reinicia `state` completo (vidas, puntaje, bloques, bola) y vuelve a `'playing'`. Test manual: perder la partida, reiniciar, y jugar de nuevo desde cero.
12. Implementar condición de victoria: cuando no queden bloques con `alive: true`, cambiar `state.screen` a `'win'` y dibujar la pantalla "¡Ganaste!" con el puntaje final, deteniendo el movimiento de la bola. Test manual: romper los 60 bloques y ver la pantalla de victoria.

---

## Acceptance criteria

- [ ] Abrir `index.html` directamente en el navegador (sin servidor ni build) carga el juego sin errores en consola.
- [ ] La pantalla de inicio se muestra antes de la primera partida y arranca el juego al presionar espacio o hacer clic.
- [ ] La paleta se mueve con las flechas ← → y con el movimiento del mouse, sin salirse de los límites del canvas.
- [ ] La bola arranca pegada a la paleta y solo se mueve tras presionar espacio o hacer clic.
- [ ] La bola rebota en espejo contra paredes laterales y techo, reproduciendo `ball-bounce.mp3` en cada rebote.
- [ ] Golpear la bola en distintos puntos de la paleta produce ángulos de salida distintos.
- [ ] Romper un bloque lo elimina del canvas, suma exactamente 10 puntos al marcador visible, y reproduce `break-sound.mp3`.
- [ ] Perder la bola (cae debajo de la paleta) resta una vida y reposiciona la bola pegada a la paleta.
- [ ] Perder las 3 vidas muestra la pantalla de "Game Over" y permite reiniciar la partida completa sin recargar la página.
- [ ] Romper los 60 bloques del nivel muestra la pantalla de "¡Ganaste!" con el puntaje final.
- [ ] Recargar la página siempre vuelve a la pantalla de inicio con el estado por defecto (sin puntaje ni vidas persistidos).

---

## Decisions

- **Sí:** 3 vidas, estándar arcade. Da margen de error razonable sin ser trivial.
- **Sí:** un único nivel fijo (10x6 bloques). Simplifica el MVP; múltiples niveles se evalúan en un spec futuro.
- **No:** persistencia de high score. Fuera de alcance del MVP; se puede agregar después con localStorage versionado.
- **Sí:** controles de teclado y mouse simultáneos. Ambos son triviales de soportar con listeners independientes sobre el mismo `paddle.x`.
- **Sí:** 10 puntos fijos por bloque, sin variar por color. Evita tener que definir y balancear una tabla de valores en el MVP.
- **No:** animación de explosión (`EXPLOSION_FRAMES`) al romper bloques. El bloque desaparece al instante; la animación se puede agregar como mejora visual después.
- **Sí:** ángulo de rebote variable según punto de impacto en la paleta. Es el comportamiento reconocible de Arkanoid; un rebote tipo espejo se sentiría plano.
- **Sí:** un solo archivo `game.js` sin módulos ES. Coherente con `assets/spritesheet.js`, que ya se carga como script plano sin sistema de módulos.
- **Sí:** bola pegada a la paleta que se lanza con input explícito. Da al jugador control sobre el inicio de cada vida/partida.
- **No:** pantalla de pausa (Esc). Fuera de alcance; se puede agregar en un spec futuro de "controles avanzados".
- **Sí:** grid de bloques 10 columnas x 6 filas escalado a 76x28px por bloque. Llena razonablemente el ancho de 800px del canvas dejando margen para las paredes.

---

## Risks

| Risk                                                                 | Mitigation                                                                                                   |
| --------------------------------------------------------------------| ---------------------------------------------------------------------------------------------------------- |
| Los navegadores bloquean reproducción de audio sin gesto del usuario | El primer sonido solo se dispara tras el clic/tecla de lanzamiento de la bola, que ya cuenta como gesto del usuario. |
| Mover el mouse fuera del canvas puede dejar la paleta en una posición inconsistente | El listener de `mousemove` calcula la posición relativa al canvas y aplica el mismo clamping que el teclado. |

---

## What is **not** in this spec

- Power-ups (bolas extra, paleta más ancha, multi-bola, etc.).
- Múltiples niveles o progresión entre niveles.
- Persistencia de puntaje más alto.
- Combos o puntuación variable por color de bloque.
- Pausa durante la partida.
- Animaciones de explosión al romper bloques.
- Versión móvil / controles táctiles.
- Multijugador.

Cada uno de estos, si se implementa, va en su propio spec.
