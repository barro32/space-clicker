import { useEffect, useState, useRef } from 'react'
import { useGameStore, GameState } from "./useGameStore.js"
import { FaMoneyBillAlt, FaFlask, FaGasPump, FaBoxOpen } from 'react-icons/fa' // Added FaGasPump
import { SpaceportView } from "./SpaceportView.js"
import { OrbitView } from "./OrbitView.js"
import { ContractsView } from "./ContractsView.js"
import { ResearchTreeView } from "./ResearchTreeView.js"
import { DevConsole } from './DevConsole.js'
import { INITIAL_STATE, TIME } from './gameConstants.js'


// Default companies - used as fallback when loading state
const DEFAULT_COMPANIES = [
  { id: 'titan', name: 'Titan Mining Corp', level: 1, experience: 0 },
  { id: 'nova', name: 'Nova Research', level: 1, experience: 0 },
  { id: 'zenith', name: 'Zenith Logistics', level: 1, experience: 0 },
  { id: 'orion', name: 'Orion Heavy Industries', level: 1, experience: 0 },
  { id: 'galactic', name: 'Galactic Energy', level: 1, experience: 0 },
  { id: 'atlas', name: 'Atlas Construction', level: 1, experience: 0 },
  { id: 'pulsar', name: 'Pulsar Electronics', level: 1, experience: 0 },
  { id: 'stellar', name: 'Stellar Bio-Tech', level: 1, experience: 0 },
  { id: 'aegis', name: 'Aegis Security', level: 1, experience: 0 },
  { id: 'dse', name: 'Deep Space Exploration', level: 1, experience: 0 },
];

// Load persisted state immediately on app load (synchronously before any render)
const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Validate that it has core properties
         if (parsed.money !== undefined && parsed.science !== undefined) {
           // Ensure all required fields exist - use defaults if missing
           if (!parsed.spaceStations) parsed.spaceStations = [];
           if (!parsed.currentView) parsed.currentView = "surface";
           if (!parsed.notifications) parsed.notifications = [];
           if (!parsed.companies) parsed.companies = DEFAULT_COMPANIES;
           if (!parsed.availableContracts) parsed.availableContracts = [];
           if (!parsed.researchedNodes) parsed.researchedNodes = [];
            if (parsed.autoBuildActive === undefined) parsed.autoBuildActive = false;
            if (!parsed.previouslyAvailableResearch) parsed.previouslyAvailableResearch = [];
            if (!parsed.rockets) parsed.rockets = [];
             if (parsed.nextRocketId === undefined) parsed.nextRocketId = 0;
             if (parsed.rocketCost === undefined) parsed.rocketCost = INITIAL_STATE.ROCKET_COST;
             if (parsed.profitPerRocket === undefined) parsed.profitPerRocket = INITIAL_STATE.PROFIT_PER_ROCKET;
              // Force spaceportCapacity to match current default (migration from old saved values of 3 or 4)
              parsed.spaceportCapacity = INITIAL_STATE.SPACEPORT_CAPACITY;
             if (!parsed.spaceports) parsed.spaceports = [{ type: "cargo" }];
             if (parsed.spaceportCost === undefined) parsed.spaceportCost = INITIAL_STATE.SPACEPORT_COST;
           if (parsed.fuelRefineries === undefined) parsed.fuelRefineries = 0;
            if (parsed.fuelProductionPerRefinery === undefined) parsed.fuelProductionPerRefinery = INITIAL_STATE.FUEL_PRODUCTION_PER_REFINERY;
            if (parsed.fuelCostPerRocket === undefined) parsed.fuelCostPerRocket = INITIAL_STATE.FUEL_COST_PER_ROCKET;
             if (parsed.fuelRefineryCost === undefined) parsed.fuelRefineryCost = INITIAL_STATE.FUEL_REFINERY_COST;
            if (!parsed.explodedRocketIds) parsed.explodedRocketIds = [];
            if (parsed.rocketExplosionChance === undefined) parsed.rocketExplosionChance = INITIAL_STATE.ROCKET_EXPLOSION_CHANCE;
           
           return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load persisted state:', e);
    }
  }
  return null;
};

