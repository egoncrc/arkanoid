# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Responde siempre en español al trabajar en este proyecto, independientemente del idioma del mensaje del usuario.

## Project

An Arkanoid/Breakout clone built with HTML, CSS, and JavaScript with **zero dependencies** — no framework, no bundler, no package manager. The game is playable today: `index.html` loads `assets/spritesheet.js` and `game.js` directly on a single `<canvas id="game">` (800x600), styled by `styles.css`. Open `index.html` in a browser to run it — no server, no build step.

There is no build, lint, or test tooling in this repo, and the zero-dependency constraint means it should stay that way — new features are added by editing `game.js` (and, if needed, `styles.css`/`index.html`), never by introducing a bundler or package manager.

`game.js` keeps one global `state` object (screen, score, lives, level, paddle, ball, blocks, explosions) plus top-level constants for layout (`BLOCK_*`) and level data (`LEVELS`, an array of row-layout strings + per-level ball speed). Follow that single-file, single-state-object structure rather than splitting into modules.

## Development workflow: spec-driven

This repo uses a two-command spec workflow (`.agents/skills/`, symlinked into `.claude/skills/`) instead of ad-hoc implementation. Follow it rather than jumping straight into code:

- **`/spec <description>`** — clarifies a feature through blocks of questions, then writes `specs/NN-slug.md` (using `.agents/skills/spec/template.md`) in `Draft`/`Borrador` state. Never writes code.
- **`/spec-impl <NN-slug>`** — only proceeds if the target spec's state means `Approved`/`Aprobado`. On success it creates/switches to a git branch `spec-NN-slug` and implements the spec's plan one step at a time, pausing for review after each step. Never commits automatically.

Practical implications:
- `specs/` already exists, with `specs/.spec-config.yml` controlling whether `/spec-impl` auto-creates branches (`AutoCreateBranch: true` by default — creates/switches without asking).
- Specs in this repo are written in **Spanish**, and states use the Spanish wording: `Borrador` → `En revisión` → `Aprobado` → `Implementado` (or `Obsoleto`). Match that convention for any new spec rather than switching to English.
- Existing specs, in order: `01-mvp-arkanoid` (core paddle/ball/blocks MVP), `02-explosion-bloques` (explosion animation on block break), `03-multiples-niveles` (multi-level progression). Read the most recent one(s) before drafting a new spec to stay consistent with naming and section wording.
- This is already a git repository — `/spec-impl` can create branches directly.
- Don't hand-roll features outside this flow unless the user explicitly asks for a quick/throwaway change — the point of the workflow is that specs (not ad-hoc requests) drive implementation.

## Assets already in place

- `assets/spritesheet-breakout.png` — the sprite sheet image (paddle, ball, colored blocks, explosion animation frames).
- `assets/spritesheet.js` — plain-JS helper loaded as a script (no module system): defines the `SPRITES` and `EXPLOSION_FRAMES` coordinate tables, and exposes `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, and `drawFrame(ctx, frame, x, y, w, h)` for drawing onto a `<canvas>` 2D context. Block sprites are looked up by name via the `block_<color>` convention (e.g. `block_red` → `SPRITES.blocks.red`).
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — sound effects for paddle/wall bounces and block breaks.

`game.js` already loads and draws through these helpers (`loadSpritesheet`, `drawSprite`, `drawFrame`, `EXPLOSION_FRAMES`). Keep using them for any new visuals rather than introducing new asset-loading abstractions or replacing `spritesheet.js`.
