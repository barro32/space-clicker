/**
 * Persistence utility for cross-platform save/load
 * Supports both web (localStorage) and Electron (file-based) environments
 */

interface GameSaveState {
  [key: string]: any
}

// Check if we're running in Electron
export const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electronAPI !== undefined
}

/**
 * Synchronously load game state from localStorage
 * NOTE: This only works in web environment. For Electron, use loadGameStateAsync
 */
export function loadGameStateSync(): GameSaveState | null {
  try {
    if (isElectron()) {
      // In Electron, we cannot load synchronously. Return null and load async later.
      return null
    }
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
      return null
    }
    const savedState = localStorage.getItem('gameState')
    return savedState ? JSON.parse(savedState) : null
  } catch (error) {
    console.error('Failed to load game state (sync):', error)
    return null
  }
}

/**
 * Asynchronously load game state from storage
 * In Electron: Loads from file via IPC
 * In Web: Loads from localStorage
 */
export async function loadGameStateAsync(): Promise<GameSaveState | null> {
  try {
    if (isElectron()) {
      const state = await (window as any).electronAPI.loadGameState()
      return state
    } else {
      if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
        return null
      }
      const savedState = localStorage.getItem('gameState')
      return savedState ? JSON.parse(savedState) : null
    }
  } catch (error) {
    console.error('Failed to load game state (async):', error)
    return null
  }
}

/**
 * Save game state to storage (async for Electron compatibility)
 * In Electron: Saves to file via IPC
 * In Web: Saves to localStorage
 */
export async function saveGameState(state: GameSaveState): Promise<boolean> {
  try {
    if (isElectron()) {
      return await (window as any).electronAPI.saveGameState(state)
    } else {
      if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') {
        return false
      }
      localStorage.setItem('gameState', JSON.stringify(state))
      return true
    }
  } catch (error) {
    console.error('Failed to save game state:', error)
    return false
  }
}

/**
 * Delete game state (for new game)
 * In Electron: Deletes file via IPC
 * In Web: Removes localStorage entry
 */
export async function deleteGameState(): Promise<boolean> {
  try {
    if (isElectron()) {
      return await (window as any).electronAPI.deleteGameState()
    } else {
      if (typeof localStorage === 'undefined' || typeof localStorage.removeItem !== 'function') {
        return false
      }
      localStorage.removeItem('gameState')
      return true
    }
  } catch (error) {
    console.error('Failed to delete game state:', error)
    return false
  }
}
