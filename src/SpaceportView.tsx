import { useGameStore } from "./useGameStore"
import { FaRegBuilding, FaRocket, FaBomb } from "react-icons/fa"

export function SpaceportView() {
  const { rockets, spaceports, spaceportCapacity, toggleSpaceport, buildSpaceport, buildRocket, explosions, clearExplosion, spaceportCost } = useGameStore()
  
  const currentRocketCost = useGameStore(state => Math.floor(state.rocketCost * Math.pow(1.2, state.rockets - state.explosions.length)));

  return (
    <div className="absolute top-0 left-0 opacity-80 flex flex-wrap gap-1">
      {spaceports.map((sp, spIndex) => {
        const fill = Math.max(0, Math.min(spaceportCapacity, rockets - spIndex * spaceportCapacity))
        return (
          <div key={spIndex} onClick={() => toggleSpaceport(spIndex)} className={`cursor-pointer grid grid-cols-3 gap-1 border ${sp.type === "cargo" ? "border-green-500" : "border-blue-500"}`}>
            {Array.from({ length: spaceportCapacity }).map((_, i) =>
              explosions.some(exp => exp.spIndex === spIndex && exp.slot === i)
                ? <FaBomb key={i} onClick={() => clearExplosion(spIndex, i)} className="text-2xl cursor-pointer" />
                : i < fill 
                  ? <FaRocket key={i} className="text-2xl" />
                  : <div key={i} className="w-6 h-6 border border-gray-300"></div>
            )}
          </div>
        )
      })}
      <div className="grid grid-cols-3 gap-1 border border-gray-500 p-1">
        <div onClick={buildRocket} className="cursor-pointer"><FaRocket className="text-2xl" /></div>
        <div>${currentRocketCost}</div>
        <div></div>
        <div onClick={buildSpaceport} className="cursor-pointer"><FaRegBuilding className="text-2xl" /></div>
        <div>${spaceportCost}</div>
        <div></div>
        <div onClick={() => {
          if (explosions.length > 0) {
            const explosionToClear = explosions[0];
            clearExplosion(explosionToClear.spIndex, explosionToClear.slot);
          }
        }} className="cursor-pointer"><FaBomb className="text-2xl" /></div>
        <div>+1 Sci</div>
        <div></div>
      </div>
    </div>
  )
}
