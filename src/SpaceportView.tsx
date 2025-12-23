import { useGameStore } from "./useGameStore"
import { FaRegBuilding, FaRocket, FaBomb, FaGasPump } from "react-icons/fa" // Added FaGasPump

export function SpaceportView() {
  const { rockets, spaceports, spaceportCapacity, toggleSpaceport, buildSpaceport, buildRocket, explodedRocketIds, clearExplosion, fuel, fuelRefineries, buildFuelRefinery, fuelRefineryCost } = useGameStore()
  
  const currentRocketCost = useGameStore(state => Math.floor(state.rocketCost * Math.pow(1.2, state.rockets.filter(r => r !== null).length - state.explodedRocketIds.length)));
  const currentSpaceportCost = useGameStore(state => state.getCurrentSpaceportCost());
  const currentFuelRefineryCost = useGameStore(state => Math.round(state.fuelRefineryCost * Math.pow(1.5, state.fuelRefineries)));

  return (
    <div className="absolute top-0 left-0 opacity-80 flex flex-wrap gap-1">
      {spaceports.map((sp, spIndex) => {
        return (
          <div key={spIndex} onClick={() => toggleSpaceport(spIndex)} className={`cursor-pointer grid grid-cols-3 gap-1 border ${sp.type === "cargo" ? "border-green-500" : "border-blue-500"}`}>
            {Array.from({ length: spaceportCapacity }).map((_, i) => {
              const rocketIndex = spIndex * spaceportCapacity + i;
              const rocket = rockets[rocketIndex];
              if (rocket) {
                const isExploded = explodedRocketIds.includes(rocket.id);
                if (isExploded) {
                  return <FaBomb key={i} onClick={(e) => { e.stopPropagation(); clearExplosion(rocket.id); }} className="text-2xl cursor-pointer text-red-500 animate-pulse" />;
                } else {
                  return <FaRocket key={i} className="text-2xl text-blue-400 animate-bounce-slow" />;
                }
              } else {
                return <div key={i} className="w-6 h-6 border border-gray-300"></div>;
              }
            })}
          </div>
        )
      })}
      <div className="grid grid-cols-3 gap-1 border border-gray-500 p-1">
        <div onClick={buildRocket} className="cursor-pointer"><FaRocket className="text-2xl text-blue-400" /></div>
        <div>${currentRocketCost}</div>
        <div></div> {/* Removed Fuel cost label */}
        <div onClick={buildSpaceport} className="cursor-pointer"><FaRegBuilding className="text-2xl" /></div>
        <div>${currentSpaceportCost}</div>
        <div></div>
        <div onClick={buildFuelRefinery} className="cursor-pointer"><FaGasPump className="text-2xl" /></div>
        <div>${currentFuelRefineryCost}</div>
        <div>Refineries: {fuelRefineries}</div>
        <div onClick={() => {
          if (explodedRocketIds.length > 0) {
            const explosionToClear = explodedRocketIds[0];
            clearExplosion(explosionToClear);
          }
        }} className="cursor-pointer"><FaBomb className="text-2xl text-red-500" /></div>
        <div>+1 Sci</div>
        <div></div>
      </div>
    </div>
  )
}
