# Track Spec: Implement Research Tree System

## Goal
Replace the random "Upgrade Cards" popup with a deterministic, branch-based Research Tree. This provides players with a clear progression path and strategic choices across Propulsion, Infrastructure, Commercial, and Orbital technologies.

## Requirements

### 1. Data Model & Store Integration
- **Research Tree Definition:** A static configuration defining nodes, costs, prerequisites, and effects.
- **State Updates:**
  - `researchedNodes`: A set or array of IDs representing unlocked technologies.
  - `unlockNode(nodeId)`: Action to purchase a technology if prerequisites are met and Science is sufficient.
- **Branches:**
  - **Propulsion:** Efficiency, Fuel costs, Launch success rates.
  - **Infrastructure:** Spaceport capacity, Refinery output, Construction costs.
  - **Commercial:** Money profit per rocket, Contract reward multipliers.
  - **Orbital:** Station effectiveness, unlocking lunar missions.

### 2. User Interface (UI)
- **Research Tab:** A new top-level view alongside Surface, Orbit, and Contracts.
- **Tree Visualization:**
  - Nodes displayed in a hierarchical or grid-based layout.
  - Visual lines or spacing indicating prerequisites.
  - Status indicators: Locked (gray), Available (pulsing), Unlocked (highlighted/green).
- **Node Details:** Tooltip or side panel showing cost, description, and "Unlocked" bonus.

### 3. Integration & Migration
- Disable the existing `checkForUpgrades` logic and the random pop-up in `App.tsx`.
- Migrate existing `upgrades` data into the Research Tree structure.

## Acceptance Criteria
- [ ] Player can access the "Research" tab.
- [ ] Research nodes are clearly organized into branches.
- [ ] Nodes can only be unlocked if the player has enough Science and has met all prerequisites.
- [ ] Unlocking a node provides the described benefit (e.g., lower fuel cost).
- [ ] The game state persists the research progress.
