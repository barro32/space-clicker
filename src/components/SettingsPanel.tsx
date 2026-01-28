import React, { useEffect, useState } from 'react'
import { useGameStore } from '../useGameStore.js'
import { DEFAULT_SETTINGS } from '../gameConstants.js'
import { MdClose } from 'react-icons/md'

interface SettingsPanelProps {
  onClose: () => void
}

// Check if running in Electron
const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electronAPI !== undefined
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const settings = useGameStore(state => state.settings)
  const updateSettings = useGameStore(state => state.updateSettings)
  const resetSettings = useGameStore(state => state.resetSettings)
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)
  const [isCurrentlyFullscreen, setIsCurrentlyFullscreen] = useState(false)

  // Initialize fullscreen support
  useEffect(() => {
    if (isElectron()) {
      setIsFullscreenSupported(true)
      // Get current fullscreen state from Electron
      ;(window as any).electronAPI.getFullscreenState().then((state: boolean) => {
        setIsCurrentlyFullscreen(state)
      })
    }
  }, [])

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleToggleFullscreen = async () => {
    if (isElectron()) {
      try {
        const newState = await (window as any).electronAPI.toggleFullscreen()
        setIsCurrentlyFullscreen(newState)
        updateSettings({ fullscreen: newState })
      } catch (error) {
        console.error('Failed to toggle fullscreen:', error)
      }
    }
  }

  const handleResetGame = () => {
    if (confirm('Are you sure you want to reset your game progress? This cannot be undone.')) {
      // Reset the game by creating a new store instance
      useGameStore.setState(state => {
        // Return initial state from INITIAL_STATE
        return {
          money: 10,
          science: 0,
          fuel: 100,
          cargo: 0,
          lunarComponents: 0,
          tickCount: 0,
          notifications: [],
          totalSuccessfulLaunches: 0,
          orbitLayerUnlocked: false,
          contractsLayerUnlocked: false,
          companies: [],
          availableContracts: [],
          activeContracts: [],
          contractRefreshTimer: 0,
          rockets: [],
          nextRocketId: 0,
          rocketCost: 1,
          profitPerRocket: 1,
          spaceportCapacity: 1,
          spaceports: [],
          spaceStations: [],
          spaceportCost: 200,
          fuelRefineries: 0,
          fuelProductionPerRefinery: 1,
          fuelCostPerRocket: 1,
          fuelRefineryCost: 20,
          explodedRocketIds: [],
          rocketExplosionChance: 0.5,
          recentlyLaunchedRocketIds: [],
          newlyAvailableResearchIds: [],
          satellites: 0,
          maxSatellites: 10,
          spaceDebris: [],
          transitRockets: [],
          dockedRockets: [],
          moonStatus: 'locked' as const,
          moonMissionTicksRemaining: 0,
          moonBuildings: { extractors: 0, refineries: 0, silos: 0, maintenance: 0, massDrivers: 0, solarArray: 0, nuclearReactor: 0, battery: 0, fabricator: 0 },
          moonResources: { regolith: 0, helium3: 0, alloys: 0 },
          earthResources: { regolith: 0, helium3: 0, alloys: 0 },
          activeHazard: null,
          moonLog: [],
          moonSectors: [{ id: 'starting-sector', name: 'Landing Zone', traits: {}, buildings: {}, slots: 4, slotsUsed: 0 }],
          moonPowerSystem: { dayNightTick: 0, isDay: true, currentEnergy: 200, maxEnergy: 200, energyGeneration: 0, energyDemand: 0 },
          moonBounties: [],
           moonBountyRefreshTimer: 120,
           researchedNodes: [],
           previouslyAvailableResearch: [],
           autoBuildActive: false,
           autoSalvageActive: false,
           bonusFuelCapacity: 0,
           currentView: 'surface' as const,
         }
      })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 border border-cyan-500/50 rounded-xl p-8 max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-cyan-400">Settings</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors p-1"
            aria-label="Close settings"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Sound Muted Toggle */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.soundMuted}
              onChange={(e) => updateSettings({ soundMuted: e.target.checked })}
              className="mr-3 w-4 h-4 cursor-pointer"
            />
            <span className="text-gray-300">🔊 Sound Muted</span>
          </label>
          <p className="text-sm text-gray-500 ml-7 mt-1">Mute all sound effects (when audio is implemented)</p>
        </div>

        {/* Fullscreen Toggle (Electron only) */}
        {isFullscreenSupported && (
          <>
            <div className="mb-6">
              <button
                onClick={handleToggleFullscreen}
                className="w-full px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 hover:border-cyan-500 text-cyan-300 hover:text-cyan-200 rounded-lg transition-all font-semibold"
              >
                {isCurrentlyFullscreen ? '⛶ Exit Fullscreen' : '⛶ Enter Fullscreen'}
              </button>
              <p className="text-sm text-gray-500 mt-2">{isCurrentlyFullscreen ? 'Exit fullscreen mode' : 'Play in fullscreen mode'}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 my-6"></div>
          </>
        )}

        {/* Reset Game */}
        <div className="mb-6">
          <button
            onClick={handleResetGame}
            className="w-full px-4 py-3 bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 hover:border-red-500 text-red-300 hover:text-red-200 rounded-lg transition-all font-semibold"
          >
            🗑️ Reset Game Progress
          </button>
          <p className="text-sm text-gray-500 mt-2">Clear your save and start a new game. This cannot be undone.</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-6"></div>

        {/* Info */}
        <div className="text-sm text-gray-500">
          <p className="mb-2">ℹ️ <strong>Coming Soon:</strong></p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Game speed controls</li>
            <li>Visual preferences</li>
            <li>Autosave settings</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 mt-6 pt-4 text-xs text-gray-600 text-center">
          <p>Press ESC to close settings</p>
        </div>
      </div>
    </div>
  )
}
