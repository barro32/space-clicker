# Space Evolution

A space-themed idle game built with React, TypeScript, Zustand, and Tailwind CSS. Manage spaceports, launch rockets, conduct research, build orbiting infrastructure, and grow a strange little interstellar economy.

## Play in the Browser

The game is published as a static site on GitHub Pages, so you can test it without running the Electron app or a local dev server.

## Running the game

```bash
npm install

# Start the browser dev server
npm run dev

# Run the Electron shell against the dev server
npm run dev:electron

# Run the test suite once
npm test -- --run

# Build the browser app
npm run build

# Build the Electron distributable
npm run build:electron
```

## Play in the Browser

The game is set up for static deployment via GitHub Pages.

- Pushes to `main` can deploy the latest Vite web build automatically.
- The app uses a relative asset base so the same build works for GitHub Pages and local previews.

## Core Loop

Start on the surface by building rockets and spaceports, then use the resources they generate to unlock deeper systems:

Navigate between four main layers using the right-side navigation:

Explosions are part of the loop: failed launches can still produce science and eventually become manageable through research and automation.

2. **Surface** - Core operations (two sub-views)
   - **Spaceports**: Build rockets and manage launch infrastructure
   - **Contracts**: Accept missions from industrial partners

3. **Moon** - Manage lunar operations and moon-base progression

4. **Research Lab** - Unlock technologies across 5 branches

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

#### Contracts
- Partner with companies such as Titan Mining and Nova Research
- Four contract types: Logistics, Research, Commercial, Balanced
- Some contracts have time limits or explosion limits
- Completing contracts grants rewards and company XP
- Companies level up for better contracts

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
  App.tsx                 # Main app with layer navigation
  useGameStore.ts         # Zustand store with game logic and save/load hooks
  SpaceportView.tsx       # Surface layer - rockets & building
  OrbitView.tsx           # Orbital layer - space stations
  MoonView.tsx            # Lunar progression layer
  ContractsView.tsx       # Contract management
  ResearchTreeView.tsx    # Research tree UI
  persistence.ts          # Local save/load helpers
  researchTree.ts         # Research node definitions
  gameConstants.ts        # Game balance constants
  renderNodeDescription.ts# Research-node description helper
  styles.css              # Custom CSS & animations
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

## Notes

- Generated coverage reports are intentionally ignored and should not be committed.
- For the GitHub Pages/browser build work, see issue #1 / PR #3.

