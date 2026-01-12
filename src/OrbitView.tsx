import { useState, useMemo, useEffect, useRef } from "react"
import { useGameStore, SpaceStation } from "./useGameStore.js"
import { FaSatellite, FaGlobe, FaMicroscope, FaTruckLoading, FaRocket, FaFlask, FaArrowUp, FaTimes, FaExclamationTriangle, FaMoon, FaInfoCircle } from "react-icons/fa"
import { ORBITAL, PRODUCTION } from "./gameConstants.js"

export function OrbitView() {
  const { 
    spaceStations, 
    buildSpaceStation, 
    upgradeStation,
    cargo, 
    science,
    lunarComponents,
    satellites,
    maxSatellites,
    launchSatellite,
    spaceDebris,
    clearDebris,
    transitRockets,
    dockedRockets,
    getEffectMultiplier,
    getCompanyPerkValue,
  } = useGameStore()
  
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null)
  const [hoveredStationId, setHoveredStationId] = useState<string | null>(null)
  const [recentDockings, setRecentDockings] = useState<{ stationId: string; timestamp: number }[]>([])
  const prevDockedRocketsRef = useRef<typeof dockedRockets>([])
  
  // Track new dockings for visual feedback
  useEffect(() => {
    const prevIds = new Set(prevDockedRocketsRef.current.map(d => d.rocketId))
    const newDockings = dockedRockets.filter(d => !prevIds.has(d.rocketId))
    
    if (newDockings.length > 0) {
      const now = Date.now()
      setRecentDockings(prev => [
        ...prev.filter(d => now - d.timestamp < 1500), // Keep only recent ones
        ...newDockings.map(d => ({ stationId: d.stationId, timestamp: now }))
      ])
    }
    
    prevDockedRocketsRef.current = dockedRockets
  }, [dockedRockets])
  
   // Clean up old docking animations
   useEffect(() => {
     const interval = setInterval(() => {
       const now = Date.now()
       setRecentDockings(prev => prev.filter(d => now - d.timestamp < 1500))
     }, 500)
     return () => clearInterval(interval)
   }, [recentDockings])
  
  // Get fresh station data from store
  const selectedStation = selectedStationId ? spaceStations.find(s => s.id === selectedStationId) || null : null
  const hoveredStation = hoveredStationId ? spaceStations.find(s => s.id === hoveredStationId) || null : null
  
  // Check research unlocks
  const satellitesUnlocked = getEffectMultiplier('unlockSatellites') > 0
  const hasDebrisImmunity = getEffectMultiplier('debrisImmunity') > 0
  
  // Calculate current max satellites with research bonuses
  const effectiveMaxSatellites = ORBITAL.MAX_SATELLITES_BASE + getEffectMultiplier('maxSatellitesBonus')
  
  // Cost calculations
  const canAffordStation = cargo >= ORBITAL.STATION_COST_CARGO && science >= ORBITAL.STATION_COST_SCIENCE
  const canAffordSatellite = cargo >= ORBITAL.SATELLITE_COST_CARGO && science >= ORBITAL.SATELLITE_COST_SCIENCE && satellites < effectiveMaxSatellites
  
  // Calculate debris penalty
  const debrisPenalty = hasDebrisImmunity ? 0 : Math.min(spaceDebris.length * ORBITAL.DEBRIS_PENALTY_PER_PIECE * 100, ORBITAL.MAX_DEBRIS_PENALTY * 100)
  
  // Calculate current lunar component production rate
  const lunarProductionMultiplier = getEffectMultiplier('lunarProductionMultiplier') || 1
  const satelliteBonus = 1 + (satellites * ORBITAL.SATELLITE_GLOBAL_BONUS * (getEffectMultiplier('satelliteBonusMultiplier') || 1))
  const debrisMultiplier = hasDebrisImmunity ? 1 : (1 - debrisPenalty / 100)
  
  // Station output multipliers (matching tick() calculation)
  const stationBonusMultiplier = getCompanyPerkValue('stationBonusMultiplier') || 1
  const dockingBonusMultiplier = getEffectMultiplier('dockingBonusMultiplier') || ORBITAL.DOCKING_BONUS_MULTIPLIER
  const stationScienceMultiplier = getEffectMultiplier('stationScienceMultiplier') || 1
  const stationLogisticsMultiplier = getEffectMultiplier('stationLogisticsMultiplier') || 1
  
  // Helper to calculate effective station output
  const getEffectiveStationOutput = (station: typeof spaceStations[0]) => {
    const dockedCount = dockedRockets.filter(d => d.stationId === station.id).length
    const stationDockingBonus = dockedCount > 0 ? 1 + (dockedCount * (dockingBonusMultiplier - 1)) : 1
    
    if (station.type === 'research') {
      const baseOutput = PRODUCTION.STATION_SCIENCE_BONUS * station.level
      const withMultipliers = baseOutput * stationScienceMultiplier * stationBonusMultiplier
      const effective = withMultipliers * stationDockingBonus * debrisMultiplier * satelliteBonus
      return { base: baseOutput, effective: effective, unit: 'Sci' }
    } else {
      const baseOutput = PRODUCTION.STATION_LOGISTICS_BONUS * station.level
      const withMultipliers = baseOutput * stationLogisticsMultiplier * stationBonusMultiplier
      const effective = withMultipliers * stationDockingBonus * debrisMultiplier * satelliteBonus
      return { base: baseOutput, effective: effective, unit: '$' }
    }
  }
  
  let currentLunarProduction = 0
  spaceStations.forEach(station => {
    if (station.type === 'research') {
      const dockedCount = dockedRockets.filter(d => d.stationId === station.id).length
      if (dockedCount > 0) {
        currentLunarProduction += dockedCount * ORBITAL.LUNAR_COMPONENT_PRODUCTION_RATE * station.level * lunarProductionMultiplier
      }
    }
  })
  currentLunarProduction *= satelliteBonus * debrisMultiplier

  // Calculate total production rates from all stations
  const totalProduction = useMemo(() => {
    let totalScience = 0
    let totalMoney = 0
    
    spaceStations.forEach(station => {
      const output = getEffectiveStationOutput(station)
      if (station.type === 'research') {
        totalScience += output.effective
      } else {
        totalMoney += output.effective
      }
    })
    
    return { science: totalScience, money: totalMoney }
  }, [spaceStations, dockedRockets, satelliteBonus, debrisMultiplier, stationScienceMultiplier, stationLogisticsMultiplier, stationBonusMultiplier, dockingBonusMultiplier])

  // Calculate incoming rockets per station
  const incomingRocketsPerStation = useMemo(() => {
    const counts: Record<string, number> = {}
    transitRockets.forEach(t => {
      counts[t.targetStationId] = (counts[t.targetStationId] || 0) + 1
    })
    return counts
  }, [transitRockets])

  // Orbit ring radii
  const SATELLITE_RING_RADIUS = 100
  const STATION_RING_RADIUS = 160

  // Memoize debris positions to prevent recalculation on every render
  const debrisPositions = useMemo(() => {
    return spaceDebris.map((debris) => {
      const angleRad = (debris.angle / 180) * Math.PI
      // Use debris id to create a deterministic offset
      const idHash = debris.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      const radius = STATION_RING_RADIUS + 20 + (idHash % 10)
      const x = Math.cos(angleRad) * radius
      const y = Math.sin(angleRad) * radius
      return { id: debris.id, x, y }
    })
  }, [spaceDebris])

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Main Orbital Display */}
      <div className="relative w-[400px] h-[400px] flex items-center justify-center">
        {/* Planet Core */}
        <div className="absolute w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center z-20">
          <FaGlobe className="text-4xl text-blue-200" />
        </div>
        
        {/* Inner Ring - Satellites */}
        <div 
          className="absolute rounded-full border border-dashed border-cyan-500/30"
          style={{ width: SATELLITE_RING_RADIUS * 2, height: SATELLITE_RING_RADIUS * 2 }}
        />
        
        {/* Satellite swarm visualization */}
        {Array.from({ length: satellites }).map((_, i) => {
          const angle = (i / Math.max(satellites, 1)) * 2 * Math.PI
          const x = Math.cos(angle) * SATELLITE_RING_RADIUS
          const y = Math.sin(angle) * SATELLITE_RING_RADIUS
          return (
            <div
              key={`sat-${i}`}
              className="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse z-10"
              style={{
                transform: `translate(${x}px, ${y}px)`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          )
        })}
        
        {/* Outer Ring - Stations */}
        <div 
          className="absolute rounded-full border-2 border-dashed border-gray-600/50"
          style={{ width: STATION_RING_RADIUS * 2, height: STATION_RING_RADIUS * 2 }}
        />
        
        {/* Space Debris */}
        {debrisPositions.map((debris) => (
          <div
            key={debris.id}
            className="absolute cursor-pointer z-30"
            style={{ 
              left: `calc(50% + ${debris.x}px - 8px)`,
              top: `calc(50% + ${debris.y}px - 8px)`,
            }}
            onClick={() => clearDebris(debris.id)}
            title="Click to clear debris (+2 Science)"
          >
            <div className="w-4 h-4 bg-gray-500 rounded-sm rotate-45 border border-orange-500/50 animate-spin-slow hover:scale-150 hover:border-orange-400 transition-transform" />
          </div>
        ))}
        
        {/* Transit Rockets (animating from center to stations) */}
        {transitRockets.map((transit) => {
          const targetStation = spaceStations.find(s => s.id === transit.targetStationId)
          if (!targetStation) return null
          
          const stationIndex = spaceStations.indexOf(targetStation)
          const angle = (stationIndex / Math.max(spaceStations.length, 1)) * 2 * Math.PI
          // Progress: 0 = just launched (at center), 1 = arrived (at station)
          const progress = 1 - (transit.ticksRemaining / ORBITAL.TRANSIT_DURATION_TICKS)
          // Start from center (0) and move outward to station ring
          const currentRadius = STATION_RING_RADIUS * progress
          const x = Math.cos(angle) * currentRadius
          const y = Math.sin(angle) * currentRadius
          
          return (
            <div
              key={`transit-${transit.id}`}
              className="absolute z-40"
              style={{ 
                transform: `translate(${x}px, ${y}px)`,
                transition: 'transform 0.1s linear'
              }}
            >
              {transit.type === 'science' ? (
                <FaFlask className="text-purple-400 text-lg animate-pulse" />
              ) : (
                <FaRocket className="text-orange-400 text-lg animate-pulse" style={{ transform: 'rotate(-45deg)' }} />
              )}
            </div>
          )
        })}
        
        {/* Space Stations */}
        {spaceStations.map((station, index) => {
          const angle = (index / Math.max(spaceStations.length, 1)) * 2 * Math.PI
          const x = Math.cos(angle) * STATION_RING_RADIUS
          const y = Math.sin(angle) * STATION_RING_RADIUS
          const dockedCount = dockedRockets.filter(d => d.stationId === station.id).length
          const incomingCount = incomingRocketsPerStation[station.id] || 0
          const isSelected = selectedStation?.id === station.id
          const isHovered = hoveredStationId === station.id
          const justDocked = recentDockings.some(d => d.stationId === station.id)
          const stationOutput = getEffectiveStationOutput(station)

          return (
            <div 
              key={station.id}
              className={`absolute z-30 cursor-pointer transition-all duration-300 ${isSelected ? 'scale-125' : 'hover:scale-110'}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              onClick={() => setSelectedStationId(isSelected ? null : station.id)}
              onMouseEnter={() => setHoveredStationId(station.id)}
              onMouseLeave={() => setHoveredStationId(null)}
            >
              {/* Docking flash effect */}
              {justDocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-16 h-16 rounded-full animate-ping opacity-50 ${
                    station.type === 'research' ? 'bg-blue-400' : 'bg-green-400'
                  }`} />
                </div>
              )}
              
              {/* Station Icon */}
              <div className={`p-2.5 rounded-full border-2 transition-all ${
                station.type === 'research' 
                  ? 'border-blue-400 bg-blue-900/80' 
                  : 'border-green-400 bg-green-900/80'
              } ${isSelected ? 'ring-2 ring-white/50' : ''} ${justDocked ? 'ring-4 ring-yellow-400/80' : ''}`}>
                {station.type === 'research' 
                  ? <FaMicroscope className="text-xl text-blue-300" /> 
                  : <FaTruckLoading className="text-xl text-green-300" />
                }
              </div>
              
              {/* Docked Rockets Indicator */}
              {dockedCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {dockedCount}
                </div>
              )}
              
              {/* Incoming Rockets Indicator */}
              {incomingCount > 0 && (
                <div className="absolute -top-1 -left-1 bg-purple-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {incomingCount}
                </div>
              )}
              
              {/* Level Badge */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap bg-black/80 px-1.5 py-0.5 rounded border border-gray-700">
                L{station.level} | {dockedCount}/{station.maxDocks}
              </div>
              
              {/* Hover Tooltip */}
              {isHovered && !isSelected && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
                  <div className={`bg-gray-900/95 border rounded-lg p-2.5 shadow-xl min-w-[140px] ${
                    station.type === 'research' ? 'border-blue-500/50' : 'border-green-500/50'
                  }`}>
                    <div className={`font-bold text-sm ${station.type === 'research' ? 'text-blue-400' : 'text-green-400'}`}>
                      {station.type === 'research' ? 'Research' : 'Logistics'} L{station.level}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Output: <span className={station.type === 'research' ? 'text-blue-300' : 'text-green-300'}>
                        {stationOutput.unit === '$' ? `$${stationOutput.effective.toFixed(1)}` : `${stationOutput.effective.toFixed(1)} Sci`}/tick
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Docked: {dockedCount}/{station.maxDocks}
                    </div>
                    {incomingCount > 0 && (
                      <div className="text-xs text-purple-400 mt-0.5">
                        Incoming: {incomingCount} rocket{incomingCount > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Debris Warning */}
      {spaceDebris.length > 0 && !hasDebrisImmunity && (
        <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-900/30 px-3 py-1.5 rounded border border-orange-500/50">
          <FaExclamationTriangle />
          <span>Debris reducing output by {debrisPenalty.toFixed(0)}%</span>
          <span className="text-gray-400">({spaceDebris.length} pieces - click to clear)</span>
        </div>
      )}
      
      {/* Selected Station Panel */}
      {selectedStation && (
        <div className="bg-gray-800/90 border border-gray-600 rounded-lg p-4 w-full max-w-md">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className={`font-bold ${selectedStation.type === 'research' ? 'text-blue-400' : 'text-green-400'}`}>
                {selectedStation.type === 'research' ? 'Research' : 'Logistics'} Station
              </div>
              <div className="text-gray-400 text-sm">Level {selectedStation.level}</div>
            </div>
            <button 
              onClick={() => setSelectedStationId(null)}
              className="text-gray-500 hover:text-white"
            >
              <FaTimes />
            </button>
          </div>
          
          {/* Station Stats */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div className="bg-black/30 rounded p-2">
              <div className="text-gray-500 text-xs">Base Output/tick</div>
              <div className={selectedStation.type === 'research' ? 'text-blue-400' : 'text-green-400'}>
                {selectedStation.type === 'research' 
                  ? `+${PRODUCTION.STATION_SCIENCE_BONUS * selectedStation.level} Sci`
                  : `+$${PRODUCTION.STATION_LOGISTICS_BONUS * selectedStation.level}`
                }
              </div>
            </div>
            <div className="bg-black/30 rounded p-2">
              <div className="text-gray-500 text-xs">Docking Slots</div>
              <div className="text-yellow-400">
                {dockedRockets.filter(d => d.stationId === selectedStation.id).length}/{selectedStation.maxDocks}
              </div>
            </div>
          </div>
          
          {/* Effective Output Breakdown */}
          {(() => {
            const output = getEffectiveStationOutput(selectedStation)
            const dockedCount = dockedRockets.filter(d => d.stationId === selectedStation.id).length
            const stationDockingBonus = dockedCount > 0 ? 1 + (dockedCount * (dockingBonusMultiplier - 1)) : 1
            const typeMultiplier = selectedStation.type === 'research' ? stationScienceMultiplier : stationLogisticsMultiplier
            const hasAnyBonus = typeMultiplier !== 1 || stationBonusMultiplier !== 1 || stationDockingBonus !== 1 || satelliteBonus !== 1 || debrisMultiplier !== 1
            
            return hasAnyBonus ? (
              <div className="bg-black/20 rounded p-2 mb-3 text-xs">
                <div className="text-gray-500 mb-1">Effective Output</div>
                <div className={`text-lg font-bold ${selectedStation.type === 'research' ? 'text-blue-300' : 'text-green-300'}`}>
                  {output.unit === '$' ? `+$${output.effective.toFixed(1)}` : `+${output.effective.toFixed(1)} ${output.unit}`}/tick
                </div>
                <div className="text-gray-500 mt-1 space-y-0.5">
                  {typeMultiplier !== 1 && (
                    <div>Research: ×{typeMultiplier.toFixed(2)}</div>
                  )}
                  {stationBonusMultiplier !== 1 && (
                    <div>Perk bonus: ×{stationBonusMultiplier.toFixed(2)}</div>
                  )}
                  {stationDockingBonus !== 1 && (
                    <div className="text-yellow-400">Docking ({dockedCount}): ×{stationDockingBonus.toFixed(2)}</div>
                  )}
                  {satelliteBonus !== 1 && (
                    <div className="text-cyan-400">Satellites: ×{satelliteBonus.toFixed(2)}</div>
                  )}
                  {debrisMultiplier !== 1 && (
                    <div className="text-orange-400">Debris: ×{debrisMultiplier.toFixed(2)}</div>
                  )}
                </div>
              </div>
            ) : null
          })()}
          
          {/* Lunar Production - Only for Research Stations with docked rockets */}
          {selectedStation.type === 'research' && dockedRockets.filter(d => d.stationId === selectedStation.id).length > 0 && (
            <div className="bg-slate-800/50 border border-slate-500/30 rounded p-2 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <FaMoon className="text-slate-300" />
                <span className="text-slate-300">Lunar Component Production</span>
              </div>
              <div className="text-slate-200 font-mono text-lg">
                +{(dockedRockets.filter(d => d.stationId === selectedStation.id).length * ORBITAL.LUNAR_COMPONENT_PRODUCTION_RATE * selectedStation.level * lunarProductionMultiplier * satelliteBonus * debrisMultiplier).toFixed(2)}/tick
              </div>
            </div>
          )}
          
          {/* Docked Rockets */}
          {dockedRockets.filter(d => d.stationId === selectedStation.id).length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1">Docked Rockets</div>
              <div className="flex gap-1 flex-wrap">
                {dockedRockets.filter(d => d.stationId === selectedStation.id).map(docked => (
                  <div key={docked.rocketId} className="bg-yellow-900/30 border border-yellow-500/50 rounded px-2 py-1 text-xs flex items-center gap-1">
                    <FaRocket className="text-yellow-400 text-[10px]" style={{ transform: 'rotate(-45deg)' }} />
                    <span className="text-gray-400">{docked.ticksRemaining}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Upgrade Button */}
          <button
            onClick={() => upgradeStation(selectedStation.id)}
            disabled={cargo < ORBITAL.STATION_UPGRADE_CARGO_BASE * selectedStation.level || science < ORBITAL.STATION_UPGRADE_SCIENCE_BASE * selectedStation.level}
            className={`w-full py-2 rounded font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              cargo >= ORBITAL.STATION_UPGRADE_CARGO_BASE * selectedStation.level && science >= ORBITAL.STATION_UPGRADE_SCIENCE_BASE * selectedStation.level
                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaArrowUp />
            Upgrade to L{selectedStation.level + 1}
            <span className="text-xs opacity-75">
              ({ORBITAL.STATION_UPGRADE_CARGO_BASE * selectedStation.level} Cargo / {ORBITAL.STATION_UPGRADE_SCIENCE_BASE * selectedStation.level} Sci)
            </span>
          </button>
        </div>
      )}

      {/* Build Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
        {/* Build Research Station */}
        <div 
          onClick={() => canAffordStation && buildSpaceStation('research')} 
          className={`cursor-pointer border-2 p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all ${
            canAffordStation 
              ? 'border-blue-500/50 hover:bg-blue-900/30 hover:border-blue-500' 
              : 'border-gray-700 opacity-50 cursor-not-allowed'
          }`}
        >
          <FaMicroscope className="text-2xl text-blue-400" />
          <div className="font-bold text-sm">Research Station</div>
          <div className="text-xs text-gray-400">{ORBITAL.STATION_COST_CARGO} Cargo / {ORBITAL.STATION_COST_SCIENCE} Sci</div>
          <div className="text-xs text-blue-300">+{PRODUCTION.STATION_SCIENCE_BONUS} Sci/tick</div>
        </div>

        {/* Build Logistics Station */}
        <div 
          onClick={() => canAffordStation && buildSpaceStation('logistics')} 
          className={`cursor-pointer border-2 p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all ${
            canAffordStation 
              ? 'border-green-500/50 hover:bg-green-900/30 hover:border-green-500' 
              : 'border-gray-700 opacity-50 cursor-not-allowed'
          }`}
        >
          <FaTruckLoading className="text-2xl text-green-400" />
          <div className="font-bold text-sm">Logistics Station</div>
          <div className="text-xs text-gray-400">{ORBITAL.STATION_COST_CARGO} Cargo / {ORBITAL.STATION_COST_SCIENCE} Sci</div>
          <div className="text-xs text-green-300">+${PRODUCTION.STATION_LOGISTICS_BONUS}/tick</div>
        </div>

        {/* Launch Satellite */}
        {satellitesUnlocked ? (
          <div 
            onClick={() => canAffordSatellite && launchSatellite()} 
            className={`cursor-pointer border-2 p-3 rounded-lg flex flex-col items-center gap-1.5 transition-all ${
              canAffordSatellite 
                ? 'border-cyan-500/50 hover:bg-cyan-900/30 hover:border-cyan-500' 
                : 'border-gray-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <FaSatellite className="text-2xl text-cyan-400" />
            <div className="font-bold text-sm">Launch Satellite</div>
            <div className="text-xs text-gray-400">{ORBITAL.SATELLITE_COST_CARGO} Cargo / {ORBITAL.SATELLITE_COST_SCIENCE} Sci</div>
            <div className="text-xs text-cyan-300">+{(ORBITAL.SATELLITE_GLOBAL_BONUS * 100).toFixed(1)}% Global</div>
            <div className="text-xs text-gray-500">{satellites}/{effectiveMaxSatellites}</div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-700 p-3 rounded-lg flex flex-col items-center gap-1.5 opacity-50">
            <FaSatellite className="text-2xl text-gray-600" />
            <div className="font-bold text-sm text-gray-600">Satellites</div>
            <div className="text-xs text-gray-600">Research Required</div>
          </div>
        )}
      </div>

      {/* Empty State Guidance */}
      {spaceStations.length === 0 && (
        <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-4 w-full max-w-md text-center">
          <FaInfoCircle className="text-2xl text-blue-400 mx-auto mb-2" />
          <div className="font-bold text-gray-200 mb-1">Welcome to Orbit!</div>
          <div className="text-sm text-gray-400 mb-3">
            Build your first space station to start producing resources in orbit.
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <div><span className="text-blue-400">Research Stations</span> generate Science per tick</div>
            <div><span className="text-green-400">Logistics Stations</span> generate Money per tick</div>
            <div className="pt-2 text-gray-400">Rockets will automatically dock at stations, boosting output!</div>
          </div>
        </div>
      )}

      {/* Production Rates Summary */}
      {(totalProduction.science > 0 || totalProduction.money > 0) && (
        <div className="flex flex-wrap justify-center gap-3 w-full max-w-lg">
          {totalProduction.science > 0 && (
            <div className="bg-blue-900/30 border border-blue-500/40 rounded-lg px-4 py-2 flex items-center gap-2">
              <FaMicroscope className="text-blue-400" />
              <div>
                <div className="text-xs text-blue-300/80">Orbital Science</div>
                <div className="text-blue-300 font-bold">+{totalProduction.science.toFixed(1)}/tick</div>
              </div>
            </div>
          )}
          {totalProduction.money > 0 && (
            <div className="bg-green-900/30 border border-green-500/40 rounded-lg px-4 py-2 flex items-center gap-2">
              <FaTruckLoading className="text-green-400" />
              <div>
                <div className="text-xs text-green-300/80">Orbital Revenue</div>
                <div className="text-green-300 font-bold">+${totalProduction.money.toFixed(1)}/tick</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transit Rockets Banner */}
      {transitRockets.length > 0 && (
        <div className="flex items-center gap-3 bg-purple-900/30 border border-purple-500/40 rounded-lg px-4 py-2">
          <div className="flex items-center gap-1.5">
            <FaRocket className="text-purple-400 animate-pulse" style={{ transform: 'rotate(-45deg)' }} />
            <span className="font-bold text-purple-300">{transitRockets.length}</span>
          </div>
          <div className="text-sm text-purple-200">
            rocket{transitRockets.length > 1 ? 's' : ''} in transit to orbit
          </div>
          <div className="text-xs text-purple-400/70">
            ({transitRockets.map(t => `${t.ticksRemaining}s`).join(', ')})
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="text-center text-sm">
        <div className="text-gray-400">
          <span className="text-cyan-400 font-bold">{satellites}</span> satellites providing 
          <span className="text-green-400 font-bold"> +{(satellites * ORBITAL.SATELLITE_GLOBAL_BONUS * 100).toFixed(1)}%</span> global bonus
        </div>
        {spaceStations.length > 0 && (
          <div className="text-gray-500 text-xs mt-1">
            {spaceStations.length} station{spaceStations.length > 1 ? 's' : ''} | {dockedRockets.length} docked
          </div>
        )}
        {/* Lunar Components Production Status */}
        {currentLunarProduction > 0 && (
          <div className="flex items-center justify-center gap-2 mt-2 text-slate-300 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-500/30 inline-flex mx-auto">
            <FaMoon className="text-sm" />
            <span className="font-mono">+{currentLunarProduction.toFixed(2)}/tick</span>
            <span className="text-gray-500">|</span>
            <span className="font-bold">{Math.floor(lunarComponents)}</span>
            <span className="text-gray-500 text-xs">components</span>
          </div>
        )}
      </div>
    </div>
  )
}
