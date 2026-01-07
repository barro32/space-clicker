# Track Plan: Implement Research Tree System

## Phase 1: Research Tree Data Structure and Logic [checkpoint: 23b48db]
Define the tree configuration and implement the core unlocking mechanics in the store.

- [x] **Task 1: Define Research Tree Configuration** db24bba
  - Create `src/researchTree.ts` to hold the node definitions and dependency links.
  - Include nodes for all 4 branches (Propulsion, Infrastructure, Commercial, Orbital).
- [x] **Task 2: Update `useGameStore` for Research** 9672aa3
  - Add `researchedNodes` to `GameState`.
  - Implement `unlockNode` action with cost and prerequisite checks.
- [x] **Task 3: Implement Benefit Application** 9672aa3
  - Ensure that unlocked research benefits are correctly applied to the game logic (e.g., updating multipliers used in `tick`).
- [x] **Task: Conductor - User Manual Verification 'Phase 1: Research Tree Data Structure and Logic' (Protocol in workflow.md)** 23b48db

## Phase 2: Research Tree UI [checkpoint: 222f796]
Create the visual tree and integrate the new tab into the navigation.

- [x] **Task 1: Update Navigation for Research Tab** d8aaef1
  - Add "Research" button to the `App.tsx` navigation bar.
- [x] **Task 2: Create `ResearchTreeView` Component** d8aaef1
  - Implement a visual tree layout using CSS Grid or Flexbox.
  - Display node status (Locked/Available/Unlocked).
- [x] **Task 3: Implement Node Interaction** d8aaef1
  - Show details on hover or click.
  - Trigger `unlockNode` when purchasing.
- [x] **Task: Conductor - User Manual Verification 'Phase 2: Research Tree UI' (Protocol in workflow.md)**

## Phase 3: Integration and Cleanup [checkpoint: b3ef689]
Remove the legacy upgrade system and finalize the experience.

- [x] **Task 1: Disable Legacy Upgrade Pop-ups** 7871f72
  - Remove `availableUpgrades` logic from `tick` and `App.tsx`.
- [x] **Task 2: Migrate and Balance** 7871f72
  - Ensure all previous "Upgrades" are now part of the tree.
  - Adjust Science costs for a smooth progression.
- [x] **Task: Conductor - User Manual Verification 'Phase 3: Integration and Cleanup' (Protocol in workflow.md)**
