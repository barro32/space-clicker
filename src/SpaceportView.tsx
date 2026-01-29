import { useGameStore } from "./useGameStore.js"
import { FaRegBuilding, FaRocket, FaBomb, FaFlask, FaGasPump } from "react-icons/fa"
import { COST_SCALING } from "./gameConstants.js"
import { AUTOMATION } from "./gameConstants.js"

export function SpaceportView() {
      const { rockets, spaceports, buildSpaceport, buildRocket, explodedRocketIds, clearExplosion, autoBuildActive, autoSalvageActive, toggleAutoBuild, toggleAutoSalvage, buildScienceRocket, fuel, tickCount, buildFuelRefinery, fuelRefineries } = useGameStore()
     
      // use effective capacity from research
      const effectiveCapacity = useGameStore(state => Math.max(1, state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus')));
       const currentRocketCost = useGameStore(state => state.getCurrentRocketCost());
       const currentSpaceportCost = useGameStore(state => state.getCurrentSpaceportCost());
       const fuelCostPerRocket = useGameStore(state => state.fuelCostPerRocket * state.getEffectMultiplier('fuelCostMultiplier'));
      
      // Calculate how many rockets can launch with available fuel
      const activeRocketCount = rockets.filter((r, i) => r !== null && !explodedRocketIds.includes(r.id)).length;
      const rocketsWithFuel = Math.floor(fuel / fuelCostPerRocket);
      
      // Get ordered list of active rocket IDs (to determine which ones get fuel)
      const activeRocketIds = rockets
        .filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null && !explodedRocketIds.includes(r.id))
        .slice(0, rocketsWithFuel)
        .map(r => r.id);
       const scienceRocketsUnlocked = useGameStore(state => state.researchedNodes.includes('o4'));
       const spaceportsUnlocked = useGameStore(state => state.researchedNodes.includes('o5'));
       const fuelRefineriesUnlocked = useGameStore(state => state.researchedNodes.includes('o6'));
       const explosionClearingUnlocked = useGameStore(state => state.researchedNodes.includes('o7'));
       const currentFuelRefineryCost = useGameStore(state => Math.round(COST_SCALING.FUEL_REFINERY_COST_BASE * Math.pow(COST_SCALING.FUEL_REFINERY_COST_EXPONENT, state.fuelRefineries)));
     
     // Auto-build progress calculation
     const autoBuildEnabled = useGameStore(state => state.getEffectMultiplier('autoBuildEnabled') > 0);
     const buildMultiplier = useGameStore(state => state.getEffectMultiplier('buildRocketMultiplier') || 1);
     const autoBuildInterval = Math.max(1, Math.floor(AUTOMATION.BASE_INTERVAL / buildMultiplier));
     const autoBuildProgress = autoBuildEnabled && autoBuildActive 
       ? ((tickCount % autoBuildInterval) / autoBuildInterval) * 100
       : 0;
     
     // Auto-salvage progress calculation
     const autoSalvageEnabled = useGameStore(state => state.getEffectMultiplier('autoSalvageEnabled') > 0);
     const clearMultiplier = useGameStore(state => state.getEffectMultiplier('clearExplosionMultiplier') || 1);
     const autoSalvageInterval = Math.max(1, Math.floor(AUTOMATION.BASE_INTERVAL / clearMultiplier));
      const autoSalvageProgress = autoSalvageEnabled && autoSalvageActive && explodedRocketIds.length > 0
        ? (((tickCount + 10) % autoSalvageInterval) / autoSalvageInterval) * 100
        : 0;

    return (
     <div className="w-full h-full flex flex-col items-center justify-center px-8 overflow-auto">
       {/* Spaceports Grid - scrollable for many spaceports */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[50vh] overflow-y-auto w-full max-w-4xl">
         {spaceports.map((sp, spIndex) => {
           return (
             <div key={sp.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 p-4 rounded-lg shadow-lg border-cyan-500/50 shadow-cyan-500/20">
               {/* Spaceport Header */}
               <div className="flex items-center gap-2 mb-3">
                 <FaRegBuilding className="text-cyan-400 text-xl" />
                 <div className="font-mono font-bold">
                   <span className="text-cyan-400">SPACEPORT {sp.id}</span>
                 </div>
               </div>

               {/* Rocket Slots Grid */}
               <div className="grid gap-1.5 p-3 bg-black/30 rounded border border-gray-700/50" style={{ gridTemplateColumns: `repeat(${Math.min(6, effectiveCapacity)}, minmax(0, 1fr))` }}>
                {Array.from({ length: effectiveCapacity }).map((_, i) => {
                    const rocketIndex = spIndex * effectiveCapacity + i;
                    const rocket = rockets[rocketIndex];
                    if (rocket) {
                      const isExploded = explodedRocketIds.includes(rocket.id);
                      const isScience = rocket.type === 'science';
                      const hasFuel = activeRocketIds.includes(rocket.id);
                      const isActive = !isExploded && hasFuel;
                      
                      if (isExploded) {
                        return (
                          <div 
                            key={i} 
                            className="w-8 h-8 flex items-center justify-center bg-red-900/30 border-2 border-red-500/50 rounded cursor-pointer hover:bg-red-900/50 transition-all"
                            onClick={(e) => { e.stopPropagation(); clearExplosion(rocket.id); }}
                            title="Click to clear explosion"
                          >
                            <FaBomb className="text-sm text-red-400 animate-pulse" />
                          </div>
                        );
                      } else {
                        return (
                          <div 
                            key={i} 
                            className={`w-8 h-8 flex items-center justify-center border-2 rounded transition-all ${
                              isScience 
                                ? (isActive ? 'bg-purple-900/30 border-purple-500/50' : 'bg-gray-800/30 border-gray-600/50')
                                : (isActive ? 'bg-blue-900/30 border-blue-500/50' : 'bg-gray-800/30 border-gray-600/50')
                            }`}
                            title={isActive ? 'Launching!' : 'Waiting for fuel'}
                          >
                            {isScience ? (
                              <FaFlask className={`text-sm ${isActive ? 'text-purple-400 animate-science-launch' : 'text-gray-500'}`} />
                            ) : (
                              <FaRocket className={`text-sm ${isActive ? 'text-blue-400 animate-cargo-launch' : 'text-gray-500'}`} style={{ transform: 'rotate(-45deg)' }} />
                            )}
                          </div>
                        );
                      }
                     } else {
                     return (
                       <div 
                         key={i} 
                         className="w-8 h-8 border-2 border-dashed border-gray-700/50 rounded bg-gray-900/20 hover:border-gray-600/50 transition-all"
                       />
                     );
                   }
                 })}
               </div>

               {/* Slot count info */}
               <div className="text-xs text-gray-400 font-mono mt-2 text-center">
                 {rockets.filter((r, idx) => r !== null && Math.floor(idx / effectiveCapacity) === spIndex).length}/{effectiveCapacity} SLOTS
               </div>
             </div>
           )
         })}
       </div>

       {/* Build Panel */}
       <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-cyan-500/50 rounded-lg p-6 shadow-lg shadow-cyan-500/20 w-full max-w-2xl">
         <div className="text-cyan-400 font-mono text-sm font-bold mb-4 pb-3 border-b border-cyan-500/30">
           ⚙ BUILD & CONTROL
         </div>

         <div className="grid grid-cols-3 gap-4">
           {/* Build Cargo Rocket */}
           <div className="bg-black/30 border-2 border-blue-500/50 rounded p-4 hover:border-blue-500/80 hover:bg-blue-900/20 transition-all cursor-pointer" onClick={buildRocket} title="Build a cargo rocket">
             <div className="flex items-center justify-center mb-2">
               <FaRocket className="text-2xl text-blue-400" style={{ transform: 'rotate(-45deg)' }} />
             </div>
             <div className="text-xs text-gray-400 font-mono text-center mb-1">CARGO ROCKET</div>
              <div className="text-lg font-bold text-green-400 font-mono text-center">${currentRocketCost.toLocaleString()}</div>
              <div className="text-xs text-orange-400 font-mono text-center">Fuel: {Math.floor(fuelCostPerRocket).toLocaleString()}</div>
             {/* Auto-build checkbox integrated into button */}
             {autoBuildEnabled && (
               <div className="mt-2 pt-2 border-t border-blue-500/30">
                 <label className="flex items-center justify-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                   <input
                     type="checkbox"
                     checked={autoBuildActive}
                     onChange={() => toggleAutoBuild()}
                     className="w-4 h-4 cursor-pointer accent-cyan-500"
                     aria-label="auto-build-toggle"
                   />
                   <span className={`text-xs font-mono ${autoBuildActive ? 'text-cyan-400' : 'text-gray-500'}`}>AUTO</span>
                 </label>
                 {autoBuildActive && (
                   <div className="w-full mt-1">
                     <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-cyan-500 transition-all duration-200 rounded-full"
                         style={{ width: `${autoBuildProgress}%` }}
                       />
                     </div>
                   </div>
                 )}
               </div>
             )}
           </div>

           {/* Build Science Rocket */}
           {scienceRocketsUnlocked && (
             <div className="bg-black/30 border-2 border-purple-500/50 rounded p-4 hover:border-purple-500/80 hover:bg-purple-900/20 transition-all cursor-pointer" onClick={buildScienceRocket} title="Science Rocket: +1 science per launch">
               <div className="flex items-center justify-center mb-2">
                 <FaFlask className="text-2xl text-purple-400" />
               </div>
               <div className="text-xs text-gray-400 font-mono text-center mb-1">SCIENCE ROCKET</div>
                <div className="text-lg font-bold text-green-400 font-mono text-center">${currentRocketCost.toLocaleString()}</div>
                <div className="text-xs text-orange-400 font-mono text-center">Fuel: {Math.floor(fuelCostPerRocket).toLocaleString()}</div>
             </div>
           )}

           {/* Clear Explosion */}
           {explosionClearingUnlocked && (
             <div className="bg-black/30 border-2 border-red-500/50 rounded p-4 hover:border-red-500/80 hover:bg-red-900/20 transition-all cursor-pointer" onClick={() => {
               if (explodedRocketIds.length > 0) {
                 clearExplosion(explodedRocketIds[0]);
               }
             }} title="Clear first explosion">
               <div className="flex items-center justify-center mb-2">
                 <FaBomb className="text-2xl text-red-400" />
               </div>
               <div className="text-xs text-gray-400 font-mono text-center mb-1">CLEAR EXPLOSION</div>
               <div className="text-lg font-bold text-blue-400 font-mono text-center">+1 SCI</div>
               <div className="text-xs text-gray-500 font-mono text-center">Queue: {explodedRocketIds.length}</div>
               {/* Auto-salvage checkbox integrated into button */}
               {autoSalvageEnabled && (
                 <div className="mt-2 pt-2 border-t border-red-500/30">
                   <label className="flex items-center justify-center gap-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                     <input
                       type="checkbox"
                       checked={autoSalvageActive}
                       onChange={() => toggleAutoSalvage()}
                       className="w-4 h-4 cursor-pointer accent-orange-500"
                       aria-label="auto-salvage-toggle"
                     />
                     <span className={`text-xs font-mono ${autoSalvageActive ? 'text-orange-400' : 'text-gray-500'}`}>AUTO</span>
                   </label>
                   {autoSalvageActive && explodedRocketIds.length > 0 && (
                     <div className="w-full mt-1">
                       <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-orange-500 transition-all duration-200 rounded-full"
                           style={{ width: `${autoSalvageProgress}%` }}
                         />
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
           )}

            {/* Build Spaceport */}
            {spaceportsUnlocked && (
              <div className="bg-black/30 border-2 border-green-500/50 rounded p-4 hover:border-green-500/80 hover:bg-green-900/20 transition-all cursor-pointer" onClick={buildSpaceport} title="Build new spaceport">
                <div className="flex items-center justify-center mb-2">
                  <FaRegBuilding className="text-2xl text-green-400" />
                </div>
                <div className="text-xs text-gray-400 font-mono text-center mb-1">NEW SPACEPORT</div>
                <div className="text-lg font-bold text-green-400 font-mono text-center">${currentSpaceportCost.toLocaleString()}</div>
                <div className="text-xs text-gray-500 font-mono text-center">Capacity +{effectiveCapacity}</div>
              </div>
               )}

            {/* Build Fuel Refinery */}
            {fuelRefineriesUnlocked && (
              <div className="bg-black/30 border-2 border-orange-500/50 rounded p-4 hover:border-orange-500/80 hover:bg-orange-900/20 transition-all cursor-pointer" onClick={buildFuelRefinery} title="Build fuel refinery">
                <div className="flex items-center justify-center mb-2">
                  <FaGasPump className="text-2xl text-orange-400" />
                </div>
                <div className="text-xs text-gray-400 font-mono text-center mb-1">FUEL REFINERY</div>
                <div className="text-lg font-bold text-orange-400 font-mono text-center">${currentFuelRefineryCost.toLocaleString()}</div>
                <div className="text-xs text-gray-500 font-mono text-center">{fuelRefineries} built · +5/tick · +500 cap</div>
              </div>
             )}
             </div>
          </div>
        </div>
     )
 }
