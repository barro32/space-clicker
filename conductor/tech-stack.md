# Tech Stack

## Core Technologies
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Frontend Framework:** [React](https://react.dev/) (v19.2.0)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) (v5.0.8)
- **Build Tool:** [Vite](https://vitejs.dev/) (v7.2.2)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4.1.17)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/) (v5.5.0)

## Development Environment
- **Runtime:** Node.js (v18+ recommended)
- **Package Manager:** npm
- **Type Checking:** TypeScript compiler (tsc)
- **Testing:** [Vitest](https://vitest.dev/) (v4.0.16) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## Key Dependencies

### Production
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-icons": "^5.5.0",
  "zustand": "^5.0.8",
  "tailwindcss": "^4.1.17",
  "@tailwindcss/vite": "^4.1.17"
}
```

### Development
```json
{
  "vite": "^7.2.2",
  "vitest": "^4.0.16",
  "@testing-library/react": "^16.3.1",
  "typescript": "^5.8.3"
}
```

## Architecture Decisions

### State Management
- Single Zustand store (`useGameStore`) contains all game state and actions
- No Redux or complex state libraries needed for this scope
- Direct localStorage persistence for save/load

### Styling
- Tailwind CSS for utility-first styling
- Custom CSS animations in `styles.css`
- No CSS-in-JS library needed

### Testing
- Vitest for fast, Vite-native testing
- React Testing Library for component tests
- 215+ tests covering game logic and UI
