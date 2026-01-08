import { useEffect, useState, useRef, useMemo } from 'react'
import { useGameStore, GameState } from "./useGameStore.js"
import { FaMoneyBillAlt, FaFlask, FaGasPump, FaBoxOpen } from 'react-icons/fa'
import { SpaceportView } from "./SpaceportView.js"
import { OrbitView } from "./OrbitView.js"
import { ContractsView } from "./ContractsView.js"
import { ResearchTreeView } from "./ResearchTreeView.js"
import { DevConsole } from './DevConsole.js'
import { INITIAL_STATE, TIME, PRODUCTION } from './gameConstants.js'
import { researchTree, ResearchNode } from './researchTree.js'


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

// Helper function to calculate effect multiplier - extracted from store
function getEffectMultiplier(type: string, researchedNodes: string[]): number {
  const multipliers = researchTree
    .filter((node: ResearchNode) => researchedNodes.includes(node.id) && node.effect.type === type)
    .map((node: ResearchNode) => node.effect.value);
  
  if (type.endsWith('Multiplier')) {
    return multipliers.length === 0 ? 1 : multipliers.reduce((acc, val) => acc * val, 1);
  } else {
    return multipliers.length === 0 ? 0 : multipliers.reduce((acc, val) => acc + val, 0);
  }
}

// Helper functions to calculate production rates and fleet summary
// These avoid the Zustand infinite loop issue by being pure functions
interface ProductionRates {
  moneyPerSec: number;
  sciencePerSec: number;
  fuelPerSec: number;
}

interface FleetSummary {
  totalRockets: number;
  cargoRockets: number;
  scienceRockets: number;
  fuelPerSecondConsumption: number;
}

function calculateProductionRates(state: GameState): ProductionRates {
  // Fuel production from refineries
  const fuelPerSec = state.fuelRefineries * state.fuelProductionPerRefinery * getEffectMultiplier('refineryOutputMultiplier', state.researchedNodes);
  
  // Count active rockets (non-exploded)
  const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
  const cargoRockets = activeRockets.filter(r => r.type === 'cargo').length;
  const scienceRockets = activeRockets.filter(r => r.type === 'science').length;
  
  // Calculate fuel cost per rocket
  const effectiveFuelCost = state.fuelCostPerRocket * getEffectMultiplier('fuelCostMultiplier', state.researchedNodes);
  
  // Estimate launches per tick based on available fuel
  const estimatedRocketsPerTick = Math.floor((state.fuel + fuelPerSec) / effectiveFuelCost);
  const maxRocketLaunches = Math.min(estimatedRocketsPerTick, cargoRockets + scienceRockets);
  
  // Calculate success rate (1 - explosion chance)
  const effectiveExplosionChance = state.rocketExplosionChance * getEffectMultiplier('explosionChanceMultiplier', state.researchedNodes);
  const successRate = Math.max(0, 1 - effectiveExplosionChance);
  
  // Estimate successful launches
  const successfulCargo = Math.floor(cargoRockets * maxRocketLaunches * successRate / Math.max(1, cargoRockets + scienceRockets));
  const successfulScience = Math.floor(scienceRockets * maxRocketLaunches * successRate / Math.max(1, cargoRockets + scienceRockets));
  
  // Money production
  const moneyPerSec = successfulCargo * state.profitPerRocket * getEffectMultiplier('profitMultiplier', state.researchedNodes);
  
  // Science production
  const sciencePerSec = successfulScience + Math.round((state.rocketExplosionChance - state.rocketExplosionChance * getEffectMultiplier('explosionChanceMultiplier', state.researchedNodes)) * maxRocketLaunches);
  
  return { moneyPerSec, sciencePerSec, fuelPerSec };
}

