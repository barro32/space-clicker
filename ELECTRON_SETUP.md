# Electron Build Setup Complete

This document describes the changes made to support running the game as a native Windows application via Electron, as a step toward Steam release.

## What Changed

### New Files Created
- **`electron-main.js`** - Electron main process entry point. Handles:
  - Creating the app window
  - IPC handlers for game state persistence (save/load/delete)
  - File I/O to user's AppData folder (`%APPDATA%/SpaceEvolution/gameSave.json`)

- **`electron-preload.js`** - Secure bridge between Electron main process and React app. Exposes IPC API safely to the renderer.

- **`src/persistence.ts`** - Cross-platform persistence layer that:
  - Uses localStorage in web environment
  - Uses Electron IPC file-based saves in desktop environment
  - Provides sync/async load functions for initialization

### Modified Files
- **`package.json`** - Updated with:
  - `main: "electron-main.js"` entry point
  - New scripts: `dev:electron`, `build:electron`
  - Added `cross-env` dependency
  - Added electron-builder configuration for Windows NSIS installer

- **`vite.config.ts`** - Added `base: './'` for local file serving instead of server-relative paths

- **`src/App.tsx`** - Refactored to:
  - Use `loadGameStateSync()` for initial state load (works in both web and Electron)
  - Use async `saveGameState()` for autosave (10-second debounce in Electron, synchronous in web)
  - Import from `persistence.ts` instead of direct localStorage calls

- **`src/DevConsole.tsx`** - Updated to use `deleteGameState()` from persistence layer

## How to Run

### Web Version (Original)
```bash
# Development server (http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Run tests
npm test
```

### Electron Version (New)
```bash
# Development: Run Vite dev server + Electron with HMR
# Terminal 1:
npm run dev

# Terminal 2 (in separate terminal):
npm run dev:electron

# Build Windows executable
npm run build:electron

# The executable will be in: dist/Space Evolution Setup 1.0.0.exe
```

## File Persistence

### Web Environment
- **Location**: Browser localStorage (opaque, managed by browser)
- **Access**: Synchronous via localStorage API
- **File**: `gameState` key in localStorage

### Electron/Windows Environment
- **Location**: `%APPDATA%/SpaceEvolution/gameSave.json`
- **Access**: Asynchronous via Electron IPC
- **Format**: Pretty-printed JSON (human-readable for debugging)

### State Flow
1. **On app start**: `loadGameStateSync()` loads from storage (instant load, no delay)
2. **During gameplay**: Auto-save every 30 seconds + on window close
3. **On reset**: `deleteGameState()` removes save file

## Save File Location Examples

**Windows**: `C:\Users\YourUsername\AppData\Roaming\SpaceEvolution\gameSave.json`

**macOS**: `~/.SpaceEvolution/gameSave.json`

**Linux**: `~/.SpaceEvolution/gameSave.json`

## Electron Builder Configuration

The `package.json` build section defines:
- App ID: `com.spaceevolution.game`
- Product name: `Space Evolution`
- Windows target: NSIS installer
- Files included: `dist/`, `electron-main.js`, `electron-preload.js`

NSIS installer features:
- Non-one-click installer (users can choose install location)
- Desktop shortcut creation
- Start menu shortcut creation

## Important Notes

1. **Backwards Compatibility**: The persistence layer detects if running in Electron vs web, so the same code works for both environments.

2. **State Migrations**: All existing state migration logic in `App.tsx` continues to work. The `loadInitialState()` function runs migrations regardless of storage backend.

3. **Testing**: Tests run in jsdom environment and use the localStorage fallback (not Electron IPC).

4. **Next Step**: To release on Steam, you'll need to:
   - Register as a Steam Partner ($100 one-time fee)
   - Upload the Windows executable via SteamPipe
   - Valve reviews the build (3-5 days)
   - After approval, your game is published to Steam

## Troubleshooting

### Electron won't start
- Ensure `npm run build` succeeded first (creates `dist/` folder)
- Check that `electron-main.js` has the correct paths

### Save file not being created
- Check that `%APPDATA%/SpaceEvolution/` directory exists
- Verify IPC handlers are registered in main process
- Check browser console for IPC errors

### Assets not loading in Electron
- Verify `vite.config.ts` has `base: './'`
- Ensure all imports use `.js` extensions

## Phase 1 Complete

✅ Electron wrapper implemented
✅ File-based persistence working
✅ Windows NSIS build configured
✅ Tests passing
⏳ Next: Tasks 1-9 (testing) → Tasks 10-11 (Steam setup & upload)
