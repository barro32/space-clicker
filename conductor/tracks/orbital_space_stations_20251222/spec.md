# Track Spec: Implement Orbital Space Stations

## Goal
Introduce the "Orbit" layer of progression by allowing players to build and manage Orbital Space Stations. This serves as a bridge between the initial planetary buildup and reaching the moons.

## Requirements

### 1. Data Model & Store Integration
- **Space Stations:** A new collection in the `GameState`.
  - Each station has a `level` and a `type` (e.g., Research, Logistics).
- **New Actions:**
  - `buildSpaceStation()`: Build a new station in orbit.
  - `upgradeSpaceStation(id)`: Increase the level of a station.
- **Costs:**
  - Space Stations should cost significantly more than surface structures.
  - Initial cost: $50,000 and 500 Science.
- **Benefits:**
  - Research Stations: Increase Science generation per tick.
  - Logistics Stations: Reduce the fuel cost of surface rockets or increase profit per rocket.

### 2. User Interface (UI)
- **View Switcher:** A way for players to switch between "Surface" and "Orbit" views.
- **Orbit View Component:**
  - A visual representation of the planet with orbiting stations.
  - Management panel for stations (build, upgrade, toggle types).
- **Navigation:** Clear indicators of where the player is and easy access to both views.

### 3. Integration
- Stations should integrate with the existing `tick` loop.
- UI should be consistent with the "Scientific and Industrial" tone.

## Acceptance Criteria
- [ ] Player can switch between Surface and Orbit views.
- [ ] Player can build a Space Station in Orbit view if they have enough resources.
- [ ] Space Stations provide a measurable benefit to resource generation or cost reduction.
- [ ] The game state is correctly updated and persisted (if persistence is implemented).
