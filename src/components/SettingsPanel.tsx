import React, { useEffect, useState } from 'react'
import { useGameStore } from '../useGameStore.js'
import { INITIAL_STATE, DEFAULT_SETTINGS, DEFAULT_COMPANIES } from '../gameConstants.js'
import { MdClose } from 'react-icons/md'
import { deleteGameState } from '../persistence.js'

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
  const [showDevConsole, setShowDevConsole] = useState(false)

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

  const handleResetGame = async () => {
    if (confirm('Are you sure you want to reset your game progress? This cannot be undone.')) {
      // Clear game state (localStorage or Electron file)
      await deleteGameState();
      
      // Reset the Zustand store to initial defaults
      useGameStore.setState({
        money: INITIAL_STATE.MONEY,
        science: INITIAL_STATE.SCIENCE,
        fuel: INITIAL_STATE.FUEL,
        bonusFuelCapacity: 0,
        cargo: INITIAL_STATE.CARGO,
        tickCount: 0,
        currentView: "surface",
        notifications: [],
        // Layer unlock tracking
        totalSuccessfulLaunches: 0,
        orbitLayerUnlocked: false,
        contractsLayerUnlocked: false,
        rockets: [],
        nextRocketId: 0,
        rocketCost: INITIAL_STATE.ROCKET_COST,
        profitPerRocket: INITIAL_STATE.PROFIT_PER_ROCKET,
        spaceportCapacity: INITIAL_STATE.SPACEPORT_CAPACITY,
        spaceports: [{ id: 1 }],
        spaceStations: [],
        spaceportCost: INITIAL_STATE.SPACEPORT_COST,
        fuelRefineries: 0,
        fuelProductionPerRefinery: INITIAL_STATE.FUEL_PRODUCTION_PER_REFINERY,
        fuelCostPerRocket: INITIAL_STATE.FUEL_COST_PER_ROCKET,
        fuelRefineryCost: INITIAL_STATE.FUEL_REFINERY_COST,
        explodedRocketIds: [],
        rocketExplosionChance: INITIAL_STATE.ROCKET_EXPLOSION_CHANCE,
        recentlyLaunchedRocketIds: [],
        newlyAvailableResearchIds: [],
        researchedNodes: [],
        previouslyAvailableResearch: [],
        autoBuildActive: false,
        autoSalvageActive: false,
        companies: DEFAULT_COMPANIES.map(c => ({ ...c })),
        availableContracts: [],
        activeContracts: [],
        contractRefreshTimer: INITIAL_STATE.CONTRACT_REFRESH_INTERVAL,
      })
      onClose()
    }
  }

  // Dev console handlers
  const handleDevReset = async () => {
    // Clear game state (localStorage or Electron file)
    await deleteGameState();
    
    // Reset the Zustand store to initial defaults
    useGameStore.setState({
      money: INITIAL_STATE.MONEY,
      science: INITIAL_STATE.SCIENCE,
      fuel: INITIAL_STATE.FUEL,
      bonusFuelCapacity: 0,
      cargo: INITIAL_STATE.CARGO,
      tickCount: 0,
      currentView: "surface",
      notifications: ['Game state reset to defaults'],
      // Layer unlock tracking
      totalSuccessfulLaunches: 0,
      orbitLayerUnlocked: false,
      contractsLayerUnlocked: false,
      rockets: [],
      nextRocketId: 0,
      rocketCost: INITIAL_STATE.ROCKET_COST,
      profitPerRocket: INITIAL_STATE.PROFIT_PER_ROCKET,
      spaceportCapacity: INITIAL_STATE.SPACEPORT_CAPACITY,
      spaceports: [{ id: 1 }],
      spaceStations: [],
      spaceportCost: INITIAL_STATE.SPACEPORT_COST,
      fuelRefineries: 0,
      fuelProductionPerRefinery: INITIAL_STATE.FUEL_PRODUCTION_PER_REFINERY,
      fuelCostPerRocket: INITIAL_STATE.FUEL_COST_PER_ROCKET,
      fuelRefineryCost: INITIAL_STATE.FUEL_REFINERY_COST,
      explodedRocketIds: [],
      rocketExplosionChance: INITIAL_STATE.ROCKET_EXPLOSION_CHANCE,
      recentlyLaunchedRocketIds: [],
      newlyAvailableResearchIds: [],
      researchedNodes: [],
      previouslyAvailableResearch: [],
      autoBuildActive: false,
      autoSalvageActive: false,
      companies: DEFAULT_COMPANIES.map(c => ({ ...c })),
      availableContracts: [],
      activeContracts: [],
      contractRefreshTimer: INITIAL_STATE.CONTRACT_REFRESH_INTERVAL,
    });
  }

  const handleDevSetExplosionChance = () => {
    useGameStore.setState({ rocketExplosionChance: 0 });
  }

  const handleDevAddMoney = () => {
    const currentMoney = useGameStore.getState().money;
    useGameStore.setState({ money: currentMoney + 1000 });
  }

  const handleDevAddScience = () => {
    const currentScience = useGameStore.getState().science;
    useGameStore.setState({ science: currentScience + 1000 });
  }

  const handleDevRefreshContracts = () => {
    useGameStore.getState().generateContracts();
  }

  const handleDevAddFuelAndCapacity = () => {
    const state = useGameStore.getState();
    useGameStore.setState({
      fuel: state.fuel + 1000,
      bonusFuelCapacity: state.bonusFuelCapacity + 1000,
    });
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

        {/* Dev Console Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowDevConsole(!showDevConsole)}
            className="w-full px-4 py-2 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 hover:border-gray-600 text-gray-300 hover:text-gray-200 rounded-lg transition-all font-semibold text-sm"
          >
            {showDevConsole ? '▼ Hide Dev Console' : '▶ Show Dev Console'}
          </button>
        </div>

        {/* Dev Console */}
        {showDevConsole && (
          <div className="mb-6 p-4 bg-gray-800/80 border border-gray-700 rounded-lg">
            <h3 className="text-sm font-bold text-yellow-400 mb-3">Development Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDevAddMoney}
                className="px-2 py-1 bg-blue-600/70 hover:bg-blue-600 border border-blue-500/50 text-blue-200 text-xs rounded transition-colors"
              >
                +1000 💰
              </button>
              <button
                onClick={handleDevAddScience}
                className="px-2 py-1 bg-purple-600/70 hover:bg-purple-600 border border-purple-500/50 text-purple-200 text-xs rounded transition-colors"
              >
                +1000 🔬
              </button>
              <button
                onClick={handleDevAddFuelAndCapacity}
                className="px-2 py-1 bg-cyan-600/70 hover:bg-cyan-600 border border-cyan-500/50 text-cyan-200 text-xs rounded transition-colors"
              >
                +1000 ⛽
              </button>
              <button
                onClick={handleDevSetExplosionChance}
                className="px-2 py-1 bg-red-600/70 hover:bg-red-600 border border-red-500/50 text-red-200 text-xs rounded transition-colors"
              >
                0% 💥
              </button>
              <button
                onClick={handleDevRefreshContracts}
                className="px-2 py-1 bg-orange-600/70 hover:bg-orange-600 border border-orange-500/50 text-orange-200 text-xs rounded transition-colors col-span-2"
              >
                Refresh Contracts 📋
              </button>
              <button
                onClick={handleDevReset}
                className="px-2 py-1 bg-red-700/70 hover:bg-red-700 border border-red-600/50 text-red-100 text-xs rounded transition-colors col-span-2"
              >
                Reset All 🔄
              </button>
            </div>
          </div>
        )}

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
