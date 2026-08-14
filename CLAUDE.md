# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Responde siempre en español al trabajar en este proyecto, independientemente del idioma del mensaje del usuario.

## Project

An Arkanoid/Breakout clone built with HTML, CSS, and JavaScript with **zero dependencies** — no framework, no bundler, no package manager. The game itself is **not implemented yet**; the repository currently only contains assets and a spec-driven development workflow.

There is no build, lint, or test tooling in this repo (none exists yet, and the zero-dependency constraint means the eventual game should stay runnable by just opening an HTML file in a browser rather than gaining a build step).

## Development workflow: spec-driven

This repo uses a two-command spec workflow (`.agents/skills/`, symlinked into `.claude/skills/`) instead of ad-hoc implementation. Follow it rather than jumping straight into code:

- **`/spec <description>`** — clarifies a feature through blocks of questions, then writes `specs/NN-slug.md` (using `.agents/skills/spec/template.md`) in `Draft` state. Never writes code.
- **`/spec-impl <NN-slug>`** — only proceeds if the target spec's state means `Approved`. On success it creates/switches to a git branch `spec-NN-slug` and implements the spec's plan one step at a time, pausing for review after each step. Never commits automatically.

Practical implications:
- `specs/` does not exist yet — the first `/spec` run creates it along with `specs/.spec-config.yml` (controls whether `/spec-impl` auto-creates branches via `AutoCreateBranch`).
- **This directory is not yet a git repository.** `/spec-impl` depends on `git checkout -b`, so a repo must be initialized (`git init`) before that command can create branches.
- Don't hand-roll features outside this flow unless the user explicitly asks for a quick/throwaway change — the point of the workflow is that specs (not ad-hoc requests) drive implementation.

## Assets already in place

- `assets/spritesheet-breakout.png` — the sprite sheet image (paddle, ball, colored blocks, explosion animation frames).
- `assets/spritesheet.js` — plain-JS helper loaded as a script (no module system): defines the `SPRITES` and `EXPLOSION_FRAMES` coordinate tables, and exposes `loadSpritesheet(cb)`, `drawSprite(ctx, name, x, y, w, h)`, and `drawFrame(ctx, frame, x, y, w, h)` for drawing onto a `<canvas>` 2D context. Block sprites are looked up by name via the `block_<color>` convention (e.g. `block_red` → `SPRITES.blocks.red`).
- `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` — sound effects for paddle/wall bounces and block breaks.

Any future game code should load and use these existing assets/helpers rather than introducing new asset-loading abstractions or replacing `spritesheet.js`.
