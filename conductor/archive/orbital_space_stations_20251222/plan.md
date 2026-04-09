# Track Plan: Implement Orbital Space Stations

## Phase 1: Data Model and Store Integration [checkpoint: 5b831bf]
Focus on updating the `useGameStore` to handle the new "Orbit" mechanics.

- [x] **Task 1: Define Orbital Types and Initial State** 0a493ef
  - Update `useGameStore.ts` with `SpaceStation` interface.
  - Add `spaceStations` array to `GameState`.
- [x] **Task 2: Implement `buildSpaceStation` Logic** e766aa7
  - Write tests for building stations (resource checks, state update).
  - Implement `buildSpaceStation` in `useGameStore`.
- [x] **Task 3: Implement Station Benefits in `tick` Loop** 9598794
  - Write tests for station benefits (e.g., science boost).
  - Update `tick` function to incorporate station-based modifiers.
- [x] **Task: Conductor - User Manual Verification 'Phase 1: Data Model and Store Integration' (Protocol in workflow.md)**

## Phase 2: Orbital UI and Navigation [checkpoint: 2d1eec5]
Create the visual representation for the Orbit view and allow players to navigate to it.

- [x] **Task 1: Create View Switcher Component** 545a67c
  - Add a simple "Surface / Orbit" toggle to the main `App.tsx` or a new navigation component.
- [x] **Task 2: Implement `OrbitView` Component** 95f66b7
  - Create `src/OrbitView.tsx`.
  - Display current stations and a "Build Station" button.
- [x] **Task 3: Integrate `OrbitView` into `App.tsx`** a9d9aef
  - Ensure the view correctly switches based on the global state or local navigation state.
- [x] **Task: Conductor - User Manual Verification 'Phase 2: Orbital UI and Navigation' (Protocol in workflow.md)**

## Phase 3: Polish and Balancing [checkpoint: 1aa989f]
Refine the experience and ensure the new mechanics feel integrated.

- [x] **Task 1: Add Visual Feedback for Orbital Actions** 83e477a
- [x] **Task 2: Final Balancing and Integration Check** 1aa989f
- [x] **Task: Conductor - User Manual Verification 'Phase 3: Polish and Balancing' (Protocol in workflow.md)**

## Phase 4: Contracts System [checkpoint: 248cb53]
Implement the company-driven contract economy.

- [x] **Task 1: Define Companies and Contract Data Structures** 6911b84
- [x] **Task 2: Implement Contract Generation and Acceptance** a499154
- [x] **Task 3: Implement Contract Completion and Failure Logic** 4b73ec2
- [x] **Task 4: Create Contracts View UI** 3ee2178
- [x] **Task 5: Integration and Persistence** 2b9b9fe
- [x] **Task: Conductor - User Manual Verification 'Phase 4: Contracts System' (Protocol in workflow.md)**
