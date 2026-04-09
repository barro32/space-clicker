import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { homedir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let mainWindow

// Save file directory: %APPDATA%/SpaceEvolution/ (Windows), ~/.SpaceEvolution/ (macOS/Linux)
const getSaveDirectory = () => {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA || homedir(), 'SpaceEvolution')
  }
  return join(homedir(), '.SpaceEvolution')
}

const SAVE_DIR = getSaveDirectory()
const SAVE_FILE = join(SAVE_DIR, 'gameSave.json')

// Ensure save directory exists
if (!existsSync(SAVE_DIR)) {
  mkdirSync(SAVE_DIR, { recursive: true })
}

// IPC Handler: Load game state from file
ipcMain.handle('load-game-state', () => {
  try {
    if (existsSync(SAVE_FILE)) {
      const data = readFileSync(SAVE_FILE, 'utf-8')
      return JSON.parse(data)
    }
    return null
  } catch (error) {
    console.error('Failed to load game state:', error)
    return null
  }
})

// IPC Handler: Save game state to file
ipcMain.handle('save-game-state', (event, state) => {
  try {
    writeFileSync(SAVE_FILE, JSON.stringify(state, null, 2))
    return true
  } catch (error) {
    console.error('Failed to save game state:', error)
    return false
  }
})

// IPC Handler: Delete game state file
ipcMain.handle('delete-game-state', () => {
  try {
    if (existsSync(SAVE_FILE)) {
      unlinkSync(SAVE_FILE)
    }
    return true
  } catch (error) {
    console.error('Failed to delete game state:', error)
    return false
  }
})

// IPC Handler: Toggle fullscreen mode
ipcMain.handle('toggle-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen())
    return !mainWindow.isFullScreen()
  }
  return false
})

// IPC Handler: Get fullscreen state
ipcMain.handle('get-fullscreen-state', () => {
  if (mainWindow) {
    return mainWindow.isFullScreen()
  }
  return false
})

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'electron-preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
  })

  // Load the app from dist directory (built by Vite)
  const startUrl =
    process.env.VITE_DEV_SERVER_URL ||
    `file://${join(__dirname, '../dist/index.html')}`

  mainWindow.loadURL(startUrl)

  // Open DevTools in development
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  // On macOS, apps typically stay active until the user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked and no windows are open
  if (mainWindow === null) {
    createWindow()
  }
})
