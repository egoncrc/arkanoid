# SPEC 03 — Múltiples niveles

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-08-14
> **Objective:** Agregar 5 niveles con layouts de bloques y velocidad de bola de dificultad creciente, con transición automática entre niveles y vidas/puntaje acumulados durante toda la partida.

---

## Scope

**In:**

- 5 niveles fijos definidos en código, cada uno con su propio layout de bloques (grid con posibles huecos) y su propia velocidad de bola (`ball.speed`).
- Progresión de velocidad: `ball.speed = 5 + (nivel - 1) * 0.5` → Nivel 1: 5, Nivel 2: 5.5, Nivel 3: 6, Nivel 4: 6.5, Nivel 5: 7.
- Layouts (`X` = bloque, `.` = hueco), color por fila cíclico sobre `BLOCK_COLORS` (`red, yellow, cyan, magenta, hotpink, green`), reiniciando el ciclo en `red` en la fila 0 de cada nivel:
  - **Nivel 1** (10x6, 60 bloques): grid completo, igual al actual.
  - **Nivel 2** (10x7, 70 bloques): grid completo.
  - **Nivel 3** (10x7, 46 bloques): patrón diamante con huecos.
    ```
    ...XXXX...
    ..XXXXXX..
    .XXXXXXXX.
    XXXXXXXXXX
    .XXXXXXXX.
    ..XXXXXX..
    ...XXXX...
    ```
  - **Nivel 4** (10x8, 60 bloques): filas alternadas densas/dispersas.
    ```
    XXXXXXXXXX
    X.X.X.X.X.
    XXXXXXXXXX
    .X.X.X.X.X
    XXXXXXXXXX
    X.X.X.X.X.
    XXXXXXXXXX
    .X.X.X.X.X
    ```
  - **Nivel 5** (10x9, 90 bloques): grid completo, el más grande.
- Al romper todos los bloques de un nivel que no es el último (y terminar sus explosiones activas, según la regla de SPEC 02), se muestra una pantalla breve "¡Nivel X completado!" durante `LEVEL_TRANSITION_DURATION` = 2000ms y luego se carga automáticamente el siguiente nivel (nuevo layout, nueva `ball.speed`, bola reposicionada en la paleta), sin input del jugador.
- Vidas y puntaje se mantienen acumulados entre niveles; no se resetean al pasar de nivel.
- La pantalla "¡Ganaste!" (ya existente desde SPEC 01) solo aparece al completar el nivel 5 (el último), en vez de dispararse al vaciar cualquier nivel.
- HUD: se agrega "Nivel: X/5" junto al puntaje y las vidas en `drawScore()`.
- Reiniciar la partida completa (desde Game Over) vuelve siempre al nivel 1, con su layout y velocidad originales.

**Out of scope (for future specs):**

- Bloques resistentes / multi-golpe. Cambia el modelo de datos de bloques y la lógica de `handleBlocksCollision`; se evalúa en un spec futuro si se decide agregar.
- Más de 5 niveles o generación procedural de layouts.
- Persistencia de progreso (nivel más alto alcanzado, high scores) entre partidas o recargas de página. Sigue fuera de alcance como en SPEC 01.
- Selector de nivel (elegir con qué nivel empezar).
- Cualquier otro tipo de dificultad creciente (power-ups, IA de bloques, etc.) fuera de layout y velocidad de bola.

---

## Data model

```js
// Nueva constante, fuera de `state` — layouts y velocidad de bola por nivel
const LEVELS = [
  { rows: [ 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX' ], ballSpeed: 5 },
  { rows: [ 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX' ], ballSpeed: 5.5 },
  { rows: [ '...XXXX...', '..XXXXXX..', '.XXXXXXXX.', 'XXXXXXXXXX', '.XXXXXXXX.', '..XXXXXX..', '...XXXX...' ], ballSpeed: 6 },
  { rows: [ 'XXXXXXXXXX', 'X.X.X.X.X.', 'XXXXXXXXXX', '.X.X.X.X.X', 'XXXXXXXXXX', 'X.X.X.X.X.', 'XXXXXXXXXX', '.X.X.X.X.X' ], ballSpeed: 6.5 },
  { rows: [ 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX' ], ballSpeed: 7 },
];

const LEVEL_TRANSITION_DURATION = 2000; // ms

// Se agrega a `state` (definido en SPEC 01)
state.level = 1;                    // nivel actual, 1-indexado (1 a LEVELS.length)
state.levelTransitionStart = null;  // performance.now() al entrar a 'levelComplete', null si no aplica
```

