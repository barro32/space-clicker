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
     <div className="absolute top-0 left-0 opacity-80 flex flex-wrap gap-1">
       {spaceports.map((sp, spIndex) => {
         return (
           <div key={spIndex} className={`grid grid-cols-3 gap-1 border ${sp.type === 'cargo' ? 'border-green-500' : 'border-blue-500'}`}>
             {Array.from({ length: effectiveCapacity }).map((_, i) => {
               const rocketIndex = spIndex * effectiveCapacity + i;
               const rocket = rockets[rocketIndex];
               if (rocket) {
                 const isExploded = explodedRocketIds.includes(rocket.id);
                 const isLaunching = recentlyLaunchedRocketIds.includes(rocket.id);
                 if (isExploded) {
                   return <FaBomb key={i} onClick={(e) => { e.stopPropagation(); clearExplosion(rocket.id); }} className="text-2xl cursor-pointer text-red-500 animate-pulse" title="Click to clear explosion" />;
                 } else if (isLaunching) {
                   return <FaRocket key={i} className="text-2xl text-yellow-300 animate-ping" title="Launching!" />;
                 } else {
                   return <FaRocket key={i} className={`text-2xl ${fuel >= fuelCostPerRocket ? 'text-blue-400 animate-bounce-slow' : 'text-gray-500'}`} title={fuel >= fuelCostPerRocket ? 'Ready to launch' : 'Waiting for fuel'} />;
                 }
               } else {
                 return <div key={i} className="w-6 h-6 border border-gray-300"></div>;
               }
             })}
           </div>
         )
       })}
        <div className="grid grid-cols-3 gap-1 border border-gray-500 p-1">
          <div onClick={buildRocket} className="cursor-pointer" title="Build a cargo rocket"><FaRocket className="text-2xl text-blue-400" /></div>
          <div>${currentRocketCost}</div>
          <div className="text-xs text-gray-400">Fuel: {Math.floor(fuelCostPerRocket)}</div>
          {scienceRocketsUnlocked && (
            <>
               <div onClick={buildScienceRocket} className="cursor-pointer" title="Science Rocket (o4): +1 science per successful launch"><FaFlask className="text-2xl text-purple-400" /></div>
              <div>${currentRocketCost}</div>
              <div className="text-xs text-gray-400">Fuel: {Math.floor(fuelCostPerRocket)}</div>
            </>
          )}
          {spaceportsUnlocked && (
            <>
               <div onClick={buildSpaceport} className="cursor-pointer" title="New Spaceport (o5): Expand rocket capacity"><FaRegBuilding className="text-2xl" /></div>
              <div>${currentSpaceportCost}</div>
              <div></div>
            </>
          )}
          {refineriesUnlocked && (
            <>
               <div onClick={buildFuelRefinery} className="cursor-pointer" title="Fuel Refinery (o6): +1 fuel/sec"><FaGasPump className="text-2xl" /></div>
              <div>${currentFuelRefineryCost}</div>
              <div className="text-xs">Refineries: {fuelRefineries}</div>
            </>
          )}
          {explosionClearingUnlocked && (
            <>
              <div onClick={() => {
                if (explodedRocketIds.length > 0) {
                  const explosionToClear = explodedRocketIds[0];
                  clearExplosion(explosionToClear);
                }
               }} className="cursor-pointer" title="Clear Explosion (o7): +1 science"><FaBomb className="text-2xl text-red-500" /></div>
               <div>+1 Sci</div>
              <div></div>
            </>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoBuildActive}
              onChange={() => toggleAutoBuild()}
              className="w-4 h-4"
              aria-label="auto-build-toggle"
              disabled={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0}
              title={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0 ? 'Requires Auto-Queue tech (u7)' : 'Toggle auto-build'}
            />
            <div className={useGameStore.getState().getEffectMultiplier('autoBuildEnabled') === 0 ? 'text-gray-400 text-xs' : 'text-xs'}>Auto</div>
          </div>
        </div>
    </div>
  )
}
