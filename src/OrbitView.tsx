import { useMemo } from "react"
import { useShallow } from 'zustand/react/shallow'
import { useGameStore, SpaceStation } from "./useGameStore.js"
import { FaSatellite, FaMicroscope, FaTruckLoading, FaArrowUp, FaExclamationTriangle, FaMoon, FaInfoCircle } from "react-icons/fa"
import { ORBITAL, PRODUCTION } from "./gameConstants.js"
import { calculateOrbitPressure } from "./orbitalHelpers.js"

interface OrbitViewProps {
  selectedStationId?: string | null;
  onSelectStation?: (stationId: string | null) => void;
}

export function OrbitView({ onSelectStation: _onSelectStation, selectedStationId: _selectedStationId }: OrbitViewProps) {
  const [
    spaceStations,
    buildSpaceStation,
    upgradeStation,
    cargo,
    science,
    lunarComponents,
    satellites,
    launchSatellite,
    spaceDebris,
    clearDebris,
    transitRockets,
    dockedRockets,
    satellitesUnlocked,
    hasDebrisImmunity,
    effectiveMaxSatellites,
    lunarProductionMultiplier,
    satelliteBonusMultiplier,
    stationBonusMultiplier,
    dockingBonusMultiplier,
    stationScienceMultiplier,
    stationLogisticsMultiplier,
  ] = useGameStore(useShallow((state) => [
    state.spaceStations,
    state.buildSpaceStation,
    state.upgradeStation,
    state.cargo,
    state.science,
    state.lunarComponents,
    state.satellites,
    state.launchSatellite,
    state.spaceDebris,
    state.clearDebris,
    state.transitRockets,
    state.dockedRockets,
    state.getEffectMultiplier('unlockSatellites') > 0,
    state.getEffectMultiplier('debrisImmunity') > 0,
    ORBITAL.MAX_SATELLITES_BASE + state.getEffectMultiplier('maxSatellitesBonus'),
    state.getEffectMultiplier('lunarProductionMultiplier') || 1,
    state.getEffectMultiplier('satelliteBonusMultiplier') || 1,
    state.getCompanyPerkValue('stationBonusMultiplier') || 1,
    state.getEffectMultiplier('dockingBonusMultiplier') || ORBITAL.DOCKING_BONUS_MULTIPLIER,
    state.getEffectMultiplier('stationScienceMultiplier') || 1,
    state.getEffectMultiplier('stationLogisticsMultiplier') || 1,
  ]))
  
  // Cost calculations
  const canAffordStation = cargo >= ORBITAL.STATION_COST_CARGO && science >= ORBITAL.STATION_COST_SCIENCE
  const canAffordSatellite = cargo >= ORBITAL.SATELLITE_COST_CARGO && science >= ORBITAL.SATELLITE_COST_SCIENCE && satellites < effectiveMaxSatellites
  
  // Calculate debris penalty
  const debrisPenalty = hasDebrisImmunity ? 0 : Math.min(spaceDebris.length * ORBITAL.DEBRIS_PENALTY_PER_PIECE * 100, ORBITAL.MAX_DEBRIS_PENALTY * 100)
  const orbitPressure = useMemo(() => calculateOrbitPressure({
    spaceStations,
    dockedRockets,
    transitRockets,
    satellites,
    spaceDebris,
  }), [spaceStations, dockedRockets, transitRockets, satellites, spaceDebris])
  
  // Calculate current lunar component production rate
  const satelliteBonus = 1 + (satellites * ORBITAL.SATELLITE_GLOBAL_BONUS * satelliteBonusMultiplier)
  const debrisMultiplier = hasDebrisImmunity ? 1 : (1 - debrisPenalty / 100)
  const congestionMultiplier = 1 - orbitPressure.congestion
  
  // Helper to calculate effective station output
  const getEffectiveStationOutput = (station: typeof spaceStations[0]) => {
    const dockedCount = dockedRockets.filter(d => d.stationId === station.id).length
    const stationDockingBonus = dockedCount > 0 ? 1 + (dockedCount * (dockingBonusMultiplier - 1)) : 1
    
    if (station.type === 'research') {
      const baseOutput = PRODUCTION.STATION_SCIENCE_BONUS * station.level
      const researchIdleMultiplier = dockedCount > 0 ? 1 : ORBITAL.RESEARCH_IDLE_MULTIPLIER
      const withMultipliers = baseOutput * stationScienceMultiplier * stationBonusMultiplier
      const effective = withMultipliers * researchIdleMultiplier * stationDockingBonus * debrisMultiplier * satelliteBonus * congestionMultiplier
      return { base: baseOutput, effective: effective, unit: 'Sci' }
    } else {
      const baseOutput = PRODUCTION.STATION_LOGISTICS_BONUS * station.level
      const withMultipliers = baseOutput * stationLogisticsMultiplier * stationBonusMultiplier
      const effective = withMultipliers * stationDockingBonus * debrisMultiplier * satelliteBonus * congestionMultiplier
      return { base: baseOutput, effective: effective, unit: '$' }
    }
  }
  
  let currentLunarProduction = 0
  spaceStations.forEach(station => {
    if (station.type === 'research') {
      const dockedCount = dockedRockets.filter(d => d.stationId === station.id).length
      if (dockedCount > 0) {
        currentLunarProduction += dockedCount * ORBITAL.LUNAR_COMPONENT_PRODUCTION_RATE * station.level * lunarProductionMultiplier * congestionMultiplier
      }
    }
  })
  currentLunarProduction *= satelliteBonus * debrisMultiplier

  const totalOccupiedDocks = dockedRockets.length
  const totalDockCapacity = Math.max(spaceStations.reduce((sum, station) => sum + station.maxDocks, 0), 1)

  return (
    <div className="flex h-full flex-col items-center justify-end gap-4 p-4 pt-24 pb-8">
      <div className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-3 rounded-lg border border-slate-700/70 bg-slate-950/60 px-4 py-3 text-sm">
        <div className="text-slate-200">
          Stations <span className="font-bold text-white">{spaceStations.length}</span>
        </div>
        <div className="text-slate-400">|</div>
        <div className="text-cyan-300">
          Satellites <span className="font-bold">{satellites}/{effectiveMaxSatellites}</span>
        </div>
        <div className="text-slate-400">|</div>
        <div className="text-purple-300">
          Transit <span className="font-bold">{transitRockets.length}</span>
        </div>
        <div className="text-slate-400">|</div>
        <div className="text-yellow-300">
          Docks <span className="font-bold">{totalOccupiedDocks}/{totalDockCapacity}</span>
        </div>
        {spaceDebris.length > 0 && (
          <>
            <div className="text-slate-400">|</div>
            <div className="text-orange-300">
              Debris <span className="font-bold">{spaceDebris.length}</span>
            </div>
          </>
        )}
        {currentLunarProduction > 0 && (
          <>
            <div className="text-slate-400">|</div>
            <div className="text-slate-300">
              Lunar <span className="font-bold">+{currentLunarProduction.toFixed(1)}/tick</span>
            </div>
          </>
        )}
      </div>
      
      {spaceDebris.length > 0 && !hasDebrisImmunity && (
        <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-900/30 px-3 py-1.5 rounded border border-orange-500/50">
          <FaExclamationTriangle />
          <span>Debris reducing output by {debrisPenalty.toFixed(0)}%</span>
        </div>
      )}

      {orbitPressure.congestion > 0 && (
        <div className="w-full max-w-3xl rounded-lg border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-center text-sm text-amber-300">
          Congestion {(orbitPressure.congestion * 100).toFixed(0)}% is cutting orbital output.
        </div>
      )}

      {spaceStations.length > 0 && (
        <div className="w-full max-w-5xl rounded-lg border border-slate-700/70 bg-slate-950/55 backdrop-blur-sm p-4">
          <div className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-300">Stations</div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {spaceStations.map((station) => {
              const dockedCount = dockedRockets.filter((rocket) => rocket.stationId === station.id).length
              const stationOutput = getEffectiveStationOutput(station)
              const canUpgrade = cargo >= ORBITAL.STATION_UPGRADE_CARGO_BASE * station.level && science >= ORBITAL.STATION_UPGRADE_SCIENCE_BASE * station.level

              return (
                <div
                  key={station.id}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    station.type === 'research'
                      ? 'border-slate-700/60 bg-slate-950/65'
                      : 'border-slate-700/60 bg-slate-950/65'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`flex items-center gap-2 font-bold ${station.type === 'research' ? 'text-blue-300' : 'text-green-300'}`}>
                        {station.type === 'research' ? <FaMicroscope /> : <FaTruckLoading />}
                        {station.type === 'research' ? 'Research Station' : 'Logistics Station'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded bg-black/25 p-2">
                      <div className="text-[11px] text-slate-500">Output</div>
                      <div className={station.type === 'research' ? 'text-blue-200' : 'text-green-200'}>
                        {stationOutput.unit === '$' ? `$${stationOutput.effective.toFixed(1)}` : `${stationOutput.effective.toFixed(1)} Sci`}
                      </div>
                    </div>
                    <div className="rounded bg-black/25 p-2">
                      <div className="text-[11px] text-slate-500">Docks</div>
                      <div className="text-yellow-300">{dockedCount}/{station.maxDocks}</div>
                    </div>
                  </div>
                  {station.type === 'research' && dockedCount > 0 && (
                    <div className="mt-3 rounded border border-slate-500/30 bg-slate-800/40 px-3 py-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <FaMoon className="text-slate-300" />
                        Lunar +{(dockedCount * ORBITAL.LUNAR_COMPONENT_PRODUCTION_RATE * station.level * lunarProductionMultiplier * satelliteBonus * debrisMultiplier).toFixed(2)}/tick
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => upgradeStation(station.id)}
                    disabled={!canUpgrade}
                    className={`mt-3 flex w-full items-center justify-center gap-2 rounded py-2 text-sm font-bold transition-colors ${
                      canUpgrade
                        ? 'bg-purple-600 text-white hover:bg-purple-500'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FaArrowUp />
                    Upgrade L{station.level} to L{station.level + 1}
                  </button>
                </div>
              )
            })}
          </div>
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
          <div className="text-xs text-blue-300">Science output</div>
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
          <div className="text-xs text-green-300">Revenue output</div>
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
            <div><span className="text-blue-400">Research Stations</span> add science</div>
            <div><span className="text-green-400">Logistics Stations</span> add revenue</div>
          </div>
        </div>
      )}
    </div>
  )
}
