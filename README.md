# Juego de Arkanoid

Clon de Arkanoid/Breakout hecho con HTML, CSS y JavaScript puro — **cero dependencias**, sin build, sin package manager. Se juega abriendo `index.html` en el navegador.

## Cómo jugar

Abrí `index.html` directamente en el navegador (no requiere servidor).

- **Mover la paleta:** flechas `←` `→`, o mover el mouse sobre el canvas.
- **Lanzar la bola:** barra espaciadora o clic sobre el canvas.
- **Objetivo:** romper todos los bloques de cada nivel antes de quedarte sin vidas.

## Features implementadas

- Paleta y bola con física de rebote (paredes, techo y ángulo de desvío según el punto de impacto en la paleta).
- Sistema de puntuación (10 puntos por bloque) y de vidas (3 vidas iniciales).
- Animación de explosión al destruir un bloque, con sonido (`assets/sounds/break-sound.mp3`) y sonido de rebote (`assets/sounds/ball-bounce.mp3`).
- Progresión de múltiples niveles, cada uno con su propio layout de bloques y velocidad de bola, con pantalla de transición entre niveles.
- Pantallas de inicio, Game Over (con reinicio completo) y victoria al terminar todos los niveles.

## Estructura del proyecto

- `index.html` / `styles.css` — página y estilos del canvas.
- `game.js` — toda la lógica del juego (estado, física, niveles, render, input).
- `assets/spritesheet-breakout.png` + `assets/spritesheet.js` — sprite sheet y helpers de dibujo (`loadSpritesheet`, `drawSprite`, `drawFrame`).
- `assets/sounds/` — efectos de sonido.

## Desarrollo: workflow spec-driven

Este repo desarrolla features nuevas a través de specs en `specs/`, usando los comandos `/spec` (para definir y documentar una feature) y `/spec-impl` (para implementarla una vez aprobada). Ver `CLAUDE.md` para el detalle del flujo.

Specs existentes: `01-mvp-arkanoid`, `02-explosion-bloques`, `03-multiples-niveles`.
