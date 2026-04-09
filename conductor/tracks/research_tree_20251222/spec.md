# Track Spec: Implement Research Tree System

**Status: COMPLETED (January 2026)**

## Goal
Replace the random "Upgrade Cards" popup with a deterministic, branch-based Research Tree. This provides players with a clear progression path and strategic choices across Propulsion, Infrastructure, Commercial, and Orbital technologies.

## Requirements

### 1. Data Model & Store Integration
- [x] **Research Tree Definition:** A static configuration defining nodes, costs, prerequisites, and effects.
- [x] **State Updates:**
  - `researchedNodes`: A set or array of IDs representing unlocked technologies.
  - `unlockNode(nodeId)`: Action to purchase a technology if prerequisites are met and Science is sufficient.
- [x] **Branches:**
  - **Propulsion:** Efficiency, Fuel costs, Launch success rates.
  - **Infrastructure:** Spaceport capacity, Refinery output, Construction costs.
  - **Commercial:** Money profit per rocket, Contract reward multipliers.
  - **Orbital:** Station effectiveness, unlocking lunar missions.
  - **Control:** (Added) Automation features for auto-build and auto-salvage.

### 2. User Interface (UI)
- [x] **Research Tab:** A new top-level view alongside Surface, Orbit, and Contracts.
- [x] **Tree Visualization:**
  - Nodes displayed in a hierarchical or grid-based layout.
  - Visual lines or spacing indicating prerequisites.
  - Status indicators: Locked (gray), Available (pulsing), Unlocked (highlighted/green).
- [x] **Node Details:** Tooltip or side panel showing cost, description, and "Unlocked" bonus.
- [x] **Branch Filtering:** Filter view by technology branch.

### 3. Integration & Migration
- [x] Disable the existing `checkForUpgrades` logic and the random pop-up in `App.tsx`.
- [x] Migrate existing `upgrades` data into the Research Tree structure.

## Acceptance Criteria
- [x] Player can access the "Research" tab.
- [x] Research nodes are clearly organized into branches.
- [x] Nodes can only be unlocked if the player has enough Science and has met all prerequisites.
- [x] Unlocking a node provides the described benefit (e.g., lower fuel cost).
- [x] The game state persists the research progress.

## Implementation Notes

### Research Tree Statistics
- **Total Nodes:** 139
- **Safety Protocols (Propulsion):** 100 levels, each reducing explosion chance by 5%
- **Modular Spaceports (Infrastructure):** 10 levels, each adding +3 capacity
- **Assembly Optimization (Infrastructure):** 5 levels for build speed
- **Recovery Protocols (Infrastructure):** 5 levels for salvage speed
- **Fixed Nodes:** 19 unique technologies

### Effect Types (EffectType union)
All research effects are type-safe using a union type:
- Multipliers: explosionChanceMultiplier, fuelCostMultiplier, profitMultiplier, etc.
- Bonuses: spaceportCapacityBonus, buildRocketBatchBonus, etc.
- Unlocks: unlockScienceRockets, unlockSpaceports, autoBuildEnabled, etc.
