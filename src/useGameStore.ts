import { create } from 'zustand'
import { researchTree, ResearchNode, EffectType } from './researchTree.js'
import { INITIAL_STATE, COST_SCALING, PRODUCTION, DEFAULT_COMPANIES, COMPANY_DEFINITIONS, CompanyPerkEffect, ORBITAL, MOON, AFTERBURNER } from './gameConstants.js'

interface Spaceport {
  id: number;
}

// Moon Layer Types
export type MoonStatus = 'locked' | 'ready' | 'transit' | 'unlocked';
export type MoonBuildingType = 'extractor' | 'refinery' | 'silo' | 'maintenance' | 'massDriver';
export type MoonHazardType = 'moonDust' | 'solarFlare';

export interface MoonBuildings {
  extractors: number;
  refineries: number;
  silos: number;
  maintenance: number;
  massDrivers: number;
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
}

export interface EarthResources {
  regolith: number;
  helium3: number;
}

export interface SpaceStation {
  id: string;
  type: "research" | "logistics";
  level: number;
  maxDocks: number;
  dockedRockets: number[]; // Array of rocket IDs currently docked
}

export interface TransitRocket {
  id: number;
  type: 'cargo' | 'science';
  targetStationId: string;
  ticksRemaining: number;
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
   rockets: ({ id: number; type: 'cargo' | 'science' } | null)[];
   nextRocketId: number;
   rocketCost: number
   profitPerRocket: number;
   spaceportCapacity: number
   spaceports: Spaceport[]
   spaceStations: SpaceStation[]
   spaceportCost: number
   fuelRefineries: number;
   fuelProductionPerRefinery: number;
   fuelCostPerRocket: number;
   fuelRefineryCost: number;
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
   getCurrentSpaceportCost: () => number;
   getCurrentRocketCost: () => number;
   getEffectMultiplier: (type: EffectType) => number;
   getCompanyPerkValue: (perkEffect: CompanyPerkEffect) => number;
   getTotalEffectValue: (type: EffectType | CompanyPerkEffect) => number;
   getMaxActiveContracts: () => number;
   getMaxAvailableContracts: () => number;
   getMaxFuel: () => number;
   getMoonStorageCapacity: () => MoonResources;
   getMoonBuildingCost: (type: MoonBuildingType) => { cargo: number; science: number; regolith: number };
   setView: (view: "surface" | "orbit" | "contracts" | "research") => void;
  addNotification: (message: string) => void;
  addMoonLog: (message: string) => void;
  generateContracts: () => void;
  acceptContract: (contractId: string) => void;
  forfeitContract: (contractId: string) => void;
  tick: () => void
   buildRocket: () => void
   buildScienceRocket: () => void
   buildSpaceport: () => void
   buildSpaceStation: (type: SpaceStation['type']) => void
   buildFuelRefinery: () => void;
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
   afterburnerActive: boolean;
   toggleAutoBuild: () => void;
   toggleAutoSalvage: () => void;
   toggleAfterburner: () => void;
   unlockNode: (nodeId: string) => void;
   getAvailableNodes: () => ResearchNode[];
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
  spaceStations: [],
  spaceportCost: INITIAL_STATE.SPACEPORT_COST,
  fuelRefineries: 0,
  fuelProductionPerRefinery: INITIAL_STATE.FUEL_PRODUCTION_PER_REFINERY,
  fuelCostPerRocket: INITIAL_STATE.FUEL_COST_PER_ROCKET,
  fuelRefineryCost: INITIAL_STATE.FUEL_REFINERY_COST,
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
  moonBuildings: { extractors: 0, refineries: 0, silos: 0, maintenance: 0, massDrivers: 0 },
  moonResources: { regolith: 0, helium3: 0 },
  earthResources: { regolith: 0, helium3: 0 },
  activeHazard: null,
  moonLog: [],
  researchedNodes: [],
  previouslyAvailableResearch: [],
  autoBuildActive: false,
  autoSalvageActive: false,
  afterburnerActive: false,
  