function calculateFleetSummary(state: GameState): FleetSummary {
  const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
  
  const cargoRockets = activeRockets.filter(r => r.type === 'cargo').length;
  const scienceRockets = activeRockets.filter(r => r.type === 'science').length;
  const totalRockets = activeRockets.length;
  
  // Calculate fuel consumption per second (all active rockets)
  const effectiveFuelCost = state.fuelCostPerRocket * getEffectMultiplier('fuelCostMultiplier', state.researchedNodes);
  const fuelPerSecondConsumption = totalRockets * effectiveFuelCost;
  
   return { totalRockets, cargoRockets, scienceRockets, fuelPerSecondConsumption };
}

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
   const activeContract = useGameStore(state => state.activeContract)
   
    // Get computed values using our helper functions
    // These pure functions avoid the Zustand infinite loop issue
    const researchedNodes = useGameStore(state => state.researchedNodes);
    const rockets = useGameStore(state => state.rockets);
    const explodedRocketIds = useGameStore(state => state.explodedRocketIds);
    const fuelRefineries = useGameStore(state => state.fuelRefineries);
    
    const productionRates = useMemo(() => {
      const state = useGameStore.getState();
      return calculateProductionRates(state);
    }, [researchedNodes, rockets, explodedRocketIds, fuelRefineries, fuel]);
    
    const fleetSummary = useMemo(() => {
      const state = useGameStore.getState();
      return calculateFleetSummary(state);
    }, [researchedNodes, rockets, explodedRocketIds]);
   const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now())
   const [displayTime, setDisplayTime] = useState<string>('just now')
   
   // Track resource changes for animations
   interface ResourceChange {
     id: number;
     type: 'money' | 'science' | 'fuel' | 'cargo';
     amount: number;
     timestamp: number;
   }
   const [resourceChanges, setResourceChanges] = useState<ResourceChange[]>([])
   const prevMoneyRef = useRef(0)
   const prevScienceRef = useRef(0)
   const prevFuelRef = useRef(0)
   const prevCargoRef = useRef(0)
   const changeIdRef = useRef(0)

   useEffect(() => {
      const interval = setInterval(tick, TIME.TICK_INTERVAL_MS)
      return () => clearInterval(interval)
    }, [tick])

    // Track resource changes for floating number animations
    useEffect(() => {
      const now = Date.now();
      const newChanges: ResourceChange[] = [];
      
      // Check for money changes
      if (Math.floor(money) > Math.floor(prevMoneyRef.current)) {
        newChanges.push({
          id: changeIdRef.current++,
          type: 'money',
          amount: Math.floor(money) - Math.floor(prevMoneyRef.current),
          timestamp: now
        });
      }
      
      // Check for science changes
      if (Math.floor(science) > Math.floor(prevScienceRef.current)) {
        newChanges.push({
          id: changeIdRef.current++,
          type: 'science',
          amount: Math.floor(science) - Math.floor(prevScienceRef.current),
          timestamp: now
        });
      }
      
      // Check for fuel changes
      if (Math.floor(fuel) > Math.floor(prevFuelRef.current)) {
        newChanges.push({
          id: changeIdRef.current++,
          type: 'fuel',
          amount: Math.floor(fuel) - Math.floor(prevFuelRef.current),
          timestamp: now
        });
      }
      
      // Check for cargo changes
      if (Math.floor(cargo) > Math.floor(prevCargoRef.current)) {
        newChanges.push({
          id: changeIdRef.current++,
          type: 'cargo',
          amount: Math.floor(cargo) - Math.floor(prevCargoRef.current),
          timestamp: now
        });
      }
      
      // Update refs
      prevMoneyRef.current = money;
      prevScienceRef.current = science;
      prevFuelRef.current = fuel;
      prevCargoRef.current = cargo;
      
      // Add new changes and remove old ones (after 1.5 seconds)
      if (newChanges.length > 0) {
        setResourceChanges(prev => {
          const filtered = prev.filter(c => now - c.timestamp < 1500);
          return [...filtered, ...newChanges];
        });
      }
    }, [money, science, fuel, cargo])

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
       {/* Navigation Buttons - top-right */}
       <div className="absolute top-4 right-4 flex gap-2 z-20">
         <button 
           onClick={() => setView("surface")} 
           className={`px-4 py-2 rounded border-2 transition-all ${currentView === "surface" ? "bg-cyan-600 border-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-gray-700 border-gray-600 hover:bg-gray-600"}`}
         >
           Surface
         </button>
         <button 
           onClick={() => setView("orbit")} 
           className={`px-4 py-2 rounded border-2 transition-all ${currentView === "orbit" ? "bg-cyan-600 border-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-gray-700 border-gray-600 hover:bg-gray-600"}`}
         >
           Orbit
         </button>
         <button 
           onClick={() => setView("contracts")} 
           className={`px-4 py-2 rounded border-2 transition-all ${currentView === "contracts" ? "bg-cyan-600 border-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-gray-700 border-gray-600 hover:bg-gray-600"}`}
         >
           Contracts
         </button>
         <button 
           onClick={() => setView("research")} 
           className={`px-4 py-2 rounded border-2 transition-all ${currentView === "research" ? "bg-cyan-600 border-cyan-400 shadow-lg shadow-cyan-400/50" : "bg-gray-700 border-gray-600 hover:bg-gray-600"}`}
         >
           Research
         </button>
       </div>

       {/* HUD Panel - top-left with Resources */}
       <div className="absolute top-4 left-4 z-30 w-96">
         <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-500/50 rounded-lg shadow-lg shadow-cyan-500/20 backdrop-blur-sm p-4">
           {/* HUD Header */}
           <div className="text-cyan-400 font-mono text-sm font-bold mb-3 pb-2 border-b border-cyan-500/30">
             ⚙ RESOURCE STATUS
           </div>

           {/* Resources Grid */}
           <div className="space-y-3">
             {/* Money */}
             <div className="bg-black/30 border border-green-600/50 rounded px-3 py-2">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <FaMoneyBillAlt className="text-green-400 text-lg" />
                   <span className="font-mono text-sm text-gray-300">CREDITS</span>
                 </div>
                 <div className="text-right">
                   <div className="text-green-400 font-bold font-mono text-lg">{Math.floor(money).toLocaleString()}</div>
                   <div className="text-green-600 text-xs font-mono">+{Math.floor(productionRates.moneyPerSec)}/s</div>
                 </div>
               </div>
               {/* Money change indicators */}
               <div className="relative h-1">
                 {resourceChanges.filter(c => c.type === 'money').map(change => (
                   <div key={change.id} className="absolute animate-float-up text-green-400 font-bold pointer-events-none text-xs">
                     +{change.amount}
                   </div>
                 ))}
               </div>
             </div>

             {/* Science */}
             <div className="bg-black/30 border border-blue-600/50 rounded px-3 py-2">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <FaFlask className="text-blue-400 text-lg" />
                   <span className="font-mono text-sm text-gray-300">SCIENCE</span>
                 </div>
                 <div className="text-right">
                   <div className="text-blue-400 font-bold font-mono text-lg">{Math.floor(science).toLocaleString()}</div>
                   <div className="text-blue-600 text-xs font-mono">+{Math.floor(productionRates.sciencePerSec)}/s</div>
                 </div>
               </div>
               {/* Science change indicators */}
               <div className="relative h-1">
                 {resourceChanges.filter(c => c.type === 'science').map(change => (
                   <div key={change.id} className="absolute animate-float-up text-blue-400 font-bold pointer-events-none text-xs">
                     +{change.amount}
                   </div>
                 ))}
               </div>
             </div>

             {/* Fuel */}
             <div className="bg-black/30 border border-orange-600/50 rounded px-3 py-2">
               <div className="flex justify-between items-center mb-2">
                 <div className="flex items-center gap-2">
                   <FaGasPump className="text-orange-400 text-lg" />
                   <span className="font-mono text-sm text-gray-300">FUEL</span>
                 </div>
                 <div className="text-right">
                   <div className="text-orange-400 font-bold font-mono text-lg">{Math.floor(fuel).toLocaleString()}</div>
                   <div className="text-orange-600 text-xs font-mono">+{Math.floor(productionRates.fuelPerSec)}/s</div>
                 </div>
               </div>
               {/* Fuel Gauge */}
               <div className="w-full h-3 bg-gray-900 border border-orange-600/50 rounded overflow-hidden">
                 {(() => {
                   const fuelPercent = Math.min(100, (fuel / 200) * 100);
                   const getGaugeColor = () => {
                     if (fuelPercent >= 75) return 'bg-green-500';
                     if (fuelPercent >= 50) return 'bg-cyan-500';
                     if (fuelPercent >= 25) return 'bg-yellow-500';
                     return 'bg-red-500';
                   };
                   return (
                     <div className={`h-full transition-all duration-100 ${getGaugeColor()} shadow-lg`} style={{ width: `${fuelPercent}%` }} />
                   );
                 })()}
               </div>
               {/* Fuel change indicators */}
               <div className="relative h-1">
                 {resourceChanges.filter(c => c.type === 'fuel').map(change => (
                   <div key={change.id} className="absolute animate-float-up text-orange-400 font-bold pointer-events-none text-xs">
                     +{change.amount}
                   </div>
                 ))}
               </div>
             </div>

             {/* Cargo */}
             <div className="bg-black/30 border border-purple-600/50 rounded px-3 py-2">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <FaBoxOpen className="text-purple-400 text-lg" />
                   <span className="font-mono text-sm text-gray-300">CARGO</span>
                 </div>
                 <div className="text-right">
                   <div className="text-purple-400 font-bold font-mono text-lg">{Math.floor(cargo).toLocaleString()}</div>
                 </div>
               </div>
               {/* Cargo change indicators */}
               <div className="relative h-1">
                 {resourceChanges.filter(c => c.type === 'cargo').map(change => (
                   <div key={change.id} className="absolute animate-float-up text-purple-400 font-bold pointer-events-none text-xs">
                     +{change.amount}
                   </div>
                 ))}
               </div>
             </div>
           </div>

           {/* Autosave Indicator */}
           <div className="text-center text-xs text-gray-500 font-mono mt-3 pt-2 border-t border-cyan-500/20">
             Last saved: {displayTime}
           </div>
         </div>
       </div>

       {/* Main Content Area */}
       <div className="relative z-10 w-full h-full flex items-center justify-center">
         {currentView === "surface" ? <SpaceportView /> : currentView === "orbit" ? <OrbitView /> : currentView === "contracts" ? <ContractsView /> : <ResearchTreeView />}
       </div>

       {/* Status Box - bottom-right with Fleet & Contract Info */}
       <div className="fixed bottom-4 right-4 z-40 w-96 max-w-full">
         <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-cyan-500/50 rounded-lg shadow-lg shadow-cyan-500/20 backdrop-blur-sm p-4">
           {/* Fleet Status Header */}
           <div className="text-cyan-400 font-mono text-sm font-bold mb-3 pb-2 border-b border-cyan-500/30">
             ▶ FLEET STATUS
           </div>

           {/* Active Contract Display */}
           {activeContract && activeContract.status === 'active' && (
             <div className="bg-blue-900/40 border-2 border-blue-500/50 px-3 py-2 rounded mb-3">
               <div className="font-semibold text-blue-300 font-mono text-sm">{activeContract.title}</div>
               <div className="text-xs text-gray-300 mt-1 space-y-1">
                 {activeContract.timeLimitSeconds > 0 ? (
                   <div>
                     ⏱ Time: {Math.floor((activeContract.timeLimitSeconds - activeContract.elapsedSeconds))}s
                   </div>
                 ) : (
                   <div>⏱ No time limit</div>
                 )}
                 <div>
                   📦 Cargo: {Math.floor(activeContract.requiredCargo)} | 📚 Science: {Math.floor(activeContract.requiredScience)}
                 </div>
               </div>
               {activeContract.maxExplosions > -1 && (
                 <div className="text-xs text-yellow-300 mt-1">
                    💥 Explosions: {activeContract.currentExplosions}/{activeContract.maxExplosions}
                 </div>
               )}
             </div>
           )}

           {/* Rocket Fleet Summary */}
           <div className="bg-black/30 border-2 border-cyan-500/50 px-3 py-2 rounded mb-3">
             <div className="text-cyan-400 font-mono text-xs font-bold mb-2">FLEET COMPOSITION</div>
             <div className="text-xs text-gray-300 space-y-1 font-mono">
               <div>🚀 Total: <span className="text-cyan-400 font-bold">{fleetSummary.totalRockets}</span></div>
               <div>📦 Cargo: <span className="text-green-400">{fleetSummary.cargoRockets}</span> | 📚 Science: <span className="text-purple-400">{fleetSummary.scienceRockets}</span></div>
               <div>⛽ Consumption: <span className="text-orange-400 font-bold">{Math.ceil(fleetSummary.fuelPerSecondConsumption)}/s</span></div>
             </div>
           </div>

           {/* Notifications */}
           <div className="text-cyan-400 font-mono text-xs font-bold mb-2 pb-2 border-b border-cyan-500/30">
             📡 NOTIFICATIONS
           </div>
           {notifications.length === 0 ? (
             <div className="text-xs text-gray-500 px-2 py-1 font-mono">No notifications</div>
           ) : (
             notifications.map((msg: string, i: number) => (
               <div key={i} className="bg-black/40 border border-cyan-500/30 px-2 py-1 rounded text-xs text-gray-300 mb-1 font-mono">
                 ▪ {msg}
               </div>
             ))
           )}
         </div>
       </div>

       <DevConsole />

     </div>
   )
}
