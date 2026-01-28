import { contextBridge, ipcRenderer } from 'electron'

// Expose safe IPC methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  loadGameState: () => ipcRenderer.invoke('load-game-state'),
  saveGameState: (state) => ipcRenderer.invoke('save-game-state', state),
  deleteGameState: () => ipcRenderer.invoke('delete-game-state'),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getFullscreenState: () => ipcRenderer.invoke('get-fullscreen-state'),
})