// Load state synchronously BEFORE first render - this is critical for hot reload
const persistedInitialState = loadInitialState();
if (persistedInitialState) {
  useGameStore.setState(persistedInitialState);
}

export function App() {
  // Note: State is already loaded synchronously above, before this component even mounts
  // The useRef below is kept as a safety measure for edge cases, but it shouldn't be needed
  const hasLoadedRef = useRef(false);

   const { money, science, fuel, cargo, tick, currentView, setView, notifications } = useGameStore()
   const productionRates = useGameStore(state => state.getProductionRates())
   const activeContract = useGameStore(state => state.activeContract)
  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now())
  const [displayTime, setDisplayTime] = useState<string>('just now')

   useEffect(() => {
     const interval = setInterval(tick, TIME.TICK_INTERVAL_MS)
     return () => clearInterval(interval)
   }, [tick])

   // Update display time every second
   useEffect(() => {
     const updateDisplayTime = () => {
       const elapsedSeconds = Math.floor((Date.now() - lastSaveTime) / 1000);
       if (elapsedSeconds === 0) {
         setDisplayTime('just now');
       } else if (elapsedSeconds < TIME.DISPLAY_TIME_THRESHOLD_SECONDS) {
         setDisplayTime(`${elapsedSeconds}s ago`);
      } else {
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        setDisplayTime(`${elapsedMinutes}m ago`);
      }
    };

    updateDisplayTime(); // Update immediately
    const interval = setInterval(updateDisplayTime, 1000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);

   useEffect(() => {
      // Setup autosave interval - state is already loaded synchronously
      const saveState = () => {
        const state = useGameStore.getState();
        const stateToSave = {
          money: state.money,
          science: state.science,
          fuel: state.fuel,
          cargo: state.cargo,
          currentView: state.currentView,
          notifications: state.notifications,
          companies: state.companies,
          availableContracts: state.availableContracts,
          activeContract: state.activeContract,
          rockets: state.rockets,
          nextRocketId: state.nextRocketId,
          rocketCost: state.rocketCost,
          profitPerRocket: state.profitPerRocket,
          spaceportCapacity: state.spaceportCapacity,
          spaceports: state.spaceports,
          spaceStations: state.spaceStations,
          spaceportCost: state.spaceportCost,
          fuelRefineries: state.fuelRefineries,
          fuelProductionPerRefinery: state.fuelProductionPerRefinery,
          fuelCostPerRocket: state.fuelCostPerRocket,
          fuelRefineryCost: state.fuelRefineryCost,
          explodedRocketIds: state.explodedRocketIds,
          rocketExplosionChance: state.rocketExplosionChance,
          researchedNodes: state.researchedNodes,
          autoBuildActive: state.autoBuildActive,
          previouslyAvailableResearch: state.previouslyAvailableResearch || [],
        };
        localStorage.setItem('gameState', JSON.stringify(stateToSave));
        setLastSaveTime(Date.now());
      };

      // Save every 30 seconds
      const interval = setInterval(saveState, 30000);
      
      // Also save when the page is about to unload (for better UX during hot reload)
      const handleBeforeUnload = () => {
        saveState();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }, []);

  return (
    <div className="relative min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-900 text-white overflow-hidden">
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button 
          onClick={() => setView("surface")} 
          className={`px-4 py-2 rounded ${currentView === "surface" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Surface
        </button>
        <button 
          onClick={() => setView("orbit")} 
          className={`px-4 py-2 rounded ${currentView === "orbit" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Orbit
        </button>
        <button 
          onClick={() => setView("contracts")} 
          className={`px-4 py-2 rounded ${currentView === "contracts" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Contracts
        </button>
        <button 
          onClick={() => setView("research")} 
          className={`px-4 py-2 rounded ${currentView === "research" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Research
        </button>
      </div>
       {currentView === "surface" ? <SpaceportView /> : currentView === "orbit" ? <OrbitView /> : currentView === "contracts" ? <ContractsView /> : <ResearchTreeView />}
                               {/* Status Box (bottom-right) */}
       <div className="fixed bottom-4 right-4 z-40 w-96 max-w-full">
         <div className="bg-black/40 backdrop-blur-sm border border-gray-700 p-2 rounded-lg shadow-lg">
           <div className="flex flex-col gap-2 pointer-events-auto">
            {/* Autosave Indicator */}
              <div className="text-xs text-gray-400 px-2 py-1 border-b border-gray-600">
                Saved: {displayTime}
              </div>
              {/* Active Contract Display */}
              {activeContract && activeContract.status === 'active' && (
                <div className="bg-blue-900/40 border border-blue-600 px-3 py-2 rounded text-sm">
                  <div className="font-semibold text-blue-300">{activeContract.title}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {activeContract.timeLimitSeconds > 0 ? (
                      <div>
                        Time: {Math.floor((activeContract.timeLimitSeconds - activeContract.elapsedSeconds))}s remaining
                      </div>
                    ) : (
                      <div>No time limit</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-300">
                    Cargo: {Math.floor(activeContract.requiredCargo)} | Science: {Math.floor(activeContract.requiredScience)}
                  </div>
                  {activeContract.maxExplosions > -1 && (
                    <div className="text-xs text-yellow-300">
                      Explosions: {activeContract.currentExplosions}/{activeContract.maxExplosions}
                    </div>
                  )}
                </div>
              )}
              {notifications.length === 0 ? (
               <div className="text-xs text-gray-400 px-2 py-1">No notifications</div>
             ) : (
               notifications.map((msg: string, i: number) => (
                 <div key={i} className="bg-gray-800 border border-gray-600 px-3 py-2 rounded text-sm opacity-95">
                   {msg}
                 </div>
               ))
             )}
           </div>
         </div>
       </div>

         <div className="z-10">
           <p className="flex justify-center items-center text-2xl">
             <FaMoneyBillAlt className="mr-2"/> {Math.floor(money)} <span className="text-xs text-gray-400 ml-1">(+{Math.floor(productionRates.moneyPerSec)}/s)</span>
           </p>
           <p className="flex justify-center items-center text-2xl">
             <FaFlask className="mr-2"/> {Math.floor(science)} <span className="text-xs text-gray-400 ml-1">(+{Math.floor(productionRates.sciencePerSec)}/s)</span>
           </p>
           <div className="flex flex-col items-center gap-1">
             <p className="flex justify-center items-center text-2xl">
               <FaGasPump className="mr-2"/> {Math.floor(fuel)} <span className="text-xs text-gray-400 ml-1">(+{Math.floor(productionRates.fuelPerSec)}/s)</span>
             </p>
             {/* Fuel Status Gauge */}
             <div className="w-48 h-6 bg-gray-800 border border-gray-600 rounded overflow-hidden">
               {(() => {
                 const fuelPercent = Math.min(100, (fuel / 200) * 100);
                 const getGaugeColor = () => {
                   if (fuelPercent >= 75) return 'bg-green-500';
                   if (fuelPercent >= 50) return 'bg-blue-500';
                   if (fuelPercent >= 25) return 'bg-yellow-500';
                   return 'bg-red-500';
                 };
                 return (
                   <div className={`h-full transition-all duration-100 ${getGaugeColor()}`} style={{ width: `${fuelPercent}%` }} />
                 );
               })()}
             </div>
           </div>
           <p className="flex justify-center items-center text-2xl">
             <FaBoxOpen className="mr-2"/> {Math.floor(cargo)}
           </p>
         </div>
      <DevConsole />

    </div>
  )
}
