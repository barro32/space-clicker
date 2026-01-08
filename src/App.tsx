import { useEffect, useState, useRef, useMemo } from 'react'
import { useGameStore, GameState } from "./useGameStore.js"
import { FaMoneyBillAlt, FaFlask, FaGasPump, FaBoxOpen, FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight, FaRocket, FaSatellite, FaFlask as FaLab } from 'react-icons/fa'
import { SpaceportView } from "./SpaceportView.js"
import { OrbitView } from "./OrbitView.js"
import { ContractsView } from "./ContractsView.js"
import { ResearchTreeView } from "./ResearchTreeView.js"
import { DevConsole } from './DevConsole.js'
import { INITIAL_STATE, TIME, DEFAULT_COMPANIES } from './gameConstants.js'
import { researchTree, ResearchNode, EffectType } from './researchTree.js'


// Helper function to calculate effect multiplier - extracted from store
function getEffectMultiplier(type: EffectType, researchedNodes: string[]): number {
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
  const fuelPerSec = state.fuelRefineries * state.fuelProductionPerRefinery * getEffectMultiplier('refineryOutputMultiplier', state.researchedNodes);
  const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
  const cargoRockets = activeRockets.filter(r => r.type === 'cargo').length;
  const scienceRockets = activeRockets.filter(r => r.type === 'science').length;
  const effectiveFuelCost = state.fuelCostPerRocket * getEffectMultiplier('fuelCostMultiplier', state.researchedNodes);
  const estimatedRocketsPerTick = Math.floor((state.fuel + fuelPerSec) / effectiveFuelCost);
  const maxRocketLaunches = Math.min(estimatedRocketsPerTick, cargoRockets + scienceRockets);
  const effectiveExplosionChance = state.rocketExplosionChance * getEffectMultiplier('explosionChanceMultiplier', state.researchedNodes);
  const successRate = Math.max(0, 1 - effectiveExplosionChance);
  const successfulCargo = Math.floor(cargoRockets * maxRocketLaunches * successRate / Math.max(1, cargoRockets + scienceRockets));
  const successfulScience = Math.floor(scienceRockets * maxRocketLaunches * successRate / Math.max(1, cargoRockets + scienceRockets));
  const moneyPerSec = successfulCargo * state.profitPerRocket * getEffectMultiplier('profitMultiplier', state.researchedNodes);
  // Include passive science from spaceports (1 per spaceport per tick)
  const passiveScienceFromSpaceports = state.spaceports.length;
  const sciencePerSec = successfulScience + Math.round((state.rocketExplosionChance - state.rocketExplosionChance * getEffectMultiplier('explosionChanceMultiplier', state.researchedNodes)) * maxRocketLaunches) + passiveScienceFromSpaceports;
  return { moneyPerSec, sciencePerSec, fuelPerSec };
}

function calculateFleetSummary(state: GameState): FleetSummary {
  const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
  const cargoRockets = activeRockets.filter(r => r.type === 'cargo').length;
  const scienceRockets = activeRockets.filter(r => r.type === 'science').length;
  const totalRockets = activeRockets.length;
  const effectiveFuelCost = state.fuelCostPerRocket * getEffectMultiplier('fuelCostMultiplier', state.researchedNodes);
  const fuelPerSecondConsumption = totalRockets * effectiveFuelCost;
  return { totalRockets, cargoRockets, scienceRockets, fuelPerSecondConsumption };
}

