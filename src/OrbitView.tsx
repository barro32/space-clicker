import { useGameStore } from "./useGameStore"
import { FaSatellite, FaGlobe, FaMicroscope, FaTruckLoading } from "react-icons/fa"

export function OrbitView() {
  const { spaceStations, buildSpaceStation, cargo, science } = useGameStore()
  
  const costCargo = 500;
  const costScience = 500;

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Planet Representation */}
        <div className="absolute w-32 h-32 bg-blue-500 rounded-full shadow-lg flex items-center justify-center z-10 animate-pulse">
           <FaGlobe className="text-6xl text-blue-300" />
        </div>
        
        {/* Orbiting Stations */}
        {spaceStations.map((station, index) => {
          const angle = (index / spaceStations.length) * 2 * Math.PI;
          const radius = 80;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div 
              key={station.id}
              className="absolute z-20 transition-all duration-1000"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <div className={`p-2 rounded-full border-2 ${station.type === 'research' ? 'border-blue-400 bg-blue-900' : 'border-green-400 bg-green-900'}`}>
                {station.type === 'research' ? <FaMicroscope className="text-xl" /> : <FaTruckLoading className="text-xl" />}
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap bg-black px-1 rounded">
                Lvl {station.level}
              </div>
            </div>
          );
        })}

        {/* Orbit Path */}
        <div className="absolute w-48 h-48 border-2 border-gray-700 rounded-full border-dashed"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          onClick={() => buildSpaceStation('research')} 
          className={`cursor-pointer border-2 p-4 rounded-lg flex flex-col items-center gap-2 transition-colors ${cargo >= costCargo && science >= costScience ? 'border-blue-500 hover:bg-blue-900' : 'border-gray-700 opacity-50'}`}
        >
          <FaMicroscope className="text-3xl text-blue-400" />
          <div className="font-bold">Build Research Station</div>
          <div className="text-sm text-gray-400">{costCargo} Cargo / {costScience} Sci</div>
          <div className="text-xs text-blue-300">+10 Sci / tick</div>
        </div>

        <div 
          onClick={() => buildSpaceStation('logistics')} 
          className={`cursor-pointer border-2 p-4 rounded-lg flex flex-col items-center gap-2 transition-colors ${cargo >= costCargo && science >= costScience ? 'border-green-500 hover:bg-green-900' : 'border-gray-700 opacity-50'}`}
        >
          <FaTruckLoading className="text-3xl text-green-400" />
          <div className="font-bold">Build Logistics Station</div>
          <div className="text-sm text-gray-400">{costCargo} Cargo / {costScience} Sci</div>
          <div className="text-xs text-green-300">+$50 / tick</div>
        </div>
      </div>

      <div className="text-gray-400 text-sm max-w-md text-center">
        Orbital space stations provide massive resource boosts and serve as the foundation for future lunar expansion.
      </div>
    </div>
  );
}
