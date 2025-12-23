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
- [ ] **Task: Conductor - User Manual Verification 'Phase 1: Data Model and Store Integration' (Protocol in workflow.md)**

## Phase 2: Orbital UI and Navigation
Create the visual representation for the Orbit view and allow players to navigate to it.

- [x] **Task 1: Create View Switcher Component** 545a67c
  - Add a simple "Surface / Orbit" toggle to the main `App.tsx` or a new navigation component.
- [x] **Task 2: Implement `OrbitView` Component** 95f66b7
  - Create `src/OrbitView.tsx`.
  - Display current stations and a "Build Station" button.
- [x] **Task 3: Integrate `OrbitView` into `App.tsx`** a9d9aef
  - Ensure the view correctly switches based on the global state or local navigation state.
- [ ] **Task: Conductor - User Manual Verification 'Phase 2: Orbital UI and Navigation' (Protocol in workflow.md)**

## Phase 3: Polish and Balancing
Refine the experience and ensure the new mechanics feel integrated.

- [ ] **Task 1: Add Visual Feedback for Orbital Actions**
  - Add animations or notifications when a station is built or upgraded.
- [ ] **Task 2: Final Balancing and Integration Check**
  - Adjust costs and benefits to ensure satisfying progression.
  - Verify all "Scientific and Industrial" tone guidelines are met in the new UI.
- [ ] **Task: Conductor - User Manual Verification 'Phase 3: Polish and Balancing' (Protocol in workflow.md)**
