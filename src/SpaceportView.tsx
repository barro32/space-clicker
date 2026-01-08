import { useGameStore } from "./useGameStore.js"
import { FaRegBuilding, FaRocket, FaBomb, FaGasPump, FaFlask } from "react-icons/fa"
import { COST_SCALING } from "./gameConstants.js"

export function SpaceportView() {
     const { rockets, spaceports, buildSpaceport, buildRocket, explodedRocketIds, clearExplosion, fuelRefineries, buildFuelRefinery, fuelRefineryCost, autoBuildActive, toggleAutoBuild, buildScienceRocket, fuel, recentlyLaunchedRocketIds } = useGameStore()
     
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
     <div className="w-full h-full flex flex-col items-center justify-center px-8">
       {/* Spaceports Grid */}
       <div className="grid gap-6 mb-8">
         {spaceports.map((sp, spIndex) => {
           return (
             <div key={spIndex} className={`bg-gradient-to-br from-gray-800 to-gray-900 border-2 p-6 rounded-lg shadow-lg ${sp.type === 'cargo' ? 'border-green-500/50 shadow-green-500/20' : 'border-blue-500/50 shadow-blue-500/20'}`}>
               {/* Spaceport Header */}
               <div className="flex items-center gap-3 mb-4">
                 <FaRegBuilding className={sp.type === 'cargo' ? 'text-green-400 text-2xl' : 'text-blue-400 text-2xl'} />
                 <div className="font-mono font-bold">
                   <span className={sp.type === 'cargo' ? 'text-green-400' : 'text-blue-400'}>
                     {sp.type === 'cargo' ? 'CARGO' : 'SCIENCE'} SPACEPORT
                   </span>
                   <div className="text-xs text-gray-400 font-normal">ID: {spIndex + 1}</div>
                 </div>
                 <button 
                   onClick={() => useGameStore.getState().toggleSpaceport(spIndex)}
                   className={`ml-auto px-3 py-1 text-xs font-mono border rounded transition-all ${sp.type === 'cargo' ? 'border-green-500/50 text-green-400 hover:bg-green-500/10' : 'border-blue-500/50 text-blue-400 hover:bg-blue-500/10'}`}
                   title="Toggle between cargo and science"
                 >
                   TOGGLE
                 </button>
               </div>

               {/* Rocket Slots Grid - Make it larger */}
               <div className={`grid gap-2 p-4 bg-black/30 rounded border border-gray-700/50`} style={{ gridTemplateColumns: `repeat(${Math.min(9, effectiveCapacity)}, minmax(0, 1fr))` }}>
                 {Array.from({ length: effectiveCapacity }).map((_, i) => {
                   const rocketIndex = spIndex * effectiveCapacity + i;
                   const rocket = rockets[rocketIndex];
                   if (rocket) {
                     const isExploded = explodedRocketIds.includes(rocket.id);
                     const isLaunching = recentlyLaunchedRocketIds.includes(rocket.id);
                     if (isExploded) {
                       return (
                         <div 
                           key={i} 
                           className="w-10 h-10 flex items-center justify-center bg-red-900/30 border-2 border-red-500/50 rounded cursor-pointer hover:bg-red-900/50 transition-all"
                           onClick={(e) => { e.stopPropagation(); clearExplosion(rocket.id); }}
                           title="Click to clear explosion"
                         >
                           <FaBomb className="text-lg text-red-400 animate-pulse" />
                         </div>
                       );
                     } else if (isLaunching) {
                       return (
                         <div 
                           key={i} 
                           className="w-10 h-10 flex items-center justify-center bg-yellow-900/30 border-2 border-yellow-500/50 rounded"
                           title="Launching!"
                         >
                           <FaRocket className="text-lg text-yellow-300 animate-launch" style={{ transform: 'rotate(-45deg)' }} />
                         </div>
                       );
                     } else {
                       return (
                         <div 
                           key={i} 
                           className={`w-10 h-10 flex items-center justify-center border-2 rounded transition-all ${fuel >= fuelCostPerRocket ? 'bg-blue-900/30 border-blue-500/50 animate-bounce-slow' : 'bg-gray-800/30 border-gray-600/50'}`}
                           title={fuel >= fuelCostPerRocket ? 'Ready to launch' : 'Waiting for fuel'}
                         >
                           <FaRocket className={`text-lg ${fuel >= fuelCostPerRocket ? 'text-blue-400' : 'text-gray-500'}`} style={{ transform: 'rotate(-45deg)' }} />
                         </div>
                       );
                     }
                   } else {
                     return (
                       <div 
                         key={i} 
                         className="w-10 h-10 border-2 border-dashed border-gray-700/50 rounded bg-gray-900/20 hover:border-gray-600/50 transition-all"
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
               title={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0 ? 'Requires Auto-Queue tech (u7)' : 'Toggle auto-build'}
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
         </div>
       </div>
     </div>
   )
}
