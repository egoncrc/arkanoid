# SPEC 02 — Animación de explosión al destruir bloques

> **Status:** Borrador
> **Depends on:** SPEC 01
> **Date:** 2026-08-14
> **Objective:** Reproducir la animación de 4 frames de `EXPLOSION_FRAMES` sobre el hueco de un bloque roto durante 150ms, sin cambiar la lógica de colisión instantánea ya implementada en SPEC 01.

---

## Scope

**In:**

- Al romper un bloque (colisión bola-bloque en `handleBlocksCollision`), registrar una animación activa en un nuevo array `state.explosions` con `{ x, y, width, height, color, startTime }`.
- El bloque roto sigue desapareciendo de las colisiones y del render de forma instantánea, exactamente como hoy (`block.alive = false` en el mismo frame del impacto). Este comportamiento no se toca.
- Mientras una explosión está activa, se dibuja sobre la posición que ocupaba el bloque usando `drawFrame()` con los frames de `EXPLOSION_FRAMES[color]`, escalados a `BLOCK_WIDTH x BLOCK_HEIGHT` (76x28), en el mismo `x`/`y` del bloque original.
- La animación completa (4 frames) dura `EXPLOSION_DURATION` = 150ms en total (~37.5ms por frame), calculado con `performance.now()` desde el `startTime` de cada explosión.
- Al superar los 150ms, la explosión se elimina de `state.explosions` y deja de dibujarse, sin dejar rastro visual.
- Pueden reproducirse varias animaciones de explosión simultáneamente si sus ventanas de tiempo se solapan (bloques rotos en frames consecutivos).
- `checkWinCondition()` solo cambia `state.screen` a `'win'` cuando no quedan bloques vivos **y** `state.explosions` está vacío.
- `break-sound.mp3` se sigue reproduciendo en el instante del impacto, sin cambios respecto al comportamiento actual.
- `state.explosions` se reinicia a `[]` junto con `state.blocks` al empezar o reiniciar una partida.

**Out of scope (for future specs):**

- Animación al perder una vida (bola cae) o en cualquier otro evento que no sea romper un bloque.
- Efectos o partículas nuevos fuera de `EXPLOSION_FRAMES`, ya definido en `assets/spritesheet.js`.
- Cambiar el sonido de destrucción de bloques.
- Pausar o ralentizar el juego mientras una explosión se reproduce; la bola y la paleta se siguen moviendo con normalidad.
- Modificar `EXPLOSION_FRAMES` o `EXPLOSION_DURATION` en `assets/spritesheet.js`.

---

## Data model

```js
// Se agrega a `state` (definido en SPEC 01), sin reemplazar estructuras existentes
state.explosions = [
  // { x, y, width: 76, height: 28, color: 'red', startTime: 1234.5 }
];
```

Convenciones:

- `startTime` se guarda con `performance.now()` en el momento en que el bloque se marca `alive: false` dentro de `handleBlocksCollision`.
- `width`/`height` siempre son `BLOCK_WIDTH`/`BLOCK_HEIGHT` (76x28), igual que el bloque que reemplazan.
- El frame a dibujar en cada render se calcula como `Math.min(3, Math.floor((performance.now() - startTime) / (EXPLOSION_DURATION / 4)))`.
- Una explosión se retira de `state.explosions` cuando `performance.now() - startTime >= EXPLOSION_DURATION`.

---

## Implementation plan

1. Agregar `state.explosions = []` al objeto `state` inicial en `game.js`, y reinicializarlo junto con `state.blocks` en la función que resetea la partida al reiniciar desde Game Over. Test manual: recargar/reiniciar y confirmar que el juego sigue funcionando igual que antes, sin cambios visibles.
2. En `handleBlocksCollision`, justo después de `block.alive = false` y `playBreakSound()`, hacer `push` a `state.explosions` de `{ x: block.x, y: block.y, width: block.width, height: block.height, color: block.color, startTime: performance.now() }`. Test manual: romper un bloque y verificar (breakpoint o `console.log` temporal) que el objeto se agrega a `state.explosions`.
3. Crear `updateExplosions()`, que filtra de `state.explosions` las entradas cuyo tiempo transcurrido ya superó `EXPLOSION_DURATION`, y llamarla desde `update()` cuando `state.screen === 'playing'`. Test manual: romper un bloque y confirmar que `state.explosions` vuelve a quedar vacío pasados ~150ms.
4. Crear `drawExplosions()`, que recorre `state.explosions`, calcula el frame según el tiempo transcurrido y lo dibuja con `drawFrame(ctx, EXPLOSION_FRAMES[color][frameIndex], x, y, width, height)`; llamarla desde `draw()` en la rama `'playing'`, después de `drawBlocks()` y antes de `drawPaddle()`. Test manual: romper un bloque y ver la animación de 4 frames reproducirse sobre el hueco antes de desaparecer.
5. Modificar `checkWinCondition()` para que el cambio a `state.screen = 'win'` solo ocurra cuando no quedan bloques vivos **y** `state.explosions.length === 0`; llamarla también desde `updateExplosions()` (no solo desde `handleBlocksCollision`) para detectar el momento exacto en que la última explosión termina sin un nuevo impacto que la dispare. Test manual: romper los 60 bloques y confirmar que "¡Ganaste!" aparece justo después de que termina de reproducirse la última animación, no antes.

