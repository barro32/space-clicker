import { useGameStore } from "./useGameStore"
import { FaRegBuilding, FaRocket } from "react-icons/fa"

export function RocketBackground() {
  const { rockets, spaceports, spaceportCapacity, toggleSpaceport, buildSpaceport, buildRocket } = useGameStore()
  return (
    <div className="absolute top-0 left-0 opacity-40 flex flex-wrap gap-1">
      {spaceports.map((sp, spIndex) => {
        const fill = Math.max(0, Math.min(spaceportCapacity, rockets - spIndex * spaceportCapacity))
        return (
          <div key={spIndex} onClick={() => toggleSpaceport(spIndex)} className="cursor-pointer grid grid-cols-3 gap-1 border border-gray-500">
            {Array.from({ length: spaceportCapacity }).map((_, i) =>
              i < fill 
                ? <FaRocket key={i} className="text-2xl" />
                : <div key={i} className="w-6 h-6 border border-gray-300"></div>
            )}
          </div>
        )
      })}
      <button className="cursor-pointer grid grid-cols-3 gap-1 border border-gray-500" onClick={buildSpaceport}><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /><FaRegBuilding className="text-2xl" /></button>
      <button className="cursor-pointer grid grid-cols-3 gap-1 border border-gray-500" onClick={buildRocket}><FaRocket className="text-2xl"/></button>
    </div>
  )
}
