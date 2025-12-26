# Track Plan: Implement Research Tree System

## Phase 1: Research Tree Data Structure and Logic [checkpoint: 9cd9574]
Define the tree configuration and implement the core unlocking mechanics in the store.

- [x] **Task 1: Define Research Tree Configuration** db24bba
  - Create `src/researchTree.ts` to hold the node definitions and dependency links.
  - Include nodes for all 4 branches (Propulsion, Infrastructure, Commercial, Orbital).
- [x] **Task 2: Update `useGameStore` for Research** 9672aa3
  - Add `researchedNodes` to `GameState`.
  - Implement `unlockNode` action with cost and prerequisite checks.
- [x] **Task 3: Implement Benefit Application** 9672aa3
  - Ensure that unlocked research benefits are correctly applied to the game logic (e.g., updating multipliers used in `tick`).
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Research Tree Data Structure and Logic' (Protocol in workflow.md)**

## Phase 2: Research Tree UI
Create the visual tree and integrate the new tab into the navigation.

- [ ] **Task 1: Update Navigation for Research Tab**
  - Add "Research" button to the `App.tsx` navigation bar.
- [ ] **Task 2: Create `ResearchTreeView` Component**
  - Implement a visual tree layout using CSS Grid or Flexbox.
  - Display node status (Locked/Available/Unlocked).
- [ ] **Task 3: Implement Node Interaction**
  - Show details on hover or click.
  - Trigger `unlockNode` when purchasing.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Research Tree UI' (Protocol in workflow.md)**

## Phase 3: Integration and Cleanup
Remove the legacy upgrade system and finalize the experience.

- [ ] **Task 1: Disable Legacy Upgrade Pop-ups**
  - Remove `availableUpgrades` logic from `tick` and `App.tsx`.
- [ ] **Task 2: Migrate and Balance**
  - Ensure all previous "Upgrades" are now part of the tree.
  - Adjust Science costs for a smooth progression.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Integration and Cleanup' (Protocol in workflow.md)**