---

## Acceptance criteria

- [ ] Romper un bloque reproduce la animación de 4 frames de `EXPLOSION_FRAMES[color]` en la posición exacta del bloque, escalada a 76x28px.
- [ ] La animación completa dura ~150ms (4 frames de ~37.5ms cada uno) y luego desaparece sin dejar rastro visual.
- [ ] El bloque deja de participar en colisiones desde el instante del impacto, igual que antes, aunque la animación siga visible unos milisegundos más.
- [ ] Romper varios bloques en frames consecutivos muestra sus animaciones de explosión superpuestas en el tiempo sin errores en consola.
- [ ] `break-sound.mp3` se sigue reproduciendo en el instante del impacto, sin cambios respecto al comportamiento actual.
- [ ] La bola y la paleta se siguen moviendo con normalidad mientras una explosión se reproduce.
- [ ] Al romper los 60 bloques del nivel, la pantalla "¡Ganaste!" aparece solo después de que termina de reproducirse la animación de explosión del último bloque roto.
- [ ] Reiniciar la partida desde Game Over deja `state.explosions` vacío, sin animaciones residuales de la partida anterior.

---

## Decisions

- **Sí:** array separado `state.explosions` en vez de flags por bloque. Desacopla la animación de la lógica de colisión ya implementada en SPEC 01; no hay que tocar el modelo de bloques existente.
- **Sí:** la colisión y remoción del bloque siguen siendo instantáneas; la animación es puramente visual encima del hueco. Cambio de menor riesgo, no reabre `handleBlocksCollision`.
- **Sí:** `EXPLOSION_DURATION` (150) se interpreta como duración total de las 4 frames (~37.5ms c/u), respetando el nombre literal de la constante en `assets/spritesheet.js`.
- **Sí:** la animación se escala a `BLOCK_WIDTH x BLOCK_HEIGHT` (76x28), igual que el bloque que reemplaza, para llenar el hueco exacto.
- **Sí:** la pantalla "¡Ganaste!" espera a que termine la última animación activa antes de aparecer. Da una sensación de cierre más pulida que cortar la animación a la mitad.
- **No:** pausar el juego durante una explosión. Rompería el ritmo de juego y no fue solicitado.
- **No:** modificar `EXPLOSION_FRAMES` o `EXPLOSION_DURATION` en `assets/spritesheet.js`. Son datos de assets ya definidos; se reutilizan tal cual, según CLAUDE.md.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| La última explosión no dispara la re-evaluación de la victoria si `checkWinCondition()` solo se llama desde `handleBlocksCollision` | `updateExplosions()` también llama a `checkWinCondition()` en cada frame mientras `state.explosions` no esté vacío, para detectar el instante exacto en que la última animación termina. |
| Acumulación de explosiones vencidas en el array si algo falla en la limpieza | El `filter` de `updateExplosions()` se ejecuta en cada frame de `'playing'` y elimina cualquier explosión que ya superó `EXPLOSION_DURATION`. |

---

## What is **not** in this spec

- Animación al perder una vida o en cualquier evento distinto de romper un bloque.
- Efectos o partículas nuevos fuera de `EXPLOSION_FRAMES`.
- Cambios al sonido de destrucción de bloques.
- Pausa o ralentización del juego durante una explosión.
- Modificaciones a `EXPLOSION_FRAMES` o `EXPLOSION_DURATION` en `assets/spritesheet.js`.

Cada uno de estos, si se implementa, va en su propio spec.