// Load persisted state
const loadInitialState = () => {
  if (typeof window !== 'undefined') {
    try {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.money !== undefined && parsed.science !== undefined) {
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
          parsed.spaceportCapacity = INITIAL_STATE.SPACEPORT_CAPACITY;
          if (!parsed.spaceports) parsed.spaceports = [{ id: 1 }];
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

const persistedInitialState = loadInitialState();
if (persistedInitialState) {
  useGameStore.setState(persistedInitialState);
}

// Layer configuration
type Layer = 'orbit' | 'surface' | 'research';
const LAYERS: Layer[] = ['orbit', 'surface', 'research'];

export function App() {
  const verticalScrollRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  const { money, science, fuel, cargo, tick, notifications } = useGameStore()
  
  // Current layer state
  const [currentLayer, setCurrentLayer] = useState<Layer>('surface');
  const [surfaceSubView, setSurfaceSubView] = useState<'spaceports' | 'contracts'>('spaceports');
  
  // Get computed values
  const researchedNodes = useGameStore(state => state.researchedNodes);
  const rockets = useGameStore(state => state.rockets);
  const explodedRocketIds = useGameStore(state => state.explodedRocketIds);
  const fuelRefineries = useGameStore(state => state.fuelRefineries);
  const spaceports = useGameStore(state => state.spaceports);
  
  const productionRates = useMemo(() => {
    const state = useGameStore.getState();
    return calculateProductionRates(state);
  }, [researchedNodes, rockets, explodedRocketIds, fuelRefineries, fuel, spaceports]);
  
  const fleetSummary = useMemo(() => {
    const state = useGameStore.getState();
    return calculateFleetSummary(state);
  }, [researchedNodes, rockets, explodedRocketIds]);

  // Check if there's affordable research available
  const hasAffordableResearch = useMemo(() => {
    const availableNodes = researchTree.filter((node: ResearchNode) => {
      // Not already researched
      if (researchedNodes.includes(node.id)) return false;
      // All prerequisites met
      return node.prerequisites.every(prereq => researchedNodes.includes(prereq));
    });
    // Check if player can afford any of them
    return availableNodes.some((node: ResearchNode) => science >= node.scienceCost);
  }, [researchedNodes, science]);

  const [lastSaveTime, setLastSaveTime] = useState<number>(Date.now())
  const [displayTime, setDisplayTime] = useState<string>('just now')
  
  // Resource change tracking
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

  // Scroll to a specific layer
  const scrollToLayer = (layer: Layer) => {
    const index = LAYERS.indexOf(layer);
    if (verticalScrollRef.current) {
      verticalScrollRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      });
    }
    setCurrentLayer(layer);
  };

  // Scroll to surface sub-view
  const scrollToSubView = (subView: 'spaceports' | 'contracts') => {
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollTo({
        left: subView === 'spaceports' ? 0 : window.innerWidth,
        behavior: 'smooth'
      });
    }
    setSurfaceSubView(subView);
  };

  // Handle vertical scroll to detect current layer
  const handleVerticalScroll = () => {
    if (verticalScrollRef.current) {
      const scrollTop = verticalScrollRef.current.scrollTop;
      const height = window.innerHeight;
      const index = Math.round(scrollTop / height);
      if (LAYERS[index] && LAYERS[index] !== currentLayer) {
        setCurrentLayer(LAYERS[index]);
      }
    }
  };

  // Handle horizontal scroll
  const handleHorizontalScroll = () => {
    if (horizontalScrollRef.current) {
      const scrollLeft = horizontalScrollRef.current.scrollLeft;
      const width = window.innerWidth;
      const subView = scrollLeft < width / 2 ? 'spaceports' : 'contracts';
      if (subView !== surfaceSubView) {
        setSurfaceSubView(subView);
      }
    }
  };

  // Initial scroll to surface
  useEffect(() => {
    if (verticalScrollRef.current) {
      verticalScrollRef.current.scrollTo({
        top: window.innerHeight, // Surface is index 1
        behavior: 'auto'
      });
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(tick, TIME.TICK_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [tick])

  // Resource change animations
  useEffect(() => {
    const now = Date.now();
    const newChanges: ResourceChange[] = [];
    
    if (Math.floor(money) > Math.floor(prevMoneyRef.current)) {
      newChanges.push({ id: changeIdRef.current++, type: 'money', amount: Math.floor(money) - Math.floor(prevMoneyRef.current), timestamp: now });
    }
    if (Math.floor(science) > Math.floor(prevScienceRef.current)) {
      newChanges.push({ id: changeIdRef.current++, type: 'science', amount: Math.floor(science) - Math.floor(prevScienceRef.current), timestamp: now });
    }
    if (Math.floor(fuel) > Math.floor(prevFuelRef.current)) {
      newChanges.push({ id: changeIdRef.current++, type: 'fuel', amount: Math.floor(fuel) - Math.floor(prevFuelRef.current), timestamp: now });
    }
    if (Math.floor(cargo) > Math.floor(prevCargoRef.current)) {
      newChanges.push({ id: changeIdRef.current++, type: 'cargo', amount: Math.floor(cargo) - Math.floor(prevCargoRef.current), timestamp: now });
    }
    
    prevMoneyRef.current = money;
    prevScienceRef.current = science;
    prevFuelRef.current = fuel;
    prevCargoRef.current = cargo;
    
    if (newChanges.length > 0) {
      setResourceChanges(prev => {
        const filtered = prev.filter(c => now - c.timestamp < 1500);
        return [...filtered, ...newChanges];
      });
    }
  }, [money, science, fuel, cargo])

  // Display time update
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
    updateDisplayTime();
    const interval = setInterval(updateDisplayTime, 1000);
    return () => clearInterval(interval);
  }, [lastSaveTime]);

  // Autosave
  useEffect(() => {
    const saveState = () => {
      const state = useGameStore.getState();
      const stateToSave = {
        money: state.money, science: state.science, fuel: state.fuel, cargo: state.cargo,
        currentView: state.currentView, notifications: state.notifications, companies: state.companies,
        availableContracts: state.availableContracts, activeContract: state.activeContract,
        rockets: state.rockets, nextRocketId: state.nextRocketId, rocketCost: state.rocketCost,
        profitPerRocket: state.profitPerRocket, spaceportCapacity: state.spaceportCapacity,
        spaceports: state.spaceports, spaceStations: state.spaceStations, spaceportCost: state.spaceportCost,
        fuelRefineries: state.fuelRefineries, fuelProductionPerRefinery: state.fuelProductionPerRefinery,
        fuelCostPerRocket: state.fuelCostPerRocket, fuelRefineryCost: state.fuelRefineryCost,
        explodedRocketIds: state.explodedRocketIds, rocketExplosionChance: state.rocketExplosionChance,
        researchedNodes: state.researchedNodes, autoBuildActive: state.autoBuildActive,
        previouslyAvailableResearch: state.previouslyAvailableResearch || [],
      };
      localStorage.setItem('gameState', JSON.stringify(stateToSave));
      setLastSaveTime(Date.now());
    };

    const interval = setInterval(saveState, 30000);
    const handleBeforeUnload = () => saveState();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 text-white">
      {/* Vertical Navigation Menu - Right side */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {/* Up arrow */}
        <button 
          onClick={() => {
            const currentIndex = LAYERS.indexOf(currentLayer);
            if (currentIndex > 0) scrollToLayer(LAYERS[currentIndex - 1]);
          }}
          className={`p-2 rounded-full transition-all ${currentLayer === 'orbit' ? 'opacity-30 cursor-not-allowed' : 'bg-gray-800/80 hover:bg-gray-700 border border-cyan-500/30'}`}
          disabled={currentLayer === 'orbit'}
        >
          <FaChevronUp className="text-cyan-400" />
        </button>

        {/* Layer buttons */}
        <button 
          onClick={() => scrollToLayer('orbit')}
          className={`p-3 rounded-lg transition-all ${currentLayer === 'orbit' ? 'bg-cyan-600 border-2 border-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-gray-800/80 border border-gray-600 hover:bg-gray-700'}`}
          title="Orbit - Space stations and orbital operations"
        >
          <FaSatellite className={currentLayer === 'orbit' ? 'text-white' : 'text-gray-400'} />
        </button>
        
        <button 
          onClick={() => scrollToLayer('surface')}
          className={`p-3 rounded-lg transition-all ${currentLayer === 'surface' ? 'bg-cyan-600 border-2 border-cyan-400 shadow-lg shadow-cyan-400/50' : 'bg-gray-800/80 border border-gray-600 hover:bg-gray-700'}`}
          title="Surface - Spaceports and launch operations"
        >
          <FaRocket className={currentLayer === 'surface' ? 'text-white' : 'text-gray-400'} />
        </button>
        
        <button 
          onClick={() => scrollToLayer('research')}
          className={`p-3 rounded-lg transition-all ${currentLayer === 'research' ? 'bg-purple-600 border-2 border-purple-400 shadow-lg shadow-purple-400/50' : 'bg-gray-800/80 border border-gray-600 hover:bg-gray-700'} ${hasAffordableResearch && currentLayer !== 'research' ? 'animate-research-flash' : ''}`}
          title="Research Lab - Underground secret facility"
        >
          <FaLab className={currentLayer === 'research' ? 'text-white' : 'text-gray-400'} />
        </button>

        {/* Down arrow */}
        <button 
          onClick={() => {
            const currentIndex = LAYERS.indexOf(currentLayer);
            if (currentIndex < LAYERS.length - 1) scrollToLayer(LAYERS[currentIndex + 1]);
          }}
          className={`p-2 rounded-full transition-all ${currentLayer === 'research' ? 'opacity-30 cursor-not-allowed' : 'bg-gray-800/80 hover:bg-gray-700 border border-cyan-500/30'}`}
          disabled={currentLayer === 'research'}
        >
          <FaChevronDown className="text-cyan-400" />
        </button>
      </div>

      {/* Horizontal Sub-navigation for Surface */}
      {currentLayer === 'surface' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3 items-center bg-gray-900/90 px-4 py-2 rounded-full border border-cyan-500/30">
          <button 
            onClick={() => scrollToSubView('spaceports')}
            className={`p-2 rounded-full transition-all ${surfaceSubView === 'spaceports' ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <FaChevronLeft className="text-white" />
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => scrollToSubView('spaceports')}
              className={`px-4 py-2 rounded transition-all font-mono text-sm ${surfaceSubView === 'spaceports' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              SPACEPORTS
            </button>
            <button 
              onClick={() => scrollToSubView('contracts')}
              className={`px-4 py-2 rounded transition-all font-mono text-sm ${surfaceSubView === 'contracts' ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              CONTRACTS
            </button>
          </div>
          <button 
            onClick={() => scrollToSubView('contracts')}
            className={`p-2 rounded-full transition-all ${surfaceSubView === 'contracts' ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <FaChevronRight className="text-white" />
          </button>
        </div>
      )}

      {/* Resource HUD - Top Left */}
      <div className="fixed top-4 left-4 z-50 w-96">
        <div className="bg-gray-900/95 border border-cyan-500/50 rounded-xl shadow-lg shadow-cyan-500/20 backdrop-blur-sm p-4">
          <div className="text-cyan-400 font-mono text-sm font-bold mb-3 pb-2 border-b border-cyan-500/30 tracking-wider">
            RESOURCES
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Money */}
            <div className="bg-black/40 border border-green-500/40 rounded-lg px-3 py-2 relative">
              <div className="flex items-center gap-2 mb-1">
                <FaMoneyBillAlt className="text-green-400 text-lg" />
                <span className="text-green-400 font-bold font-mono text-xl">{Math.floor(money).toLocaleString()}</span>
              </div>
              <div className="text-green-500/80 text-sm font-mono">+{Math.floor(productionRates.moneyPerSec)}/s</div>
              {resourceChanges.filter(c => c.type === 'money').map(change => (
                <div key={change.id} className="absolute -top-3 right-3 animate-float-up text-green-400 font-bold pointer-events-none text-sm">+{change.amount}</div>
              ))}
            </div>
            {/* Science */}
            <div className="bg-black/40 border border-blue-500/40 rounded-lg px-3 py-2 relative">
              <div className="flex items-center gap-2 mb-1">
                <FaFlask className="text-blue-400 text-lg" />
                <span className="text-blue-400 font-bold font-mono text-xl">{Math.floor(science).toLocaleString()}</span>
              </div>
              <div className="text-blue-500/80 text-sm font-mono">+{Math.floor(productionRates.sciencePerSec)}/s</div>
              {resourceChanges.filter(c => c.type === 'science').map(change => (
                <div key={change.id} className="absolute -top-3 right-3 animate-float-up text-blue-400 font-bold pointer-events-none text-sm">+{change.amount}</div>
              ))}
            </div>
            {/* Fuel */}
            <div className="bg-black/40 border border-orange-500/40 rounded-lg px-3 py-2 relative">
              <div className="flex items-center gap-2 mb-1">
                <FaGasPump className="text-orange-400 text-lg" />
                <span className="text-orange-400 font-bold font-mono text-xl">{Math.floor(fuel).toLocaleString()}</span>
              </div>
              <div className="text-orange-500/80 text-sm font-mono">+{Math.floor(productionRates.fuelPerSec)}/s</div>
              {/* Fuel gauge */}
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mt-2">
                <div className={`h-full transition-all rounded-full ${fuel >= 150 ? 'bg-green-500' : fuel >= 100 ? 'bg-cyan-500' : fuel >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (fuel / 200) * 100)}%` }} />
              </div>
              {resourceChanges.filter(c => c.type === 'fuel').map(change => (
                <div key={change.id} className="absolute -top-3 right-3 animate-float-up text-orange-400 font-bold pointer-events-none text-sm">+{change.amount}</div>
              ))}
            </div>
            {/* Cargo */}
            <div className="bg-black/40 border border-purple-500/40 rounded-lg px-3 py-2 relative">
              <div className="flex items-center gap-2 mb-1">
                <FaBoxOpen className="text-purple-400 text-lg" />
                <span className="text-purple-400 font-bold font-mono text-xl">{Math.floor(cargo).toLocaleString()}</span>
              </div>
              <div className="text-purple-500/60 text-sm font-mono">Cargo</div>
              {resourceChanges.filter(c => c.type === 'cargo').map(change => (
                <div key={change.id} className="absolute -top-3 right-3 animate-float-up text-purple-400 font-bold pointer-events-none text-sm">+{change.amount}</div>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 font-mono mt-3 text-center">Last saved: {displayTime}</div>
        </div>
      </div>

      {/* Fleet Status - Top Right (when on surface) */}
      {currentLayer === 'surface' && (
        <div className="fixed top-4 right-20 z-40 w-64">
          <div className="bg-gray-900/95 border border-cyan-500/50 rounded-lg shadow-lg backdrop-blur-sm p-3">
            <div className="text-cyan-400 font-mono text-xs font-bold mb-2">FLEET</div>
            <div className="text-xs text-gray-300 space-y-1 font-mono">
              <div>Rockets: <span className="text-cyan-400 font-bold">{fleetSummary.totalRockets}</span></div>
              <div>Cargo: <span className="text-green-400">{fleetSummary.cargoRockets}</span> | Science: <span className="text-purple-400">{fleetSummary.scienceRockets}</span></div>
              <div>Fuel use: <span className="text-orange-400">{Math.ceil(fleetSummary.fuelPerSecondConsumption)}/s</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Layer Label */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40">
        <div className={`px-6 py-2 rounded-full font-mono font-bold text-sm border-2 backdrop-blur-sm ${
          currentLayer === 'orbit' ? 'bg-blue-900/80 border-blue-400 text-blue-200' :
          currentLayer === 'surface' ? 'bg-gray-800/80 border-cyan-400 text-cyan-200' :
          'bg-purple-900/80 border-purple-400 text-purple-200'
        }`}>
          {currentLayer === 'orbit' && 'ORBITAL STATION'}
          {currentLayer === 'surface' && 'SURFACE OPERATIONS'}
          {currentLayer === 'research' && 'UNDERGROUND LAB'}
        </div>
      </div>

      {/* Main Vertical Scroll Container */}
      <div 
        ref={verticalScrollRef}
        className="w-full h-full overflow-y-scroll snap-y-mandatory scrollbar-hide"
        onScroll={handleVerticalScroll}
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* ORBIT LAYER */}
        <section 
          className="w-full h-screen layer-orbit stars relative flex items-center justify-center"
          style={{ scrollSnapAlign: 'start' }}
        >
          {/* Orbit decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-blue-500/20" />
            <div className="absolute top-40 right-40 w-48 h-48 rounded-full border border-cyan-500/10" />
            <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-blue-500/5" />
          </div>
          
          <div className="relative z-10 w-full max-w-6xl px-8">
            <OrbitView />
          </div>
          
          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronDown className="mx-auto mb-1" />
            Scroll down to Surface
          </div>
        </section>

        {/* SURFACE LAYER */}
        <section 
          className="w-full h-screen layer-surface relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          {/* Horizontal scroll container for surface sub-views */}
          <div 
            ref={horizontalScrollRef}
            className="w-full h-full overflow-x-scroll snap-x-mandatory scrollbar-hide flex"
            onScroll={handleHorizontalScroll}
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {/* Spaceports View */}
            <div 
              className="w-screen h-screen flex-shrink-0 flex items-center justify-center"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-full max-w-6xl px-8">
                <SpaceportView />
              </div>
            </div>
            
            {/* Contracts View */}
            <div 
              className="w-screen h-screen flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="w-full max-w-6xl px-8">
                <ContractsView />
              </div>
            </div>
          </div>
          
          {/* Surface decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
        </section>

        {/* RESEARCH LAYER - Underground Lab */}
        <section 
          className="w-full h-screen layer-research underground-glow relative flex items-center justify-center"
          style={{ scrollSnapAlign: 'start' }}
        >
          {/* Underground lab decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Pipes and cables */}
            <div className="absolute top-0 left-10 w-2 h-full bg-gradient-to-b from-purple-900/50 to-transparent" />
            <div className="absolute top-0 right-20 w-1 h-full bg-gradient-to-b from-pink-900/30 to-transparent" />
            <div className="absolute top-0 left-1/4 w-1 h-2/3 bg-gradient-to-b from-purple-800/40 to-transparent" />
            
            {/* Glowing elements */}
            <div className="absolute top-20 left-40 w-4 h-4 rounded-full bg-purple-500/50 animate-pulse" />
            <div className="absolute top-40 right-60 w-3 h-3 rounded-full bg-pink-500/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-40 left-60 w-5 h-5 rounded-full bg-purple-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
            
            {/* Top gradient (coming from surface) */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-gray-900 to-transparent" />
            
            {/* Bottom dark */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent" />
          </div>
          
          <div className="relative z-10 w-full max-w-6xl px-8">
            <ResearchTreeView />
          </div>
          
          {/* Scroll hint */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronUp className="mx-auto mb-1" />
            Scroll up to Surface
          </div>
        </section>
      </div>

      <DevConsole />
    </div>
  )
}
