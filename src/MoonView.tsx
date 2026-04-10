import { useGameStore, MoonBuildingType, MoonSector } from './useGameStore.js'
import { shallow } from 'zustand/shallow'
import { MOON } from './gameConstants.js'
import { FaMoon, FaRocket, FaWarehouse, FaWrench, FaBolt, FaExclamationTriangle, FaArrowRight, FaIndustry, FaSun, FaAtom, FaBatteryFull, FaGripHorizontal, FaBox, FaFlask, FaGem } from 'react-icons/fa'
import { useState } from 'react'

export function MoonView() {
  const [
    moonStatus,
    moonMissionTicksRemaining,
    moonSectors,
    moonResources,
    earthResources,
    activeHazard,
    moonLog,
    moonPowerSystem,
    fuel,
    cargo,
    science,
    lunarComponents,
    researchedNodes,
    startMoonMission,
    scanSector,
    constructBuildingOnMoon,
    launchMassDriverPayload,
    sendSupplyMission,
    clearHazard,
    storage,
    getMoonBuildingCost,
    getEffectMultiplier,
  ] = useGameStore((state) => [
    state.moonStatus,
    state.moonMissionTicksRemaining,
    state.moonSectors,
    state.moonResources,
    state.earthResources,
    state.activeHazard,
    state.moonLog,
    state.moonPowerSystem,
    state.fuel,
    state.cargo,
    state.science,
    state.lunarComponents,
    state.researchedNodes,
    state.startMoonMission,
    state.scanSector,
    state.constructBuildingOnMoon,
    state.launchMassDriverPayload,
    state.sendSupplyMission,
    state.clearHazard,
    state.getMoonStorageCapacity(),
    state.getMoonBuildingCost,
    state.getEffectMultiplier,
  ], shallow)

  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null)
  const [buildingHoverType, setBuildingHoverType] = useState<string | null>(null)
  const [supplyMissionCargo, setSupplyMissionCargo] = useState(Math.min(cargo, MOON.CARGO_ROCKET_CAPACITY))

  const hasLunarManufacturing = researchedNodes.includes('o14')

  // Mission cost check
  const cost = MOON.MISSION_COST
  const canAffordMission = fuel >= cost.fuel && cargo >= cost.cargo && 
                          science >= cost.science && lunarComponents >= cost.lunarComponents

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
        <div className="terminal-header border-b border-green-500/30 pb-4 mb-6">
          <h1 className="terminal-title text-2xl flex items-center gap-3">
            <FaMoon className="text-green-400" />
            LUNAR MISSION CONTROL
          </h1>
          <p className="terminal-text text-green-500/60 text-sm mt-1">STATUS: AWAITING LAUNCH AUTHORIZATION</p>
        </div>

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
                     <span className="flex items-center gap-1"><FaBox className="w-3 h-3" /> Cargo:</span>
                     <span>{Math.floor(cargo).toLocaleString()} / {cost.cargo.toLocaleString()}</span>
                   </div>
                   <div className={`flex justify-between ${science >= cost.science ? 'text-green-400' : 'text-red-400'}`}>
                     <span className="flex items-center gap-1"><FaFlask className="w-3 h-3" /> Science:</span>
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
        <div className="terminal-header border-b border-green-500/30 pb-4 mb-6">
          <h1 className="terminal-title text-2xl flex items-center gap-3">
            <FaMoon className="text-green-400" />
            LUNAR MISSION CONTROL
          </h1>
          <p className="terminal-text text-amber-400 text-sm mt-1 animate-pulse">STATUS: MISSION IN PROGRESS</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
          <div className="terminal-panel max-w-lg w-full p-6 space-y-6">
            <h2 className="terminal-text text-lg text-center">LUNAR LANDER EN ROUTE</h2>
            
            <div className="font-mono text-xs text-center space-y-2">
              <div className="text-green-400">
                {'[' + '='.repeat(Math.floor(progress / 5)) + '>'.padEnd(20 - Math.floor(progress / 5), ' ') + ']'}
              </div>
              <div className="text-green-400/60">
                {progress.toFixed(1)}% COMPLETE
              </div>
            </div>
            
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

  // Unlocked state - full moon base interface with grid
  const selectedSector = selectedSectorId ? moonSectors.find(s => s.id === selectedSectorId) : moonSectors[0]

  return (
    <div className="terminal-container h-full flex flex-col">
      {/* Terminal Header */}
      <div className="terminal-header border-b border-green-500/30 pb-3 mb-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="terminal-title text-lg flex items-center gap-2">
              <FaMoon className="text-green-400" />
              LUNAR BASE CONTROL
            </h1>
            <p className="terminal-text text-green-500/60 text-xs mt-0.5">STATUS: OPERATIONAL</p>
          </div>
          
          {/* Hazard Alert */}
          {activeHazard && (
            <div className="terminal-alert bg-red-900/30 border border-red-500/50 px-3 py-2 rounded animate-pulse text-xs">
              <div className="flex items-center gap-2 text-red-400">
                <FaExclamationTriangle className="flex-shrink-0" />
                <span className="font-bold">{activeHazard.name}</span>
              </div>
              <div className="text-xs text-red-400/70 mt-1">
                -{(activeHazard.debuff * 100).toFixed(0)}% prod | {activeHazard.ticksRemaining}s left
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

       {/* Main Grid Layout: 3 columns */}
       <div className="flex-1 grid grid-cols-3 gap-3 overflow-hidden">
        
        {/* Left Column: Sector Grid */}
        <div className="col-span-1 terminal-panel p-3 space-y-2 overflow-y-auto">
          <h2 className="terminal-text text-xs border-b border-green-500/30 pb-1 mb-2">SECTORS ({moonSectors.length}/{MOON.MAX_SECTORS})</h2>
          
          <div className="space-y-1">
            {moonSectors.map(sector => (
              <div
                key={sector.id}
                onClick={() => setSelectedSectorId(sector.id)}
                className={`p-2 rounded text-xs cursor-pointer border transition ${
                  selectedSectorId === sector.id
                    ? 'bg-green-900/50 border-green-400'
                    : 'bg-gray-900/30 border-green-500/20 hover:border-green-500/40'
                }`}
              >
                <div className="font-bold text-green-400">{sector.name}</div>
                <div className="text-green-500/60 text-xs">
                  Slots: {sector.slotsUsed}/{sector.slots}
                </div>
                {Object.keys(sector.traits).length > 0 && (
                  <div className="text-green-400/70 text-xs mt-1">
                    {Object.keys(sector.traits)[0]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {moonSectors.length < MOON.MAX_SECTORS && (
            <button
              onClick={scanSector}
              disabled={science < MOON.SECTOR_SCAN_COST.science || cargo < MOON.SECTOR_SCAN_COST.cargo}
              className="terminal-button w-full py-1 text-xs mt-2"
            >
              SCAN SECTOR
            </button>
          )}
        </div>

        {/* Center Column: Sector Details & Building Selection */}
        <div className="col-span-1 terminal-panel p-3 space-y-2 overflow-y-auto">
          <h2 className="terminal-text text-xs border-b border-green-500/30 pb-1">
            {selectedSector?.name || 'Select Sector'}
          </h2>
          
          {selectedSector && (
            <div className="space-y-2 text-xs">
               {/* Sector Traits */}
               {Object.keys(selectedSector.traits).length > 0 && (
                 <div className="border border-green-500/20 rounded p-2 bg-green-900/10">
                   <div className="text-green-400 font-bold mb-1">Traits:</div>
                   {Object.entries(selectedSector.traits).map(([traitName, trait]) => (
                     <div key={traitName} className="text-green-400/70 text-xs">
                       {traitName}
                     </div>
                   ))}
                 </div>
               )}

               {/* Buildings in Sector */}
               {selectedSector && Object.keys(selectedSector.buildings).length > 0 && (
                 <div className="border border-green-500/20 rounded p-2 bg-green-900/10">
                   <div className="text-green-400 font-bold mb-1">Buildings:</div>
                   <div className="space-y-1">
                     {Object.entries(selectedSector.buildings).map(([buildingType, count]) => {
                        const buildingNames: Record<string, string> = {
                          extractors: 'Regolith Extractors',
                          refineries: 'He-3 Refineries',
                          silos: 'Storage Silos',
                          maintenance: 'Maintenance Bays',
                          massDrivers: 'Mass Drivers',
                          solarArray: 'Solar Arrays',
                          nuclearReactor: 'Nuclear Reactors',
                          battery: 'Power Batteries',
                          fabricator: 'Alloy Fabricators',
                        };
                       return (
                         <div key={buildingType} className="text-green-400/70 text-xs flex justify-between">
                           <span>{buildingNames[buildingType] || buildingType}</span>
                           <span>x{count}</span>
                         </div>
                       );
                     })}
                   </div>
                 </div>
               )}

                 {/* Available Building Types */}
                 <div className="border border-green-500/20 rounded p-2">
                   <div className="text-green-400 font-bold mb-1">Build:</div>
                   <div className="space-y-1">
                     {['extractor', 'refinery', 'silo', 'maintenance', 'massDriver', 'solarArray', 'nuclearReactor', 'battery', 'fabricator'].map(type => {
                       const cost = getMoonBuildingCost(type as any)
                       const canBuild = cargo >= cost.cargo && science >= cost.science && (!cost.regolith || moonResources.regolith >= cost.regolith) && (!cost.alloys || moonResources.alloys >= cost.alloys) && selectedSector.slotsUsed < selectedSector.slots
                        const buildingNames: Record<string, string> = {
                          extractor: 'Regolith Extractor',
                          refinery: 'He-3 Refinery',
                          silo: 'Storage Silo',
                          maintenance: 'Maintenance Bay',
                          massDriver: 'Mass Driver',
                          solarArray: 'Solar Array',
                          nuclearReactor: 'Nuclear Reactor',
                          battery: 'Power Battery',
                          fabricator: 'Alloy Fabricator',
                        }
                       const buildingDescriptions = {
                         extractor: 'Extracts Regolith (5/tick). Boosted by Regolith Rich sectors.',
                         refinery: 'Converts Regolith → He-3 (0.1/tick). Consumes 10 Regolith per He-3.',
                         silo: 'Expands storage +500 regolith, +50 He-3, +250 alloys.',
                         maintenance: 'Reduces hazard duration by 15% per building.',
                         massDriver: 'Auto-transports 5 He-3/tick to Earth when powered.',
                         solarArray: 'Generates 50 power during day (60 ticks). Boosted by Solar Rich.',
                         nuclearReactor: 'Generates 40 power 24/7. Consumes 1 He-3/tick fuel.',
                         battery: 'Stores 100 power per unit. Charges during day, discharges at night.',
                         fabricator: 'Converts Regolith → Alloys (0.05/tick). Consumes 20 Regolith per alloy.',
                       }
                       return (
                         <button
                           key={type}
                           onClick={() => constructBuildingOnMoon(selectedSector.id, type as any)}
                           disabled={!canBuild}
                           onMouseEnter={() => setBuildingHoverType(type)}
                           onMouseLeave={() => setBuildingHoverType(null)}
                           title={buildingDescriptions[type as keyof typeof buildingDescriptions] || ''}
                           className={`w-full py-1.5 px-1.5 text-xs rounded border text-left transition ${
                             canBuild
                               ? 'bg-green-900/20 border-green-500/40 text-green-400 hover:bg-green-900/40'
                               : 'bg-gray-900/20 border-gray-600/40 text-gray-500'
                           }`}
                         >
                           <div className="font-bold">{buildingNames[type]}</div>
                           <div className="text-green-500/60 text-xs mt-0.5 space-y-1">
                             <div className="flex items-center gap-1">
                               <FaBox className="w-3 h-3" /> {Math.round(cost.cargo).toLocaleString()}
                               <FaFlask className="w-3 h-3 ml-2" /> {Math.round(cost.science).toLocaleString()}
                             </div>
                             {cost.regolith > 0 && (
                               <div className="flex items-center gap-1">
                                 <FaGripHorizontal className="w-3 h-3" /> {Math.round(cost.regolith).toLocaleString()}
                               </div>
                             )}
                             {cost.alloys > 0 && (
                               <div className="flex items-center gap-1">
                                 <FaGem className="w-3 h-3" /> {Math.round(cost.alloys).toLocaleString()}
                               </div>
                             )}
                           </div>
                         </button>
                       )
                     })}
                   </div>
                 </div>
            </div>
          )}
        </div>

        {/* Right-Center Column: Resources & Power */}
        <div className="col-span-1 terminal-panel p-3 space-y-2 overflow-y-auto">
          <h2 className="terminal-text text-xs border-b border-green-500/30 pb-1">RESOURCES & POWER</h2>
          
          {/* Storage */}
          <div className="space-y-1">
            <div className="text-xs text-green-500/60">Moon Regolith</div>
            <div className="flex justify-between text-xs text-green-400 mb-1">
              <span>{Math.floor(moonResources.regolith).toLocaleString()}</span>
              <span>/ {storage.regolith.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded overflow-hidden">
              <div className="h-full bg-amber-600" style={{ width: `${(moonResources.regolith / storage.regolith) * 100}%` }} />
            </div>

             <div className="text-xs text-green-500/60 mt-2">Moon Helium-3</div>
             <div className="flex justify-between text-xs text-green-400 mb-1">
               <span>{Math.floor(moonResources.helium3).toLocaleString()}</span>
               <span>/ {storage.helium3.toLocaleString()}</span>
             </div>
             <div className="h-1 bg-gray-800 rounded overflow-hidden">
               <div className="h-full bg-cyan-500" style={{ width: `${(moonResources.helium3 / storage.helium3) * 100}%` }} />
             </div>

             {/* Moon Alloys */}
             <div className="text-xs text-green-500/60 mt-2">Moon Alloys</div>
             <div className="flex justify-between text-xs text-green-400 mb-1">
               <span>{Math.floor(moonResources.alloys).toLocaleString()}</span>
               <span>/ {storage.alloys.toLocaleString()}</span>
             </div>
             <div className="h-1 bg-gray-800 rounded overflow-hidden">
               <div className="h-full bg-purple-600" style={{ width: `${(moonResources.alloys / storage.alloys) * 100}%` }} />
             </div>
          </div>

          {/* Power System */}
          <div className="border-t border-green-500/20 pt-2 mt-2">
            <div className="text-xs text-green-400 font-bold mb-1">
              {moonPowerSystem.isDay ? '☀️ DAY' : '🌙 NIGHT'}
            </div>
            <div className="flex justify-between text-xs text-green-400 mb-1">
              <span>Energy:</span>
              <span>{Math.floor(moonPowerSystem.currentEnergy).toLocaleString()} / {Math.floor(moonPowerSystem.maxEnergy).toLocaleString()}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all" 
                style={{ width: `${(moonPowerSystem.currentEnergy / Math.max(1, moonPowerSystem.maxEnergy)) * 100}%` }} 
              />
            </div>
            <div className="text-xs text-green-500/60 mt-1">
              Gen: {moonPowerSystem.energyGeneration.toLocaleString()} | Demand: {moonPowerSystem.energyDemand.toLocaleString()}
            </div>
          </div>

           {/* Earth Resources */}
           <div className="border-t border-green-500/20 pt-2 mt-2">
             <div className="text-xs text-green-400 font-bold mb-1">Earth Reserves</div>
             <div className="text-xs space-y-1">
               <div className="text-cyan-400">
                 He-3: {Math.floor(earthResources.helium3).toLocaleString()}
               </div>
               <div className="text-purple-400">
                 Alloys: {Math.floor(earthResources.alloys).toLocaleString()}
               </div>
             </div>
           </div>
           
           {/* Supply Mission Control */}
           <div className="border-t border-green-500/20 pt-2 mt-2">
             <div className="text-xs text-green-400 font-bold mb-2">Supply Mission</div>
             <div className="space-y-2 text-xs">
               <div className="flex items-center gap-2">
                 <FaBox className="w-3 h-3 text-amber-400" />
                 <span className="text-green-500/70">Cargo Storage:</span>
                 <span className="text-green-400 ml-auto">{Math.floor(moonResources.cargo)}/{Math.floor(storage.cargo)}</span>
               </div>
               <div className="h-1 bg-gray-800 rounded overflow-hidden">
                 <div className="h-full bg-amber-500" style={{ width: `${(moonResources.cargo / storage.cargo) * 100}%` }} />
               </div>
               
               <div className="flex gap-1 mt-2">
                 <input
                   type="range"
                   min="0"
                   max={Math.min(Math.floor(cargo), MOON.CARGO_ROCKET_CAPACITY)}
                   value={supplyMissionCargo}
                   onChange={(e) => setSupplyMissionCargo(parseInt(e.target.value))}
                   className="flex-1 text-xs"
                   title="Select cargo amount (0-100 units)"
                 />
               </div>
               
               <div className="flex justify-between text-xs text-green-500/60">
                 <span>Amount:</span>
                 <span>{supplyMissionCargo} / {MOON.CARGO_ROCKET_CAPACITY}</span>
               </div>
               
               <button
                 onClick={() => sendSupplyMission(supplyMissionCargo)}
                 disabled={supplyMissionCargo <= 0 || fuel < MOON.FUEL_CONSUMPTION_PER_MOON_TRIP || cargo < supplyMissionCargo}
                 className={`terminal-button w-full py-1 text-xs transition ${
                   supplyMissionCargo > 0 && fuel >= MOON.FUEL_CONSUMPTION_PER_MOON_TRIP && cargo >= supplyMissionCargo
                     ? 'bg-blue-900/50 border-blue-500 text-blue-400 hover:bg-blue-800/50'
                     : 'bg-gray-900/50 border-gray-600 text-gray-500'
                 }`}
                 title={`Requires ${MOON.FUEL_CONSUMPTION_PER_MOON_TRIP} fuel`}
               >
                 <FaRocket className="inline mr-1 w-3 h-3" />
                 SEND SUPPLY ({Math.floor(fuel)}/{MOON.FUEL_CONSUMPTION_PER_MOON_TRIP} fuel)
               </button>
             </div>
           </div>

           {/* Manual Launch */}
           <button
             onClick={() => launchMassDriverPayload(Math.floor(moonResources.helium3))}
             disabled={moonResources.helium3 === 0}
             className="terminal-button w-full py-1 text-xs mt-2"
           >
             LAUNCH MAX He-3
           </button>
        </div>
      </div>
    </div>
  )
}
