# Space Rocket Idle Game

A space-themed idle game built with React, TypeScript, Zustand, Vite, and Tailwind CSS. Build out a space program across the surface, orbit, research lab, and Moon while balancing money, science, fuel, cargo, contracts, and lunar resources.

## Getting Started

```bash
npm install
npm run dev
npm test -- --run
npm run build
```

## Play in the Browser

The game is set up for static deployment via GitHub Pages.

- Pushes to `main` can deploy the latest Vite web build automatically.
- The app uses a relative asset base so the same build works for GitHub Pages and local previews.

## Core Loop

Start on the surface by building rockets and spaceports, then use the resources they generate to unlock deeper systems:

- **Money** funds expansion and construction.
- **Science** unlocks research and progression.
- **Fuel** is generated passively and consumed by launches.
- **Cargo** supports orbital and lunar progression.
- **Moon resources** such as regolith and helium-3 unlock later-stage systems.

Explosions are part of the loop: failed launches can still produce science and eventually become manageable through research and automation.

## Main Views

The current game includes four main areas:

1. **Surface**
   - Build rockets and expand spaceports
   - Manage launch capacity and early-game economy
2. **Orbit**
   - Build stations and manage orbital progression
   - Track satellites, debris, docking, and related upgrades
3. **Research Lab**
   - Unlock research across multiple branches
   - Gain automation, UI, economy, safety, and progression upgrades
4. **Moon**
   - Unlock lunar progression and gather Moon-specific resources
   - Manage hazards, resource transfers, and later-game expansion

## Contracts and Companies

Contracts are available from the in-game company system and provide structured goals plus rewards.

- The code currently uses **6 default companies** (`titan`, `nova`, `zenith`, `galactic`, `aegis`, `atlas`).
- Active contract limits and rewards can be increased through progression.
- Contract state is persisted and refreshed over time.

## Automation and Progression

Research can unlock or improve:

- auto-build
- auto-salvage
- telemetry and UI helpers
- economy and launch safety bonuses
- orbital and lunar systems

## Tech Stack

- React 19
- TypeScript
- Zustand
- Vite 7
- Tailwind CSS 4
- Vitest
- Electron (desktop packaging)

## Project Structure

```text
src/
  App.tsx                    # Main app shell and view navigation
  useGameStore.ts            # Game state and core mechanics
  SpaceportView.tsx          # Surface gameplay
  OrbitView.tsx              # Orbital gameplay
  ContractsView.tsx          # Contract management
  ResearchTreeView.tsx       # Research UI
  MoonView.tsx               # Lunar gameplay
  components/
    ResearchSidebar.tsx      # Research sidebar
    SettingsPanel.tsx        # Game settings panel
  persistence.ts             # Save/load logic
  researchTree.ts            # Research definitions
  gameConstants.ts           # Balance constants and defaults
```

## Development Notes

### Tests

```bash
npm test           # watch mode
npm test -- --run  # single run
```

### Build Targets

```bash
npm run build           # web build
npm run build:electron  # packaged Electron build
```

### Persistence

The app includes save/load support and state migrations so older saves can continue working as the game evolves.

## Repository Hygiene

Generated coverage output is intentionally ignored and should not be committed. Regenerate it locally when needed.

## License

ISC