  tick: () => set(state => {
    // Clear animation flags at start of each tick
    const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
   
    const fuelProduction = state.fuelRefineries * state.fuelProductionPerRefinery * state.getEffectMultiplier('refineryOutputMultiplier');
    // Add passive fuel from company perks
    const passiveFuelBonus = state.getCompanyPerkValue('passiveFuelBonus');
    // Apply fuel capacity bonus from research, company perks, and dev bonus
    const maxFuel = state.getMaxFuel();
    let fuelAvailable = Math.min(maxFuel, state.fuel + fuelProduction + passiveFuelBonus);
    let successfulCargoLaunches = 0;
    let successfulScienceLaunches = 0;
    let explosionCount = 0;
    let explosionScienceFromCost = 0; // Track science from Black Box perk
    let newExplodedRocketIds = [...state.explodedRocketIds];
    let newActiveContracts = state.activeContracts.map(c => ({ ...c }));
    let newCompanies = [...state.companies];
    let recentlyLaunchedIds: number[] = [];
    
    // New transit rockets to add this tick
    let newTransitRockets: TransitRocket[] = [...state.transitRockets];

    // Get combined multipliers (research + company perks)
    let baseFuelCost = state.fuelCostPerRocket * state.getTotalEffectValue('fuelCostMultiplier');
    let baseExplosionChance = state.rocketExplosionChance * state.getTotalEffectValue('explosionChanceMultiplier');
    
    // Afterburner logic
    const afterburnerUnlocked = state.getEffectMultiplier('unlockAfterburner') > 0;
    const afterburnerActive = afterburnerUnlocked && state.afterburnerActive;
    let afterburnerOutputMultiplier = 1;
    
    if (afterburnerActive) {
      // Fuel cost multiplier (default 3x, reduced by efficiency perk)
      const afterburnerEfficiency = state.getCompanyPerkValue('afterburnerEfficiency');
      const fuelCostMultiplier = afterburnerEfficiency > 0 ? afterburnerEfficiency : AFTERBURNER.FUEL_COST_MULTIPLIER;
      baseFuelCost *= fuelCostMultiplier;
      
      // Output multiplier (default 2x, increased by output perk)
      const afterburnerOutput = state.getCompanyPerkValue('afterburnerOutput');
      afterburnerOutputMultiplier = afterburnerOutput > 0 ? afterburnerOutput : AFTERBURNER.OUTPUT_MULTIPLIER;
      
      // Explosion risk bonus (negated by thermal shielding perk)
      const hasThermalShielding = state.getCompanyPerkValue('thermalShielding') > 0;
      if (!hasThermalShielding) {
        baseExplosionChance += AFTERBURNER.EXPLOSION_RISK_BONUS;
      }
    }
    
    const effectiveFuelCost = baseFuelCost;
    const effectiveExplosionChance = baseExplosionChance;

    // Process each rocket launch
    for (const rocket of activeRockets) {
      if (fuelAvailable >= effectiveFuelCost) {
        fuelAvailable -= effectiveFuelCost;
        
        // Roll for explosion
        if (Math.random() < effectiveExplosionChance) {
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
        } else {
          // Track successful launches for animation
          recentlyLaunchedIds.push(rocket.id);
          if (rocket.type === 'cargo') {
            successfulCargoLaunches += 1;
          } else {
            successfulScienceLaunches += 1;
          }
          
          // === ORBITAL DOCKING: Send rocket to orbit if there's a free dock ===
          // Find a station with available docks
          const stationsWithDocks = state.spaceStations.filter(s => {
            const dockedCount = state.dockedRockets.filter(d => d.stationId === s.id).length;
            const transitCount = newTransitRockets.filter(t => t.targetStationId === s.id).length;
            return dockedCount + transitCount < s.maxDocks;
          });
          
          if (stationsWithDocks.length > 0) {
            // Pick a random station with available docks
            const targetStation = stationsWithDocks[Math.floor(Math.random() * stationsWithDocks.length)];
            // Transit speed multiplier (Zenith perk: Express Transit)
            const transitSpeedMultiplier = state.getCompanyPerkValue('transitSpeedMultiplier') || 1;
            const transitDuration = Math.max(1, Math.floor(ORBITAL.TRANSIT_DURATION_TICKS * transitSpeedMultiplier));
            newTransitRockets.push({
              id: rocket.id,
              type: rocket.type,
              targetStationId: targetStation.id,
              ticksRemaining: transitDuration,
            });
          }
        }
      }
    }
    
    // === ORBITAL MECHANICS ===
    
    // Process transit rockets (decrement timer, convert to docked)
    let newDockedRockets: DockedRocket[] = [...state.dockedRockets];
    let newSpaceStations = state.spaceStations.map(s => ({ ...s, dockedRockets: [...s.dockedRockets] }));
    
    const arrivedTransit: TransitRocket[] = [];
    const stillInTransit: TransitRocket[] = [];
    
    for (const transit of newTransitRockets) {
      if (transit.ticksRemaining <= 1) {
        arrivedTransit.push(transit);
      } else {
        stillInTransit.push({ ...transit, ticksRemaining: transit.ticksRemaining - 1 });
      }
    }
    
    // Dock arrived rockets
    const dockingDurationReduction = state.getCompanyPerkValue('dockingDurationReduction') || 0;
    const effectiveDockingDuration = Math.max(1, Math.floor(ORBITAL.DOCKING_DURATION_TICKS * (1 - dockingDurationReduction)));
    for (const arrived of arrivedTransit) {
      const stationIndex = newSpaceStations.findIndex(s => s.id === arrived.targetStationId);
      if (stationIndex !== -1) {
        newSpaceStations[stationIndex].dockedRockets.push(arrived.id);
        newDockedRockets.push({
          rocketId: arrived.id,
          stationId: arrived.targetStationId,
          ticksRemaining: effectiveDockingDuration,
        });
      }
    }
    
    // Process docked rockets (decrement timer, undock when done)
    const stillDocked: DockedRocket[] = [];
    for (const docked of newDockedRockets) {
      if (docked.ticksRemaining <= 1) {
        // Undock - remove from station
        const stationIndex = newSpaceStations.findIndex(s => s.id === docked.stationId);
        if (stationIndex !== -1) {
          newSpaceStations[stationIndex].dockedRockets = newSpaceStations[stationIndex].dockedRockets.filter(id => id !== docked.rocketId);
        }
      } else {
        stillDocked.push({ ...docked, ticksRemaining: docked.ticksRemaining - 1 });
      }
    }
    newDockedRockets = stillDocked;
    
    // Spawn debris randomly
    let newDebris = [...state.spaceDebris];
    const hasDebrisImmunity = state.getEffectMultiplier('debrisImmunity') > 0;
    if (!hasDebrisImmunity && Math.random() < ORBITAL.DEBRIS_SPAWN_CHANCE && state.spaceStations.length > 0) {
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

    // Calculate production with company perk bonuses
    const profitMultiplier = state.getTotalEffectValue('profitMultiplier');
    // Apply afterburner output multiplier to launch-based production
    let cargoProd = successfulCargoLaunches * state.profitPerRocket * profitMultiplier * afterburnerOutputMultiplier;
    
    // Science production with company perks
    const sciencePerRocketBonus = state.getCompanyPerkValue('sciencePerRocketBonus');
    const sciencePerExplosionBonus = state.getCompanyPerkValue('sciencePerExplosionBonus');
    let sciProd = successfulScienceLaunches * (PRODUCTION.SCIENCE_PER_SCIENCE_ROCKET + sciencePerRocketBonus) * afterburnerOutputMultiplier + explosionCount * (PRODUCTION.SCIENCE_PER_EXPLOSION + sciencePerExplosionBonus) + explosionScienceFromCost;
    
    // Cargo generation - combine research multipliers and company perks
    const cargoPerLaunchMultiplier = state.getTotalEffectValue('cargoPerLaunchMultiplier');
    const cargoGenerationMultiplier = state.getEffectMultiplier('cargoGenerationMultiplier');
    const totalCargoMultiplier = (cargoPerLaunchMultiplier !== 1 ? cargoPerLaunchMultiplier : 1) * (cargoGenerationMultiplier !== 0 ? cargoGenerationMultiplier : 1);
    let cargoResourceProd = successfulCargoLaunches * PRODUCTION.CARGO_PER_SUCCESSFUL_LAUNCH * totalCargoMultiplier * afterburnerOutputMultiplier;

    // Passive bonuses from company perks
    const passiveMoneyBonus = state.getCompanyPerkValue('passiveMoneyBonus');
    const passiveScienceBonus = state.getCompanyPerkValue('passiveScienceBonus');
    const passiveCargoBonus = state.getCompanyPerkValue('passiveCargoBonus');
    cargoProd += passiveMoneyBonus;
    sciProd += passiveScienceBonus;
    cargoResourceProd += passiveCargoBonus;
    
    // Passive cargo bonus from research
    const researchPassiveCargoBonus = state.getEffectMultiplier('passiveCargoBonus');
    cargoResourceProd += researchPassiveCargoBonus;

    // Passive Spaceport Bonuses
    for (let i = 0; i < state.spaceports.length; i++) {
      sciProd += PRODUCTION.PASSIVE_SCIENCE_PER_SPACEPORT;
      cargoProd += (i + 1) * PRODUCTION.PASSIVE_CARGO_BONUS_PER_SPACEPORT;
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
      cargoProd *= (1 + moneyBonus);
    }
    
    // Global Money Multiplier (Titan perk: Monopoly)
    const globalMoneyMultiplier = state.getCompanyPerkValue('globalMoneyMultiplier');
    if (globalMoneyMultiplier > 1) {
      cargoProd *= globalMoneyMultiplier;
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
          const baseOutput = PRODUCTION.STATION_SCIENCE_BONUS * station.level * state.getEffectMultiplier('stationScienceMultiplier') * stationBonusMultiplier;
          sciProd += baseOutput * stationDockingBonus * debrisPenalty;
          
          // Lunar component production: each docked rocket at research station produces components
          if (dockedCount > 0) {
            lunarProd += dockedCount * ORBITAL.LUNAR_COMPONENT_PRODUCTION_RATE * station.level * lunarProductionMultiplier;
          }
        } else if (station.type === 'logistics') {
          const baseOutput = PRODUCTION.STATION_LOGISTICS_BONUS * station.level * state.getEffectMultiplier('stationLogisticsMultiplier') * stationBonusMultiplier;
          cargoProd += baseOutput * stationDockingBonus * debrisPenalty;
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
    cargoProd *= satelliteBonus;
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
      const moneyToDeliver = Math.min(cargoProd, contract.requiredMoney - contract.deliveredMoney);
      contract.deliveredMoney += moneyToDeliver;
      cargoProd -= moneyToDeliver;
      
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
        const baseCargoReq = 50 * levelScale * (0.5 + Math.random()) * contractRequirementMult;
        const baseScienceReq = 100 * levelScale * (0.5 + Math.random()) * contractRequirementMult;
        const baseMoneyReq = 300 * levelScale * (0.5 + Math.random()) * contractRequirementMult;

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
    let finalMoney = state.money + cargoProd;
    let finalRockets = state.rockets;
    let finalNextId = state.nextRocketId;
    let finalScience = newScience;
    let finalExplodedRocketIds = newExplodedRocketIds;

    const autoBuildEnabled = state.getEffectMultiplier('autoBuildEnabled') > 0;
    if (autoBuildEnabled && state.autoBuildActive) {
      const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier') || 1;
      const autoBuildSpeedMultiplier = state.getCompanyPerkValue('autoBuildSpeedMultiplier') || 1;
      const buildSpeedMultiplier = state.getCompanyPerkValue('buildSpeedMultiplier') || 1;
      const baseInterval = 20;
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
            const newRocket = { id: finalNextId, type: 'cargo' as const };
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
      const baseInterval = 20;
      const effectiveInterval = Math.max(1, Math.floor(baseInterval / (clearMultiplier * autoSalvageSpeedMultiplier)));
      
      if ((state.tickCount + 10) % effectiveInterval === 0) {
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
      ? [...notificationsToAdd, ...state.notifications].slice(0, 5)
      : state.notifications;

    // === MOON LAYER MECHANICS ===
    let newMoonStatus = state.moonStatus;
    let newMoonMissionTicks = state.moonMissionTicksRemaining;
    let newMoonResources = { ...state.moonResources };
    let newEarthResources = { ...state.earthResources };
    let newActiveHazard = state.activeHazard;
    let newMoonLog = [...state.moonLog];
    
    // Check if o14 (Lunar Manufacturing) is researched to show "ready" status
    if (state.moonStatus === 'locked' && state.researchedNodes.includes('o14')) {
      newMoonStatus = 'ready';
    }
    
    // Process Moon mission transit
    if (state.moonStatus === 'transit') {
      newMoonMissionTicks = state.moonMissionTicksRemaining - 1;
      
      // Mission complete!
      if (newMoonMissionTicks <= 0) {
        newMoonStatus = 'unlocked';
        newMoonMissionTicks = 0;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        newMoonLog = [`[${timestamp}] LANDING SUCCESSFUL - Lunar base operational`, ...newMoonLog].slice(0, 50);
        notificationsToAdd.push('Lunar Landing Successful! Moon base is now operational.');
      }
    }
    
    // Process Moon production (only when unlocked)
    if (state.moonStatus === 'unlocked') {
      const storage = state.getMoonStorageCapacity();
      
      // Calculate hazard debuff
      let hazardDebuff = 1;
      if (newActiveHazard) {
        hazardDebuff = 1 - newActiveHazard.debuff;
        
        // Reduce hazard duration (maintenance buildings speed this up)
        // Company perk also reduces duration
        const hazardDurationReduction = state.getCompanyPerkValue('hazardDurationReduction') || 0;
        const maintenanceReduction = 1 - (state.moonBuildings.maintenance * MOON.MAINTENANCE_DURATION_REDUCTION) - hazardDurationReduction;
        const ticksToRemove = Math.max(1, Math.ceil(1 / Math.max(0.1, maintenanceReduction)));
        newActiveHazard = {
          ...newActiveHazard,
          ticksRemaining: newActiveHazard.ticksRemaining - ticksToRemove,
        };
        
        // Clear hazard if duration is up
        if (newActiveHazard.ticksRemaining <= 0) {
          const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
          newMoonLog = [`[${timestamp}] HAZARD CLEARED: ${newActiveHazard.name} has subsided`, ...newMoonLog].slice(0, 50);
          newActiveHazard = null;
        }
      }
      
      // Roll for new hazard (only if none active)
      if (!newActiveHazard && Math.random() < MOON.HAZARD_CHANCE) {
        const hazardType = Math.random() < 0.7 ? 'moonDust' : 'solarFlare';
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
        newMoonLog = [`[${timestamp}] WARNING: ${hazardDef.name} detected!`, ...newMoonLog].slice(0, 50);
        notificationsToAdd.push(`Moon Hazard: ${hazardDef.name}!`);
        hazardDebuff = 1 - hazardDef.debuff;
      }
      
      // Extractor production (Regolith)
      const extractorMultiplier = state.getEffectMultiplier('extractorOutputMultiplier' as EffectType) || 1;
      const regolithProduction = state.moonBuildings.extractors * MOON.EXTRACTOR_REGOLITH_RATE * hazardDebuff * extractorMultiplier;
      newMoonResources.regolith = Math.min(storage.regolith, newMoonResources.regolith + regolithProduction);
      
      // Refinery production (Helium-3 from Regolith)
      const refineryMultiplier = state.getEffectMultiplier('moonRefineryOutputMultiplier' as EffectType) || 1;
      const potentialHelium3 = state.moonBuildings.refineries * MOON.REFINERY_HELIUM3_RATE * hazardDebuff * refineryMultiplier;
      const regolithNeeded = potentialHelium3 * MOON.REFINERY_REGOLITH_COST;
      const actualRegolithUsed = Math.min(regolithNeeded, newMoonResources.regolith);
      const actualHelium3 = (actualRegolithUsed / MOON.REFINERY_REGOLITH_COST);
      newMoonResources.regolith -= actualRegolithUsed;
      newMoonResources.helium3 = Math.min(storage.helium3, newMoonResources.helium3 + actualHelium3);
      
      // Mass Driver auto-transport (only Helium-3, not regolith)
      if (state.moonBuildings.massDrivers > 0) {
        const transportMultiplier = state.moonBuildings.massDrivers;
        const massDriverEfficiency = state.getEffectMultiplier('massDriverEfficiency' as EffectType) || 1;
        const helium3ToTransport = Math.min(newMoonResources.helium3, MOON.MASS_DRIVER_HELIUM3_RATE * transportMultiplier * hazardDebuff * massDriverEfficiency);
        
        newMoonResources.helium3 -= helium3ToTransport;
        newEarthResources.helium3 += helium3ToTransport;
      }
    }

    return {
      money: finalMoney,
      science: finalScience,
      fuel: fuelAvailable,
      cargo: state.cargo + cargoResourceProd,
      lunarComponents: state.lunarComponents + lunarProd,
      // Track successful launches for layer unlock
      totalSuccessfulLaunches: state.totalSuccessfulLaunches + successfulCargoLaunches + successfulScienceLaunches,
      activeContracts: newActiveContracts,
      availableContracts: newAvailableContracts,
      contractRefreshTimer: newContractRefreshTimer,
      companies: newCompanies,
      explodedRocketIds: finalExplodedRocketIds,
      rockets: finalRockets,
      nextRocketId: finalNextId,
      previouslyAvailableResearch: currentAvailableIds,
      notifications: [...notificationsToAdd, ...updatedNotifications].slice(0, 5),
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
        for (let i = 0; i < affordableCount; i++) {
          const newRocket = { id: state.nextRocketId + i, type: 'cargo' as const };
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
    
  buildScienceRocket: () =>
    set(state => {
      if (state.researchedNodes.indexOf('o4') === -1) {
        return {};
      }
      
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
        for (let i = 0; i < affordableCount; i++) {
          const newRocket = { id: state.nextRocketId + i, type: 'science' as const };
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
      if (state.researchedNodes.indexOf('o5') === -1) {
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
        notifications: [`Deployed ${type} station`, ...state.notifications].slice(0, 5)
      };
    }
    return {};
  }),
  
  buildFuelRefinery: () =>
    set(state => {
      if (state.researchedNodes.indexOf('o6') === -1) {
        return {};
      }
      const refineryCostMultiplier = state.getCompanyPerkValue('refineryCostMultiplier') || 1;
      const baseCost = state.fuelRefineryCost * Math.pow(COST_SCALING.FUEL_REFINERY_COST_EXPONENT, state.fuelRefineries);
      const currentFuelRefineryCost = Math.round(baseCost * state.getEffectMultiplier('constructionCostMultiplier') * refineryCostMultiplier);
      if (state.money >= currentFuelRefineryCost) {
        return {
          money: state.money - currentFuelRefineryCost,
          fuelRefineries: state.fuelRefineries + 1,
        }
      }
      return {}
    }),
    
   clearExplosion: (rocketId: number) =>
    set(state => {
      if (state.researchedNodes.indexOf('o7') === -1) {
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
    
  getCurrentSpaceportCost: () => {
    const state = get();
    return Math.round(state.spaceportCost * Math.pow(COST_SCALING.SPACEPORT_COST_EXPONENT, state.spaceports.length) * state.getEffectMultiplier('constructionCostMultiplier'));
  },
  
  getCurrentRocketCost: () => {
    const state = get();
    const currentRocketCount = state.rockets.filter(r => r !== null).length;
    const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
    const rocketCostMultiplier = state.getCompanyPerkValue('rocketCostMultiplier') || 1;
    const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, currentRocketCount);
    return Math.round(baseCost * constructionMultiplier * rocketCostMultiplier);
  },
  
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
  
  getMaxActiveContracts: () => {
    const state = get();
    const researchBonus = state.getEffectMultiplier('maxActiveContractsBonus');
    const companyBonus = state.getCompanyPerkValue('maxActiveContractsBonus');
    return INITIAL_STATE.MAX_ACTIVE_CONTRACTS + researchBonus + companyBonus;
  },
  
  getMaxAvailableContracts: () => {
    const state = get();
    return INITIAL_STATE.MAX_AVAILABLE_CONTRACTS + state.getEffectMultiplier('maxAvailableContractsBonus');
  },
  
  getMaxFuel: () => {
    const state = get();
    const researchFuelCapacityBonus = state.getEffectMultiplier('fuelCapacityBonus');
    const perkFuelCapacityBonus = state.getCompanyPerkValue('fuelCapacityBonus');
    return INITIAL_STATE.FUEL + researchFuelCapacityBonus + perkFuelCapacityBonus + state.bonusFuelCapacity;
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
  
  addNotification: (message: string) => set(state => ({ notifications: [message, ...state.notifications].slice(0, 5) })),
  
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
      const isFragile = Math.random() > 0.7;
      const isTimed = Math.random() > 0.5;
      
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      const title = contractType.titles[Math.floor(Math.random() * contractType.titles.length)];
      const description = contractType.descriptions[Math.floor(Math.random() * contractType.descriptions.length)];

      // Apply contract requirement multiplier (c2 Lean Logistics research)
      const contractRequirementMult = get().getEffectMultiplier('contractRequirementMultiplier') || 1;
      const baseCargoReq = 50 * levelScale * (1 + Math.random()) * contractRequirementMult;
      const baseScienceReq = 100 * levelScale * (1 + Math.random()) * contractRequirementMult;
      const baseMoneyReq = 300 * levelScale * (1 + Math.random()) * contractRequirementMult;
      const baseMoneyReward = 800 * levelScale * (1 + Math.random());
      const baseScienceReward = 50 * levelScale * (1 + Math.random());

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
        rewardExperience: 50 * company.level,
        timeLimitSeconds: isTimed ? 60 + Math.floor(Math.random() * 120) * company.level : 0,
        elapsedSeconds: 0,
        maxExplosions: isFragile ? 1 + Math.floor(Math.random() * 3) : -1,
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
      notifications: [`Contract Accepted: ${contract.title}`, ...state.notifications].slice(0, 5)
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
  toggleAfterburner: () => set(state => {
    // Only allow toggling if afterburner is unlocked
    const afterburnerUnlocked = state.getEffectMultiplier('unlockAfterburner') > 0;
    if (!afterburnerUnlocked) return {};
    return { afterburnerActive: !state.afterburnerActive };
  }),
  
  // Layer unlock action
  unlockLayer: (layer: 'orbit' | 'contracts') => set(state => {
    if (layer === 'orbit') {
      // Orbit requires 500 cargo
      if (state.orbitLayerUnlocked) return {};
      if (state.cargo < 500) return {};
      get().addNotification('Orbital Operations Unlocked!');
      return {
        cargo: state.cargo - 500,
        orbitLayerUnlocked: true,
      };
    } else if (layer === 'contracts') {
      // Contracts requires 1000 successful launches
      if (state.contractsLayerUnlocked) return {};
      if (state.totalSuccessfulLaunches < 1000) return {};
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
        notifications: [`Satellite launched! (${state.satellites + 1}/${maxSatellites})`, ...state.notifications].slice(0, 5),
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
      notifications: [`Debris cleared! +${ORBITAL.DEBRIS_CLEAR_SCIENCE_REWARD} Science`, ...state.notifications].slice(0, 5),
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
        notifications: [`Station upgraded to Level ${station.level + 1}!`, ...state.notifications].slice(0, 5),
      };
    }
    return {};
  }),
  
  // Moon layer helper methods
  getMoonStorageCapacity: () => {
    const state = get();
    const siloBonus = state.moonBuildings.silos;
    return {
      regolith: MOON.STORAGE_BASE.regolith + siloBonus * MOON.STORAGE_PER_SILO.regolith,
      helium3: MOON.STORAGE_BASE.helium3 + siloBonus * MOON.STORAGE_PER_SILO.helium3,
    };
  },
  
  getMoonBuildingCost: (type: MoonBuildingType) => {
    const state = get();
    const buildingKeyMap: Record<MoonBuildingType, keyof MoonBuildings> = {
      extractor: 'extractors',
      refinery: 'refineries',
      silo: 'silos',
      maintenance: 'maintenance',
      massDriver: 'massDrivers',
    };
    const count = state.moonBuildings[buildingKeyMap[type]] || 0;
    const baseCost = MOON.BUILDING_COSTS[type];
    const multiplier = Math.pow(MOON.BUILDING_COST_EXPONENT, count);
    const regolithCost = 'regolith' in baseCost ? Math.round(baseCost.regolith * multiplier) : 0;
    return {
      cargo: Math.round(baseCost.cargo * multiplier),
      science: Math.round(baseCost.science * multiplier),
      regolith: regolithCost,
    };
  },
  
  addMoonLog: (message: string) => set(state => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    return { moonLog: [`[${timestamp}] ${message}`, ...state.moonLog].slice(0, 50) };
  }),
  
  // Moon layer actions
  startMoonMission: () => set(state => {
    // Check if Lunar Manufacturing is unlocked (o14)
    if (!state.researchedNodes.includes('o14')) {
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
    
    get().addMoonLog('MISSION INITIATED - Lunar lander en route');
    get().addNotification('Lunar Landing Mission launched!');
    
    return {
      fuel: state.fuel - cost.fuel,
      cargo: state.cargo - cost.cargo,
      science: state.science - cost.science,
      lunarComponents: state.lunarComponents - cost.lunarComponents,
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
    };
    
    get().addMoonLog(`CONSTRUCTION COMPLETE: ${buildingNames[type]} online`);
    
    return {
      cargo: state.cargo - cost.cargo,
      science: state.science - cost.science,
      moonResources: cost.regolith 
        ? { ...state.moonResources, regolith: state.moonResources.regolith - cost.regolith }
        : state.moonResources,
      moonBuildings: newBuildings,
      notifications: [`Built ${buildingNames[type]} on the Moon!`, ...state.notifications].slice(0, 5),
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
    
    // Apply research cost multiplier from company perks
    const researchCostMultiplier = state.getCompanyPerkValue('researchCostMultiplier') || 1;
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
}))
