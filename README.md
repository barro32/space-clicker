# Space Evolution

Space Evolution is a React + TypeScript incremental game about building a launch program, expanding into orbit, running contracts, and establishing lunar industry.

The current desktop target is Electron on Windows, with Steam as the intended release path once desktop reliability, input support, and Steam integration are ready.

## Stack

- React 19
- TypeScript
- Zustand
- Tailwind CSS 4
- Vite
- Electron
- Vitest + Testing Library

## Scripts

```bash
# Web development
npm run dev

# Electron development
# Run these in separate terminals:
npm run dev
npm run dev:electron

# Production web build
npm run build

# Windows Electron build
npm run build:electron

# Tests
npm test
npm test -- --run
```

## Current Game Scope

The game currently includes:

- Surface operations with rockets, spaceports, fuel, explosions, and salvage
- Orbit gameplay with stations, docking, satellites, and debris
- Contract progression tied to company levels and perks
- A large research tree that unlocks automation and layer progression
- Moon progression with missions, sectors, power, hazards, and resource processing
- Save/load support for browser and Electron builds

## Project Layout

```text
src/
  App.tsx
  useGameStore.ts
  gameConstants.ts
  researchTree.ts
  SpaceportView.tsx
  OrbitView.tsx
  ContractsView.tsx
  ResearchTreeView.tsx
  MoonView.tsx
  components/
    ResearchSidebar.tsx
    SettingsPanel.tsx
```

Important files:

- [src/useGameStore.ts](/home/barro/code/barro/space-clicker/src/useGameStore.ts): core simulation, actions, progression state
- [src/gameConstants.ts](/home/barro/code/barro/space-clicker/src/gameConstants.ts): balance and tuning constants
- [src/researchTree.ts](/home/barro/code/barro/space-clicker/src/researchTree.ts): research definitions
- [src/persistence.ts](/home/barro/code/barro/space-clicker/src/persistence.ts): browser/Electron save abstraction
- [electron-main.js](/home/barro/code/barro/space-clicker/electron-main.js): Electron main process and file-based saves

## Saves

Browser builds use `localStorage`.

Electron builds use a JSON save file:

- Windows: `%APPDATA%/SpaceEvolution/gameSave.json`
- macOS/Linux: `~/.SpaceEvolution/gameSave.json`

## Testing

Run the full suite:

```bash
npm test -- --run
```

Run a specific file:

```bash
npm test -- --run src/useGameStore.test.ts
```

The current suite covers store logic, research behavior, and the major React views.

## Documentation Policy

This repository intentionally keeps documentation small.

- `README.md` is the main project document.
- `AGENTS.md` contains repository-specific coding instructions for agentic tools.
- Stale audit notes, planning scratch files, and one-off analysis documents are removed instead of preserved.

## Steam Direction

The current plan is:

1. Keep the Electron desktop build stable and save-safe.
2. Improve keyboard and controller navigation so the game is playable without a mouse.
3. Add Steam-specific integration such as Cloud saves and achievements.
4. Validate UI readability and interaction flow for Steam Deck class devices.

This is a viable stack for a management/idle game, but Steam readiness depends more on polish, input handling, and reliability than on engine choice.
