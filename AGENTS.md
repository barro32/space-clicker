# Agent Development Guide

This document contains build, test, style, and development guidelines for agentic coding in this repository.

## Project Overview

**Space Rocket Idle Game** - A React + TypeScript space-themed incremental game with orbital mechanics, contracts, research trees, and lunar exploration.

- **Framework**: React 19 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite
- **Testing**: Vitest with React Testing Library

## Build & Development Commands

### Core Commands
- `npm run dev` - Start Vite dev server (HMR enabled)
- `npm run build` - Production build to `dist/`
- `npm run preview` - Preview production build locally
- `npm test` - Run tests in watch mode
- `npm test -- --run` - Single test run (CI mode)

### Running Specific Tests
```bash
# Run single test file
npm test -- src/useGameStore.test.ts

# Run tests matching pattern
npm test -- src/useGameStore

# Run with coverage
npm test -- --coverage

# Run single test by name
npm test -- --reporter=verbose -t "test name pattern"
```

## Code Style Guidelines

### TypeScript & Type Safety
- **Strict mode enabled** in `tsconfig.json` - all types must be explicit
- Use `type` for type aliases, `interface` for object shapes (prefer interfaces for extensibility)
- No `any` types - use generics, unions, or `unknown` with type guards
- Type imports: `import type { TypeName } from './file'` (when importing only types)
- Export types from modules for reusability (see `useGameStore.ts` for examples)

### Imports & Module Paths
- **ES modules only** - `type: "module"` in package.json
- Always use explicit `.js` extensions in imports: `import { X } from './file.js'`
- Group imports in order: external libs → internal types → internal modules
- Example:
  ```typescript
  import { create } from 'zustand'
  import type { GameState } from './useGameStore.js'
  import { INITIAL_STATE } from './gameConstants.js'
  ```

### File Organization
- Components: `src/components/` (React TSX)
- Stores & State: `useGameStore.ts`, `researchTree.ts`
- Constants: `gameConstants.ts` (all balance values centralized here)
- Tests: `*.test.ts` or `*.test.tsx` (colocated with source)
- Types: Defined in their module, exported for use elsewhere

### Naming Conventions
- **Components**: PascalCase (`SpaceportView.tsx`, `ResearchSidebar.tsx`)
- **Functions/Variables**: camelCase (`calculateGameMetrics`, `getEffectMultiplier`)
- **Constants**: UPPER_SNAKE_CASE (`INITIAL_STATE`, `COST_SCALING`)
- **Types/Interfaces**: PascalCase (`GameState`, `SpaceStation`, `MoonHazard`)
- **Event handlers**: `handle` prefix (`handleBuildRocket`, `handleAddContract`)
- **Tests**: Describe actual behavior, avoid "should" - use `it('unlocks research when science sufficient')`

### Formatting
- Indentation: 2 spaces (enforced by Tailwind/Vite defaults)
- Line length: No hard limit, but keep <120 chars when readable
- Trailing commas: Include in objects/arrays for consistency
- Semicolons: Required

### Component Structure (React/TSX)
- Hooks at top: `useState`, `useRef`, `useMemo`, `useEffect` (in that order)
- Handlers/callbacks next
- Render JSX at bottom
- Use `useMemo` for expensive calculations in render logic
- Destructure props for readability
- Example structure:
  ```typescript
  function MyComponent({ prop1, prop2 }: Props) {
    const [state, setState] = useState(null)
    const memoValue = useMemo(() => expensiveCalc(), [])
    
    const handleClick = () => { /* ... */ }
    
    return <div>{/* JSX */}</div>
  }
  ```

### State Management (Zustand)
- Define state interface (`GameState`) with all properties
- Group related actions together
- Use getState() selectors for computed values (avoid duplication)
- Store lifecycle: initialization → mutations → selectors
- Document complex state with JSDoc comments
- Example from codebase:
  ```typescript
  const store = create<GameState>((set, get) => ({
    money: 0,
    addMoney: (amount) => set(state => ({ money: state.money + amount })),
    getEffectMultiplier: (type) => { /* computed */ },
  }))
  ```

### Error Handling
- Use try-catch for async operations
- Validate state before mutations: `if (!state.property) return`
- Log errors to console during development
- Include error context: `console.error('Failed to build rocket:', error, context)`
- Return early with guards in complex functions
- Prefer explicit error checks over exceptions

### Testing Patterns
- Use `describe` blocks to group related tests
- Use `beforeEach` to reset state between tests
- Mock Zustand store with `setState()` for isolation
- Test behavior, not implementation
- Use `expect().toBe()` for exact values, `toContain()` for arrays
- Example:
  ```typescript
  describe('useGameStore', () => {
    beforeEach(() => {
      useGameStore.setState({ money: 100, rockets: [] })
    })
    
    it('builds rocket when afforded', () => {
      getState().buildRocket()
      expect(getState().rockets).toHaveLength(1)
    })
  })
  ```

### Comments & Documentation
- Comments explain **why**, not **what** the code does
- JSDoc for exported functions/types
- Inline comments for complex logic (game mechanics, calculations)
- TODO comments for known issues: `// TODO: Move metrics calculations to store selectors`
- Example:
  ```typescript
  // Reduce explosion chance with each safety protocol level
  // (multiplicative: 50% base * 0.98^level = safer launches)
  const explosionChance = baseChance * Math.pow(0.98, safetyLevel)
  ```

### Performance & Optimization
- Memoize expensive calculations (`useMemo`, `useCallback`)
- Avoid inline object/array creation in render
- Use selectors in stores to avoid unnecessary re-renders
- Batch state updates when possible
- Game runs `tick()` every `TIME.TICK_INTERVAL_MS` - keep handlers fast

### Common Patterns in Codebase
- **Game constants**: Centralized in `gameConstants.ts` for easy rebalancing
- **Research tree effects**: Add to `EffectType` union, handle in store tick/actions
- **View switching**: Use `currentView` state and conditional rendering
- **Contract system**: `activeContracts` array with completion validation
- **Celestial mechanics**: Moon/Orbit layers use resource pools and building slots

## Important Notes

- All balance values (costs, production rates, timers) live in `gameConstants.ts`
- Research tree defined declaratively in `researchTree.ts` with effect handlers
- No external HTTP calls - all game logic is local state
- CSS uses Tailwind classes only (custom CSS in `styles.css` for animations)
- Tests use Vitest globals (no need to import `describe`, `it`, `expect`)

## Cursor/Copilot Rules

*(No existing .cursorrules or .github/copilot-instructions.md found in repository)*

Apply the guidelines above when using AI-assisted coding tools in this project.