Convenciones:

- `state.screen` gana un nuevo valor posible: `'levelComplete'` (además de `'start' | 'playing' | 'gameover' | 'win'`).
- Cada string de `rows` tiene exactamente `BLOCK_COLS` (10) caracteres; `'X'` genera un bloque vivo en esa columna, `'.'` no genera bloque.
- El color de cada fila se calcula como `BLOCK_COLORS[rowIndex % BLOCK_COLORS.length]`, donde `rowIndex` es el índice de fila dentro del nivel actual (siempre arranca en 0 y por lo tanto en `'red'`).
- `LEVELS` es 0-indexado (`LEVELS[0]` = nivel 1); `state.level` es 1-indexado para mostrarlo directamente en el HUD.

---

## Implementation plan

1. Agregar la constante `LEVELS` y `LEVEL_TRANSITION_DURATION` en `game.js`, sin usarlas todavía. Test manual: recargar la página y confirmar que el juego se comporta exactamente igual que antes (nada cambia visualmente).
2. Refactorizar `initBlocks()` para que reciba un `layout` (array de strings tipo `rows`) y genere `state.blocks` recorriendo cada fila y columna según el carácter (`'X'` vivo, `'.'` hueco), con color cíclico sobre `BLOCK_COLORS` por índice de fila. Agregar `state.level = 1` al estado inicial y actualizar `startGame()`/`restartGame()` para llamar `initBlocks(LEVELS[state.level - 1].rows)`. Test manual: iniciar una partida nueva y ver el nivel 1 (grid 10x6 idéntico al actual).
3. Aplicar `state.ball.speed = LEVELS[state.level - 1].ballSpeed` cada vez que se (re)inicia un nivel (en `startGame()`, `restartGame()` y en el paso 6), y agregar "Nivel: X/5" en `drawScore()`, junto a puntaje y vidas. Test manual: iniciar partida y ver "Nivel: 1/5" en el HUD.
4. Modificar `checkWinCondition()`: cuando no quedan bloques vivos y `state.explosions.length === 0`, si `state.level < LEVELS.length` cambiar `state.screen` a `'levelComplete'` y guardar `state.levelTransitionStart = performance.now()`; si `state.level === LEVELS.length`, mantener el comportamiento actual (`state.screen = 'win'`). Test manual: romper todos los bloques del nivel 1 y confirmar (con `console.log` temporal o breakpoint) que `state.screen` pasa a `'levelComplete'`.
5. Crear `drawLevelCompleteScreen()` (texto "¡Nivel X completado!" centrado, mismo estilo que `drawWinScreen`/`drawGameOverScreen`) y dibujarla desde `draw()` en la rama `'levelComplete'`. Test manual: romper el nivel 1 y ver el mensaje en pantalla en vez de un canvas vacío.
6. Crear `updateLevelTransition()`: si `state.screen === 'levelComplete'` y `performance.now() - state.levelTransitionStart >= LEVEL_TRANSITION_DURATION`, incrementar `state.level`, regenerar `state.blocks` con `initBlocks(LEVELS[state.level - 1].rows)`, aplicar la nueva `ball.speed`, llamar `resetBall()`, limpiar `state.levelTransitionStart = null` y volver `state.screen` a `'playing'`. Llamarla desde `update()`. Test manual: esperar ~2s tras completar el nivel 1 y confirmar que arranca el nivel 2 con la bola pegada a la paleta y "Nivel: 2/5" en el HUD.
7. Actualizar `restartGame()` para resetear `state.level = 1`, regenerar bloques y velocidad del nivel 1, y limpiar `state.levelTransitionStart`. Test manual: perder las 3 vidas en cualquier nivel, reiniciar desde Game Over, y confirmar que vuelve al nivel 1 con su layout y velocidad originales.
8. Verificar el recorrido completo de los 5 niveles: romper el nivel 5 (último) debe mostrar directamente "¡Ganaste!" sin pasar por la pantalla de "Nivel completado". Test manual: jugar los 5 niveles de corrido (o forzar `state.level = 5` temporalmente en consola para acelerar la prueba) y confirmar que la pantalla final es "¡Ganaste!" con el puntaje acumulado de los 5 niveles.

---

## Acceptance criteria

