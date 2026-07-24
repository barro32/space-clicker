import { create } from 'zustand'
import { researchTree, ResearchNode, EffectType } from './researchTree.js'
import { INITIAL_STATE, COST_SCALING, PRODUCTION, DEFAULT_COMPANIES, COMPANY_DEFINITIONS, CompanyPerkEffect, ORBITAL, MOON, GameSettings, DEFAULT_SETTINGS, AUTOMATION, CONTRACT, LAYER_UNLOCK, GAME } from './gameConstants.js'
import { calculateOrbitPressure } from './orbitalHelpers.js'

interface Spaceport {
  id: number;
}

// Moon Layer Types
export type MoonStatus = 'locked' | 'ready' | 'transit' | 'unlocked';
export type MoonBuildingType = 'extractor' | 'refinery' | 'silo' | 'maintenance' | 'massDriver' | 'solarArray' | 'nuclearReactor' | 'battery' | 'fabricator';
export type MoonHazardType = 'moonDust' | 'solarFlare';

export interface MoonBuildings {
  extractors: number;
  refineries: number;
  silos: number;
  maintenances: number;
  massDrivers: number;
  solarArray: number;
  nuclearReactor: number;
  battery: number;
  fabricators: number;
  cargoStorage: number;
  starport: number;
}

export interface MoonHazard {
  type: MoonHazardType;
  name: string;
  ticksRemaining: number;
  debuff: number;
}

export interface MoonResources {
  regolith: number;
  helium3: number;
  alloys: number;
  cargo: number;
}

export interface EarthResources {
  regolith: number;
  helium3: number;
  alloys: number;
}

// Moon Sector Types
export interface MoonSectorTrait {
  extractorMultiplier?: number;
  solarMultiplier?: number;
  hazardChanceMultiplier?: number;
}

export interface MoonSector {
  id: string;
  name: string;
  traits: Record<string, MoonSectorTrait>;
  buildings: Partial<Record<MoonBuildingType | 'solarArray' | 'nuclearReactor' | 'battery' | 'fabricator' | 'cargoStorage' | 'starport', number>>;
  slots: number; // Total building slots
  slotsUsed: number; // Slots currently occupied
  unlocked: boolean; // Requires research to unlock
  scanned: boolean; // Requires science cost to scan before building
  researchRequirement?: string; // Optional research node ID required to unlock this sector
}

export interface MoonLunarBounty {
  id: string;
  companyId: string;
  helium3Amount: number;
  timeLimit: number; // seconds
  elapsedTime: number; // seconds
  rewardMoney: number;
  rewardScience: number;
  status: 'available' | 'active' | 'completed' | 'failed';
}

export interface MoonPowerSystem {
  dayNightTick: number; // Current position in day/night cycle (0 = start of day)
  isDay: boolean; // True if currently day
  currentEnergy: number; // Current stored energy
  maxEnergy: number; // Max energy from batteries
  energyGeneration: number; // Per tick
  energyDemand: number; // Per tick
}

export interface SpaceStation {
  id: string;
  type: "research" | "logistics" | "refueling";
  level: number;
  maxDocks: number;
  dockedRockets: number[]; // Array of rocket IDs currently docked
  fuelStorage?: number; // NEW - fuel held at refueling stations
}

export type RocketLocationLayer = 'surface' | 'transit' | 'orbit' | 'moon';
export type RocketTransitRoute = 'surface_to_orbit' | 'surface_to_moon' | 'moon_to_surface';
export type RocketMoonRole = 'colony' | 'supply' | 'returning';

export interface Rocket {
  id: number;
  type: 'cargo' | 'science' | 'fuel';
  freeLaunches?: number;
  locationLayer?: RocketLocationLayer;
  transitRoute?: RocketTransitRoute;
  targetStationId?: string;
  stationId?: string;
  ticksRemaining?: number;
  totalTicks?: number;
  homeSpaceportId?: number;
  cargoAmount?: number;
  moonRole?: RocketMoonRole;
}

export interface TransitRocket {
   id: number;
   type: 'cargo' | 'science' | 'fuel';
   targetStationId: string;
   ticksRemaining: number;
   fuel?: number; // NEW - fuel remaining for journey
   cargoAmount?: number; // NEW - cargo being transported (for supply missions)
}

export interface DockedRocket {
  rocketId: number;
  stationId: string;
  ticksRemaining: number;
}

export interface SpaceDebris {
  id: string;
  angle: number; // Position on orbit ring (0-360)
}

export interface Company {
  id: string;
  name: string;
  level: number;
  contractsCompleted: number;
}

export interface Contract {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requiredCargo: number;
  requiredScience: number;
  requiredMoney: number;
  deliveredCargo: number;
  deliveredScience: number;
  deliveredMoney: number;
  rewardMoney: number;
  rewardScience: number;
  rewardExperience: number;
  timeLimitSeconds: number; // 0 for no limit
  elapsedSeconds: number;
  maxExplosions: number; // -1 for no limit
  currentExplosions: number;
  status: 'available' | 'active' | 'completed' | 'failed';
}

function getRocketLocationLayer(rocket: Rocket): RocketLocationLayer {
  return rocket.locationLayer ?? 'surface';
}

function deriveOrbitTracking(rockets: (Rocket | null)[], spaceStations: SpaceStation[], explodedRocketIds: number[] = []) {
  const activeStationIds = new Set(spaceStations.map((station) => station.id));
  const spaceStationsWithDockedRockets = spaceStations.map((station) => ({
    ...station,
    dockedRockets: [] as number[],
  }));
  const dockedRockets: DockedRocket[] = [];
  const transitRockets: TransitRocket[] = [];

  rockets.forEach((rocket) => {
    if (!rocket || explodedRocketIds.includes(rocket.id)) {
      return;
    }

    const locationLayer = getRocketLocationLayer(rocket);
    const ticksRemaining = rocket.ticksRemaining ?? 0;

    if (
      locationLayer === 'transit' &&
      rocket.transitRoute === 'surface_to_orbit' &&
      rocket.targetStationId &&
      activeStationIds.has(rocket.targetStationId)
    ) {
      transitRockets.push({
        id: rocket.id,
        type: rocket.type,
        targetStationId: rocket.targetStationId,
        ticksRemaining,
      });
      return;
    }

    if (locationLayer === 'orbit' && rocket.stationId && activeStationIds.has(rocket.stationId)) {
      dockedRockets.push({
        rocketId: rocket.id,
        stationId: rocket.stationId,
        ticksRemaining,
      });

      const stationIndex = spaceStationsWithDockedRockets.findIndex((station) => station.id === rocket.stationId);
      if (stationIndex !== -1) {
        spaceStationsWithDockedRockets[stationIndex].dockedRockets.push(rocket.id);
      }
    }
  });

  return {
    spaceStations: spaceStationsWithDockedRockets,
    dockedRockets,
    transitRockets,
  };
}

function getOrbitTrackingSnapshot(
  rockets: (Rocket | null)[],
  spaceStations: SpaceStation[],
  explodedRocketIds: number[] = [],
  legacyDockedRockets: DockedRocket[] = [],
  legacyTransitRockets: TransitRocket[] = [],
) {
  const persistentTracking = deriveOrbitTracking(rockets, spaceStations, explodedRocketIds);
  if (persistentTracking.dockedRockets.length > 0 || persistentTracking.transitRockets.length > 0) {
    return persistentTracking;
  }

  if (legacyDockedRockets.length === 0 && legacyTransitRockets.length === 0) {
    return persistentTracking;
  }

  const spaceStationsWithDockedRockets = spaceStations.map((station) => ({
    ...station,
    dockedRockets: legacyDockedRockets
      .filter((dockedRocket) => dockedRocket.stationId === station.id)
      .map((dockedRocket) => dockedRocket.rocketId),
  }));

  return {
    spaceStations: spaceStationsWithDockedRockets,
    dockedRockets: legacyDockedRockets,
    transitRockets: legacyTransitRockets,
  };
}

export interface GameState {
   money: number
   science: number
   fuel: number;
   bonusFuelCapacity: number; // Dev/cheat bonus for fuel capacity
   cargo: number;
   lunarComponents: number; // Orbital-exclusive resource for Moon layer
   tickCount: number; // Increments each tick, used for animations
   currentView: "surface" | "orbit" | "contracts" | "research";
   notifications: string[];
   // Layer unlock tracking
   totalSuccessfulLaunches: number;
   orbitLayerUnlocked: boolean;
   contractsLayerUnlocked: boolean;
   companies: Company[];
   availableContracts: Contract[];
    activeContracts: Contract[]; // Changed from activeContract to array
    contractRefreshTimer: number; // Countdown to next contract refresh
    rockets: (Rocket | null)[];
    nextRocketId: number;
    rocketCost: number
    profitPerRocket: number;
    spaceportCapacity: number
    spaceports: Spaceport[]
    fuelRefineries: number; // Number of fuel refinery buildings
    spaceStations: SpaceStation[]
    spaceportCost: number
    fuelCostPerRocket: number;
    explodedRocketIds: number[];
   rocketExplosionChance: number;
   recentlyLaunchedRocketIds: number[]; // Rockets that launched this tick (for animation)
   newlyAvailableResearchIds: string[]; // Research nodes that just became available (for animation)
   // Orbital layer state
   satellites: number;
   maxSatellites: number;
   spaceDebris: SpaceDebris[];
   transitRockets: TransitRocket[]; // Rockets traveling from surface to orbit
   dockedRockets: DockedRocket[]; // Rockets currently docked at stations
    // Moon layer state
    moonStatus: MoonStatus;
    moonMissionTicksRemaining: number;
    moonBuildings: MoonBuildings;
    moonResources: MoonResources; // Local Moon storage (limited)
    earthResources: EarthResources; // Global unlimited storage
    activeHazard: MoonHazard | null;
    moonLog: string[]; // Terminal log messages
    moonSectors: MoonSector[];
    moonPowerSystem: MoonPowerSystem;
    moonBounties: MoonLunarBounty[];
    moonBountyRefreshTimer: number;
   getCurrentSpaceportCost: () => number;
   getCurrentRocketCost: () => number;
   getEffectMultiplier: (type: EffectType) => number;
   getCompanyPerkValue: (perkEffect: CompanyPerkEffect) => number;
   getTotalEffectValue: (type: EffectType | CompanyPerkEffect) => number;
   getMaxActiveContracts: () => number;
   getMaxAvailableContracts: () => number;
   getMaxFuel: () => number;
   getMoonStorageCapacity: () => MoonResources;
    getMoonBuildingCost: (type: MoonBuildingType | 'solarArray' | 'nuclearReactor' | 'battery' | 'fabricator') => { cargo: number; science: number; regolith: number; alloys: number };
   setView: (view: "surface" | "orbit" | "contracts" | "research") => void;
  addNotification: (message: string) => void;
  addMoonLog: (message: string) => void;
  generateContracts: () => void;
  acceptContract: (contractId: string) => void;
  forfeitContract: (contractId: string) => void;
  tick: () => void
     buildRocket: () => void
     buildSpaceport: () => void
     buildFuelRefinery: () => void
     buildSpaceStation: (type: SpaceStation['type']) => void
    clearExplosion: (rocketId: number) => void;
   // Orbital layer actions
   launchSatellite: () => void;
   clearDebris: (debrisId: string) => void;
   upgradeStation: (stationId: string) => void;
   // Moon layer actions
   startMoonMission: () => void;
   buildMoonStructure: (type: MoonBuildingType) => void;
   transportResources: () => void;
   clearHazard: () => void;
   // Layer unlock action
   unlockLayer: (layer: 'orbit' | 'contracts') => void;
    researchedNodes: string[];
    previouslyAvailableResearch: string[];
    autoBuildActive: boolean;
    autoSalvageActive: boolean;
    toggleAutoBuild: () => void;
    toggleAutoSalvage: () => void;
    settings: GameSettings;
    updateSettings: (partial: Partial<GameSettings>) => void;
    resetSettings: () => void;
     unlockNode: (nodeId: string) => void;
    getAvailableNodes: () => ResearchNode[];
    scanSector: () => void;
    unlockMoonSector: (sectorId: string) => void;
    scanMoonSector: (sectorId: string) => void;
    sendSupplyMission: (cargoAmount: number) => void;
    constructBuildingOnMoon: (sectorId: string, buildingType: MoonBuildingType | 'solarArray' | 'nuclearReactor' | 'battery') => void;
    launchMassDriverPayload: (amount: number) => void;
    acceptMoonBounty: (bountyId: string) => void;
    completeMoonBounty: (bountyId: string) => void;
}



