# Running Electron Development Environment

## Two-Terminal Setup (Required)

The Electron app needs the Vite dev server to be running. They must be started in separate terminals:

### Terminal 1: Start Vite Dev Server
```bash
npm run dev
```

This starts the dev server at `http://localhost:5173/` with Hot Module Replacement (HMR).

**Expected output:**
```
  VITE v7.2.2  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Terminal 2: Start Electron App
Wait for Terminal 1 to show "ready", then in a new terminal:

```bash
npm run dev:electron
```

This launches the Electron app connected to the dev server.

**Expected output:**
```
[PID:123456] electron: Loading URL: http://localhost:5173/
```

## Troubleshooting

### "ERR_CONNECTION_REFUSED" Error
- **Cause**: Vite dev server not running in Terminal 1
- **Fix**: Start `npm run dev` first, wait for "ready" message, then run `npm run dev:electron`

### Electron window opens but shows blank screen
- Check that Vite server is running (should see "ready" message)
- Check browser console (Shift+F12 in Electron window) for errors
- Check terminal output for IPC errors

### Changes not hot-reloading
- Electron HMR should work automatically from the Vite dev server
- If not working, close Electron window and restart `npm run dev:electron`

### Port 5173 already in use
If another process is using port 5173, you can specify a different port:
```bash
npm run dev -- --port 5174
```

Then modify the Electron command:
```bash
cross-env VITE_DEV_SERVER_URL=http://localhost:5174 electron .
```

## Testing Persistence

While running the dev environment:

1. **Test Save**: Click around the game for 30+ seconds (auto-save interval)
2. **Check Save File**: Open file explorer to `%APPDATA%/SpaceEvolution/gameSave.json`
3. **Verify File**: Should contain JSON game state (readable format)
4. **Test Load**: Close and reopen Electron app - game state should be restored
5. **Test Reset**: Use DevConsole "Reset State" button to test delete functionality

## Building for Distribution

When ready to build the Windows installer (requires Windows or Wine):

```bash
npm run build:electron
```

Output: `dist/Space Evolution Setup 1.0.0.exe`

The installer can be shared directly to users or uploaded to Steam via SteamPipe.
