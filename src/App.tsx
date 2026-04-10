import { useEffect, useState, useRef, useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { useGameStore, GameState } from "./useGameStore.js"
import { MOON } from "./gameConstants.js"
import { FaMoneyBillAlt, FaFlask, FaGasPump, FaBox, FaChevronUp, FaChevronDown, FaChevronLeft, FaChevronRight, FaRocket, FaSatellite, FaFlask as FaLab, FaExclamationTriangle, FaFileContract, FaIndustry, FaMoon, FaGem, FaLock } from 'react-icons/fa'
import { MdSettings } from 'react-icons/md'
import { SpaceportView } from "./SpaceportView.js"
import { OrbitView } from "./OrbitView.js"
import { ContractsView } from "./ContractsView.js"
import { ResearchTreeView } from "./ResearchTreeView.js"
import { MoonView } from "./MoonView.js"
import { ResearchSidebar } from "./components/ResearchSidebar.js"
import { SettingsPanel } from "./components/SettingsPanel.js"
import { INITIAL_STATE, TIME, DEFAULT_COMPANIES, DEFAULT_SETTINGS, PRODUCTION } from './gameConstants.js'
import { researchTree, ResearchNode, EffectType } from './researchTree.js'
import { isElectron, loadGameStateSync, loadGameStateAsync, saveGameState } from './persistence.js'


// Helper function to calculate effect multiplier (duplicated from store for use in metrics calculation)
// TODO: Consider moving all metrics calculations to store selectors to avoid duplication
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

// Check if a flag-type research is unlocked
function hasResearch(type: EffectType, researchedNodes: string[]): boolean {
  return researchTree.some((node: ResearchNode) => 
    researchedNodes.includes(node.id) && node.effect.type === type
  );
}

// Comprehensive game metrics for the info panel
interface GameMetrics {
   // Fleet
   totalRockets: number;
   cargoRockets: number;
   explodedRockets: number;
  // Production
  fuelProduction: number;
  fuelConsumption: number;
  fuelNet: number;
  moneyPerSec: number;
  sciencePerSec: number;
  // Rates
  explosionChance: number;
  successRate: number;
  // Telemetry (advanced)
  hasTelemetry: boolean;
  spaceportCount: number;
  refineryCount: number;
  stationCount: number;
  activeContracts: number;
  maxActiveContracts: number;
  // Orbital
  satelliteCount: number;
  debrisCount: number;
  // Lunar
  lunarComponents: number;
  // Moon
  moonStatus: string;
  moonRegolith: number;
  moonHelium3: number;
  earthRegolith: number;
  earthHelium3: number;
  hasActiveHazard: boolean;
}

function calculateGameMetrics(state: GameState): GameMetrics {
  const researchedNodes = state.researchedNodes || [];
  
   // Fleet counts
   const allRockets = (state.rockets || []).filter((r): r is { id: number; type: 'cargo' } => r !== null);
   const explodedIds = state.explodedRocketIds || [];
   const activeRockets = allRockets.filter(r => !explodedIds.includes(r.id));
   const cargoRockets = activeRockets.length;
   const totalRockets = activeRockets.length;
   const explodedRockets = explodedIds.length;
   
   // Fuel calculations
   const fuelProduction = PRODUCTION.PASSIVE_FUEL_PER_TICK;
  const effectiveFuelCost = (state.fuelCostPerRocket || 1) * getEffectMultiplier('fuelCostMultiplier', researchedNodes);
  const fuelConsumption = totalRockets * effectiveFuelCost;
  const fuelNet = fuelProduction - fuelConsumption;
  
  // Explosion/success rates
  const explosionChance = (state.rocketExplosionChance || 0.5) * getEffectMultiplier('explosionChanceMultiplier', researchedNodes);
  const successRate = Math.max(0, 1 - explosionChance);
  
    // Estimated production
    const estimatedLaunches = Math.min(totalRockets, Math.floor((state.fuel || 0) / Math.max(1, effectiveFuelCost)));
    const successfulCargo = Math.floor(cargoRockets * estimatedLaunches * successRate / Math.max(1, totalRockets));
    const moneyPerSec = successfulCargo * (state.profitPerRocket || 1) * getEffectMultiplier('profitMultiplier', researchedNodes);
    
    // Science production from launches + company perks
    const sciencePerRocketBonus = getEffectMultiplier('sciencePerRocketBonus', researchedNodes);
    const sciencePerLaunch = PRODUCTION.SCIENCE_PER_SCIENCE_ROCKET + sciencePerRocketBonus;
    const launchScience = successfulCargo * sciencePerLaunch;
    
    // Science from explosions
    const explosionScienceBonus = PRODUCTION.SCIENCE_PER_EXPLOSION;
    const failedLaunches = Math.floor(cargoRockets * estimatedLaunches * explosionChance / Math.max(1, totalRockets));
    const explosionScience = failedLaunches * explosionScienceBonus;
    
    // Passive science from spaceports
    const passiveScience = (state.spaceports || []).length;
    
    // Total science per second
    const sciencePerSec = launchScience + explosionScience + passiveScience;
  
  // Telemetry check
  const hasTelemetry = hasResearch('uiTelemetryFlag', researchedNodes);
  
   return {
     totalRockets,
     cargoRockets,
     explodedRockets,
    fuelProduction,
    fuelConsumption,
    fuelNet,
    moneyPerSec,
    sciencePerSec,
    explosionChance,
    successRate,
    hasTelemetry,
    spaceportCount: (state.spaceports || []).length,
    refineryCount: state.fuelRefineries || 0,
    stationCount: (state.spaceStations || []).length,
    activeContracts: (state.activeContracts || []).length,
    maxActiveContracts: state.getMaxActiveContracts ? state.getMaxActiveContracts() : 1,
    // Orbital
    satelliteCount: state.satellites || 0,
    debrisCount: (state.spaceDebris || []).length,
    // Lunar
    lunarComponents: state.lunarComponents || 0,
    // Moon
    moonStatus: state.moonStatus || 'locked',
    moonRegolith: state.moonResources?.regolith || 0,
    moonHelium3: state.moonResources?.helium3 || 0,
    earthRegolith: state.earthResources?.regolith || 0,
    earthHelium3: state.earthResources?.helium3 || 0,
    hasActiveHazard: !!state.activeHazard,
  };
}

function normalizeLoadedState(savedState: Record<string, any> | null) {
  if (!savedState || savedState.money === undefined || savedState.science === undefined) {
    return null;
  }

  const parsed = { ...savedState };

  if (!parsed.spaceStations) parsed.spaceStations = [];
  if (!parsed.currentView) parsed.currentView = "surface";
  if (!parsed.notifications) parsed.notifications = [];
  if (!parsed.companies) parsed.companies = DEFAULT_COMPANIES;
  if (!parsed.availableContracts) parsed.availableContracts = [];
  if (!parsed.researchedNodes) parsed.researchedNodes = [];
  if (parsed.autoBuildActive === undefined) parsed.autoBuildActive = false;
  if (parsed.autoSalvageActive === undefined) parsed.autoSalvageActive = false;
  if (!parsed.previouslyAvailableResearch) parsed.previouslyAvailableResearch = [];
  if (!parsed.rockets) parsed.rockets = [];
  if (parsed.nextRocketId === undefined) parsed.nextRocketId = 0;
  if (parsed.rocketCost === undefined) parsed.rocketCost = INITIAL_STATE.ROCKET_COST;
  if (parsed.profitPerRocket === undefined) parsed.profitPerRocket = INITIAL_STATE.PROFIT_PER_ROCKET;
  parsed.spaceportCapacity = INITIAL_STATE.SPACEPORT_CAPACITY;
  if (!parsed.spaceports) parsed.spaceports = [{ id: 1 }];
  if (parsed.spaceportCost === undefined) parsed.spaceportCost = INITIAL_STATE.SPACEPORT_COST;
  if (parsed.fuelCostPerRocket === undefined) parsed.fuelCostPerRocket = INITIAL_STATE.FUEL_COST_PER_ROCKET;
  if (!parsed.explodedRocketIds) parsed.explodedRocketIds = [];
  if (parsed.rocketExplosionChance === undefined) parsed.rocketExplosionChance = INITIAL_STATE.ROCKET_EXPLOSION_CHANCE;

  if (parsed.activeContract !== undefined) {
    parsed.activeContracts = parsed.activeContract ? [parsed.activeContract] : [];
    delete parsed.activeContract;
  }
  if (!parsed.activeContracts) parsed.activeContracts = [];

  if (parsed.contractRefreshTimer === undefined) {
    parsed.contractRefreshTimer = 300;
  }

  const newCompanyIds = ['titan', 'nova', 'zenith', 'galactic', 'aegis', 'atlas'];
  if (parsed.companies) {
    const existingIds = parsed.companies.map((c: { id: string }) => c.id);
    const hasOldCompanies = existingIds.some((id: string) => !newCompanyIds.includes(id));
    const missingNewCompanies = newCompanyIds.some(id => !existingIds.includes(id));

    if (hasOldCompanies || missingNewCompanies) {
      parsed.companies = DEFAULT_COMPANIES.map(defaultCompany => {
        const existing = parsed.companies.find((c: { id: string }) => c.id === defaultCompany.id);
        return existing || defaultCompany;
      });
    }
  }

  if (parsed.satellites === undefined) parsed.satellites = 0;
  if (parsed.maxSatellites === undefined) parsed.maxSatellites = 10;
  if (!parsed.spaceDebris) parsed.spaceDebris = [];
  if (!parsed.transitRockets) parsed.transitRockets = [];
  if (!parsed.dockedRockets) parsed.dockedRockets = [];

  if (parsed.spaceStations && parsed.spaceStations.length > 0) {
    parsed.spaceStations = parsed.spaceStations.map((station: { id: string; type: string; level: number; maxDocks?: number; dockedRockets?: number[] }) => ({
      ...station,
      maxDocks: station.maxDocks ?? 2,
      dockedRockets: station.dockedRockets ?? [],
    }));
  }

  if (parsed.lunarComponents === undefined) parsed.lunarComponents = 0;
  if (parsed.moonStatus === undefined) parsed.moonStatus = 'locked';
  if (parsed.moonMissionTicksRemaining === undefined) parsed.moonMissionTicksRemaining = 0;
  if (!parsed.moonBuildings) parsed.moonBuildings = { extractors: 0, refineries: 0, silos: 0, maintenances: 0, massDrivers: 0, solarArray: 0, nuclearReactor: 0, battery: 0, fabricators: 0 };
  if (!parsed.moonResources) parsed.moonResources = { regolith: 0, helium3: 0, alloys: 0 };
  if (!parsed.earthResources) parsed.earthResources = { regolith: 0, helium3: 0, alloys: 0 };

  if (parsed.moonResources && parsed.moonResources.alloys === undefined) {
    parsed.moonResources.alloys = 0;
  }
  if (parsed.earthResources && parsed.earthResources.alloys === undefined) {
    parsed.earthResources.alloys = 0;
  }

  if (parsed.moonBuildings) {
    if (parsed.moonBuildings.solarArray === undefined) parsed.moonBuildings.solarArray = 0;
    if (parsed.moonBuildings.nuclearReactor === undefined) parsed.moonBuildings.nuclearReactor = 0;
    if (parsed.moonBuildings.battery === undefined) parsed.moonBuildings.battery = 0;
    if (parsed.moonBuildings.fabricators === undefined) parsed.moonBuildings.fabricators = 0;
    if (parsed.moonBuildings.maintenance !== undefined && parsed.moonBuildings.maintenances === undefined) {
      parsed.moonBuildings.maintenances = parsed.moonBuildings.maintenance;
      delete parsed.moonBuildings.maintenance;
    }
    if (parsed.moonBuildings.fabricator !== undefined && parsed.moonBuildings.fabricators === undefined) {
      parsed.moonBuildings.fabricators = parsed.moonBuildings.fabricator;
      delete parsed.moonBuildings.fabricator;
    }
  }

  if (parsed.activeHazard === undefined) parsed.activeHazard = null;
  if (!parsed.moonLog) parsed.moonLog = [];
  if (!parsed.moonSectors) parsed.moonSectors = [{
    id: 'starting-sector',
    name: 'Landing Zone',
    traits: {},
    buildings: {},
    slots: 4,
    slotsUsed: 0,
  }];
  if (!parsed.moonPowerSystem) parsed.moonPowerSystem = {
    dayNightTick: 0,
    isDay: true,
    currentEnergy: MOON.INITIAL_POWER_ENERGY,
    maxEnergy: MOON.INITIAL_POWER_ENERGY,
    energyGeneration: 0,
    energyDemand: 0,
  };
  if (!parsed.moonBounties) parsed.moonBounties = [];
  if (parsed.moonBountyRefreshTimer === undefined) parsed.moonBountyRefreshTimer = 300;

  if (!parsed.settings) parsed.settings = DEFAULT_SETTINGS;
  else {
    parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
  }

  if (parsed.totalSuccessfulLaunches === undefined) parsed.totalSuccessfulLaunches = 0;
  if (parsed.orbitLayerUnlocked === undefined) parsed.orbitLayerUnlocked = false;
  if (parsed.contractsLayerUnlocked === undefined) parsed.contractsLayerUnlocked = false;

  return parsed;
}

// Load persisted state
const loadInitialState = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return normalizeLoadedState(loadGameStateSync());
  } catch (e) {
    console.error('Failed to load persisted state:', e);
    return null;
  }
};

