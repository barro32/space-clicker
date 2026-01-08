import { useGameStore } from "./useGameStore.js"
import { FaRegBuilding, FaRocket, FaBomb, FaGasPump, FaFlask } from "react-icons/fa"
import { COST_SCALING } from "./gameConstants.js"

export function SpaceportView() {
     const { rockets, spaceports, buildSpaceport, buildRocket, explodedRocketIds, clearExplosion, fuelRefineries, buildFuelRefinery, fuelRefineryCost, autoBuildActive, autoSalvageActive, toggleAutoBuild, toggleAutoSalvage, buildScienceRocket, fuel, recentlyLaunchedRocketIds, tickCount } = useGameStore()
     
      // use effective capacity from research
      const effectiveCapacity = useGameStore(state => Math.max(1, state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus')));
      const currentRocketCost = useGameStore(state => Math.floor(state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, state.rockets.filter(r => r !== null).length - state.explodedRocketIds.length)));
      const currentSpaceportCost = useGameStore(state => state.getCurrentSpaceportCost());
      const currentFuelRefineryCost = useGameStore(state => Math.round(state.fuelRefineryCost * Math.pow(COST_SCALING.FUEL_REFINERY_COST_EXPONENT, state.fuelRefineries)));
      const fuelCostPerRocket = useGameStore(state => state.fuelCostPerRocket * state.getEffectMultiplier('fuelCostMultiplier'));
     const scienceRocketsUnlocked = useGameStore(state => state.researchedNodes.includes('o4'));
     const spaceportsUnlocked = useGameStore(state => state.researchedNodes.includes('o5'));
     const refineriesUnlocked = useGameStore(state => state.researchedNodes.includes('o6'));
     const explosionClearingUnlocked = useGameStore(state => state.researchedNodes.includes('o7'));

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
                     const isLaunching = recentlyLaunchedRocketIds.includes(rocket.id);
                     const isScience = rocket.type === 'science';
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
                     } else if (isLaunching) {
                       return (
                         <div 
                           key={i} 
                           className="w-8 h-8 flex items-center justify-center bg-yellow-900/30 border-2 border-yellow-500/50 rounded"
                           title="Launching!"
                         >
                           {isScience ? (
                             <FaFlask className="text-sm text-purple-300 animate-launch" />
                           ) : (
                             <FaRocket className="text-sm text-yellow-300 animate-launch" style={{ transform: 'rotate(-45deg)' }} />
                           )}
                         </div>
                       );
                     } else {
                       const readyToLaunch = fuel >= fuelCostPerRocket;
                       return (
                         <div 
                           key={readyToLaunch ? `${i}-${tickCount}` : i} 
                           className={`w-8 h-8 flex items-center justify-center border-2 rounded transition-all ${
                             isScience 
                               ? (readyToLaunch ? 'bg-purple-900/30 border-purple-500/50' : 'bg-gray-800/30 border-gray-600/50')
                               : (readyToLaunch ? 'bg-blue-900/30 border-blue-500/50' : 'bg-gray-800/30 border-gray-600/50')
                           } ${readyToLaunch ? 'animate-rocket-ready' : ''}`}
                           title={readyToLaunch ? 'Ready to launch' : 'Waiting for fuel'}
                         >
                           {isScience ? (
                             <FaFlask className={`text-sm ${readyToLaunch ? 'text-purple-400' : 'text-gray-500'}`} />
                           ) : (
                             <FaRocket className={`text-sm ${readyToLaunch ? 'text-blue-400' : 'text-gray-500'}`} style={{ transform: 'rotate(-45deg)' }} />
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
             <div className="text-lg font-bold text-green-400 font-mono text-center">${currentRocketCost}</div>
             <div className="text-xs text-orange-400 font-mono text-center">Fuel: {Math.floor(fuelCostPerRocket)}</div>
           </div>

           {/* Build Science Rocket */}
           {scienceRocketsUnlocked && (
             <div className="bg-black/30 border-2 border-purple-500/50 rounded p-4 hover:border-purple-500/80 hover:bg-purple-900/20 transition-all cursor-pointer" onClick={buildScienceRocket} title="Science Rocket: +1 science per launch">
               <div className="flex items-center justify-center mb-2">
                 <FaFlask className="text-2xl text-purple-400" />
               </div>
               <div className="text-xs text-gray-400 font-mono text-center mb-1">SCIENCE ROCKET</div>
               <div className="text-lg font-bold text-green-400 font-mono text-center">${currentRocketCost}</div>
               <div className="text-xs text-orange-400 font-mono text-center">Fuel: {Math.floor(fuelCostPerRocket)}</div>
             </div>
           )}

           {/* Build Spaceport */}
           {spaceportsUnlocked && (
             <div className="bg-black/30 border-2 border-green-500/50 rounded p-4 hover:border-green-500/80 hover:bg-green-900/20 transition-all cursor-pointer" onClick={buildSpaceport} title="Build new spaceport">
               <div className="flex items-center justify-center mb-2">
                 <FaRegBuilding className="text-2xl text-green-400" />
               </div>
               <div className="text-xs text-gray-400 font-mono text-center mb-1">NEW SPACEPORT</div>
               <div className="text-lg font-bold text-green-400 font-mono text-center">${currentSpaceportCost}</div>
               <div className="text-xs text-gray-500 font-mono text-center">Capacity +{effectiveCapacity}</div>
             </div>
           )}

           {/* Build Fuel Refinery */}
           {refineriesUnlocked && (
             <div className="bg-black/30 border-2 border-orange-500/50 rounded p-4 hover:border-orange-500/80 hover:bg-orange-900/20 transition-all cursor-pointer" onClick={buildFuelRefinery} title="Build fuel refinery">
               <div className="flex items-center justify-center mb-2">
                 <FaGasPump className="text-2xl text-orange-400" />
               </div>
               <div className="text-xs text-gray-400 font-mono text-center mb-1">FUEL REFINERY</div>
               <div className="text-lg font-bold text-green-400 font-mono text-center">${currentFuelRefineryCost}</div>
               <div className="text-xs text-cyan-400 font-mono text-center">Total: {fuelRefineries}</div>
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
             </div>
           )}

           {/* Auto Build Toggle */}
           <div className="bg-black/30 border-2 border-cyan-500/50 rounded p-4 flex flex-col items-center justify-center">
             <input
               type="checkbox"
               checked={autoBuildActive}
               onChange={() => toggleAutoBuild()}
               className="w-5 h-5 mb-2 cursor-pointer"
               aria-label="auto-build-toggle"
               disabled={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0}
               title={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0 ? 'Requires Auto-Queue tech (u7)' : 'Toggle auto-build (1 rocket/20s)'}
             />
             <div className="text-xs font-mono text-center">
               <div className={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0 ? 'text-gray-500' : 'text-cyan-400 font-bold'}>
                 AUTO-BUILD
               </div>
               <div className={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0 ? 'text-gray-600 text-xs' : 'text-gray-400 text-xs'}>
                 {autoBuildActive ? 'ACTIVE' : 'INACTIVE'}
               </div>
             </div>
           </div>

           {/* Auto Salvage Toggle */}
           <div className="bg-black/30 border-2 border-orange-500/50 rounded p-4 flex flex-col items-center justify-center">
             <input
               type="checkbox"
               checked={autoSalvageActive}
               onChange={() => toggleAutoSalvage()}
               className="w-5 h-5 mb-2 cursor-pointer"
               aria-label="auto-salvage-toggle"
               disabled={useGameStore.getState().getEffectMultiplier('autoSalvageEnabled') === 0}
               title={useGameStore.getState().getEffectMultiplier('autoSalvageEnabled') === 0 ? 'Requires Auto-Salvage tech (u8)' : 'Toggle auto-salvage (1 clear/20s)'}
             />
             <div className="text-xs font-mono text-center">
               <div className={useGameStore.getState().getEffectMultiplier('autoSalvageEnabled') === 0 ? 'text-gray-500' : 'text-orange-400 font-bold'}>
                 AUTO-SALVAGE
               </div>
               <div className={useGameStore.getState().getEffectMultiplier('autoSalvageEnabled') === 0 ? 'text-gray-600 text-xs' : 'text-gray-400 text-xs'}>
                 {autoSalvageActive ? 'ACTIVE' : 'INACTIVE'}
               </div>
             </div>
           </div>
         </div>
       </div>
     </div>
   )
}