export const useGameStore = create<GameState>((set, get) => ({
  money: INITIAL_STATE.MONEY,
  science: INITIAL_STATE.SCIENCE,
  fuel: INITIAL_STATE.FUEL,
  bonusFuelCapacity: 0,
  cargo: INITIAL_STATE.CARGO,
  lunarComponents: 0,
  tickCount: 0,
  currentView: "surface",
  notifications: [],
  // Layer unlock tracking
  totalSuccessfulLaunches: 0,
  orbitLayerUnlocked: false,
  contractsLayerUnlocked: false,
  companies: DEFAULT_COMPANIES.map(c => ({ ...c })),
  availableContracts: [],
  activeContracts: [],
  contractRefreshTimer: INITIAL_STATE.CONTRACT_REFRESH_INTERVAL,
  rockets: [],
  nextRocketId: 0,
  rocketCost: INITIAL_STATE.ROCKET_COST,
  profitPerRocket: INITIAL_STATE.PROFIT_PER_ROCKET,
   spaceportCapacity: INITIAL_STATE.SPACEPORT_CAPACITY,
   spaceports: [{ id: 1 }],
    fuelRefineries: 0,
    spaceStations: [],
    spaceportCost: INITIAL_STATE.SPACEPORT_COST,
   fuelCostPerRocket: INITIAL_STATE.FUEL_COST_PER_ROCKET,
   explodedRocketIds: [],
  rocketExplosionChance: INITIAL_STATE.ROCKET_EXPLOSION_CHANCE,
  recentlyLaunchedRocketIds: [],
  newlyAvailableResearchIds: [],
  // Orbital layer state
  satellites: 0,
  maxSatellites: ORBITAL.MAX_SATELLITES_BASE,
  spaceDebris: [],
  transitRockets: [],
  dockedRockets: [],
   // Moon layer state
   moonStatus: 'locked',
   moonMissionTicksRemaining: 0,
    moonBuildings: { extractors: 0, refineries: 0, silos: 0, maintenances: 0, massDrivers: 0, solarArray: 0, nuclearReactor: 0, battery: 0, fabricators: 0, cargoStorage: 0, starport: 0 },
    moonResources: { regolith: 0, helium3: 0, alloys: 0, cargo: 0 },
    earthResources: { regolith: 0, helium3: 0, alloys: 0 },
   activeHazard: null,
   moonLog: [],
   moonSectors: [{ 
      id: 'starting-sector', 
      name: 'Landing Zone', 
      traits: {}, 
      buildings: {}, 
      slots: MOON.BUILDING_SLOTS_PER_SECTOR, 
      slotsUsed: 0,
      unlocked: true, // Starting sector is unlocked
      scanned: true // Starting sector is scanned
    }],
   moonPowerSystem: { 
     dayNightTick: 0, 
     isDay: true, 
     currentEnergy: MOON.INITIAL_POWER_ENERGY, 
     maxEnergy: MOON.INITIAL_POWER_ENERGY, 
     energyGeneration: 0, 
     energyDemand: 0 
   },
   moonBounties: [],
   moonBountyRefreshTimer: MOON.BOUNTY_GENERATION_INTERVAL,
    researchedNodes: [],
    previouslyAvailableResearch: [],
    autoBuildActive: false,
    autoSalvageActive: false,
   settings: DEFAULT_SETTINGS,
   
   tick: () => set(state => {
    // Clear animation flags at start of each tick
    const updatedRockets = [...state.rockets];
    const initialOrbitTracking = getOrbitTrackingSnapshot(
      updatedRockets,
      state.spaceStations,
      state.explodedRocketIds,
      state.dockedRockets,
      state.transitRockets,
    );
    const activeRockets = updatedRockets
      .filter((rocket): rocket is Rocket => rocket !== null)
      .filter((rocket) => !state.explodedRocketIds.includes(rocket.id) && getRocketLocationLayer(rocket) === 'surface');
    const rocketIndexById = new Map<number, number>();

    updatedRockets.forEach((rocket, index) => {
      if (rocket !== null) {
        rocketIndexById.set(rocket.id, index);
      }
    });
    
       const passiveFuelProduction = PRODUCTION.PASSIVE_FUEL_PER_TICK;
       const refineryOutputMultiplier = state.getTotalEffectValue('refineryOutputMultiplier') || 1;
       const refineryFuelProduction = state.fuelRefineries * PRODUCTION.FUEL_REFINERY_PRODUCTION_PER_TICK * refineryOutputMultiplier;
       const fuelProduction = passiveFuelProduction + refineryFuelProduction;
      // Apply fuel capacity bonus from research, company perks, dev bonus, and refineries
      const maxFuel = state.getMaxFuel();
      let fuelAvailable = Math.min(maxFuel, state.fuel + fuelProduction);
    let successfulCargoLaunches = 0;
    let explosionCount = 0;
    let blockedOrbitTransfers = 0;
    let explosionScienceFromCost = 0; // Track science from Black Box perk
     let newExplodedRocketIds = [...state.explodedRocketIds];
    let newActiveContracts = state.activeContracts.map(c => ({ ...c }));
    let newCompanies = [...state.companies];
    let recentlyLaunchedIds: number[] = [];
    let plannedTransitRockets: TransitRocket[] = [...initialOrbitTracking.transitRockets];

     // Get combined multipliers (research + company perks)
     let baseFuelCost = state.fuelCostPerRocket * state.getTotalEffectValue('fuelCostMultiplier');
     let baseExplosionChance = state.rocketExplosionChance * state.getTotalEffectValue('explosionChanceMultiplier');
     
     const effectiveFuelCost = baseFuelCost;
     const effectiveExplosionChance = baseExplosionChance;

      // Process each rocket launch
     for (const rocket of activeRockets) {
       if (fuelAvailable >= effectiveFuelCost) {
         fuelAvailable -= effectiveFuelCost;
         
         // Check if rocket has free launches
         const rocketIndex = rocketIndexById.get(rocket.id);
         const rocketData = rocketIndex === undefined ? null : updatedRockets[rocketIndex];
         const hasFreeLaunch = rocketData && rocketData.freeLaunches && rocketData.freeLaunches > 0;
         
         // Roll for explosion (unless rocket has free launch)
         if (hasFreeLaunch || Math.random() >= effectiveExplosionChance) {
           let nextRocketState = rocketData ? { ...rocketData } : { ...rocket };

           // Consume free launch if used
           if (hasFreeLaunch) {
             nextRocketState.freeLaunches = (nextRocketState.freeLaunches || 1) - 1;
           }
           
            // Track successful launches for animation
            recentlyLaunchedIds.push(rocket.id);
            successfulCargoLaunches += 1;
            
           // === ORBITAL DOCKING: Send rocket to orbit if there's a free dock ===
           // Find a station with available docks
           const stationsWithDocks = state.spaceStations.filter(s => {
             const dockedCount = initialOrbitTracking.dockedRockets.filter(d => d.stationId === s.id).length;
             const transitCount = plannedTransitRockets.filter(t => t.targetStationId === s.id).length;
             return dockedCount + transitCount < s.maxDocks;
           });
           
           if (stationsWithDocks.length > 0) {
             // Pick a random station with available docks
             const targetStation = stationsWithDocks[Math.floor(Math.random() * stationsWithDocks.length)];
             // Transit speed multiplier (Zenith perk: Express Transit)
             const transitSpeedMultiplier = state.getCompanyPerkValue('transitSpeedMultiplier') || 1;
             const transitDuration = Math.max(1, Math.floor(ORBITAL.TRANSIT_DURATION_TICKS * transitSpeedMultiplier));
             nextRocketState = {
               ...nextRocketState,
               locationLayer: 'transit',
               transitRoute: 'surface_to_orbit',
               targetStationId: targetStation.id,
               stationId: undefined,
               ticksRemaining: transitDuration,
               totalTicks: transitDuration,
             };
             plannedTransitRockets.push({
               id: rocket.id,
               type: rocket.type,
               targetStationId: targetStation.id,
               ticksRemaining: transitDuration,
             });
           } else if (state.spaceStations.length > 0) {
             blockedOrbitTransfers += 1;
           }

           if (rocketIndex !== undefined) {
             updatedRockets[rocketIndex] = nextRocketState;
           }
         } else {
           newExplodedRocketIds.push(rocket.id);
           explosionCount += 1;
           
           // Black Box perk: Explosions grant science based on rocket cost
           const scienceFromExplosions = state.getCompanyPerkValue('scienceFromExplosions');
           if (scienceFromExplosions > 0) {
             // Calculate what this rocket cost (approximate based on current rocket count)
             const currentRocketCount = state.rockets.filter(r => r !== null).length;
             const rocketIndex = Math.max(0, currentRocketCount - 1);
             const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, rocketIndex);
             explosionScienceFromCost += Math.floor(baseCost * scienceFromExplosions);
           }
           
           // Handle contract fragility for all active contracts
           for (const contract of newActiveContracts) {
             if (contract.status === 'active' && contract.maxExplosions !== -1) {
               contract.currentExplosions += 1;
               if (contract.currentExplosions > contract.maxExplosions) {
                 contract.status = 'failed';
                 get().addNotification(`Contract Failed: ${contract.title} (Too many explosions)`);
               }
             }
           }
         }
     }
     }
    
    // === ORBITAL MECHANICS ===
    const dockingDurationReduction = state.getCompanyPerkValue('dockingDurationReduction') || 0;
    const effectiveDockingDuration = Math.max(1, Math.floor(ORBITAL.DOCKING_DURATION_TICKS * (1 - dockingDurationReduction)));
    updatedRockets.forEach((rocket, index) => {
      if (!rocket || newExplodedRocketIds.includes(rocket.id)) {
        return;
      }

      const locationLayer = getRocketLocationLayer(rocket);
      const ticksRemaining = rocket.ticksRemaining ?? 0;

      if (locationLayer === 'transit' && rocket.transitRoute === 'surface_to_orbit' && rocket.targetStationId) {
        if (ticksRemaining <= 1) {
          updatedRockets[index] = {
            ...rocket,
            locationLayer: 'orbit',
            transitRoute: undefined,
            stationId: rocket.targetStationId,
            targetStationId: undefined,
            ticksRemaining: effectiveDockingDuration,
            totalTicks: undefined,
          };
        } else {
          updatedRockets[index] = {
            ...rocket,
            ticksRemaining: ticksRemaining - 1,
          };
        }
        return;
      }

      if (locationLayer === 'orbit' && rocket.stationId) {
        if (ticksRemaining <= 1) {
          updatedRockets[index] = {
            ...rocket,
            locationLayer: 'surface',
            stationId: undefined,
            ticksRemaining: undefined,
            totalTicks: undefined,
          };
        } else {
          updatedRockets[index] = {
            ...rocket,
            ticksRemaining: ticksRemaining - 1,
          };
        }
      }
    });

    const orbitTracking = getOrbitTrackingSnapshot(
      updatedRockets,
      state.spaceStations,
      newExplodedRocketIds,
      initialOrbitTracking.dockedRockets,
      initialOrbitTracking.transitRockets,
    );
    const newSpaceStations = orbitTracking.spaceStations;
    const newDockedRockets = orbitTracking.dockedRockets;
    const stillInTransit = orbitTracking.transitRockets;
    
    // Spawn debris randomly
    let newDebris = [...state.spaceDebris];
    const hasDebrisImmunity = state.getEffectMultiplier('debrisImmunity') > 0;
    const orbitPressure = calculateOrbitPressure({
      spaceStations: newSpaceStations,
      dockedRockets: newDockedRockets,
      transitRockets: stillInTransit,
      satellites: state.satellites,
      spaceDebris: newDebris,
    });

    const debrisSpawnChance =
      ORBITAL.DEBRIS_SPAWN_CHANCE +
      orbitPressure.congestion * 0.35 +
      blockedOrbitTransfers * ORBITAL.DEBRIS_FROM_BLOCKED_TRANSFER_CHANCE +
      explosionCount * ORBITAL.DEBRIS_FROM_EXPLOSION_CHANCE;

    if (!hasDebrisImmunity && Math.random() < debrisSpawnChance && state.spaceStations.length > 0) {
      newDebris.push({
        id: `debris-${Date.now()}-${Math.random()}`,
        angle: Math.random() * 360,
      });
    }
    
    // Calculate satellite bonus (global multiplier)
    const satelliteBonusMultiplier = state.getEffectMultiplier('satelliteBonusMultiplier') || 1;
    const satelliteBonus = 1 + (state.satellites * ORBITAL.SATELLITE_GLOBAL_BONUS * satelliteBonusMultiplier);
    
    // Calculate debris penalty
    const debrisPenalty = hasDebrisImmunity ? 1 : Math.max(1 - ORBITAL.MAX_DEBRIS_PENALTY, 1 - (newDebris.length * ORBITAL.DEBRIS_PENALTY_PER_PIECE));
    const congestionMultiplier = 1 - orbitPressure.congestion;

      // Calculate production with company perk bonuses
       const profitMultiplier = state.getTotalEffectValue('profitMultiplier');
       let moneyProduction = successfulCargoLaunches * state.profitPerRocket * profitMultiplier;
      
       // Science production with company perks
         const sciencePerRocketBonus = state.getTotalEffectValue('sciencePerRocketBonus');
         const sciencePerExplosionBonus = state.getCompanyPerkValue('sciencePerExplosionBonus');
         let sciProd = successfulCargoLaunches * (PRODUCTION.SCIENCE_PER_SCIENCE_ROCKET + sciencePerRocketBonus) + explosionCount * (PRODUCTION.SCIENCE_PER_EXPLOSION + sciencePerExplosionBonus) + explosionScienceFromCost;
      
       // Cargo generation - combine research multipliers and company perks
      const cargoPerLaunchMultiplier = state.getTotalEffectValue('cargoPerLaunchMultiplier');
      const cargoPerLaunchBonus = state.getTotalEffectValue('cargoPerLaunchBonus');
      const cargoGenerationMultiplier = state.getEffectMultiplier('cargoGenerationMultiplier');
      const totalCargoMultiplier = (cargoPerLaunchMultiplier !== 1 ? cargoPerLaunchMultiplier : 1) * (cargoGenerationMultiplier !== 0 ? cargoGenerationMultiplier : 1);
      let cargoResourceProd = successfulCargoLaunches * (PRODUCTION.CARGO_PER_SUCCESSFUL_LAUNCH + cargoPerLaunchBonus) * totalCargoMultiplier;

      // Passive bonuses from both research and company perks
      const passiveMoneyBonus = state.getTotalEffectValue('passiveMoneyBonus');
      const passiveScienceBonus = state.getTotalEffectValue('passiveScienceBonus');
      const passiveCargoBonus = state.getTotalEffectValue('passiveCargoBonus');
      moneyProduction += passiveMoneyBonus;
      sciProd += passiveScienceBonus;
       cargoResourceProd += passiveCargoBonus;

      // Passive Spaceport Bonuses
      for (let i = 0; i < state.spaceports.length; i++) {
        moneyProduction += (i + 1) * PRODUCTION.PASSIVE_CARGO_BONUS_PER_SPACEPORT;
      }
     
     // Satellite Science Bonus (Nova perk: Telemetry Link)
     const satelliteScienceBonus = state.getCompanyPerkValue('satelliteScienceBonus');
     if (satelliteScienceBonus > 0) {
       sciProd += state.satellites * satelliteScienceBonus;
     }
     
     // Fuel to Money Bonus (Titan perk: Liquid Assets)
     // Money gen scales with current fuel % (up to +50% at full tank)
     const fuelToMoneyBonus = state.getCompanyPerkValue('fuelToMoneyBonus');
     if (fuelToMoneyBonus > 0 && maxFuel > 0) {
       const fuelPercentage = fuelAvailable / maxFuel;
       const moneyBonus = fuelPercentage * fuelToMoneyBonus;
       moneyProduction *= (1 + moneyBonus);
     }
     
     // Global Money Multiplier (Titan perk: Monopoly)
     const globalMoneyMultiplier = state.getCompanyPerkValue('globalMoneyMultiplier');
     if (globalMoneyMultiplier > 1) {
       moneyProduction *= globalMoneyMultiplier;
     }

    // Apply Orbital Station Benefits with company perk multipliers and docking bonus
    const stationBonusMultiplier = state.getCompanyPerkValue('stationBonusMultiplier') || 1;
    const dockingBonusMultiplier = state.getEffectMultiplier('dockingBonusMultiplier') || ORBITAL.DOCKING_BONUS_MULTIPLIER;
    
    // Lunar component production - only from docked rockets at research stations
    let lunarProd = 0;
    const lunarProductionMultiplier = state.getEffectMultiplier('lunarProductionMultiplier') || 1;
    
    // Track total station levels for Station Science Scale perk
    let totalStationLevels = 0;
    
    if (newSpaceStations.length > 0) {
      newSpaceStations.forEach(station => {
        totalStationLevels += station.level;
        
        // Calculate docking bonus for this station
        const dockedCount = station.dockedRockets.length;
        const stationDockingBonus = dockedCount > 0 ? 1 + (dockedCount * (dockingBonusMultiplier - 1)) : 1;
        
        if (station.type === 'research') {
          const researchIdleMultiplier = dockedCount > 0 ? 1 : ORBITAL.RESEARCH_IDLE_MULTIPLIER;
          const baseOutput = PRODUCTION.STATION_SCIENCE_BONUS * station.level * state.getEffectMultiplier('stationScienceMultiplier') * stationBonusMultiplier;
          sciProd += baseOutput * researchIdleMultiplier * stationDockingBonus * debrisPenalty * congestionMultiplier;
          
          // Lunar component production: each docked rocket at research station produces components
          if (dockedCount > 0) {
            lunarProd += dockedCount * ORBITAL.LUNAR_COMPONENT_PRODUCTION_RATE * station.level * lunarProductionMultiplier * congestionMultiplier;
          }
         } else if (station.type === 'logistics') {
           const baseOutput = PRODUCTION.STATION_LOGISTICS_BONUS * station.level * state.getEffectMultiplier('stationLogisticsMultiplier') * stationBonusMultiplier;
           moneyProduction += baseOutput * stationDockingBonus * debrisPenalty * congestionMultiplier;
         }
      });
    }
    
    // Station Science Scale (Nova perk: Orbital Labs)
    // Each station level adds +X% to global science
    const stationScienceScale = state.getCompanyPerkValue('stationScienceScale');
    if (stationScienceScale > 0 && totalStationLevels > 0) {
      const scienceMultiplier = 1 + (totalStationLevels * stationScienceScale);
      sciProd *= scienceMultiplier;
    }
    
    // Apply satellite bonus and debris penalty to lunar production
    lunarProd *= satelliteBonus * debrisPenalty;
    
    // Apply satellite bonus to all production
    moneyProduction *= satelliteBonus;
    sciProd *= satelliteBonus;
    cargoResourceProd *= satelliteBonus;

    // Process all active contracts (in order they were accepted)
    let completedContracts: Contract[] = [];
    for (const contract of newActiveContracts) {
      if (contract.status !== 'active') continue;
      
      // Update time limit
      if (contract.timeLimitSeconds > 0) {
        contract.elapsedSeconds += 1;
        if (contract.elapsedSeconds >= contract.timeLimitSeconds) {
          contract.status = 'failed';
          get().addNotification(`Contract Failed: ${contract.title} (Time limit reached)`);
          continue;
        }
      }
      
      // Deliver resources to contract (sequential - fill each contract in order)
      const moneyToDeliver = Math.min(moneyProduction, contract.requiredMoney - contract.deliveredMoney);
      contract.deliveredMoney += moneyToDeliver;
      moneyProduction -= moneyToDeliver;
      
      const scienceToDeliver = Math.min(sciProd, contract.requiredScience - contract.deliveredScience);
      contract.deliveredScience += scienceToDeliver;
      sciProd -= scienceToDeliver;
      
      const cargoToDeliver = Math.min(cargoResourceProd, contract.requiredCargo - contract.deliveredCargo);
      contract.deliveredCargo += cargoToDeliver;
      cargoResourceProd -= cargoToDeliver;
      
      // Check if contract is complete
      if (contract.deliveredMoney >= contract.requiredMoney &&
          contract.deliveredScience >= contract.requiredScience &&
          contract.deliveredCargo >= contract.requiredCargo) {
        contract.status = 'completed';
        completedContracts.push(contract);
      }
    }

    // Process completed contracts
    for (const completedContract of completedContracts) {
      const company = state.companies.find(c => c.id === completedContract.companyId);
      if (company) {
        // Apply company XP multiplier (c3 Negotiation Tactics research)
        // This gives bonus contract progress (e.g., 1.5x means 50% chance to get +1 extra progress)
        const companyXPMultiplier = state.getEffectMultiplier('companyXPMultiplier') || 1;
        let contractProgress = 1;
        // If multiplier > 1, add bonus progress with chance based on fractional part
        if (companyXPMultiplier > 1) {
          const bonusChance = companyXPMultiplier - 1; // e.g., 1.5 -> 0.5 = 50% chance
          if (Math.random() < bonusChance) {
            contractProgress += 1;
          }
        }
        
        const newContractsCompleted = company.contractsCompleted + contractProgress;
        const contractsToLevel = company.level + 1; // Level N requires N+1 contracts to reach level N+1
        let newLevel = company.level;
        let finalContractsCompleted = newContractsCompleted;

        // Check for level ups (can level up multiple times if XP bonus is high)
        while (finalContractsCompleted >= contractsToLevel + (newLevel - company.level)) {
          finalContractsCompleted -= (contractsToLevel + (newLevel - company.level));
          newLevel += 1;
          get().addNotification(`${company.name} leveled up to ${newLevel}!`);
        }

        newCompanies = newCompanies.map(c => 
          c.id === company.id ? { ...c, level: newLevel, contractsCompleted: finalContractsCompleted } : c
        );
        
        // Contracts no longer give money/science/cargo rewards, only company XP
      }
      get().addNotification(`Contract Completed: ${completedContract.title}`);
    }

    // Remove completed/failed contracts from active list
    newActiveContracts = newActiveContracts.filter(c => c.status === 'active');

    const newScience = state.science + sciProd;

    // Contract refresh timer
    let newContractRefreshTimer = state.contractRefreshTimer - 1;
    let newAvailableContracts = state.availableContracts;
    
    if (newContractRefreshTimer <= 0) {
      // Reset timer and generate new contracts
      const refreshMultiplier = state.getEffectMultiplier('contractRefreshMultiplier') || 1;
      newContractRefreshTimer = Math.floor(INITIAL_STATE.CONTRACT_REFRESH_INTERVAL / refreshMultiplier);
      
      // Generate new contracts (will replace old available ones)
      const maxAvailable = get().getMaxAvailableContracts();
      newAvailableContracts = [];
      // Filter out companies that have reached max level (all perks unlocked)
      const companiesToPick = state.companies.filter(c => {
        const definition = COMPANY_DEFINITIONS.find(d => d.id === c.id);
        const maxLevel = definition?.perks.length || 10;
        return c.level < maxLevel;
      });
      
      const contractTitles = ['Contract', 'Mission', 'Assignment', 'Project', 'Initiative', 'Task'];
      
      while (newAvailableContracts.length < maxAvailable && companiesToPick.length > 0) {
        const companyIndex = Math.floor(Math.random() * companiesToPick.length);
        const company = companiesToPick.splice(companyIndex, 1)[0];
        
        // Difficulty scales exponentially with level
        const levelScale = Math.pow(company.level, 1.5);
        
        const titleBase = contractTitles[Math.floor(Math.random() * contractTitles.length)];

        // Randomize requirements with some variance
        // Apply contract requirement multiplier (c2 Lean Logistics research)
         const contractRequirementMult = state.getEffectMultiplier('contractRequirementMultiplier') || 1;
         const baseCargoReq = CONTRACT.BASE_CARGO_REQ * levelScale * (0.5 + Math.random()) * contractRequirementMult;
         const baseScienceReq = CONTRACT.BASE_SCIENCE_REQ * levelScale * (0.5 + Math.random()) * contractRequirementMult;
         const baseMoneyReq = CONTRACT.BASE_MONEY_REQ * levelScale * (0.5 + Math.random()) * contractRequirementMult;

        newAvailableContracts.push({
          id: `contract-${Date.now()}-${Math.random()}`,
          companyId: company.id,
          title: `${company.name} ${titleBase} #${Math.floor(Math.random() * 1000)}`,
          description: `Support ${company.name}'s operations with resources.`,
          requiredCargo: Math.round(baseCargoReq),
          requiredScience: Math.round(baseScienceReq),
          requiredMoney: Math.round(baseMoneyReq),
          deliveredCargo: 0, deliveredScience: 0, deliveredMoney: 0,
          rewardMoney: 0,
          rewardScience: 0,
          rewardExperience: 50 * company.level,
          timeLimitSeconds: 0,
          elapsedSeconds: 0,
          maxExplosions: -1,
          currentExplosions: 0,
          status: 'available'
        });
      }
      
      get().addNotification('New contracts available!');
    }

     // Auto-build logic
     let finalMoney = state.money + moneyProduction;
     let finalRockets = updatedRockets;
    let finalNextId = state.nextRocketId;
    let finalScience = newScience;
    let finalExplodedRocketIds = newExplodedRocketIds;

    const autoBuildEnabled = state.getEffectMultiplier('autoBuildEnabled') > 0;
    if (autoBuildEnabled && state.autoBuildActive) {
      const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier') || 1;
      const autoBuildSpeedMultiplier = state.getCompanyPerkValue('autoBuildSpeedMultiplier') || 1;
       const buildSpeedMultiplier = state.getCompanyPerkValue('buildSpeedMultiplier') || 1;
       const baseInterval = AUTOMATION.BASE_INTERVAL;
       const effectiveInterval = Math.max(1, Math.floor(baseInterval / (buildMultiplier * autoBuildSpeedMultiplier * buildSpeedMultiplier)));
      
      if (state.tickCount % effectiveInterval === 0) {
        const effectiveCapacity = state.spaceportCapacity + state.getTotalEffectValue('spaceportCapacityBonus');
        const maxRockets = state.spaceports.length * effectiveCapacity;
        const currentTotalRockets = finalRockets.filter(r => r !== null).length;

        if (currentTotalRockets < maxRockets) {
          const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
          const rocketCostMultiplier = state.getCompanyPerkValue('rocketCostMultiplier') || 1;
          const idx = currentTotalRockets;
          const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, idx);
          const cost = Math.round(baseCost * constructionMultiplier * rocketCostMultiplier);
          
          if (finalMoney >= cost) {
            const newRockets = [...finalRockets];
            const newRocket = { id: finalNextId, type: 'cargo' as const, locationLayer: 'surface' as RocketLocationLayer };
            const firstNullIndex = newRockets.findIndex(r => r === null);
            if (firstNullIndex !== -1) {
              newRockets[firstNullIndex] = newRocket;
            } else {
              newRockets.push(newRocket);
            }
            finalRockets = newRockets;
            finalNextId += 1;
            finalMoney -= cost;
          }
        }
      }
    }

    // Auto-salvage logic
    const autoSalvageEnabled = state.getEffectMultiplier('autoSalvageEnabled') > 0;
    if (autoSalvageEnabled && state.autoSalvageActive && finalExplodedRocketIds.length > 0) {
      const clearMultiplier = state.getEffectMultiplier('clearExplosionMultiplier') || 1;
      const autoSalvageSpeedMultiplier = state.getCompanyPerkValue('autoSalvageSpeedMultiplier') || 1;
       const baseInterval = AUTOMATION.BASE_INTERVAL;
       const effectiveInterval = Math.max(1, Math.floor(baseInterval / (clearMultiplier * autoSalvageSpeedMultiplier)));
       
       if ((state.tickCount + AUTOMATION.SALVAGE_TICK_OFFSET) % effectiveInterval === 0) {
        const rocketId = finalExplodedRocketIds[0];
        const newRockets = [...finalRockets];
        const rocketIndex = newRockets.findIndex(r => r !== null && r.id === rocketId);
        if (rocketIndex !== -1) {
          newRockets[rocketIndex] = null;
          finalRockets = newRockets;
          finalExplodedRocketIds = finalExplodedRocketIds.filter(id => id !== rocketId);
          const sciencePerSalvageBonus = state.getCompanyPerkValue('sciencePerSalvageBonus');
          finalScience += 1 + sciencePerSalvageBonus;
        }
      }
    }

    // Detect newly available research nodes
    const currentAvailableIds = get().getAvailableNodes().map(n => n.id);
    const newlyAvailable = currentAvailableIds.filter(id => !state.previouslyAvailableResearch.includes(id));
    
    let notificationsToAdd: string[] = [];
    for (const nodeId of newlyAvailable) {
      const node = researchTree.find(n => n.id === nodeId);
      if (node) {
        notificationsToAdd.push(`New research available: ${node.name}`);
      }
    }

    const updatedNotifications = newlyAvailable.length > 0 
      ? [...notificationsToAdd, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS)
      : state.notifications;

     // === MOON LAYER MECHANICS ===
     let newMoonStatus = state.moonStatus;
     let newMoonMissionTicks = state.moonMissionTicksRemaining;
     let newMoonResources = { ...state.moonResources };
     let newEarthResources = { ...state.earthResources };
     let newActiveHazard = state.activeHazard;
     let newMoonLog = [...state.moonLog];
     let newMoonPowerSystem = { ...state.moonPowerSystem };
     
     // Check if lunar manufacturing is unlocked to show "ready" status
    if (state.moonStatus === 'locked' && state.getEffectMultiplier('unlockLunarManufacturing') > 0) {
      newMoonStatus = 'ready';
    }
    const moonStorageCapacity = state.getMoonStorageCapacity();
    const hasRocketDrivenMoonMission = finalRockets.some(
      (rocket) => rocket !== null && rocket.transitRoute === 'surface_to_moon' && rocket.moonRole === 'colony',
    );

    finalRockets = finalRockets.map((rocket) => {
      if (!rocket || finalExplodedRocketIds.includes(rocket.id)) {
        return rocket;
      }

      if (rocket.locationLayer === 'transit' && rocket.transitRoute === 'surface_to_moon') {
        const nextTicksRemaining = Math.max(0, (rocket.ticksRemaining ?? 0) - 1);

        if (rocket.moonRole === 'colony') {
          newMoonMissionTicks = nextTicksRemaining;
        }

        if (nextTicksRemaining > 0) {
          return {
            ...rocket,
            ticksRemaining: nextTicksRemaining,
          };
        }

        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

        if (rocket.moonRole === 'colony') {
          newMoonStatus = 'unlocked';
          newMoonMissionTicks = 0;
          newMoonResources.cargo = Math.min(
            moonStorageCapacity.cargo,
            newMoonResources.cargo + MOON.INITIAL_MOON_CARGO,
          );
          newMoonLog = [`[${timestamp}] LANDING SUCCESSFUL - Rocket #${rocket.id} established the lunar base`, ...newMoonLog]
            .slice(0, MOON.LOG_MAX_ENTRIES);
          notificationsToAdd.push(`Lunar Landing Successful! Rocket #${rocket.id} is now on the Moon.`);

          return {
            ...rocket,
            locationLayer: 'moon',
            transitRoute: undefined,
            ticksRemaining: undefined,
            totalTicks: undefined,
            cargoAmount: undefined,
            moonRole: 'colony',
          };
        }

        const deliveredCargo = Math.min(
          rocket.cargoAmount || 0,
          Math.max(0, moonStorageCapacity.cargo - newMoonResources.cargo),
        );
        newMoonResources.cargo += deliveredCargo;
        newMoonLog = [`[${timestamp}] SUPPLY ARRIVAL - Rocket #${rocket.id} delivered ${deliveredCargo} cargo`, ...newMoonLog]
          .slice(0, MOON.LOG_MAX_ENTRIES);
        notificationsToAdd.push(`Rocket #${rocket.id} delivered ${deliveredCargo} cargo to the Moon.`);

        return {
          ...rocket,
          locationLayer: 'moon',
          transitRoute: undefined,
          ticksRemaining: MOON.SUPPLY_TURNAROUND_TICKS,
          totalTicks: MOON.SUPPLY_TURNAROUND_TICKS,
          moonRole: 'supply',
        };
      }

      if (rocket.locationLayer === 'moon' && rocket.moonRole === 'supply') {
        const nextTicksRemaining = Math.max(0, (rocket.ticksRemaining ?? 0) - 1);
        if (nextTicksRemaining > 0) {
          return {
            ...rocket,
            ticksRemaining: nextTicksRemaining,
          };
        }

        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        newMoonLog = [`[${timestamp}] RETURN BURN - Rocket #${rocket.id} departing for Earth orbit`, ...newMoonLog]
          .slice(0, MOON.LOG_MAX_ENTRIES);

        return {
          ...rocket,
          locationLayer: 'transit',
          transitRoute: 'moon_to_surface',
          ticksRemaining: MOON.SUPPLY_MISSION_DURATION,
          totalTicks: MOON.SUPPLY_MISSION_DURATION,
          moonRole: 'returning',
        };
      }

      if (rocket.locationLayer === 'transit' && rocket.transitRoute === 'moon_to_surface') {
        const nextTicksRemaining = Math.max(0, (rocket.ticksRemaining ?? 0) - 1);
        if (nextTicksRemaining > 0) {
          return {
            ...rocket,
            ticksRemaining: nextTicksRemaining,
          };
        }

        return {
          ...rocket,
          locationLayer: 'surface',
          transitRoute: undefined,
          ticksRemaining: undefined,
          totalTicks: undefined,
          cargoAmount: undefined,
          moonRole: undefined,
        };
      }

      return rocket;
    });

    // Legacy fallback for older saves that still have only the global mission timer.
    if (state.moonStatus === 'transit' && !hasRocketDrivenMoonMission) {
      newMoonMissionTicks = state.moonMissionTicksRemaining - 1;
      
      // Mission complete!
      if (newMoonMissionTicks <= 0) {
        newMoonStatus = 'unlocked';
        newMoonMissionTicks = 0;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        newMoonLog = [`[${timestamp}] LANDING SUCCESSFUL - Lunar base operational`, ...newMoonLog].slice(0, MOON.LOG_MAX_ENTRIES);
        notificationsToAdd.push('Lunar Landing Successful! Moon base is now operational.');
      }
    }
    
     // Process Moon production (only when unlocked)
     if (state.moonStatus === 'unlocked') {
        const storage = state.getMoonStorageCapacity();
        
        // Update day/night cycle
        newMoonPowerSystem = { ...state.moonPowerSystem };
        newMoonPowerSystem.dayNightTick = (newMoonPowerSystem.dayNightTick + 1) % (MOON.DAY_DURATION + MOON.NIGHT_DURATION);
       const cycleDuration = MOON.DAY_DURATION + MOON.NIGHT_DURATION;
       newMoonPowerSystem.isDay = newMoonPowerSystem.dayNightTick < MOON.DAY_DURATION;
       
       // Calculate power generation and demand
       let totalEnergyGen = 0;
       let totalEnergyDemand = 0;
        
        // Count buildings across all sectors
        let solarCount = 0, nuclearCount = 0, batteryCount = 0;
        let extractorCount = 0, refineryCount = 0, siloCount = 0, maintenanceCount = 0, massDriverCount = 0, fabricatorCount = 0;
        
        for (const sector of state.moonSectors) {
          solarCount += sector.buildings.solarArray || 0;
          nuclearCount += sector.buildings.nuclearReactor || 0;
          batteryCount += sector.buildings.battery || 0;
          extractorCount += sector.buildings.extractors || 0;
          refineryCount += sector.buildings.refineries || 0;
          siloCount += sector.buildings.silos || 0;
          maintenanceCount += sector.buildings.maintenances || 0;
          massDriverCount += sector.buildings.massDrivers || 0;
          fabricatorCount += sector.buildings.fabricators || 0;
         }
        
         // Calculate sector trait multipliers
         let extractorTraitMultiplier = 1;
         let solarTraitMultiplier = 1;
         if (state.moonSectors.length > 0) {
           const extractorSectors = state.moonSectors.filter(s => (s.buildings.extractors || 0) > 0);
           const solarSectors = state.moonSectors.filter(s => (s.buildings.solarArray || 0) > 0);
           
           if (extractorSectors.length > 0) {
             const totalExtractorMultiplier = extractorSectors.reduce((sum, sector) => {
               const trait = sector.traits.extractorMultiplier;
               return sum + (trait?.multiplier || 1);
             }, 0);
             extractorTraitMultiplier = totalExtractorMultiplier / extractorSectors.length;
           }
           
           if (solarSectors.length > 0) {
             const totalSolarMultiplier = solarSectors.reduce((sum, sector) => {
               const trait = sector.traits.solarMultiplier;
               return sum + (trait?.multiplier || 1);
             }, 0);
             solarTraitMultiplier = totalSolarMultiplier / solarSectors.length;
           }
         }
        
         // Solar only generates during day
         if (newMoonPowerSystem.isDay) {
           totalEnergyGen += solarCount * MOON.SOLAR_ARRAY_OUTPUT * solarTraitMultiplier;
         }
       
        // Nuclear generates 24/7 but consumes He-3 (from moon resources)
        if (nuclearCount > 0) {
          totalEnergyGen += nuclearCount * MOON.NUCLEAR_REACTOR_OUTPUT;
          const helium3Needed = nuclearCount * MOON.NUCLEAR_REACTOR_HELIUM3_COST;
          const helium3Available = Math.min(helium3Needed, newMoonResources.helium3);
          newMoonResources.helium3 -= helium3Available;
          // Only count energy generation for reactors that have fuel
          if (helium3Available < helium3Needed) {
            totalEnergyGen -= nuclearCount * MOON.NUCLEAR_REACTOR_OUTPUT * (helium3Needed - helium3Available) / helium3Needed;
          }
        }
       
        // Power demand
        totalEnergyDemand += extractorCount * MOON.EXTRACTOR_POWER_DEMAND;
        totalEnergyDemand += refineryCount * MOON.REFINERY_POWER_DEMAND;
        totalEnergyDemand += siloCount * MOON.SILO_POWER_DEMAND;
        totalEnergyDemand += maintenanceCount * MOON.MAINTENANCE_POWER_DEMAND;
        totalEnergyDemand += massDriverCount * MOON.MASS_DRIVER_POWER_DEMAND;
        totalEnergyDemand += fabricatorCount * MOON.FABRICATOR_POWER_DEMAND;
       
       // Battery storage (can charge or discharge)
       newMoonPowerSystem.maxEnergy = batteryCount * MOON.BATTERY_CAPACITY_PER_UNIT;
       const netEnergy = totalEnergyGen - totalEnergyDemand;
       newMoonPowerSystem.currentEnergy = Math.min(
         newMoonPowerSystem.maxEnergy,
         Math.max(0, newMoonPowerSystem.currentEnergy + netEnergy)
       );
       
       newMoonPowerSystem.energyGeneration = totalEnergyGen;
       newMoonPowerSystem.energyDemand = totalEnergyDemand;
       
       // Check if power is sufficient for production
       const hasPower = newMoonPowerSystem.currentEnergy >= totalEnergyDemand;
       
       // Calculate hazard debuff
       let hazardDebuff = 1;
      if (newActiveHazard) {
        hazardDebuff = 1 - newActiveHazard.debuff;
        
        // Reduce hazard duration (maintenance buildings speed this up)
         // Company perk also reduces duration
         const hazardDurationReduction = state.getCompanyPerkValue('hazardDurationReduction') || 0;
         const maintenanceReduction = 1 - (maintenanceCount * MOON.MAINTENANCE_DURATION_REDUCTION) - hazardDurationReduction;
         const ticksToRemove = Math.max(1, Math.ceil(1 / Math.max(0.1, maintenanceReduction)));
        newActiveHazard = {
          ...newActiveHazard,
          ticksRemaining: newActiveHazard.ticksRemaining - ticksToRemove,
        };
        
        // Clear hazard if duration is up
        if (newActiveHazard.ticksRemaining <= 0) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          newMoonLog = [`[${timestamp}] HAZARD CLEARED: ${newActiveHazard.name} has subsided`, ...newMoonLog].slice(0, MOON.LOG_MAX_ENTRIES);
          newActiveHazard = null;
        }
      }
      
      // Roll for new hazard (only if none active)
      if (!newActiveHazard && Math.random() < MOON.HAZARD_CHANCE) {
        const hazardType = Math.random() < MOON.HAZARD_DUST_CHANCE ? 'moonDust' : 'solarFlare';
        const hazardDef = MOON.HAZARDS[hazardType];
        const baseDuration = hazardDef.durationMin + Math.floor(Math.random() * (hazardDef.durationMax - hazardDef.durationMin));
        
        // Apply hazard duration multiplier from research
        const hazardDurationMultiplier = state.getEffectMultiplier('hazardDurationMultiplier') || 1;
        const duration = Math.max(1, Math.floor(baseDuration * hazardDurationMultiplier));
        
        newActiveHazard = {
          type: hazardType as MoonHazardType,
          name: hazardDef.name,
          ticksRemaining: duration,
          debuff: hazardDef.debuff,
        };
        
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        newMoonLog = [`[${timestamp}] WARNING: ${hazardDef.name} detected!`, ...newMoonLog].slice(0, MOON.LOG_MAX_ENTRIES);
        notificationsToAdd.push(`Moon Hazard: ${hazardDef.name}!`);
        hazardDebuff = 1 - hazardDef.debuff;
       }
        
          // Extractor production (Regolith) - only if powered
         const extractorMultiplier = state.getEffectMultiplier('extractorOutputMultiplier' as EffectType) || 1;
         const powerEfficiency = hasPower ? 1 : 0; // No production if no power
         const regolithProduction = extractorCount * MOON.EXTRACTOR_REGOLITH_RATE * hazardDebuff * extractorMultiplier * extractorTraitMultiplier * powerEfficiency;
       newMoonResources.regolith = Math.min(storage.regolith, newMoonResources.regolith + regolithProduction);
       
        // Refinery production (Helium-3 from Regolith) - only if powered
        const refineryMultiplier = state.getEffectMultiplier('moonRefineryOutputMultiplier' as EffectType) || 1;
        const potentialHelium3 = refineryCount * MOON.REFINERY_HELIUM3_RATE * hazardDebuff * refineryMultiplier * powerEfficiency;
      const regolithNeeded = potentialHelium3 * MOON.REFINERY_REGOLITH_COST;
      const actualRegolithUsed = Math.min(regolithNeeded, newMoonResources.regolith);
      const actualHelium3 = (actualRegolithUsed / MOON.REFINERY_REGOLITH_COST);
       newMoonResources.regolith -= actualRegolithUsed;
       newMoonResources.helium3 = Math.min(storage.helium3, newMoonResources.helium3 + actualHelium3);
       
        // Fabricator production (Alloys from Regolith) - only if powered
        const fabricatorMultiplier = state.getEffectMultiplier('fabricatorOutputMultiplier' as EffectType) || 1;
        const fabricatorCostReduction = state.getEffectMultiplier('fabricatorCostReduction' as EffectType) || 1;
        const effectiveRegolithCost = MOON.FABRICATOR_REGOLITH_COST * fabricatorCostReduction;
        const potentialAlloys = fabricatorCount * MOON.FABRICATOR_ALLOYS_RATE * hazardDebuff * fabricatorMultiplier * powerEfficiency;
         const regolithNeededForFab = potentialAlloys * effectiveRegolithCost;
         const actualRegolithUsedForFab = Math.min(regolithNeededForFab, newMoonResources.regolith);
         const actualAlloys = Math.max(0, (actualRegolithUsedForFab / effectiveRegolithCost));
        newMoonResources.regolith -= actualRegolithUsedForFab;
        newMoonResources.alloys = Math.min(storage.alloys, newMoonResources.alloys + actualAlloys);
       
       // Mass Driver auto-transport (only Helium-3, not regolith)
       if (massDriverCount > 0) {
         const transportMultiplier = massDriverCount;
         const massDriverEfficiency = state.getEffectMultiplier('massDriverEfficiency' as EffectType) || 1;
         const helium3ToTransport = Math.min(newMoonResources.helium3, MOON.MASS_DRIVER_HELIUM3_RATE * transportMultiplier * hazardDebuff * massDriverEfficiency);
         
         newMoonResources.helium3 -= helium3ToTransport;
         newEarthResources.helium3 += helium3ToTransport;
        }
     }
     
     // Process moon bounties
     let newMoonBounties = state.moonBounties.map(bounty => {
       if (bounty.status === 'active') {
         const updatedBounty = { ...bounty, elapsedTime: bounty.elapsedTime + (GAME.TICK_INTERVAL_MS / 1000) };
         
         // Active bounties expire when their timer runs out.
         if (updatedBounty.elapsedTime >= updatedBounty.timeLimit) {
           return { ...updatedBounty, status: 'failed' as const };
         }
         return updatedBounty;
       }
       return bounty;
     });

     let newMoonBountyRefreshTimer = state.moonBountyRefreshTimer;
     if (state.moonStatus === 'unlocked') {
       newMoonBountyRefreshTimer -= 1;

       if (newMoonBountyRefreshTimer <= 0) {
         const activeOrAvailableBounties = newMoonBounties.filter(
           bounty => bounty.status === 'available' || bounty.status === 'active',
         );

         if (activeOrAvailableBounties.length < 3) {
           const company = state.companies[Math.floor(Math.random() * state.companies.length)];
           const helium3Amount = MOON.BOUNTY_AMOUNTS[Math.floor(Math.random() * MOON.BOUNTY_AMOUNTS.length)];
           const timeLimit = MOON.BOUNTY_TIME_LIMITS[Math.floor(Math.random() * MOON.BOUNTY_TIME_LIMITS.length)];
           const rewardMoney = Math.round(helium3Amount * MOON.BOUNTY_REWARD_MULTIPLIER);
           const rewardScience = Math.round(helium3Amount * 0.1);

           newMoonBounties = [
             ...newMoonBounties,
             {
               id: `moon-bounty-${Date.now()}-${Math.random()}`,
               companyId: company?.id ?? 'titan',
               helium3Amount,
               timeLimit,
               elapsedTime: 0,
               rewardMoney,
               rewardScience,
               status: 'available',
             },
           ];
           notificationsToAdd.push('New lunar bounty available.');
         }

         newMoonBountyRefreshTimer = MOON.BOUNTY_GENERATION_INTERVAL;
       }
     }

     return {
      money: finalMoney,
      science: finalScience,
      fuel: fuelAvailable,
      cargo: state.cargo + cargoResourceProd,
      lunarComponents: state.lunarComponents + lunarProd,
      // Track successful launches for layer unlock
       totalSuccessfulLaunches: state.totalSuccessfulLaunches + successfulCargoLaunches,
      activeContracts: newActiveContracts,
      availableContracts: newAvailableContracts,
      contractRefreshTimer: newContractRefreshTimer,
      companies: newCompanies,
      explodedRocketIds: finalExplodedRocketIds,
      rockets: finalRockets,
      nextRocketId: finalNextId,
      previouslyAvailableResearch: currentAvailableIds,
      notifications: [...notificationsToAdd, ...updatedNotifications].slice(0, GAME.MAX_NOTIFICATIONS),
      recentlyLaunchedRocketIds: recentlyLaunchedIds,
      newlyAvailableResearchIds: newlyAvailable,
      // Orbital state updates
      transitRockets: stillInTransit,
      dockedRockets: newDockedRockets,
      spaceStations: newSpaceStations,
      spaceDebris: newDebris,
        // Moon state updates
        moonStatus: newMoonStatus,
        moonMissionTicksRemaining: newMoonMissionTicks,
        moonResources: newMoonResources,
        earthResources: newEarthResources,
        activeHazard: newActiveHazard,
        moonLog: newMoonLog,
        moonSectors: state.moonSectors, // Sectors are immutable during tick; only change via constructBuildingOnMoon
        moonPowerSystem: newMoonPowerSystem,
        moonBounties: newMoonBounties,
        moonBountyRefreshTimer: newMoonBountyRefreshTimer,
      tickCount: state.tickCount + 1,
    }
  }),
  
  buildRocket: () =>
    set(state => {
      const effectiveCapacity = state.spaceportCapacity + state.getTotalEffectValue('spaceportCapacityBonus');
      const maxRockets = state.spaceports.length * effectiveCapacity;
      const currentTotalRockets = state.rockets.filter(r => r !== null).length;

      const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier');
      const batchBonus = state.getEffectMultiplier('buildRocketBatchBonus') + state.getCompanyPerkValue('batchBuildBonus');
      const desiredCountFloat = 1 * (buildMultiplier || 1) + batchBonus;
      let desiredCount = Math.max(1, Math.floor(desiredCountFloat));
      desiredCount = Math.min(desiredCount, maxRockets - currentTotalRockets);

      if (desiredCount <= 0) return {};

      const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
      const rocketCostMultiplier = state.getCompanyPerkValue('rocketCostMultiplier') || 1;

      let affordableCount = 0;
      let totalBatchCost = 0;
      for (let i = 0; i < desiredCount; i++) {
        const idx = currentTotalRockets + i;
        const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, idx);
        const cost = Math.round(baseCost * constructionMultiplier * rocketCostMultiplier);
        if (state.money >= totalBatchCost + cost) {
          totalBatchCost += cost;
          affordableCount += 1;
        } else {
          break;
        }
      }

       if (affordableCount > 0) {
         const newRockets = [...state.rockets];
         const hasFreeLaunch = state.getEffectMultiplier('unlockFreeLaunch') > 0;
         for (let i = 0; i < affordableCount; i++) {
         const newRocket = { 
             id: state.nextRocketId + i, 
             type: 'cargo' as const,
             freeLaunches: hasFreeLaunch ? 1 : undefined,
             locationLayer: 'surface' as RocketLocationLayer,
           };
           const firstNullIndex = newRockets.findIndex(r => r === null);
           if (firstNullIndex !== -1) {
             newRockets[firstNullIndex] = newRocket;
           } else {
             newRockets.push(newRocket);
           }
         }
         return {
           money: state.money - totalBatchCost,
           rockets: newRockets,
           nextRocketId: state.nextRocketId + affordableCount,
         };
       }
        return {};
     }),
     
   buildSpaceport: () =>
     set(state => {
      if (state.getEffectMultiplier('unlockSpaceports') === 0) {
        return {};
      }
      const spaceportCostMultiplier = state.getCompanyPerkValue('spaceportCostMultiplier') || 1;
      const currentSpaceportCost = Math.round(get().getCurrentSpaceportCost() * spaceportCostMultiplier);
      if (state.money >= currentSpaceportCost) {
        const newId = state.spaceports.length > 0 ? Math.max(...state.spaceports.map(sp => sp.id)) + 1 : 1;
        return { money: state.money - currentSpaceportCost, spaceports: [...state.spaceports, { id: newId }] }
      }
      return {}
     }),
     
   buildFuelRefinery: () =>
     set(state => {
       // Check if Fuel Production research is unlocked
       if (state.getEffectMultiplier('unlockRefineries') === 0) {
         get().addNotification('Unlock Fuel Production research first');
         return {};
       }
       const currentRefineryCost = Math.round(COST_SCALING.FUEL_REFINERY_COST_BASE * Math.pow(COST_SCALING.FUEL_REFINERY_COST_EXPONENT, state.fuelRefineries));
       if (state.money >= currentRefineryCost) {
         return { 
           money: state.money - currentRefineryCost, 
           fuelRefineries: state.fuelRefineries + 1,
           notifications: [`Built fuel refinery! (+${PRODUCTION.FUEL_REFINERY_PRODUCTION_PER_TICK}/tick, +${PRODUCTION.FUEL_REFINERY_CAPACITY_BONUS} capacity)`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS)
         }
       }
       return {}
     }),
     
   buildSpaceStation: (type: SpaceStation['type']) => set(state => {
    const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
    const stationCostMultiplier = state.getCompanyPerkValue('stationCostMultiplier') || 1;
    const costCargo = Math.round(ORBITAL.STATION_COST_CARGO * constructionMultiplier * stationCostMultiplier);
    const costScience = Math.round(ORBITAL.STATION_COST_SCIENCE * constructionMultiplier * stationCostMultiplier);
    if (state.cargo >= costCargo && state.science >= costScience) {
      const baseDocks = ORBITAL.BASE_DOCKS_PER_STATION + state.getEffectMultiplier('stationDocksBonus');
      return {
        cargo: state.cargo - costCargo,
        science: state.science - costScience,
        spaceStations: [...state.spaceStations, {
          id: `station-${Date.now()}-${Math.random()}`,
          type,
          level: 1,
          maxDocks: baseDocks,
          dockedRockets: [],
        }],
        notifications: [`Deployed ${type} station`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS)
      };
    }
    return {};
  }),
   
    clearExplosion: (rocketId: number) =>
    set(state => {
      if (state.getEffectMultiplier('unlockExplosionClearing') === 0) {
        return {};
      }
      
      const clearMultiplier = state.getEffectMultiplier('clearExplosionMultiplier');
      const clearCountBonus = state.getEffectMultiplier('clearExplosionCountBonus') || 0;
      const salvageSpeedMultiplier = state.getCompanyPerkValue('salvageSpeedMultiplier') || 1;
      const desiredCountFloat = (1 * (clearMultiplier || 1) + clearCountBonus) * salvageSpeedMultiplier;
      let desiredCount = Math.max(1, Math.floor(desiredCountFloat));
      
      const explodedToProcess = [rocketId];
      for (const id of state.explodedRocketIds) {
        if (id !== rocketId && explodedToProcess.length < desiredCount) {
          explodedToProcess.push(id);
        }
      }
      
      const newRockets = [...state.rockets];
      const sciencePerSalvageBonus = state.getCompanyPerkValue('sciencePerSalvageBonus');
      let scienceGained = 0;
      const clearedIds: number[] = [];
      
      for (const id of explodedToProcess) {
        if (state.explodedRocketIds.includes(id)) {
          const rocketIndex = newRockets.findIndex(r => r !== null && r.id === id);
          if (rocketIndex !== -1) {
            newRockets[rocketIndex] = null;
            scienceGained += 1 + sciencePerSalvageBonus;
            clearedIds.push(id);
          }
        }
      }
      
      if (clearedIds.length === 0) return {};

      // Update all active contracts for explosion count
      let newActiveContracts = state.activeContracts.map(contract => {
        if (contract.status === 'active' && contract.maxExplosions !== -1) {
          const updated = { ...contract, currentExplosions: contract.currentExplosions + clearedIds.length };
          if (updated.currentExplosions > updated.maxExplosions) {
            updated.status = 'failed';
            get().addNotification(`Contract Failed: ${updated.title} (Too many explosions)`);
          }
          return updated;
        }
        return contract;
      });

      return {
        explodedRocketIds: state.explodedRocketIds.filter(id => !clearedIds.includes(id)),
        rockets: newRockets,
        science: state.science + scienceGained,
        activeContracts: newActiveContracts,
      }
    }),
    
   /**
    * Gets current spaceport cost with construction multiplier applied.
    * Cost scales exponentially with number of spaceports already owned.
    * 
    * @returns The current cost to build a new spaceport
    */
   getCurrentSpaceportCost: () => {
     const state = get();
     return Math.round(state.spaceportCost * Math.pow(COST_SCALING.SPACEPORT_COST_EXPONENT, state.spaceports.length) * state.getEffectMultiplier('constructionCostMultiplier'));
   },
   
   /**
    * Gets current rocket cost with research and company perk multipliers applied.
    * Cost scales exponentially with number of rockets already owned.
    * 
    * @returns The current cost to build a new rocket
    */
   getCurrentRocketCost: () => {
     const state = get();
     const currentRocketCount = state.rockets.filter(r => r !== null).length;
     const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
     const rocketCostMultiplier = state.getCompanyPerkValue('rocketCostMultiplier') || 1;
     const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, currentRocketCount);
     return Math.round(baseCost * constructionMultiplier * rocketCostMultiplier);
   },
  
   /**
    * Gets research effect value (from researched nodes only).
    * 
    * Effect value semantics:
    * - For '*Multiplier' types: returns multiplicative product (base 1)
    *   E.g., if you have multipliers 1.2 and 1.5, result is 1.8 (80% total increase)
    * - For other types (e.g., bonuses, unlocks): returns additive sum (base 0)
    *   E.g., if you have bonuses +50 and +30, result is +80
    * 
    * @param type The effect type to retrieve (e.g., 'rocketCostMultiplier', 'maxSatellitesBonus')
    * @returns The calculated effect value. Returns 1 for multipliers (no effect), 0 for bonuses (no effect)
    */
   getEffectMultiplier: (type: EffectType) => {
     const state = get();
     
     if (!researchTree || !Array.isArray(researchTree)) {
       return 1;
     }
     if (!state.researchedNodes || !Array.isArray(state.researchedNodes)) {
       return 1;
     }
     
     const multipliers = researchTree
       .filter((node: ResearchNode) => state.researchedNodes.includes(node.id) && node.effect.type === type)
       .map((node: ResearchNode) => node.effect.value);
     
     if (type.endsWith('Multiplier')) {
       return multipliers.length === 0 ? 1 : multipliers.reduce((acc, val) => acc * val, 1);
     } else {
       return multipliers.length === 0 ? 0 : multipliers.reduce((acc, val) => acc + val, 0);
     }
   },
  
   /**
    * Gets company perk effect value (from all companies and their unlocked perks).
    * 
    * Effect value semantics:
    * - For '*Multiplier' types: returns multiplicative product (base 1)
    *   E.g., if Titan has multiplier 1.3 and Nova has 1.2, result is 1.56 (56% total increase)
    * - For other types: returns additive sum (base 0)
    *   E.g., if Zenith has +10 and Atlas has +5, result is +15
    * 
    * @param perkEffect The company perk effect type to retrieve (e.g., 'rocketCostMultiplier', 'passiveMoneyBonus')
    * @returns The calculated perk value. Returns 1 for multipliers (no effect), 0 for bonuses (no effect)
    */
   getCompanyPerkValue: (perkEffect: CompanyPerkEffect) => {
     const state = get();
     
     if (!state.companies || !Array.isArray(state.companies)) {
       return 0;
     }
     
     let totalValue = 0;
     let isMultiplier = perkEffect.endsWith('Multiplier');
     if (isMultiplier) totalValue = 1;
     
     for (const company of state.companies) {
       const definition = COMPANY_DEFINITIONS.find(d => d.id === company.id);
       if (!definition) continue;
       
       for (const perk of definition.perks) {
         if (perk.effect === perkEffect && company.level >= perk.level) {
           if (isMultiplier) {
             totalValue *= perk.value;
           } else {
             totalValue += perk.value;
           }
         }
       }
     }
     
     return totalValue;
   },
  
   /**
    * Gets combined effect value from both research and company perks.
    * 
    * Effect value semantics:
    * - For '*Multiplier' types: combines multiplicatively
    *   E.g., research 1.2 × company 1.5 = 1.8 total (80% increase)
    * - For other types: combines additively
    *   E.g., research +30 + company +20 = +50 total
    * 
    * @param type The effect type to retrieve (can be EffectType or CompanyPerkEffect)
    * @returns The calculated total effect value combining research and perks
    */
   getTotalEffectValue: (type: EffectType | CompanyPerkEffect) => {
     const state = get();
     const researchValue = state.getEffectMultiplier(type as EffectType);
     const perkValue = state.getCompanyPerkValue(type as CompanyPerkEffect);
     
     if (type.endsWith('Multiplier')) {
       return researchValue * perkValue;
     } else {
       return researchValue + perkValue;
     }
   },
  
   /**
    * Gets maximum number of contracts that can be active simultaneously.
    * Combines research bonuses and company perk bonuses.
    * 
    * @returns Maximum active contracts allowed
    */
   getMaxActiveContracts: () => {
     const state = get();
     const researchBonus = state.getEffectMultiplier('maxActiveContractsBonus');
     const companyBonus = state.getCompanyPerkValue('maxActiveContractsBonus');
     return INITIAL_STATE.MAX_ACTIVE_CONTRACTS + researchBonus + companyBonus;
   },
   
   /**
    * Gets maximum number of contracts available to accept.
    * Multiplier research effects can increase this pool.
    * 
    * @returns Maximum available contracts to show
    */
   getMaxAvailableContracts: () => {
     const state = get();
     return INITIAL_STATE.MAX_AVAILABLE_CONTRACTS + state.getEffectMultiplier('maxAvailableContractsBonus');
   },
  
   /**
    * Gets maximum fuel capacity with all multipliers applied.
    * Combines research bonuses, company perk bonuses, and developer bonuses.
    * 
    * @returns Maximum fuel tank capacity
     */
      getMaxFuel: () => {
        const state = get();
        const totalFuelCapacityBonus = state.getTotalEffectValue('fuelCapacityBonus');
        const refineryCapacityBonus = state.fuelRefineries * (
          PRODUCTION.FUEL_REFINERY_CAPACITY_BONUS + state.getEffectMultiplier('refineryCapacityBonus')
        );
        return INITIAL_STATE.FUEL + totalFuelCapacityBonus + state.bonusFuelCapacity + refineryCapacityBonus;
      },
  
  getAvailableNodes: () => {
    const state = get();
    return researchTree.filter((node: ResearchNode) => {
      if (state.researchedNodes.includes(node.id)) return false;
      if (state.science < node.scienceCost) return false;
      if (node.cargoCost && state.cargo < node.cargoCost) return false;
      if (node.lunarComponentCost && state.lunarComponents < node.lunarComponentCost) return false;
      if (node.helium3Cost && state.earthResources.helium3 < node.helium3Cost) return false;
      if (!node.prerequisites.every(p => state.researchedNodes.includes(p))) return false;
      return true;
    });
  },
  
  setView: (view: "surface" | "orbit" | "contracts" | "research") => set({ currentView: view }),
  
  addNotification: (message: string) => set(state => ({ notifications: [message, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS) })),
  
  generateContracts: () => set(state => {
    const maxAvailable = get().getMaxAvailableContracts();
    if (state.availableContracts.length >= maxAvailable) return {};
    
    const newContracts: Contract[] = [...state.availableContracts];
    // Filter out companies that have reached max level (all perks unlocked)
    const companiesToPick = state.companies.filter(c => {
      const definition = COMPANY_DEFINITIONS.find(d => d.id === c.id);
      const maxLevel = definition?.perks.length || 10;
      return c.level < maxLevel;
    });
    
    const contractTypes = [
      { 
        type: 'logistics', 
        titles: ['Orbital Resupply', 'Deep Space Freight', 'Emergency Provisions', 'Colony Supplies', 'Station Restock'],
        descriptions: [
          'Critical cargo needed to sustain orbital operations. Time-sensitive delivery required.',
          'Remote outpost awaiting essential supplies. Your fleet is their lifeline.',
          'High-priority logistics run to support expanding frontier operations.',
        ],
        cargoMultiplier: 2.0, scienceMultiplier: 0.2, moneyMultiplier: 0.5, rewardMoneyBonus: 1.3 
      },
      { 
        type: 'research', 
        titles: ['Quantum Breakthrough', 'Stellar Phenomena Study', 'Prototype Trials', 'Zero-G Experiments', 'Deep Space Survey'],
        descriptions: [
          'Pioneering research that could revolutionize space travel. Data collection is paramount.',
          'Rare celestial event detected. Gather scientific data before the window closes.',
          'Experimental technology requires extensive testing under real mission conditions.',
        ],
        cargoMultiplier: 0.2, scienceMultiplier: 3.0, moneyMultiplier: 0.3, rewardScienceBonus: 2.0 
      },
      { 
        type: 'commercial', 
        titles: ['Lucrative Venture', 'Premium Charter', 'VIP Transport', 'Corporate Expedition', 'Executive Mission'],
        descriptions: [
          'High-value opportunity with substantial returns. Discretion and reliability expected.',
          'Prestigious clients demand excellence. Success means long-term partnership potential.',
          'A chance to prove your fleet capabilities to influential industry leaders.',
        ],
        cargoMultiplier: 0.3, scienceMultiplier: 0.2, moneyMultiplier: 2.0, rewardMoneyBonus: 1.5 
      },
      { 
        type: 'balanced', 
        titles: ['Strategic Alliance', 'Joint Operations', 'Full Spectrum Support', 'Comprehensive Mission', 'Multi-Phase Campaign'],
        descriptions: [
          'A complex operation requiring coordination across all resource types.',
          'Prove your versatility with this demanding multi-objective mission.',
          'Only the most capable operators can handle this balanced challenge.',
        ],
        cargoMultiplier: 1.0, scienceMultiplier: 1.0, moneyMultiplier: 1.0, rewardMoneyBonus: 1.0 
      },
    ];
    
    while (newContracts.length < maxAvailable && companiesToPick.length > 0) {
      const companyIndex = Math.floor(Math.random() * companiesToPick.length);
      const company = companiesToPick.splice(companyIndex, 1)[0];
      
      const levelScale = Math.pow(company.level, 1.5);
       const isFragile = Math.random() > CONTRACT.FRAGILE_CHANCE;
       const isTimed = Math.random() > CONTRACT.TIMED_CHANCE;
      
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      const title = contractType.titles[Math.floor(Math.random() * contractType.titles.length)];
      const description = contractType.descriptions[Math.floor(Math.random() * contractType.descriptions.length)];

      // Apply contract requirement multiplier (c2 Lean Logistics research)
       const contractRequirementMult = get().getEffectMultiplier('contractRequirementMultiplier') || 1;
       const baseCargoReq = CONTRACT.BASE_CARGO_REQ * levelScale * (1 + Math.random()) * contractRequirementMult;
       const baseScienceReq = CONTRACT.BASE_SCIENCE_REQ * levelScale * (1 + Math.random()) * contractRequirementMult;
       const baseMoneyReq = CONTRACT.BASE_MONEY_REQ * levelScale * (1 + Math.random()) * contractRequirementMult;
       const baseMoneyReward = CONTRACT.BASE_MONEY_REWARD * levelScale * (1 + Math.random());
       const baseScienceReward = CONTRACT.BASE_SCIENCE_REWARD * levelScale * (1 + Math.random());

      newContracts.push({
        id: `contract-${Date.now()}-${Math.random()}`,
        companyId: company.id,
        title: title,
        description: description,
        requiredCargo: Math.round(baseCargoReq * contractType.cargoMultiplier),
        requiredScience: Math.round(baseScienceReq * contractType.scienceMultiplier),
        requiredMoney: Math.round(baseMoneyReq * contractType.moneyMultiplier),
        deliveredCargo: 0, deliveredScience: 0, deliveredMoney: 0,
        rewardMoney: Math.round(baseMoneyReward * (contractType.rewardMoneyBonus || 1)),
        rewardScience: Math.round(baseScienceReward * (contractType.rewardScienceBonus || 1)),
         rewardExperience: CONTRACT.EXPERIENCE_PER_LEVEL * company.level,
         timeLimitSeconds: isTimed ? CONTRACT.TIME_LIMIT_BASE + Math.floor(Math.random() * CONTRACT.TIME_LIMIT_VARIANCE_MAX) * company.level : 0,
         elapsedSeconds: 0,
         maxExplosions: isFragile ? 1 + Math.floor(Math.random() * CONTRACT.FRAGILE_EXPLOSION_LIMIT_MAX) : -1,
        currentExplosions: 0,
        status: 'available'
      });
    }
    
    return { availableContracts: newContracts };
  }),
  
  acceptContract: (contractId: string) => set(state => {
    const maxActive = get().getMaxActiveContracts();
    if (state.activeContracts.length >= maxActive) return {};
    
    const contract = state.availableContracts.find(c => c.id === contractId);
    if (!contract) return {};
    
    return {
      activeContracts: [...state.activeContracts, { ...contract, status: 'active' }],
      availableContracts: state.availableContracts.filter(c => c.id !== contractId), // Only remove the accepted contract
      notifications: [`Contract Accepted: ${contract.title}`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS)
    };
  }),
  
  forfeitContract: (contractId: string) => set(state => {
    const contract = state.activeContracts.find(c => c.id === contractId);
    if (!contract || contract.status !== 'active') return {};

    const company = state.companies.find(c => c.id === contract.companyId);
    if (!company) return { activeContracts: state.activeContracts.filter(c => c.id !== contractId) };

    // Forfeit penalty: lose 1 contract progress
    const newContractsCompleted = Math.max(0, company.contractsCompleted - 1);
    
    const newCompanies = state.companies.map(c => 
      c.id === company.id ? { ...c, contractsCompleted: newContractsCompleted } : c
    );

    get().addNotification(`Contract Forfeited: ${contract.title} (-1 progress for ${company.name})`);

    return {
      companies: newCompanies,
      activeContracts: state.activeContracts.filter(c => c.id !== contractId),
    };
  }),
   
   toggleAutoBuild: () => set(state => ({ autoBuildActive: !state.autoBuildActive })),
   toggleAutoSalvage: () => set(state => ({ autoSalvageActive: !state.autoSalvageActive })),
   
   updateSettings: (partial: Partial<GameSettings>) => set(state => ({
    settings: { ...state.settings, ...partial },
  })),
  
  resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
  
   // Layer unlock action
   unlockLayer: (layer: 'orbit' | 'contracts') => set(state => {
    if (layer === 'orbit') {
      // Orbit requires 500 cargo
      if (state.orbitLayerUnlocked) return {};
      if (state.cargo < LAYER_UNLOCK.ORBIT_CARGO_REQUIRED) return {};
      get().addNotification('Orbital Operations Unlocked!');
      return {
        cargo: state.cargo - LAYER_UNLOCK.ORBIT_CARGO_REQUIRED,
        orbitLayerUnlocked: true,
      };
    } else if (layer === 'contracts') {
      // Contracts requires 1000 successful launches
      if (state.contractsLayerUnlocked) return {};
      if (state.totalSuccessfulLaunches < LAYER_UNLOCK.CONTRACTS_LAUNCHES_REQUIRED) return {};
      get().addNotification('Contract Operations Unlocked!');
      return {
        contractsLayerUnlocked: true,
      };
    }
    return {};
  }),
  
  // Orbital layer actions
  launchSatellite: () => set(state => {
    // Check if satellites are unlocked
    if (state.getEffectMultiplier('unlockSatellites') === 0) return {};
    
    const maxSatellites = ORBITAL.MAX_SATELLITES_BASE + state.getEffectMultiplier('maxSatellitesBonus');
    if (state.satellites >= maxSatellites) return {};
    
    const costCargo = ORBITAL.SATELLITE_COST_CARGO;
    const costScience = ORBITAL.SATELLITE_COST_SCIENCE;
    
    if (state.cargo >= costCargo && state.science >= costScience) {
      return {
        cargo: state.cargo - costCargo,
        science: state.science - costScience,
        satellites: state.satellites + 1,
        notifications: [`Satellite launched! (${state.satellites + 1}/${maxSatellites})`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }
    return {};
  }),
  
  clearDebris: (debrisId: string) => set(state => {
    const debris = state.spaceDebris.find(d => d.id === debrisId);
    if (!debris) return {};
    
    return {
      spaceDebris: state.spaceDebris.filter(d => d.id !== debrisId),
      science: state.science + ORBITAL.DEBRIS_CLEAR_SCIENCE_REWARD,
      notifications: [`Debris cleared! +${ORBITAL.DEBRIS_CLEAR_SCIENCE_REWARD} Science`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
    };
  }),
  
  upgradeStation: (stationId: string) => set(state => {
    const station = state.spaceStations.find(s => s.id === stationId);
    if (!station) return {};
    
    const costCargo = ORBITAL.STATION_UPGRADE_CARGO_BASE * station.level;
    const costScience = ORBITAL.STATION_UPGRADE_SCIENCE_BASE * station.level;
    
    if (state.cargo >= costCargo && state.science >= costScience) {
      const newStations = state.spaceStations.map(s => {
        if (s.id === stationId) {
          return {
            ...s,
            level: s.level + 1,
            maxDocks: s.maxDocks + 1, // Each level adds a dock
          };
        }
        return s;
      });
      
      return {
        cargo: state.cargo - costCargo,
        science: state.science - costScience,
        spaceStations: newStations,
        notifications: [`Station upgraded to Level ${station.level + 1}!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }
    return {};
  }),
   
   // Moon layer helper methods
    /**
     * Gets current moon storage capacity for all lunar resource types.
     * Storage increases with silo/cargoStorage buildings and research effects.
     * 
     * @returns Object with regolith, helium3, alloys, and cargo capacity
     */
    getMoonStorageCapacity: () => {
       const state = get();
       const siloBonus = state.moonSectors.reduce((total, sector) => total + (sector.buildings.silos || 0), 0);
       const cargoStorageBonus = state.moonSectors.reduce((total, sector) => total + (sector.buildings.cargoStorage || 0), 0);
       const alloysStorageBonus = state.getEffectMultiplier('alloysStorageBonus' as EffectType) || 0;
       const moonStorageMultiplier = state.getEffectMultiplier('moonStorageMultiplier' as EffectType) || 1;
       return {
         regolith: (MOON.STORAGE_BASE.regolith + siloBonus * MOON.STORAGE_PER_SILO.regolith) * moonStorageMultiplier,
         helium3: (MOON.STORAGE_BASE.helium3 + siloBonus * MOON.STORAGE_PER_SILO.helium3) * moonStorageMultiplier,
         alloys: (MOON.STORAGE_BASE.alloys + siloBonus * MOON.STORAGE_PER_SILO.alloys + alloysStorageBonus) * moonStorageMultiplier,
         cargo: MOON.MOON_CARGO_BASE_STORAGE + cargoStorageBonus * MOON.TIER1_CARGO_STORAGE_CAPACITY,
        };
      },
     
     getMoonBuildingDescription: (buildingType: string) => {
       const descriptions: Record<string, string> = {
         extractor: 'Extracts Regolith from moon surface. Produces 5 Regolith/tick. Affected by Regolith Rich sector trait (×1.5 bonus).',
         refinery: 'Converts Regolith into Helium-3. Produces 0.1 He-3/tick, consumes 10 Regolith per He-3. Critical for power generation.',
         silo: 'Expands storage capacity. Each silo adds +500 Regolith, +50 He-3, +250 Alloys storage.',
         maintenance: 'Reduces hazard duration by 15% per building. Essential when Moon Dust or Solar Flares occur.',
         massDriver: 'Auto-transports 5 He-3/tick to Earth each tick power is available. Allows moon resources to reach Earth.',
         solarArray: 'Generates 50 Power during day cycle only. Affected by Solar Rich trait (×1.6 bonus). Day/night cycles: 60 ticks each.',
         nuclearReactor: 'Generates 40 Power 24/7 but consumes 1 He-3/tick fuel. Provides consistent power independent of sun.',
         battery: 'Stores up to 100 Power per unit. Charges when generation > demand, discharges during night or peak demand.',
         fabricator: 'Converts Regolith into Alloys. Produces 0.05 Alloys/tick, consumes 20 Regolith per Alloy. Requires power to operate.',
       };
       return descriptions[buildingType] || 'Unknown building type';
     },
    
   /**
    * Gets cost to build a specific moon building type.
    * Cost scales exponentially with the number of buildings of that type already built.
    * 
    * @param type The moon building type (e.g., 'extractor', 'refinery', 'silo')
    * @returns Cost object with cargo, science, regolith, and alloys costs
    */
    getMoonBuildingCost: (type: MoonBuildingType | 'solarArray' | 'nuclearReactor' | 'battery' | 'fabricator' | 'cargoStorage' | 'starport') => {
      const state = get();
      const buildingKeyMap: Record<string, keyof MoonBuildings | string> = {
        extractor: 'extractors',
        refinery: 'refineries',
        silo: 'silos',
        maintenance: 'maintenances',
        massDriver: 'massDrivers',
        solarArray: 'solarArray',
        nuclearReactor: 'nuclearReactor',
        battery: 'battery',
        fabricator: 'fabricators',
        cargoStorage: 'cargoStorage',
        starport: 'starport',
      };
     
      // Count total buildings of this type across all sectors
      let count = 0;
      for (const sector of state.moonSectors) {
        count += sector.buildings[buildingKeyMap[type] as keyof typeof sector.buildings] || 0;
      }
      
      // Check if Tier 2 is available for this building type
      const tier2ResearchMap: Record<string, string> = {
        extractor: 'm13', // Tier 2 Extraction (placeholder, needs research node)
        refinery: 'm13',  // Tier 2 Extraction
        fabricator: 'm16', // Alloy Furnaces (existing research)
        silo: 'm15', // Tier 2 Storage (placeholder)
      };
      
      const tier2ResearchId = tier2ResearchMap[type];
      const hasTier2 = tier2ResearchId && state.researchedNodes.includes(tier2ResearchId);
      
      // Use appropriate cost tier
      let cargoBaseCost = 0;
      let scienceBaseCost = 0;
      let regolithBaseCost = 0;
      let alloysBaseCost = 0;
      
       if (hasTier2) {
        // Tier 2 costs (moon resources)
        switch (type) {
          case 'extractor':
            regolithBaseCost = MOON.TIER2_EXTRACTOR_COST.regolith;
            alloysBaseCost = MOON.TIER2_EXTRACTOR_COST.alloys;
            break;
          case 'refinery':
            regolithBaseCost = MOON.TIER2_REFINERY_COST.regolith;
            alloysBaseCost = MOON.TIER2_REFINERY_COST.alloys;
            break;
          case 'fabricator':
            regolithBaseCost = MOON.TIER2_FABRICATOR_COST.regolith;
            alloysBaseCost = MOON.TIER2_FABRICATOR_COST.alloys;
            break;
          case 'silo':
          case 'cargoStorage':
            regolithBaseCost = MOON.TIER2_CARGO_STORAGE_COST.regolith;
            alloysBaseCost = MOON.TIER2_CARGO_STORAGE_COST.alloys;
            break;
          default:
            // Non-tier-2 buildings fall back to old costs
            const baseCost = MOON.BUILDING_COSTS[type as keyof typeof MOON.BUILDING_COSTS];
            cargoBaseCost = baseCost.cargo;
            scienceBaseCost = baseCost.science;
            regolithBaseCost = 'regolith' in baseCost ? (baseCost.regolith as number) : 0;
            alloysBaseCost = 'alloys' in baseCost ? (baseCost.alloys as number) : 0;
        }
      } else {
        // Tier 1 costs (cargo from Earth)
        switch (type) {
          case 'extractor':
            cargoBaseCost = MOON.TIER1_EXTRACTOR_COST;
            break;
          case 'refinery':
            cargoBaseCost = MOON.TIER1_REFINERY_COST;
            break;
          case 'fabricator':
            cargoBaseCost = MOON.TIER1_FABRICATOR_COST;
            break;
          case 'silo':
          case 'cargoStorage':
            cargoBaseCost = MOON.TIER1_CARGO_STORAGE_COST;
            break;
          case 'maintenance':
            cargoBaseCost = MOON.TIER1_MAINTENANCE_COST;
            break;
          case 'massDriver':
            cargoBaseCost = MOON.TIER1_MASS_DRIVER_COST;
            break;
          case 'solarArray':
            cargoBaseCost = MOON.TIER1_SOLAR_COST;
            break;
          case 'nuclearReactor':
            cargoBaseCost = MOON.TIER1_NUCLEAR_COST;
            break;
          case 'battery':
            cargoBaseCost = MOON.TIER1_BATTERY_COST;
            break;
          case 'starport':
            cargoBaseCost = MOON.TIER1_STARPORT_COST;
            break;
          default:
            // Fallback to old system
            const baseCost = MOON.BUILDING_COSTS[type as keyof typeof MOON.BUILDING_COSTS];
            cargoBaseCost = baseCost.cargo;
            scienceBaseCost = baseCost.science;
            regolithBaseCost = 'regolith' in baseCost ? (baseCost.regolith as number) : 0;
            alloysBaseCost = 'alloys' in baseCost ? (baseCost.alloys as number) : 0;
        }
      }
      
      // Apply scaling multiplier based on building count
      const multiplier = Math.pow(MOON.TIER1_COST_SCALING, count);
      
      return {
        cargo: Math.round(cargoBaseCost * multiplier),
        science: Math.round(scienceBaseCost * multiplier),
        regolith: Math.round(regolithBaseCost * multiplier),
        alloys: Math.round(alloysBaseCost * multiplier),
      };
    },
  
  addMoonLog: (message: string) => set(state => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    return { moonLog: [`[${timestamp}] ${message}`, ...state.moonLog].slice(0, MOON.LOG_MAX_ENTRIES) };
  }),
  
  // Moon layer actions
  startMoonMission: () => set(state => {
    // Check if lunar manufacturing is unlocked
    if (state.getEffectMultiplier('unlockLunarManufacturing') === 0) {
      return {};
    }
    
    // Check if mission already started or completed (allow 'locked' or 'ready' states)
    if (state.moonStatus === 'transit' || state.moonStatus === 'unlocked') {
      return {};
    }
    
    // Check resources
    const cost = MOON.MISSION_COST;
    if (state.fuel < cost.fuel || state.cargo < cost.cargo || 
        state.science < cost.science || state.lunarComponents < cost.lunarComponents) {
      return {};
    }
    
    // Calculate mission duration (can be reduced by research)
    const durationMultiplier = state.getEffectMultiplier('missionDurationMultiplier' as EffectType) || 1;
    const duration = Math.round(MOON.MISSION_DURATION_BASE * durationMultiplier);

    const availableRocketIndex = state.rockets.findIndex((rocket) =>
      rocket !== null &&
      !state.explodedRocketIds.includes(rocket.id) &&
      getRocketLocationLayer(rocket) === 'surface',
    );
    if (availableRocketIndex === -1) {
      get().addNotification('No surface rocket available for the lunar landing mission.');
      return {};
    }

    const missionRocket = state.rockets[availableRocketIndex];
    if (!missionRocket) {
      return {};
    }
    const updatedRockets = [...state.rockets];
    updatedRockets[availableRocketIndex] = {
      ...missionRocket,
      locationLayer: 'transit',
      transitRoute: 'surface_to_moon',
      ticksRemaining: duration,
      totalTicks: duration,
      moonRole: 'colony',
      cargoAmount: MOON.INITIAL_MOON_CARGO,
    };
    
    get().addMoonLog(`MISSION INITIATED - Rocket #${missionRocket.id} en route to the Moon`);
    get().addNotification(`Lunar Landing Mission launched with Rocket #${missionRocket.id}!`);
    
    return {
      fuel: state.fuel - cost.fuel,
      cargo: state.cargo - cost.cargo,
      science: state.science - cost.science,
      lunarComponents: state.lunarComponents - cost.lunarComponents,
      rockets: updatedRockets,
      moonStatus: 'transit' as MoonStatus,
      moonMissionTicksRemaining: duration,
    };
  }),
  
  buildMoonStructure: (type: MoonBuildingType) => set(state => {
    if (state.moonStatus !== 'unlocked') return {};
    
    const cost = state.getMoonBuildingCost(type);
    
    // Check resources (cargo and science from Earth, regolith from Moon)
    if (state.cargo < cost.cargo || state.science < cost.science) return {};
    if (cost.regolith && state.moonResources.regolith < cost.regolith) return {};
    
    const buildingKeyMap: Record<MoonBuildingType, keyof MoonBuildings> = {
      extractor: 'extractors',
      refinery: 'refineries',
      silo: 'silos',
      maintenance: 'maintenance',
      massDriver: 'massDrivers',
      solarArray: 'solarArray',
      nuclearReactor: 'nuclearReactor',
      battery: 'battery',
      fabricator: 'fabricator',
    };
    const buildingKey = buildingKeyMap[type];
    const newBuildings = { ...state.moonBuildings };
    newBuildings[buildingKey] = (newBuildings[buildingKey] || 0) + 1;
    
    const buildingNames: Record<MoonBuildingType, string> = {
      extractor: 'Regolith Extractor',
      refinery: 'Helium-3 Refinery',
      silo: 'Storage Silo',
      maintenance: 'Maintenance Bay',
      massDriver: 'Mass Driver',
      solarArray: 'Solar Array',
      nuclearReactor: 'Nuclear Reactor',
      battery: 'Battery',
      fabricator: 'Fabricator',
    };
    
    get().addMoonLog(`CONSTRUCTION COMPLETE: ${buildingNames[type]} online`);
    
    return {
      cargo: state.cargo - cost.cargo,
      science: state.science - cost.science,
      moonResources: cost.regolith 
        ? { ...state.moonResources, regolith: state.moonResources.regolith - cost.regolith }
        : state.moonResources,
      moonBuildings: newBuildings,
      notifications: [`Built ${buildingNames[type]} on the Moon!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
    };
  }),
  
  transportResources: () => set(state => {
    if (state.moonStatus !== 'unlocked') return {};
    
    // Manual transport - only Helium-3 (not regolith)
    const helium3ToTransport = Math.min(state.moonResources.helium3, MOON.MANUAL_TRANSPORT_HELIUM3);
    
    if (helium3ToTransport === 0) return {};
    
    get().addMoonLog(`TRANSPORT: ${helium3ToTransport.toFixed(1)} He-3 sent to Earth`);
    
    return {
      moonResources: {
        ...state.moonResources,
        helium3: state.moonResources.helium3 - helium3ToTransport,
      },
      earthResources: {
        ...state.earthResources,
        helium3: state.earthResources.helium3 + helium3ToTransport,
      },
    };
  }),
  
  clearHazard: () => set(state => {
    if (!state.activeHazard || state.moonStatus !== 'unlocked') return {};
    
    // Cost to clear hazard manually
    const scienceCost = 100;
    if (state.science < scienceCost) return {};
    
    get().addMoonLog(`HAZARD CLEARED: ${state.activeHazard.name} neutralized by maintenance team`);
    get().addNotification(`Moon hazard cleared!`);
    
    return {
      science: state.science - scienceCost,
      activeHazard: null,
    };
  }),
  
   unlockNode: (nodeId: string) => set(state => {
     const node = researchTree.find(n => n.id === nodeId);
     if (!node) return {};
     
     if (state.researchedNodes.includes(nodeId)) return {};
     
     const metPrereqs = node.prerequisites.every(p => state.researchedNodes.includes(p));
     if (!metPrereqs) return {};
     
      // Apply research cost multiplier from company perks and research effects
      const researchCostMultiplier = state.getTotalEffectValue('researchCostMultiplier');
      const effectiveScienceCost = Math.round(node.scienceCost * researchCostMultiplier);
      const effectiveCargoCost = node.cargoCost ? Math.round(node.cargoCost * researchCostMultiplier) : 0;
     const lunarCost = node.lunarComponentCost || 0;
     const helium3Cost = node.helium3Cost || 0;
     
     // Check all resource requirements
     if (state.science < effectiveScienceCost) return {};
     if (effectiveCargoCost > 0 && state.cargo < effectiveCargoCost) return {};
     if (lunarCost > 0 && state.lunarComponents < lunarCost) return {};
     if (helium3Cost > 0 && state.earthResources.helium3 < helium3Cost) return {};
     
     get().addNotification(`Technology Unlocked: ${node.name}`);
     
     return {
       science: state.science - effectiveScienceCost,
       cargo: state.cargo - effectiveCargoCost,
       lunarComponents: state.lunarComponents - lunarCost,
       earthResources: helium3Cost > 0 
         ? { ...state.earthResources, helium3: state.earthResources.helium3 - helium3Cost }
         : state.earthResources,
       researchedNodes: [...state.researchedNodes, nodeId]
     };
   }),

    scanSector: () => set(state => {
      if (state.moonStatus !== 'unlocked') return {};
      const maxSectors = MOON.MAX_SECTORS + (state.getEffectMultiplier('unlockPlanetaryExpansion') > 0 ? MOON.PLANETARY_EXPANSION_SECTOR_BONUS : 0);
      
      // Calculate scan cost with research reduction
      const costReduction = state.getEffectMultiplier('sectorScanCostReduction') || 1;
      const costScience = Math.round(MOON.SECTOR_SCAN_COST.science * costReduction);
      const costCargo = Math.round(MOON.SECTOR_SCAN_COST.cargo * costReduction);
      
      if (state.science < costScience || state.cargo < costCargo) return {};
      if (state.moonSectors.length >= maxSectors) return {};
      
      // Generate random sector with traits
      const traitTypes = ['regolithRich', 'regolithPoor', 'solarRich', 'solarPoor', 'stable', 'unstable'];
      const randomTrait = traitTypes[Math.floor(Math.random() * traitTypes.length)];
      const traitDef = MOON.SECTOR_TRAITS[randomTrait as keyof typeof MOON.SECTOR_TRAITS];
      
      const newSector: MoonSector = {
        id: `sector-${Date.now()}-${Math.random()}`,
        name: `Sector ${state.moonSectors.length}`,
        traits: { [randomTrait]: traitDef },
        buildings: {},
        slots: MOON.BUILDING_SLOTS_PER_SECTOR + state.getEffectMultiplier('buildingSlotsPerSectorBonus'),
        slotsUsed: 0,
      };
      
      get().addMoonLog(`SECTOR SCANNED: ${newSector.name} discovered - ${randomTrait}`);
      
      return {
        science: state.science - costScience,
        cargo: state.cargo - costCargo,
        moonSectors: [...state.moonSectors, newSector],
        notifications: [`New sector discovered: ${newSector.name}!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }),
    
    unlockMoonSector: (sectorId: string) => set(state => {
      if (state.moonStatus !== 'unlocked') return {};
      
      const sector = state.moonSectors.find(s => s.id === sectorId);
      if (!sector) return {};
      
      // Already unlocked
      if (sector.unlocked) {
        get().addNotification('Sector already unlocked!');
        return {};
      }
      
      // Check if has required research
      if (sector.researchRequirement && !state.researchedNodes.includes(sector.researchRequirement)) {
        get().addNotification(`Research required to unlock this sector`);
        return {};
      }
      
      // Mark sector as unlocked
      const newSectors = state.moonSectors.map(s => 
        s.id === sectorId ? { ...s, unlocked: true } : s
      );
      
      get().addMoonLog(`SECTOR UNLOCKED: ${sector.name} is now available`);
      
      return {
        moonSectors: newSectors,
        notifications: [`Sector unlocked: ${sector.name}!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }),
    
    scanMoonSector: (sectorId: string) => set(state => {
      if (state.moonStatus !== 'unlocked') return {};
      
      const sector = state.moonSectors.find(s => s.id === sectorId);
      if (!sector) return {};
      
      // Already scanned
      if (sector.scanned) {
        get().addNotification('Sector already scanned!');
        return {};
      }
      
      // Calculate scan cost with research reduction
      const costReduction = state.getEffectMultiplier('sectorScanCostReduction') || 1;
      const scanCostScience = Math.round(MOON.SECTOR_SCAN_COST_BASE * costReduction);
      
      if (state.science < scanCostScience) {
        get().addNotification('Insufficient science for scan!');
        return {};
      }
      
      // Mark sector as scanned
      const newSectors = state.moonSectors.map(s => 
        s.id === sectorId ? { ...s, scanned: true } : s
      );
      
      get().addMoonLog(`SECTOR SCANNED: ${sector.name} is now available for building`);
      
      return {
        science: state.science - scanCostScience,
        moonSectors: newSectors,
        notifications: [`Sector scanned: ${sector.name}!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }),
    
    sendSupplyMission: (cargoAmount: number) => set(state => {
      if (state.moonStatus !== 'unlocked') {
        get().addNotification('Moon not established yet!');
        return {};
      }
      
      // Validate cargo amount
      const requestedCargo = Math.min(cargoAmount, MOON.CARGO_ROCKET_CAPACITY);
      if (requestedCargo <= 0) {
        get().addNotification('Cargo amount must be greater than 0!');
        return {};
      }
      
      // Check if enough cargo available on Earth
      if (state.cargo < requestedCargo) {
        get().addNotification(`Insufficient cargo! Need ${requestedCargo}, have ${Math.floor(state.cargo)}`);
        return {};
      }
      
      // Check if enough fuel for trip (Earth -> Moon)
      const fuelCost = MOON.FUEL_CONSUMPTION_PER_MOON_TRIP;
      if (state.fuel < fuelCost) {
        get().addNotification(`Insufficient fuel! Need ${fuelCost}, have ${Math.floor(state.fuel)}`);
        return {};
      }

      const availableRocketIndex = state.rockets.findIndex((rocket) =>
        rocket !== null &&
        !state.explodedRocketIds.includes(rocket.id) &&
        getRocketLocationLayer(rocket) === 'surface',
      );
      if (availableRocketIndex === -1) {
        get().addNotification('No surface rocket available for a supply mission.');
        return {};
      }

      const missionRocket = state.rockets[availableRocketIndex];
      if (!missionRocket) {
        return {};
      }

      const duration = MOON.SUPPLY_MISSION_DURATION;
      const updatedRockets = [...state.rockets];
      updatedRockets[availableRocketIndex] = {
        ...missionRocket,
        locationLayer: 'transit',
        transitRoute: 'surface_to_moon',
        ticksRemaining: duration,
        totalTicks: duration,
        cargoAmount: requestedCargo,
        moonRole: 'supply',
      };

      get().addMoonLog(`SUPPLY LAUNCHED: Rocket #${missionRocket.id} carrying ${requestedCargo} cargo to the Moon`);
      get().addNotification(`Rocket #${missionRocket.id} launched a Moon supply run.`);
      
      return {
        cargo: state.cargo - requestedCargo,
        fuel: state.fuel - fuelCost,
        rockets: updatedRockets,
      };
    }),

    constructBuildingOnMoon: (sectorId: string, buildingType: MoonBuildingType) => set(state => {
      if (state.moonStatus !== 'unlocked') return {};
      
      const sector = state.moonSectors.find(s => s.id === sectorId);
      if (!sector) return {};
      
      // Check if sector is unlocked and scanned
      if (!sector.unlocked) {
        get().addNotification('Sector not unlocked! Use research to unlock first.');
        return {};
      }
      if (!sector.scanned) {
        get().addNotification('Sector not scanned! Must scan sector before building.');
        return {};
      }
      
      // Check if sector has available slots
      if (sector.slotsUsed >= sector.slots) {
        get().addNotification('Sector slots full!');
        return {};
      }
      
      const cost = state.getMoonBuildingCost(buildingType as MoonBuildingType);
      
      // Check all resource requirements
      if (cost.cargo > 0 && state.cargo < cost.cargo) {
        get().addNotification('Insufficient cargo!');
        return {};
      }
      if (cost.science > 0 && state.science < cost.science) {
        get().addNotification('Insufficient science!');
        return {};
      }
      if (cost.regolith > 0 && state.moonResources.regolith < cost.regolith) {
        get().addNotification('Insufficient regolith!');
        return {};
      }
      if (cost.alloys > 0 && state.moonResources.alloys < cost.alloys) {
        get().addNotification('Insufficient alloys!');
        return {};
      }
      
      // Update sector buildings and slots
      const newSectors = state.moonSectors.map(s => {
        if (s.id === sectorId) {
          const buildingKey = buildingType === 'solarArray' || buildingType === 'nuclearReactor' || buildingType === 'battery' 
            ? buildingType 
            : buildingType + 's';
          return {
            ...s,
            buildings: {
              ...s.buildings,
              [buildingKey]: (s.buildings[buildingKey as keyof typeof s.buildings] || 0) + 1,
            },
            slotsUsed: s.slotsUsed + 1,
          };
        }
        return s;
      });
      
      const buildingNames: Record<string, string> = {
        extractor: 'Regolith Extractor',
        refinery: 'Helium-3 Refinery',
        silo: 'Storage Silo',
        maintenance: 'Maintenance Bay',
        massDriver: 'Mass Driver',
        solarArray: 'Solar Array',
        nuclearReactor: 'Nuclear Reactor',
        battery: 'Battery Bank',
        fabricator: 'Alloy Fabricator',
      };
      
      get().addMoonLog(`CONSTRUCTION: ${buildingNames[buildingType]} built in ${sector.name}`);
      
      // Deduct all resources (only non-zero values)
      const newMoonResources = {
        ...state.moonResources,
        regolith: cost.regolith > 0 ? state.moonResources.regolith - cost.regolith : state.moonResources.regolith,
        alloys: cost.alloys > 0 ? state.moonResources.alloys - cost.alloys : state.moonResources.alloys,
      };
      
      return {
        cargo: cost.cargo > 0 ? state.cargo - cost.cargo : state.cargo,
        science: cost.science > 0 ? state.science - cost.science : state.science,
        moonResources: newMoonResources,
        moonSectors: newSectors,
        notifications: [`Built ${buildingNames[buildingType]}!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }),

    launchMassDriverPayload: (amount: number) => set(state => {
      if (state.moonStatus !== 'unlocked') return {};
      
      // Check if enough He-3 available
      const helium3ToSend = Math.min(amount, state.moonResources.helium3);
      if (helium3ToSend === 0) return {};
      
      // Check for Mass Driver buildings
       let massDriverCount = 0;
       for (const sector of state.moonSectors) {
         massDriverCount += sector.buildings.massDrivers || 0;
       }
       if (massDriverCount === 0) return {};
      
      // Check payload capacity with research bonus
      const capacityMultiplier = state.getEffectMultiplier('massDriverCapacityBonus') || 1;
      const maxCapacity = MOON.MASS_DRIVER_CAPACITY * capacityMultiplier * massDriverCount;
      const actualAmount = Math.min(helium3ToSend, maxCapacity);
      
      if (actualAmount === 0) return {};
      
      get().addMoonLog(`LAUNCH: ${actualAmount.toFixed(1)} He-3 sent to Earth`);
      
      return {
        moonResources: {
          ...state.moonResources,
          helium3: state.moonResources.helium3 - actualAmount,
        },
        earthResources: {
          ...state.earthResources,
          helium3: state.earthResources.helium3 + actualAmount,
        },
        notifications: [`Launched ${Math.floor(actualAmount)} He-3 to Earth!`, ...state.notifications].slice(0, GAME.MAX_NOTIFICATIONS),
      };
    }),

    acceptMoonBounty: (bountyId: string) => set(state => {
      const bounty = state.moonBounties.find(b => b.id === bountyId);
      if (!bounty || bounty.status !== 'available') return {};
      
      return {
        moonBounties: state.moonBounties.map(b =>
          b.id === bountyId ? { ...b, status: 'active' as const } : b
        ),
      };
    }),

    completeMoonBounty: (bountyId: string) => set(state => {
      const bounty = state.moonBounties.find(b => b.id === bountyId);
      if (!bounty || bounty.status !== 'active') return {};
      if (state.earthResources.helium3 < bounty.helium3Amount) return {};
      
      return {
        money: state.money + bounty.rewardMoney,
        science: state.science + bounty.rewardScience,
        earthResources: {
          ...state.earthResources,
          helium3: state.earthResources.helium3 - bounty.helium3Amount,
        },
        moonBounties: state.moonBounties.filter(b => b.id !== bountyId),
      };
    }),
}))