const persistedInitialState = loadInitialState();
if (persistedInitialState) {
  useGameStore.setState(persistedInitialState);
}

// Layer configuration - DOM order (top to bottom in scroll): moon -> orbit -> contracts -> surface -> research
// Visual order (bottom to top): research (bottom) -> surface -> contracts -> orbit -> moon (top)
type Layer = 'moon' | 'orbit' | 'contracts' | 'surface' | 'research';
const LAYERS: Layer[] = ['moon', 'orbit', 'contracts', 'surface', 'research'];

// Locked Layer View Component
interface LockedLayerViewProps {
  layer: 'orbit' | 'contracts';
  cargo: number;
  totalSuccessfulLaunches: number;
  onUnlock: () => void;
}

function LockedLayerView({ layer, cargo, totalSuccessfulLaunches, onUnlock }: LockedLayerViewProps) {
  const isOrbit = layer === 'orbit';
  const requirement = isOrbit ? 500 : 1000;
  const current = isOrbit ? cargo : totalSuccessfulLaunches;
  const progress = Math.min(100, (current / requirement) * 100);
  const canUnlock = current >= requirement;
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="bg-gray-800/80 border border-gray-600 rounded-xl p-8 max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center mb-4">
            <FaLock className="text-4xl text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isOrbit ? 'Orbital Operations' : 'Contract Operations'}
          </h2>
          <p className="text-gray-400 text-sm">
            {isOrbit 
              ? 'Establish orbital infrastructure with space stations and satellites.'
              : 'Unlock commercial partnerships and contract management.'
            }
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">
              {isOrbit ? 'Cargo Required' : 'Launches Required'}
            </span>
            <span className={canUnlock ? 'text-green-400' : 'text-yellow-400'}>
              {Math.floor(current).toLocaleString()} / {requirement.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${canUnlock ? 'bg-green-500' : 'bg-yellow-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <button
          onClick={onUnlock}
          disabled={!canUnlock}
          className={`w-full py-3 px-6 rounded-lg font-bold transition-all ${
            canUnlock
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canUnlock 
            ? (isOrbit ? `Unlock (Cost: 500 Cargo)` : 'Unlock Operations')
            : (isOrbit ? 'Gather more cargo...' : 'Launch more rockets...')
          }
        </button>
      </div>
    </div>
  );
}

export function App() {
  const verticalScrollRef = useRef<HTMLDivElement>(null);

  const [
    money,
    science,
    fuel,
    cargo,
    tick,
    maxFuel,
    researchedNodes,
    rockets,
    explodedRocketIds,
    spaceports,
    spaceStations,
    activeContracts,
    satellites,
    spaceDebris,
    totalSuccessfulLaunches,
    orbitLayerUnlocked,
    contractsLayerUnlocked,
    unlockLayer,
  ] = useGameStore((state) => [
    state.money,
    state.science,
    state.fuel,
    state.cargo,
    state.tick,
    state.getMaxFuel(),
    state.researchedNodes,
    state.rockets,
    state.explodedRocketIds,
    state.spaceports,
    state.spaceStations,
    state.activeContracts,
    state.satellites,
    state.spaceDebris,
    state.totalSuccessfulLaunches,
    state.orbitLayerUnlocked,
    state.contractsLayerUnlocked,
    state.unlockLayer,
  ], shallow);
  
   // Current layer state
   const [currentLayer, setCurrentLayer] = useState<Layer>('surface');
   const [settingsOpen, setSettingsOpen] = useState(false);
  
  const metrics = useMemo(() => {
    const state = useGameStore.getState();
    return calculateGameMetrics(state);
   }, [researchedNodes, rockets, explodedRocketIds, fuel, spaceports, spaceStations, activeContracts, satellites, spaceDebris]);

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

  // Check if a layer is unlocked (fully accessible, not just viewable)
  // DOM order: moon(0) -> orbit(1) -> contracts(2) -> surface(3) -> research(4)
  // Visual (bottom to top): research -> surface -> contracts -> orbit -> moon
  const isLayerUnlocked = (layer: Layer): boolean => {
    if (layer === 'research' || layer === 'surface') return true;
    if (layer === 'contracts') return contractsLayerUnlocked;
    if (layer === 'orbit') return orbitLayerUnlocked;
    if (layer === 'moon') return researchedNodes.includes('o14');
    return true;
  };

  // Check if a layer should be visible in the nav (unlocked OR is the next locked layer to unlock)
  const isLayerVisible = (layer: Layer): boolean => {
    if (layer === 'research' || layer === 'surface') return true;
    // Contracts is always visible (first locked layer going up from surface)
    if (layer === 'contracts') return true;
    // Orbit is visible if contracts is unlocked
    if (layer === 'orbit') return contractsLayerUnlocked;
    // Moon is visible if orbit is unlocked
    if (layer === 'moon') return contractsLayerUnlocked && orbitLayerUnlocked;
    return true;
  };

  // Get the lowest scrollable layer index (includes the first locked layer)
  // Lower index = higher in visual space (moon=0 is at top)
  // Player starts at surface(3), can scroll down to research(4), up towards moon(0)
  const getLowestScrollableLayerIndex = (): number => {
    // surface=3, research=4 always accessible
    // contracts=2 always scrollable (first locked layer going up)
    // orbit=1 scrollable if contracts unlocked
    // moon=0 scrollable if orbit unlocked
    if (!contractsLayerUnlocked) return 2; // Can scroll to contracts (first locked)
    if (!orbitLayerUnlocked) return 1; // Can scroll to orbit (next locked)
    if (!researchedNodes.includes('o14')) return 0; // Can scroll to moon (next locked)
    return 0; // All layers accessible
  };

  // Scroll to a specific layer (with access check)
  const scrollToLayer = (layer: Layer) => {
    const index = LAYERS.indexOf(layer);
    const lowestScrollable = getLowestScrollableLayerIndex();
    
    // Don't allow scrolling to layers above the lowest scrollable (lower index = higher visually)
    if (index < lowestScrollable) {
      return;
    }
    
    if (verticalScrollRef.current) {
      verticalScrollRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth'
      });
    }
    setCurrentLayer(layer);
  };

  // Handle vertical scroll to detect current layer (with bounds check)
  const handleVerticalScroll = () => {
    if (verticalScrollRef.current) {
      const scrollTop = verticalScrollRef.current.scrollTop;
      const height = window.innerHeight;
      const index = Math.round(scrollTop / height);
      const lowestScrollable = getLowestScrollableLayerIndex();
      
      // If trying to scroll above lowest scrollable (lower index = higher), snap back
      if (index < lowestScrollable) {
        verticalScrollRef.current.scrollTo({
          top: lowestScrollable * height,
          behavior: 'smooth'
        });
        setCurrentLayer(LAYERS[lowestScrollable]);
        return;
      }
      
      if (LAYERS[index] && LAYERS[index] !== currentLayer) {
        setCurrentLayer(LAYERS[index]);
      }
    }
  };

  // Initial scroll to surface
  useEffect(() => {
    if (verticalScrollRef.current) {
      verticalScrollRef.current.scrollTo({
        top: window.innerHeight * 3, // Surface is index 3 (moon=0, orbit=1, contracts=2, surface=3, research=4)
        behavior: 'auto'
      });
    }
  }, []);

  useEffect(() => {
    if (!isElectron()) {
      return;
    }

    let cancelled = false;

    const hydrateAsyncState = async () => {
      try {
        const savedState = await loadGameStateAsync();
        const normalizedState = normalizeLoadedState(savedState);
        if (!cancelled && normalizedState) {
          useGameStore.setState(normalizedState);
        }
      } catch (error) {
        console.error('Failed to load async persisted state:', error);
      }
    };

    void hydrateAsyncState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleKeyboardLayerNavigation = (event: KeyboardEvent) => {
      if (settingsOpen) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget = tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isTypingTarget) {
        return;
      }

      const currentIndex = LAYERS.indexOf(currentLayer);
      const lowestScrollable = getLowestScrollableLayerIndex();

      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        if (currentIndex > lowestScrollable) {
          scrollToLayer(LAYERS[currentIndex - 1]);
        }
      } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        if (currentIndex < LAYERS.length - 1) {
          scrollToLayer(LAYERS[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyboardLayerNavigation);
    return () => window.removeEventListener('keydown', handleKeyboardLayerNavigation);
  }, [currentLayer, settingsOpen, contractsLayerUnlocked, orbitLayerUnlocked, researchedNodes]);

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
    const saveState = async () => {
      const state = useGameStore.getState();
      const stateToSave = {
        money: state.money, science: state.science, fuel: state.fuel, cargo: state.cargo,
        lunarComponents: state.lunarComponents,
        currentView: state.currentView, notifications: state.notifications, companies: state.companies,
        availableContracts: state.availableContracts, activeContracts: state.activeContracts,
        contractRefreshTimer: state.contractRefreshTimer,
        rockets: state.rockets, nextRocketId: state.nextRocketId, rocketCost: state.rocketCost,
         profitPerRocket: state.profitPerRocket, spaceportCapacity: state.spaceportCapacity,
         spaceports: state.spaceports, spaceStations: state.spaceStations, spaceportCost: state.spaceportCost,
         fuelCostPerRocket: state.fuelCostPerRocket,
        explodedRocketIds: state.explodedRocketIds, rocketExplosionChance: state.rocketExplosionChance,
        researchedNodes: state.researchedNodes, autoBuildActive: state.autoBuildActive,
        autoSalvageActive: state.autoSalvageActive,
        previouslyAvailableResearch: state.previouslyAvailableResearch || [],
        // Orbital layer state
        satellites: state.satellites, maxSatellites: state.maxSatellites,
        spaceDebris: state.spaceDebris, transitRockets: state.transitRockets,
        dockedRockets: state.dockedRockets,
         // Moon layer state
         moonStatus: state.moonStatus, moonMissionTicksRemaining: state.moonMissionTicksRemaining,
         moonBuildings: state.moonBuildings, moonResources: state.moonResources,
         earthResources: state.earthResources, activeHazard: state.activeHazard,
         moonLog: state.moonLog, moonSectors: state.moonSectors, moonPowerSystem: state.moonPowerSystem,
         moonBounties: state.moonBounties, moonBountyRefreshTimer: state.moonBountyRefreshTimer,
        // Layer unlock tracking
        totalSuccessfulLaunches: state.totalSuccessfulLaunches,
        orbitLayerUnlocked: state.orbitLayerUnlocked,
        contractsLayerUnlocked: state.contractsLayerUnlocked,
      };
      await saveGameState(stateToSave);
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
        {/* Up arrow - goes to lower index (moon direction, visually up) */}
        <button 
          onClick={() => {
            const currentIndex = LAYERS.indexOf(currentLayer);
            const lowestScrollable = getLowestScrollableLayerIndex();
            if (currentIndex > lowestScrollable) scrollToLayer(LAYERS[currentIndex - 1]);
          }}
          className={`p-2 rounded-full transition-all ${LAYERS.indexOf(currentLayer) <= getLowestScrollableLayerIndex() ? 'opacity-30 cursor-not-allowed' : 'bg-gray-800/80 hover:bg-gray-700 border border-cyan-500/30'}`}
          disabled={LAYERS.indexOf(currentLayer) <= getLowestScrollableLayerIndex()}
        >
          <FaChevronUp className="text-cyan-400" />
        </button>

        {/* Layer buttons - Visual order top to bottom: moon, orbit, contracts, surface, research */}
        {/* Moon - only visible if orbit is unlocked */}
        {isLayerVisible('moon') && (
          <button 
            onClick={() => scrollToLayer('moon')}
            className={`p-3 rounded-lg transition-all ${
              currentLayer === 'moon' 
                ? 'bg-green-600 border-2 border-green-400 shadow-lg shadow-green-400/50' 
                : !isLayerUnlocked('moon')
                  ? 'bg-gray-900/80 border border-gray-700'
                  : 'bg-gray-800/80 border border-gray-600 hover:bg-gray-700'
            } ${metrics.hasActiveHazard && currentLayer !== 'moon' ? 'animate-pulse' : ''}`}
            title={isLayerUnlocked('moon') ? "Moon - Lunar base operations" : "Moon - Locked (Research o14)"}
          >
            <div className="relative">
              <FaMoon className={currentLayer === 'moon' ? 'text-white' : isLayerUnlocked('moon') ? 'text-green-400' : 'text-gray-500'} />
              {!isLayerUnlocked('moon') && <FaLock className="absolute -bottom-1 -right-1 text-[8px] text-yellow-500" />}
            </div>
          </button>
        )}
        
        {/* Orbit - only visible if contracts is unlocked */}
        {isLayerVisible('orbit') && (
          <button 
            onClick={() => scrollToLayer('orbit')}
            className={`p-3 rounded-lg transition-all ${
              currentLayer === 'orbit' 
                ? 'bg-cyan-600 border-2 border-cyan-400 shadow-lg shadow-cyan-400/50' 
                : !isLayerUnlocked('orbit')
                  ? 'bg-gray-900/80 border border-gray-700'
                  : 'bg-gray-800/80 border border-gray-600 hover:bg-gray-700'
            }`}
            title={isLayerUnlocked('orbit') ? "Orbit - Space stations and orbital operations" : `Orbit - Locked (${Math.floor(cargo).toLocaleString()}/500 Cargo)`}
          >
            <div className="relative">
              <FaSatellite className={currentLayer === 'orbit' ? 'text-white' : isLayerUnlocked('orbit') ? 'text-gray-400' : 'text-gray-600'} />
              {!isLayerUnlocked('orbit') && <FaLock className="absolute -bottom-1 -right-1 text-[8px] text-yellow-500" />}
            </div>
          </button>
        )}
        
        {/* Contracts - always visible (first locked layer going up) */}
        {isLayerVisible('contracts') && (
          <button 
            onClick={() => scrollToLayer('contracts')}
            className={`p-3 rounded-lg transition-all ${
              currentLayer === 'contracts' 
                ? 'bg-purple-600 border-2 border-purple-400 shadow-lg shadow-purple-400/50' 
                : !isLayerUnlocked('contracts')
                  ? 'bg-gray-900/80 border border-gray-700'
                  : 'bg-gray-800/80 border border-gray-600 hover:bg-gray-700'
            } ${contractsLayerUnlocked && metrics.activeContracts > 0 && currentLayer !== 'contracts' ? 'animate-pulse' : ''}`}
            title={isLayerUnlocked('contracts') ? "Contracts - Business contracts and missions" : `Contracts - Locked (${totalSuccessfulLaunches.toLocaleString()}/1,000 Launches)`}
          >
            <div className="relative">
              <FaFileContract className={currentLayer === 'contracts' ? 'text-white' : isLayerUnlocked('contracts') ? 'text-gray-400' : 'text-gray-600'} />
              {!isLayerUnlocked('contracts') && <FaLock className="absolute -bottom-1 -right-1 text-[8px] text-yellow-500" />}
            </div>
          </button>
        )}
        
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

        {/* Down arrow - goes to higher index (research direction, visually down) */}
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

      {/* Info Panel - Sticky Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 border-b border-cyan-500/30 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-2 max-w-screen-2xl mx-auto gap-4">
          {/* Resources Section */}
          <div className="flex items-center gap-3">
            {/* Money */}
            <div className="flex items-center gap-2 bg-black/40 border border-green-500/30 rounded px-2.5 py-1 relative">
              <FaMoneyBillAlt className="text-green-400 text-sm" />
              <span className="text-green-400 font-bold font-mono">{Math.floor(money).toLocaleString()}</span>
              {resourceChanges.filter(c => c.type === 'money').map(change => (
                <div key={change.id} className="absolute -top-2 right-1 animate-float-up text-green-400 font-bold pointer-events-none text-xs">+{change.amount}</div>
              ))}
            </div>
            
            {/* Science */}
            <div className="flex items-center gap-2 bg-black/40 border border-blue-500/30 rounded px-2.5 py-1 relative">
              <FaFlask className="text-blue-400 text-sm" />
              <span className="text-blue-400 font-bold font-mono">{Math.floor(science).toLocaleString()}</span>
              {resourceChanges.filter(c => c.type === 'science').map(change => (
                <div key={change.id} className="absolute -top-2 right-1 animate-float-up text-blue-400 font-bold pointer-events-none text-xs">+{change.amount}</div>
              ))}
            </div>
            
            {/* Fuel */}
            <div className="flex items-center gap-2 bg-black/40 border border-orange-500/30 rounded px-2.5 py-1 relative">
              <FaGasPump className="text-orange-400 text-sm" />
              <span className="text-orange-400 font-bold font-mono">{Math.floor(fuel).toLocaleString()} / {Math.floor(maxFuel).toLocaleString()}</span>
              {resourceChanges.filter(c => c.type === 'fuel').map(change => (
                <div key={change.id} className="absolute -top-2 right-1 animate-float-up text-orange-400 font-bold pointer-events-none text-xs">+{change.amount}</div>
              ))}
            </div>
            
            {/* Cargo */}
            <div className="flex items-center gap-2 bg-black/40 border border-yellow-500/30 rounded px-2.5 py-1 relative">
              <FaBox className="text-yellow-400 text-sm" />
              <span className="text-yellow-400 font-bold font-mono">{Math.floor(cargo).toLocaleString()}</span>
              {resourceChanges.filter(c => c.type === 'cargo').map(change => (
                <div key={change.id} className="absolute -top-2 right-1 animate-float-up text-yellow-400 font-bold pointer-events-none text-xs">+{change.amount}</div>
              ))}
            </div>
            
            {/* Lunar Components - Only shown when > 0 */}
            {metrics.lunarComponents > 0 && (
              <div className="flex items-center gap-2 bg-black/40 border border-slate-400/30 rounded px-2.5 py-1 relative" title="Lunar Components - Required for Moon missions">
                <FaMoon className="text-slate-300 text-sm" />
                <span className="text-slate-300 font-bold font-mono">{Math.floor(metrics.lunarComponents).toLocaleString()}</span>
              </div>
            )}
            
            {/* Earth Helium-3 - Only shown when Moon is unlocked and has He-3 */}
            {metrics.earthHelium3 > 0 && (
              <div className="flex items-center gap-2 bg-black/40 border border-cyan-400/30 rounded px-2.5 py-1 relative" title="Helium-3 on Earth - Gateway to Planetary expansion">
                <FaGem className="text-cyan-300 text-sm" />
                <span className="text-cyan-300 font-bold font-mono">{Math.floor(metrics.earthHelium3).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {/* Fleet & Operations Section */}
          <div className="flex items-center gap-3">
            {/* Fleet Status */}
            <div className="flex items-center gap-2 bg-black/40 border border-cyan-500/30 rounded px-2.5 py-1">
              <FaRocket className="text-cyan-400 text-sm" />
              <span className="text-cyan-400 font-bold font-mono">{metrics.totalRockets}</span>
              <span className="text-gray-500 text-xs">rockets</span>
              {metrics.explodedRockets > 0 && (
                <span className="text-red-400 text-xs font-mono flex items-center gap-1">
                  <FaExclamationTriangle className="text-[10px]" />{metrics.explodedRockets}
                </span>
              )}
            </div>
            
            {/* Active Contracts */}
            {metrics.activeContracts > 0 && (
              <div className="flex items-center gap-2 bg-black/40 border border-purple-500/30 rounded px-2.5 py-1">
                <FaFileContract className="text-purple-400 text-sm" />
                <span className="text-purple-400 font-mono">{metrics.activeContracts}/{metrics.maxActiveContracts}</span>
              </div>
            )}
            
            {/* Telemetry Section - Only shown when researched */}
            {metrics.hasTelemetry && (
              <div className="flex items-center gap-3 bg-black/40 border border-emerald-500/30 rounded px-2.5 py-1">
                <div className="flex items-center gap-1.5" title="Success Rate">
                  <span className={`text-xs font-mono ${metrics.successRate >= 0.8 ? 'text-green-400' : metrics.successRate >= 0.5 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {Math.round(metrics.successRate * 100)}%
                  </span>
                  <span className="text-gray-500 text-[10px]">success</span>
                </div>
                <span className="text-gray-600">|</span>
                <div className="flex items-center gap-1.5" title="Infrastructure">
                  <FaIndustry className="text-gray-400 text-[10px]" />
                  <span className="text-gray-400 text-xs font-mono">{metrics.spaceportCount}P {metrics.refineryCount}R {metrics.stationCount}S</span>
                </div>
                {(metrics.satelliteCount > 0 || metrics.debrisCount > 0) && (
                  <>
                    <span className="text-gray-600">|</span>
                    <div className="flex items-center gap-1.5" title="Orbital">
                      <FaSatellite className="text-cyan-400 text-[10px]" />
                      <span className="text-cyan-400 text-xs font-mono">{metrics.satelliteCount}</span>
                      {metrics.debrisCount > 0 && (
                        <span className="text-orange-400 text-xs font-mono" title="Space Debris">
                          <FaExclamationTriangle className="inline text-[10px] mr-0.5" />{metrics.debrisCount}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
           )}
           </div>
           
           {/* Settings Button */}
           <button
             onClick={() => setSettingsOpen(true)}
             className="p-2 rounded-lg bg-gray-800/80 border border-cyan-500/30 hover:bg-gray-700 hover:border-cyan-500/50 transition-all text-cyan-400 hover:text-cyan-300"
             title="Open settings"
           >
             <MdSettings size={20} />
           </button>
           
           {/* Save indicator - minimal */}
           <div className="text-[10px] text-gray-600 font-mono whitespace-nowrap">
             {displayTime}
           </div>
        </div>
      </div>

      {/* Main Vertical Scroll Container */}
      <div 
        ref={verticalScrollRef}
        className="w-full h-full overflow-y-scroll snap-y-mandatory scrollbar-hide"
        onScroll={handleVerticalScroll}
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {/* MOON LAYER (index 0) - top of scroll, visually highest */}
        <section 
          className="w-full min-h-screen layer-moon relative flex items-center justify-center pt-16 pb-8"
          style={{ scrollSnapAlign: 'start', background: 'linear-gradient(to bottom, #0a0a0a, #111111)' }}
        >
          {/* Moon surface decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Crater patterns */}
            <div className="absolute top-20 left-20 w-48 h-48 rounded-full border border-gray-800/50" />
            <div className="absolute top-60 right-32 w-32 h-32 rounded-full border border-gray-700/30" />
            <div className="absolute bottom-32 left-1/4 w-24 h-24 rounded-full bg-gray-800/20" />
            <div className="absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-gray-700/10" />
            
            {/* Scanline overlay effect */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,0,0.03)_2px,rgba(0,255,0,0.03)_4px)]" />
          </div>
          
          <div className="relative z-10 w-full max-w-6xl px-8 h-full">
            <MoonView />
          </div>
          
          {/* Scroll hint - Moon is at top, can only go down to Orbit */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronDown className="mx-auto mb-1" />
            Scroll down to Orbit
          </div>
        </section>

        {/* ORBIT LAYER (index 1) */}
        <section 
          className="w-full min-h-screen layer-orbit stars relative flex items-center justify-center pt-16 pb-8"
          style={{ scrollSnapAlign: 'start' }}
        >
          {/* Orbit decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-32 h-32 rounded-full border border-blue-500/20" />
            <div className="absolute top-40 right-40 w-48 h-48 rounded-full border border-cyan-500/10" />
            <div className="absolute bottom-20 left-1/3 w-24 h-24 rounded-full bg-blue-500/5" />
          </div>
          
          <div className="relative z-10 w-full max-w-6xl px-8">
            {orbitLayerUnlocked ? (
              <OrbitView />
            ) : (
              <LockedLayerView 
                layer="orbit" 
                cargo={cargo} 
                totalSuccessfulLaunches={totalSuccessfulLaunches}
                onUnlock={() => unlockLayer('orbit')}
              />
            )}
          </div>
          
          {/* Scroll hints */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronDown className="mx-auto mb-1" />
            Scroll down to Contracts
          </div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronUp className="mx-auto mb-1" />
            Scroll up to Moon
          </div>
        </section>

        {/* CONTRACTS LAYER (index 2) */}
        <section 
          className="w-full min-h-screen layer-contracts relative flex items-center justify-center pt-16 pb-8"
          style={{ scrollSnapAlign: 'start', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)' }}
        >
          {/* Contracts decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-20 w-24 h-24 rounded-lg border border-purple-500/20 rotate-12" />
            <div className="absolute top-40 right-40 w-32 h-32 rounded-lg border border-purple-500/10 -rotate-6" />
            <div className="absolute bottom-32 left-1/3 w-20 h-20 rounded bg-purple-500/5" />
          </div>
          
          <div className="relative z-10 w-full max-w-6xl px-8">
            {contractsLayerUnlocked ? (
              <ContractsView />
            ) : (
              <LockedLayerView 
                layer="contracts" 
                cargo={cargo} 
                totalSuccessfulLaunches={totalSuccessfulLaunches}
                onUnlock={() => unlockLayer('contracts')}
              />
            )}
          </div>
          
          {/* Scroll hints */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronDown className="mx-auto mb-1" />
            Scroll down to Surface
          </div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronUp className="mx-auto mb-1" />
            Scroll up to Orbit
          </div>
        </section>

        {/* SURFACE LAYER (index 3) */}
        <section 
          className="w-full min-h-screen layer-surface relative flex items-center justify-center pt-16 pb-8"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className="relative z-10 w-full max-w-6xl px-8">
            <SpaceportView />
          </div>
          
          {/* Surface decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent" />
          </div>
          
          {/* Scroll hints */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronDown className="mx-auto mb-1" />
            Scroll down to Research
          </div>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronUp className="mx-auto mb-1" />
            Scroll up to Contracts
          </div>
        </section>

        {/* RESEARCH LAYER (index 4) - bottom of scroll, visually lowest (underground) */}
        <section 
          className="w-full min-h-screen layer-research underground-glow relative pt-16 pb-8"
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
          
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
            <ResearchTreeView />
          </div>
          
          {/* Scroll hint - Research is at bottom, can only go up to Surface */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2 text-gray-500 font-mono text-xs animate-bounce">
            <FaChevronUp className="mx-auto mb-1" />
            Scroll up to Surface
          </div>
        </section>
      </div>

      {/* Research Sidebar - Only show for layers that have research (orbit, contracts, moon) */}
      {(currentLayer === 'orbit' || currentLayer === 'contracts' || currentLayer === 'moon') && (
        <ResearchSidebar layer={currentLayer} />
      )}

      {/* Settings Panel Modal */}
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
