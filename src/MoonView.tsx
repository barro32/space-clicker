import { useGameStore, MoonBuildingType } from './useGameStore.js'
import { MOON } from './gameConstants.js'
import { FaMoon, FaRocket, FaWarehouse, FaWrench, FaBolt, FaExclamationTriangle, FaArrowRight, FaIndustry } from 'react-icons/fa'

export function MoonView() {
  const {
    moonStatus,
    moonMissionTicksRemaining,
    moonBuildings,
    moonResources,
    earthResources,
    activeHazard,
    moonLog,
    fuel,
    cargo,
    science,
    lunarComponents,
    researchedNodes,
    startMoonMission,
    buildMoonStructure,
    transportResources,
    clearHazard,
    getMoonStorageCapacity,
    getMoonBuildingCost,
  } = useGameStore()

  const storage = getMoonStorageCapacity()
  const hasLunarManufacturing = researchedNodes.includes('o14')

  // Mission cost check
  const cost = MOON.MISSION_COST
  const canAffordMission = fuel >= cost.fuel && cargo >= cost.cargo && 
                          science >= cost.science && lunarComponents >= cost.lunarComponents

  // Building definitions
  const buildings: { type: MoonBuildingType; name: string; icon: typeof FaIndustry; description: string }[] = [
    { type: 'extractor', name: 'Regolith Extractor', icon: FaIndustry, description: `Produces ${MOON.EXTRACTOR_REGOLITH_RATE} regolith/tick` },
    { type: 'refinery', name: 'Helium-3 Refinery', icon: FaBolt, description: `Converts regolith to He-3` },
    { type: 'silo', name: 'Storage Silo', icon: FaWarehouse, description: `+${MOON.STORAGE_PER_SILO.regolith} regolith, +${MOON.STORAGE_PER_SILO.helium3} He-3 capacity` },
    { type: 'maintenance', name: 'Maintenance Bay', icon: FaWrench, description: `Reduces hazard duration by ${MOON.MAINTENANCE_DURATION_REDUCTION * 100}%` },
    { type: 'massDriver', name: 'Mass Driver', icon: FaArrowRight, description: `Auto-transports resources to Earth` },
  ]

  // Locked state - show requirements
  if (!hasLunarManufacturing) {
    return (
      <div className="terminal-container h-full flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="text-6xl text-gray-600 animate-pulse">
            <FaMoon />
          </div>
          <h2 className="terminal-title text-2xl">LUNAR ACCESS RESTRICTED</h2>
          <div className="terminal-text text-gray-500 max-w-md">
            <p>Research "Lunar Prototype" (o14) required to unlock Moon missions.</p>
            <p className="mt-4 text-xs">Requires: 2000 Science, 1000 Cargo, 50 Lunar Components</p>
          </div>
        </div>
      </div>
    )
  }

  // Ready state - show mission launch interface
  if (moonStatus === 'locked' || moonStatus === 'ready') {
    return (
      <div className="terminal-container h-full flex flex-col">
        {/* Terminal Header */}
        <div className="terminal-header border-b border-green-500/30 pb-4 mb-6">
          <h1 className="terminal-title text-2xl flex items-center gap-3">
            <FaMoon className="text-green-400" />
            LUNAR MISSION CONTROL
          </h1>
          <p className="terminal-text text-green-500/60 text-sm mt-1">STATUS: AWAITING LAUNCH AUTHORIZATION</p>
        </div>

        {/* Mission Brief */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="terminal-panel max-w-lg w-full p-6 space-y-6">
            <h2 className="terminal-text text-lg border-b border-green-500/30 pb-2">MISSION BRIEF: LUNAR LANDING</h2>
            
            <div className="space-y-3 text-sm">
              <p className="text-green-400/80">
                Establish permanent human presence on the Moon. Extract regolith and process Helium-3 
                for future planetary expansion.
              </p>
              
              <div className="border-t border-green-500/20 pt-4">
                <h3 className="text-green-400 mb-2">MISSION REQUIREMENTS:</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex justify-between ${fuel >= cost.fuel ? 'text-green-400' : 'text-red-400'}`}>
                    <span>Fuel:</span>
                    <span>{fuel.toLocaleString()} / {cost.fuel.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between ${cargo >= cost.cargo ? 'text-green-400' : 'text-red-400'}`}>
                    <span>Cargo:</span>
                    <span>{Math.floor(cargo).toLocaleString()} / {cost.cargo.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between ${science >= cost.science ? 'text-green-400' : 'text-red-400'}`}>
                    <span>Science:</span>
                    <span>{Math.floor(science).toLocaleString()} / {cost.science.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between ${lunarComponents >= cost.lunarComponents ? 'text-green-400' : 'text-red-400'}`}>
                    <span>Lunar Components:</span>
                    <span>{Math.floor(lunarComponents).toLocaleString()} / {cost.lunarComponents.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-green-500/20 pt-4">
                <h3 className="text-green-400 mb-2">TRANSIT TIME:</h3>
                <p className="text-green-400/60">{MOON.MISSION_DURATION_BASE} ticks (~{Math.round(MOON.MISSION_DURATION_BASE / 60)} minutes)</p>
              </div>
            </div>
          </div>

          <button
            onClick={startMoonMission}
            disabled={!canAffordMission}
            className={`terminal-button px-8 py-4 text-lg ${
              canAffordMission 
                ? 'bg-green-900/50 border-green-500 text-green-400 hover:bg-green-800/50 animate-pulse' 
                : 'bg-gray-900/50 border-gray-600 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaRocket className="inline mr-3" />
            INITIATE LUNAR LANDING
          </button>
        </div>
      </div>
    )
  }

  // Transit state - show progress
  if (moonStatus === 'transit') {
    const progress = ((MOON.MISSION_DURATION_BASE - moonMissionTicksRemaining) / MOON.MISSION_DURATION_BASE) * 100
    
    return (
      <div className="terminal-container h-full flex flex-col">
        {/* Terminal Header */}
        <div className="terminal-header border-b border-green-500/30 pb-4 mb-6">
          <h1 className="terminal-title text-2xl flex items-center gap-3">
            <FaMoon className="text-green-400" />
            LUNAR MISSION CONTROL
          </h1>
          <p className="terminal-text text-amber-400 text-sm mt-1 animate-pulse">STATUS: MISSION IN PROGRESS</p>
        </div>

        {/* Transit Display */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="terminal-panel max-w-lg w-full p-6 space-y-6">
            <h2 className="terminal-text text-lg text-center">LUNAR LANDER EN ROUTE</h2>
            
            {/* ASCII Progress */}
            <div className="font-mono text-xs text-center space-y-2">
              <div className="text-green-400">
                {'[' + '='.repeat(Math.floor(progress / 5)) + '>'.padEnd(20 - Math.floor(progress / 5), ' ') + ']'}
              </div>
              <div className="text-green-400/60">
                {progress.toFixed(1)}% COMPLETE
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-sm border-t border-green-500/20 pt-4">
              <div>
                <span className="text-green-500/60">ETA:</span>
                <span className="text-green-400 ml-2">{moonMissionTicksRemaining}s</span>
              </div>
              <div>
                <span className="text-green-500/60">Distance:</span>
                <span className="text-green-400 ml-2">{(384400 * (1 - progress / 100)).toFixed(0)} km</span>
              </div>
            </div>

            {/* Telemetry Feed */}
            <div className="border-t border-green-500/20 pt-4">
              <h3 className="text-green-500/60 text-xs mb-2">TELEMETRY FEED:</h3>
              <div className="h-24 overflow-hidden text-xs font-mono">
                {moonLog.slice(0, 5).map((log, i) => (
                  <div key={i} className="text-green-400/70 truncate">{log}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Unlocked state - full mission control interface
  return (
    <div className="terminal-container h-full flex flex-col">
      {/* Terminal Header */}
      <div className="terminal-header border-b border-green-500/30 pb-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="terminal-title text-xl flex items-center gap-3">
              <FaMoon className="text-green-400" />
              LUNAR BASE CONTROL
            </h1>
            <p className="terminal-text text-green-500/60 text-xs mt-1">STATUS: OPERATIONAL</p>
          </div>
          
          {/* Hazard Alert */}
          {activeHazard && (
            <div className="terminal-alert bg-red-900/30 border border-red-500/50 px-4 py-2 rounded animate-pulse">
              <div className="flex items-center gap-2 text-red-400">
                <FaExclamationTriangle />
                <span className="text-sm font-bold">{activeHazard.name}</span>
              </div>
              <div className="text-xs text-red-400/70">
                -{(activeHazard.debuff * 100).toFixed(0)}% production | {activeHazard.ticksRemaining}s remaining
              </div>
              <button
                onClick={clearHazard}
                className="mt-1 text-xs text-red-300 hover:text-red-100 underline"
              >
                Clear (100 Science)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
        {/* Left Panel: Resources */}
        <div className="terminal-panel p-4 space-y-4">
          <h2 className="terminal-text text-sm border-b border-green-500/30 pb-2">MOON STORAGE</h2>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-green-500/60 mb-1">
                <span>Regolith</span>
                <span>{Math.floor(moonResources.regolith)} / {storage.regolith}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded overflow-hidden">
                <div 
                  className="h-full bg-amber-600 transition-all"
                  style={{ width: `${(moonResources.regolith / storage.regolith) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs text-green-500/60 mb-1">
                <span>Helium-3</span>
                <span>{moonResources.helium3.toFixed(1)} / {storage.helium3}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded overflow-hidden">
                <div 
                  className="h-full bg-cyan-500 transition-all"
                  style={{ width: `${(moonResources.helium3 / storage.helium3) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          <div className="border-t border-green-500/20 pt-3">
            <h3 className="text-xs text-green-500/60 mb-2">EARTH RESERVES</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-amber-400">
                <span className="text-green-500/60">Regolith:</span> {Math.floor(earthResources.regolith)}
              </div>
              <div className="text-cyan-400">
                <span className="text-green-500/60">He-3:</span> {earthResources.helium3.toFixed(1)}
              </div>
            </div>
          </div>
          
          <button
            onClick={transportResources}
            disabled={moonResources.regolith === 0 && moonResources.helium3 === 0}
            className="terminal-button w-full py-2 text-xs"
          >
            MANUAL TRANSPORT TO EARTH
          </button>
        </div>

        {/* Center Panel: Buildings */}
        <div className="terminal-panel p-4 space-y-3 overflow-y-auto">
          <h2 className="terminal-text text-sm border-b border-green-500/30 pb-2">INFRASTRUCTURE</h2>
          
          {buildings.map(({ type, name, icon: Icon, description }) => {
            const cost = getMoonBuildingCost(type)
            const count = moonBuildings[type === 'massDriver' ? 'massDrivers' : `${type}s` as keyof typeof moonBuildings]
            const canAfford = cargo >= cost.cargo && science >= cost.science && 
                            (!cost.regolith || moonResources.regolith >= cost.regolith)
            
            return (
              <div key={type} className="border border-green-500/20 rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="text-green-400" />
                    <span className="text-green-400 text-sm">{name}</span>
                  </div>
                  <span className="text-green-500/60 text-xs">x{count}</span>
                </div>
                <p className="text-xs text-green-500/50 mb-2">{description}</p>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-green-500/60">
                    {cost.cargo.toLocaleString()}C {cost.science.toLocaleString()}S {cost.regolith > 0 && `${cost.regolith.toLocaleString()}R`}
                  </div>
                  <button
                    onClick={() => buildMoonStructure(type)}
                    disabled={!canAfford}
                    className={`terminal-button-sm px-3 py-1 text-xs ${canAfford ? '' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    BUILD
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Panel: Log */}
        <div className="terminal-panel p-4 flex flex-col">
          <h2 className="terminal-text text-sm border-b border-green-500/30 pb-2 mb-3">SYSTEM LOG</h2>
          
          <div className="flex-1 overflow-y-auto text-xs font-mono space-y-1">
            {moonLog.length === 0 ? (
              <div className="text-green-500/40">No activity logged.</div>
            ) : (
              moonLog.map((log, i) => (
                <div key={i} className="text-green-400/70 leading-tight">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