- [ ] Al iniciar una partida nueva, el HUD muestra "Nivel: 1/5" junto al puntaje y las vidas.
- [ ] El nivel 1 usa el grid 10x6 completo (60 bloques) y `ball.speed = 5`, igual que el comportamiento actual.
- [ ] Al romper todos los bloques del nivel 1 (y terminar sus animaciones de explosión), aparece la pantalla "¡Nivel 1 completado!" durante ~2 segundos.
- [ ] Tras esos ~2 segundos, arranca automáticamente el nivel 2 con su propio layout (10x7 completo, 70 bloques), `ball.speed = 5.5`, la bola pegada a la paleta, y el HUD actualizado a "Nivel: 2/5".
- [ ] El puntaje y las vidas del nivel 1 se mantienen al pasar al nivel 2 (no se resetean).
- [ ] Los niveles 3, 4 y 5 cargan sus layouts (diamante, filas alternadas, grid grande) y velocidades (6, 6.5, 7) correctamente en su turno.
- [ ] Al romper todos los bloques del nivel 5 (el último), la pantalla que aparece es "¡Ganaste!" con el puntaje final acumulado, no "Nivel completado".
- [ ] Perder las 3 vidas en cualquier nivel muestra "Game Over"; reiniciar desde ahí vuelve siempre al nivel 1, con su layout y velocidad originales, puntaje en 0 y 3 vidas.
- [ ] Abrir `index.html` directamente en el navegador sigue funcionando sin errores en consola ni build adicional.

---

## Decisions

- **Sí:** 5 niveles fijos definidos en código (`LEVELS`), sin generación procedural. Mantiene la simplicidad "zero dependencies" del proyecto y es suficiente para la dificultad pedida.
- **Sí:** dificultad creciente = layout + velocidad de bola. No se agregan bloques resistentes ni otros mecanismos nuevos; reutiliza el 100% de la lógica de colisión ya implementada en SPEC 01/02.
- **No:** bloques resistentes (multi-golpe). Requeriría cambiar el modelo de datos de bloques y `handleBlocksCollision`; se evalúa en un spec futuro si se decide agregar.
- **Sí:** incremento de velocidad fijo aditivo (+0.5 px/frame por nivel). Progresión simple y predecible, sin necesidad de justificar una curva exponencial.
- **Sí:** transición entre niveles con temporizador fijo (2000ms) en vez de esperar input del jugador. Es una pantalla informativa, no una decisión del jugador; evita interrumpir el ritmo de juego con una tecla extra entre cada nivel.
- **Sí:** vidas y puntaje se mantienen acumulados entre niveles; solo se resetean al perder todas las vidas (Game Over) o reiniciar la partida completa. Es el comportamiento estándar de Arkanoid.
- **Sí:** colores de bloques cíclicos sobre los 6 colores existentes en `BLOCK_COLORS`, reiniciando el ciclo en cada nivel. No requiere definir colores nuevos ni tocar `assets/spritesheet.js`.
- **No:** persistencia de nivel alcanzado o high scores entre partidas/recargas. Fuera de alcance, igual que en SPEC 01; reiniciar siempre vuelve al nivel 1.
- **No:** selector de nivel. No fue solicitado; los niveles siempre se juegan en secuencia desde el 1.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| La transición de nivel podría dispararse mientras aún hay explosiones activas del último bloque roto | `checkWinCondition()` solo cambia de pantalla cuando `state.explosions.length === 0`, igual que ya garantiza SPEC 02 para la pantalla "¡Ganaste!". |
| Layouts con filas más largas (niveles 4 y 5, hasta 9 filas) podrían acercarse demasiado a la paleta | Con `BLOCK_TOP_MARGIN = 40` y separación de 32px por fila, 9 filas terminan en y=324, muy por encima de la paleta (y=560); no requiere ajustar constantes existentes. |
| El texto "Nivel: X/5" podría superponerse con "Puntaje"/"Vidas" si el layout del HUD no deja espacio | Se agrega usando el mismo patrón de medición dinámica (`ctx.measureText`) que ya usa `drawScore()` para posicionar "Vidas" después de "Puntaje". |

---

## What is **not** in this spec

- Bloques resistentes / multi-golpe.
- Más de 5 niveles o generación procedural de layouts.
- Persistencia de progreso o high scores entre partidas o recargas de página.
- Selector de nivel.
- Cualquier otro mecanismo de dificultad (power-ups, IA de bloques, etc.) fuera de layout y velocidad de bola.

Cada uno de estos, si se implementa, va en su propio spec.
