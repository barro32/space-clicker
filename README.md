# Space Evolution

A space-themed idle game built with React, TypeScript, Zustand, and Tailwind CSS. Manage spaceports, launch rockets, conduct research, build orbiting infrastructure, and grow a strange little interstellar economy.

## Running the game

```bash
# Install dependencies
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

## How to Play

### Goal
Build a thriving space program by accumulating money, science, and cargo. Expand your infrastructure, research new technologies, and complete contracts for industrial partners.

### Resources

| Resource | Description | Generation |
|----------|-------------|------------|
| **Money** | Primary currency for building | Cargo rocket launches, contract rewards |
| **Science** | Used for research unlocks | Science rockets, explosions, spaceports |
| **Fuel** | Required for each rocket launch | Fuel refineries (1/sec per refinery) |
| **Cargo** | Used for orbital construction | Successful cargo launches |

### Game Layers

Navigate between four main layers using the right-side navigation:

1. **Orbit** - Build and manage space stations
   - Research Stations: Boost science output
   - Logistics Stations: Increase money production

2. **Surface** - Core operations (two sub-views)
   - **Spaceports**: Build rockets and manage launch infrastructure
   - **Contracts**: Accept missions from industrial partners

3. **Moon** - Manage lunar operations and moon-base progression

4. **Research Lab** - Unlock technologies across 5 branches

### Core Mechanics

#### Rockets
- **Cargo Rockets** (blue): Generate money on successful launch
- **Science Rockets** (purple): Generate science on successful launch
- Each launch consumes fuel and has an explosion chance (50% base)
- Exploded rockets can be salvaged for +1 science

#### Spaceports
- Each spaceport has slots for rockets (2 base capacity)
- Generates passive science and cargo bonuses
- Build more spaceports to expand fleet capacity

#### Research Tree (139 nodes)
Five technology branches:
- **Propulsion**: Reduce explosion chance (100 levels of Safety Protocols)
- **Infrastructure**: Increase capacity, reduce costs (10 Modular Spaceports)
- **Commercial**: Boost profits and contract rewards
- **Orbital**: Unlock science rockets, spaceports, refineries, stations
- **Control**: Automation features (auto-build, auto-salvage)

#### Contracts
- Partner with companies such as Titan Mining and Nova Research
- Four contract types: Logistics, Research, Commercial, Balanced
- Some contracts have time limits or explosion limits
- Completing contracts grants rewards and company XP
- Companies level up for better contracts

#### Automation (requires research)
- **Auto-Build**: Automatically builds cargo rockets (1 per 20s base)
- **Auto-Salvage**: Automatically clears explosions (1 per 20s base)
- Progress bars show countdown to next automatic action

### Tips
- Start by building cargo rockets to generate money
- Research "Safety Protocols" to reduce explosion chance
- Build fuel refineries to sustain more rocket launches
- Accept contracts for bonus rewards
- Science rockets unlock after researching "Science Module"

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS 4** - Styling
- **Vite** - Build tool
- **Vitest** - Testing

## Project Structure

```
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

## Development

### Running Tests
```bash
npm test           # Watch mode
npm test -- --run  # Single run
```

### Game Constants
All balance values are centralized in `src/gameConstants.ts`:
- Initial resource values
- Cost scaling exponents
- Production rates
- Timing intervals

### Adding Research Nodes
1. Add effect type to `EffectType` union in `researchTree.ts`
2. Create node definition with prerequisites
3. Handle effect in `useGameStore.ts` tick or action functions

## Notes

- Generated coverage reports are intentionally ignored and should not be committed.
- For the GitHub Pages/browser build work, see issue #1 / PR #3.

## License

ISC
