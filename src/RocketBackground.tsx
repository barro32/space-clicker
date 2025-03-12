import { useGameStore } from "./useGameStore"
import { FaRocket } from "react-icons/fa"

export function RocketBackground() {
  const { rockets, spaceports, spaceportCapacity } = useGameStore()
  return (
    <div className="absolute top-0 left-0 pointer-events-none opacity-40 flex gap-1 p-1 flex-wrap">
      {Array.from({ length: spaceports }).map((_, spIndex) => {
        const fill = Math.max(0, Math.min(spaceportCapacity, rockets - spIndex * spaceportCapacity))
        return (
          <div key={spIndex} className="grid grid-cols-3 gap-1 border border-gray-500">
            {Array.from({ length: spaceportCapacity }).map((_, i) =>
              i < fill 
                ? <FaRocket key={i} className="text-2xl" />
                : <div key={i} className="w-6 h-6 border border-gray-500"></div>
            )}
          </div>
        )
      })}
    </div>
  )
}
