import { create } from 'zustand'
import { researchTree, ResearchNode, EffectType } from './researchTree.js'
import { INITIAL_STATE, COST_SCALING, PRODUCTION, DEFAULT_COMPANIES } from './gameConstants.js'

interface Spaceport {
  id: number;
}

export interface SpaceStation {
  id: string;
  type: "research" | "logistics";
  level: number;
}

export interface Company {
  id: string;
  name: string;
  level: number;
  experience: number;
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
   cargo: number;
   tickCount: number; // Increments each tick, used for animations
   currentView: "surface" | "orbit" | "contracts" | "research";
   notifications: string[];
   companies: Company[];
   availableContracts: Contract[];
   activeContract: Contract | null;
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
   getCurrentSpaceportCost: () => number;
    getEffectMultiplier: (type: EffectType) => number;
   setView: (view: "surface" | "orbit" | "contracts" | "research") => void;
  addNotification: (message: string) => void;
  generateContracts: () => void;
  acceptContract: (contractId: string) => void;
  forfeitContract: () => void;
  tick: () => void
   buildRocket: () => void
   buildScienceRocket: () => void
   buildSpaceport: () => void
   buildSpaceStation: (type: SpaceStation['type']) => void
   buildFuelRefinery: () => void;
   toggleSpaceport: (index: number) => void; // Deprecated - no-op
   clearExplosion: (rocketId: number) => void;
   researchedNodes: string[];
   previouslyAvailableResearch: string[];
   autoBuildActive: boolean;
   autoSalvageActive: boolean;
   toggleAutoBuild: () => void;
   toggleAutoSalvage: () => void;
   unlockNode: (nodeId: string) => void;
   getAvailableNodes: () => ResearchNode[];
}



export const useGameStore = create<GameState>((set, get) => ({
  money: INITIAL_STATE.MONEY,
  science: INITIAL_STATE.SCIENCE,
  fuel: INITIAL_STATE.FUEL,
  cargo: INITIAL_STATE.CARGO,
  tickCount: 0,
  currentView: "surface",
  notifications: [],
  companies: DEFAULT_COMPANIES.map(c => ({ ...c })),
  availableContracts: [],
   activeContract: null,
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
      researchedNodes: [],
      previouslyAvailableResearch: [],
      autoBuildActive: false,
      autoSalvageActive: false,
     tick: () => set(state => {
      // Clear animation flags at start of each tick
      const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
     
      const fuelProduction = state.fuelRefineries * state.fuelProductionPerRefinery * state.getEffectMultiplier('refineryOutputMultiplier');
      let fuelAvailable = state.fuel + fuelProduction;
      let successfulCargoLaunches = 0;
      let successfulScienceLaunches = 0;
      let explosionCount = 0;
      let newExplodedRocketIds = [...state.explodedRocketIds];
      let newActiveContract = state.activeContract ? { ...state.activeContract } : null;
      let newCompanies = [...state.companies];
      let recentlyLaunchedIds: number[] = [];

     const effectiveFuelCost = state.fuelCostPerRocket * state.getEffectMultiplier('fuelCostMultiplier');
     const effectiveExplosionChance = state.rocketExplosionChance * state.getEffectMultiplier('explosionChanceMultiplier');

     // Process each rocket launch
     for (const rocket of activeRockets) {
       if (fuelAvailable >= effectiveFuelCost) {
         fuelAvailable -= effectiveFuelCost;
         
         // Roll for explosion
         if (Math.random() < effectiveExplosionChance) {
           newExplodedRocketIds.push(rocket.id);
           explosionCount += 1;
           // Handle contract fragility
           if (newActiveContract && newActiveContract.status === 'active' && newActiveContract.maxExplosions !== -1) {
             newActiveContract.currentExplosions += 1;
             if (newActiveContract.currentExplosions > newActiveContract.maxExplosions) {
               newActiveContract.status = 'failed';
               get().addNotification(`Contract Failed: ${newActiveContract.title} (Too many explosions)`);
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
         }
       }
     }

    let cargoProd = successfulCargoLaunches * state.profitPerRocket * state.getEffectMultiplier('profitMultiplier');
    let sciProd = successfulScienceLaunches * PRODUCTION.SCIENCE_PER_SCIENCE_ROCKET + explosionCount * PRODUCTION.SCIENCE_PER_EXPLOSION;
    let cargoResourceProd = successfulCargoLaunches * PRODUCTION.CARGO_PER_SUCCESSFUL_LAUNCH * state.getEffectMultiplier('cargoGenerationMultiplier');

     // Passive Spaceport Bonuses
     for (let i = 0; i < state.spaceports.length; i++) {
       // All spaceports generate passive science and cargo
       sciProd += PRODUCTION.PASSIVE_SCIENCE_PER_SPACEPORT;
       cargoProd += (i + 1) * PRODUCTION.PASSIVE_CARGO_BONUS_PER_SPACEPORT;
     }

    // Apply Orbital Station Benefits
    if (state.spaceStations) {
      state.spaceStations.forEach(station => {
        if (station.type === 'research') {
          sciProd += PRODUCTION.STATION_SCIENCE_BONUS * station.level * state.getEffectMultiplier('stationScienceMultiplier');
        } else if (station.type === 'logistics') {
          cargoProd += PRODUCTION.STATION_LOGISTICS_BONUS * station.level * state.getEffectMultiplier('stationLogisticsMultiplier');
        }
      });
    }

    if (newActiveContract && newActiveContract.status === 'active') {
      if (newActiveContract.timeLimitSeconds > 0) {
        newActiveContract.elapsedSeconds += 1;
        if (newActiveContract.elapsedSeconds >= newActiveContract.timeLimitSeconds) {
          newActiveContract.status = 'failed';
          get().addNotification(`Contract Failed: ${newActiveContract.title} (Time limit reached)`);
        }
      }
      
      // When contract is active, redirect all resources to the contract
      if (newActiveContract.status === 'active') {
        // Deliver money to contract
        const moneyToDeliver = Math.min(cargoProd, newActiveContract.requiredMoney - newActiveContract.deliveredMoney);
        newActiveContract.deliveredMoney += moneyToDeliver;
        cargoProd -= moneyToDeliver; // Remaining goes to player
        
        // Deliver science to contract
        const scienceToDeliver = Math.min(sciProd, newActiveContract.requiredScience - newActiveContract.deliveredScience);
        newActiveContract.deliveredScience += scienceToDeliver;
        sciProd -= scienceToDeliver; // Remaining goes to player
        
        // Deliver cargo to contract
        const cargoToDeliver = Math.min(cargoResourceProd, newActiveContract.requiredCargo - newActiveContract.deliveredCargo);
        newActiveContract.deliveredCargo += cargoToDeliver;
        cargoResourceProd -= cargoToDeliver; // Remaining goes to player
        
        // Check if contract is complete
        if (newActiveContract.deliveredMoney >= newActiveContract.requiredMoney &&
            newActiveContract.deliveredScience >= newActiveContract.requiredScience &&
            newActiveContract.deliveredCargo >= newActiveContract.requiredCargo) {
          // Complete the contract
          const completedContract = newActiveContract;
          completedContract.status = 'completed';
          const company = state.companies.find(c => c.id === completedContract.companyId);
          if (company) {
            const newExperience = company.experience + completedContract.rewardExperience;
            const experienceToLevel = company.level * 100;
            let newLevel = company.level;
            let finalExperience = newExperience;

            if (finalExperience >= experienceToLevel) {
              finalExperience -= experienceToLevel;
              newLevel += 1;
              get().addNotification(`${company.name} leveled up to ${newLevel}!`);
            }

            newCompanies = state.companies.map(c => 
              c.id === company.id ? { ...c, level: newLevel, experience: finalExperience } : c
            );
            
            // Add rewards
            cargoProd += completedContract.rewardMoney * state.getEffectMultiplier('contractMoneyMultiplier');
            sciProd += completedContract.rewardScience;
          }
          get().addNotification(`Contract Completed: ${completedContract.title}`);
          newActiveContract = null;
        }
      }
    }

    const newScience = state.science + sciProd;

    // Auto-build logic (only during passive phase, before returning state)
    let finalMoney = state.money + cargoProd;
    let finalRockets = state.rockets;
    let finalNextId = state.nextRocketId;
    let finalScience = newScience;
    let finalExplodedRocketIds = newExplodedRocketIds;

    // Auto-build logic: 1 rocket every 20 seconds (affected by build speed tech)
    const autoBuildEnabled = state.getEffectMultiplier('autoBuildEnabled') > 0;
    if (autoBuildEnabled && state.autoBuildActive) {
      // Base interval is 20 seconds, build speed multiplier reduces it
      const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier') || 1;
      const baseInterval = 20;
      const effectiveInterval = Math.max(1, Math.floor(baseInterval / buildMultiplier));
      
      // Only build on the interval tick
      if (state.tickCount % effectiveInterval === 0) {
        const effectiveCapacity = state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus');
        const maxRockets = state.spaceports.length * effectiveCapacity;
        const currentTotalRockets = finalRockets.filter(r => r !== null).length;

        if (currentTotalRockets < maxRockets) {
          const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
          const idx = currentTotalRockets;
          const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, idx);
          const cost = Math.round(baseCost * constructionMultiplier);
          
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

    // Auto-salvage logic: 1 explosion cleared every 20 seconds (affected by salvage speed tech)
    const autoSalvageEnabled = state.getEffectMultiplier('autoSalvageEnabled') > 0;
    if (autoSalvageEnabled && state.autoSalvageActive && finalExplodedRocketIds.length > 0) {
      // Base interval is 20 seconds, salvage speed multiplier reduces it
      const clearMultiplier = state.getEffectMultiplier('clearExplosionMultiplier') || 1;
      const baseInterval = 20;
      const effectiveInterval = Math.max(1, Math.floor(baseInterval / clearMultiplier));
      
      // Only salvage on the interval tick (offset by 10 to not compete with auto-build)
      if ((state.tickCount + 10) % effectiveInterval === 0) {
        const rocketId = finalExplodedRocketIds[0];
        const newRockets = [...finalRockets];
        const rocketIndex = newRockets.findIndex(r => r !== null && r.id === rocketId);
        if (rocketIndex !== -1) {
          newRockets[rocketIndex] = null;
          finalRockets = newRockets;
          finalExplodedRocketIds = finalExplodedRocketIds.filter(id => id !== rocketId);
          finalScience += 1;
        }
      }
    }

    // Detect newly available research nodes
    const currentAvailableIds = get().getAvailableNodes().map(n => n.id);
    const newlyAvailable = currentAvailableIds.filter(id => !state.previouslyAvailableResearch.includes(id));
    
    // Add notifications for newly available research
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

     return {
       money: finalMoney,
       science: finalScience,
       fuel: fuelAvailable,
       cargo: state.cargo + cargoResourceProd,
       activeContract: newActiveContract,
       companies: newCompanies,
       explodedRocketIds: finalExplodedRocketIds,
       rockets: finalRockets,
       nextRocketId: finalNextId,
       previouslyAvailableResearch: currentAvailableIds,
       notifications: updatedNotifications,
       recentlyLaunchedRocketIds: recentlyLaunchedIds,
       newlyAvailableResearchIds: newlyAvailable,
       tickCount: state.tickCount + 1,
     }
  }),
  buildRocket: () =>
    set(state => {
      const effectiveCapacity = state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus');
      const maxRockets = state.spaceports.length * effectiveCapacity;
      const currentTotalRockets = state.rockets.filter(r => r !== null).length;

      // Calculate how many rockets to build based on research bonuses
      const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier');
      const batchBonus = state.getEffectMultiplier('buildRocketBatchBonus') || 0;
      const desiredCountFloat = 1 * (buildMultiplier || 1) + batchBonus;
      let desiredCount = Math.max(1, Math.floor(desiredCountFloat));
      desiredCount = Math.min(desiredCount, maxRockets - currentTotalRockets);

      if (desiredCount <= 0) return {};

      const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');

      // Calculate how many rockets we can afford
      let affordableCount = 0;
      let totalBatchCost = 0;
      for (let i = 0; i < desiredCount; i++) {
        const idx = currentTotalRockets + i;
        const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, idx);
        const cost = Math.round(baseCost * constructionMultiplier);
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
       // Check if science rockets are unlocked
       if (state.researchedNodes.indexOf('o4') === -1) {
         return {}; // Science rockets not unlocked
       }
       
       const effectiveCapacity = state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus');
       const maxRockets = state.spaceports.length * effectiveCapacity;
       const currentTotalRockets = state.rockets.filter(r => r !== null).length;

       // Calculate how many rockets to build based on research bonuses
       const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier');
       const batchBonus = state.getEffectMultiplier('buildRocketBatchBonus') || 0;
       const desiredCountFloat = 1 * (buildMultiplier || 1) + batchBonus;
       let desiredCount = Math.max(1, Math.floor(desiredCountFloat));
       desiredCount = Math.min(desiredCount, maxRockets - currentTotalRockets);

       if (desiredCount <= 0) return {};

       const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');

       // Calculate how many rockets we can afford
       let affordableCount = 0;
       let totalBatchCost = 0;
       for (let i = 0; i < desiredCount; i++) {
         const idx = currentTotalRockets + i;
         const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, idx);
         const cost = Math.round(baseCost * constructionMultiplier);
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
        // Check if spaceports are unlocked via research
        if (state.researchedNodes.indexOf('o5') === -1) {
          return {}; // Spaceports not unlocked
        }
        const currentSpaceportCost = get().getCurrentSpaceportCost()
        if (state.money >= currentSpaceportCost) {
          const newId = state.spaceports.length > 0 ? Math.max(...state.spaceports.map(sp => sp.id)) + 1 : 1;
          return { money: state.money - currentSpaceportCost, spaceports: [...state.spaceports, { id: newId }] }
        }
        return {}
      }),
  buildSpaceStation: (type: SpaceStation['type']) => set(state => {
    const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');
    const costCargo = Math.round(500 * constructionMultiplier);
    const costScience = Math.round(500 * constructionMultiplier);
    if (state.cargo >= costCargo && state.science >= costScience) {
      return {
        cargo: state.cargo - costCargo,
        science: state.science - costScience,
        spaceStations: [...state.spaceStations, {
          id: `station-${Date.now()}-${Math.random()}`,
          type,
          level: 1
        }],
        notifications: [`Deployed ${type} station`, ...state.notifications].slice(0, 5)
      };
    }
    return {};
  }),
   buildFuelRefinery: () =>
     set(state => {
       // Check if refineries are unlocked via research
       if (state.researchedNodes.indexOf('o6') === -1) {
         return {}; // Refineries not unlocked
       }
       const baseCost = state.fuelRefineryCost * Math.pow(COST_SCALING.FUEL_REFINERY_COST_EXPONENT, state.fuelRefineries);
       const currentFuelRefineryCost = Math.round(baseCost * state.getEffectMultiplier('constructionCostMultiplier'));
       if (state.money >= currentFuelRefineryCost) {
         return {
           money: state.money - currentFuelRefineryCost,
           fuelRefineries: state.fuelRefineries + 1,
         }
       }
       return {}
     }),
  toggleSpaceport: (_index: number) =>
    set(_state => {
      // Spaceport types removed - this function is deprecated
      return {}
    }),
    clearExplosion: (rocketId: number) =>
      set(state => {
        // Check if explosion clearing is unlocked via research
        if (state.researchedNodes.indexOf('o7') === -1) {
          return {}; // Explosion clearing not unlocked
        }
        
        // Calculate how many explosions to clear based on research bonuses
        const clearMultiplier = state.getEffectMultiplier('clearExplosionMultiplier');
        const clearCountBonus = state.getEffectMultiplier('clearExplosionCountBonus') || 0;
        const desiredCountFloat = 1 * (clearMultiplier || 1) + clearCountBonus;
        let desiredCount = Math.max(1, Math.floor(desiredCountFloat));
        
        // Find exploded rockets to clear (starting with the one clicked)
        const explodedToProcess = [rocketId];
        for (const id of state.explodedRocketIds) {
          if (id !== rocketId && explodedToProcess.length < desiredCount) {
            explodedToProcess.push(id);
          }
        }
        
        const newRockets = [...state.rockets];
        let scienceGained = 0;
        const clearedIds: number[] = [];
        
        for (const id of explodedToProcess) {
          if (state.explodedRocketIds.includes(id)) {
            const rocketIndex = newRockets.findIndex(r => r !== null && r.id === id);
            if (rocketIndex !== -1) {
              newRockets[rocketIndex] = null; // Set the slot to null
              scienceGained += 1;
              clearedIds.push(id);
            }
          }
        }
        
        if (clearedIds.length === 0) return {};

        let newActiveContract = state.activeContract ? { ...state.activeContract } : null;
        if (newActiveContract && newActiveContract.status === 'active' && newActiveContract.maxExplosions !== -1) {
          newActiveContract.currentExplosions += clearedIds.length;
          if (newActiveContract.currentExplosions > newActiveContract.maxExplosions) {
            newActiveContract.status = 'failed';
            get().addNotification(`Contract Failed: ${newActiveContract.title} (Too many explosions)`);
          }
        }

        return {
          explodedRocketIds: state.explodedRocketIds.filter(id => !clearedIds.includes(id)),
          rockets: newRockets,
          science: state.science + scienceGained,
          activeContract: newActiveContract,
        }
      }),
  getCurrentSpaceportCost: () => {
    const state = get();
    return Math.round(state.spaceportCost * Math.pow(COST_SCALING.SPACEPORT_COST_EXPONENT, state.spaceports.length) * state.getEffectMultiplier('constructionCostMultiplier'));
  },
  getEffectMultiplier: (type: EffectType) => {
    const state = get();
    const multipliers = researchTree
      .filter((node: ResearchNode) => state.researchedNodes.includes(node.id) && node.effect.type === type)
      .map((node: ResearchNode) => node.effect.value);
    
    // Most effects are multiplicative, but some might be additive bonuses
    // We treat 'Multiplier' suffix as multiplicative, others as additive
    if (type.endsWith('Multiplier')) {
      // Multiplicative: default to 1 (no change when multiplied)
      return multipliers.length === 0 ? 1 : multipliers.reduce((acc, val) => acc * val, 1);
    } else {
      // Additive: default to 0 (no bonus when added)
      return multipliers.length === 0 ? 0 : multipliers.reduce((acc, val) => acc + val, 0);
    }
   },
    getAvailableNodes: () => {
       const state = get();
       return researchTree.filter((node: ResearchNode) => {
         // Not already researched
         if (state.researchedNodes.includes(node.id)) return false;
         // Has enough science
         if (state.science < node.scienceCost) return false;
         // Prerequisites are met
         if (!node.prerequisites.every(p => state.researchedNodes.includes(p))) return false;
         return true;
       });
     },
    setView: (view: "surface" | "orbit" | "contracts" | "research") => set({ currentView: view }),
  addNotification: (message: string) => set(state => ({ notifications: [message, ...state.notifications].slice(0, 5) })),
  generateContracts: () => set(state => {
    if (state.availableContracts.length >= 3) return {};
    
    const newContracts: Contract[] = [...state.availableContracts];
    const companiesToPick = [...state.companies];
    
    // Contract type definitions with different resource focuses
    const contractTypes = [
      {
        type: 'logistics',
        titles: ['Cargo Haul', 'Supply Run', 'Freight Contract'],
        description: 'A cargo-heavy delivery contract.',
        cargoMultiplier: 2.0,
        scienceMultiplier: 0.2,
        moneyMultiplier: 0.5,
        rewardMoneyBonus: 1.3,
      },
      {
        type: 'research',
        titles: ['Research Grant', 'Science Initiative', 'Data Collection'],
        description: 'A science-focused research contract.',
        cargoMultiplier: 0.2,
        scienceMultiplier: 3.0,
        moneyMultiplier: 0.3,
        rewardScienceBonus: 2.0,
      },
      {
        type: 'commercial',
        titles: ['Trade Deal', 'Commercial Venture', 'Investment Project'],
        description: 'A money-focused commercial contract.',
        cargoMultiplier: 0.3,
        scienceMultiplier: 0.2,
        moneyMultiplier: 2.0,
        rewardMoneyBonus: 1.5,
      },
      {
        type: 'balanced',
        titles: ['Partnership', 'Joint Venture', 'Expansion Project'],
        description: 'A balanced contract requiring all resources.',
        cargoMultiplier: 1.0,
        scienceMultiplier: 1.0,
        moneyMultiplier: 1.0,
        rewardMoneyBonus: 1.0,
      },
    ];
    
    while (newContracts.length < 3 && companiesToPick.length > 0) {
      const companyIndex = Math.floor(Math.random() * companiesToPick.length);
      const company = companiesToPick.splice(companyIndex, 1)[0];
      
      const levelScale = company.level;
      const isFragile = Math.random() > 0.7;
      const isTimed = Math.random() > 0.5;
      
      // Pick a random contract type
      const contractType = contractTypes[Math.floor(Math.random() * contractTypes.length)];
      const titleBase = contractType.titles[Math.floor(Math.random() * contractType.titles.length)];

      // Base requirements scaled by level
      const baseCargoReq = 50 * levelScale * (1 + Math.random());
      const baseScienceReq = 100 * levelScale * (1 + Math.random());
      const baseMoneyReq = 300 * levelScale * (1 + Math.random());
      
      // Base rewards scaled by level
      const baseMoneyReward = 800 * levelScale * (1 + Math.random());
      const baseScienceReward = 50 * levelScale * (1 + Math.random());

      newContracts.push({
        id: `contract-${Date.now()}-${Math.random()}`,
        companyId: company.id,
        title: `${company.name} ${titleBase} #${Math.floor(Math.random() * 1000)}`,
        description: `${contractType.description} Support ${company.name}'s operations.`,
        requiredCargo: Math.round(baseCargoReq * contractType.cargoMultiplier),
        requiredScience: Math.round(baseScienceReq * contractType.scienceMultiplier),
        requiredMoney: Math.round(baseMoneyReq * contractType.moneyMultiplier),
        deliveredCargo: 0,
        deliveredScience: 0,
        deliveredMoney: 0,
        rewardMoney: Math.round(baseMoneyReward * (contractType.rewardMoneyBonus || 1)),
        rewardScience: Math.round(baseScienceReward * (contractType.rewardScienceBonus || 1)),
        rewardExperience: 50 * levelScale,
        timeLimitSeconds: isTimed ? 60 + Math.floor(Math.random() * 120) : 0,
        elapsedSeconds: 0,
        maxExplosions: isFragile ? 1 + Math.floor(Math.random() * 3) : -1,
        currentExplosions: 0,
        status: 'available'
      });
    }
    
    return { availableContracts: newContracts };
  }),
  acceptContract: (contractId: string) => set(state => {
    if (state.activeContract) return {};
    
    const contract = state.availableContracts.find(c => c.id === contractId);
    if (!contract) return {};
    
    return {
      activeContract: { ...contract, status: 'active' },
      availableContracts: state.availableContracts.filter(c => c.id !== contractId),
      notifications: [`Contract Accepted: ${contract.title}`, ...state.notifications].slice(0, 5)
    };
  }),
  forfeitContract: () => set(state => {
    const contract = state.activeContract;
    if (!contract || contract.status !== 'active') return {};

    // Forfeit penalty: reduce company XP by 50% of the reward
    const company = state.companies.find(c => c.id === contract.companyId);
    if (!company) return { activeContract: null };

    const xpPenalty = Math.floor(contract.rewardExperience * 0.5);
    const newExperience = Math.max(0, company.experience - xpPenalty);
    
    const newCompanies = state.companies.map(c => 
      c.id === company.id ? { ...c, experience: newExperience } : c
    );

    get().addNotification(`Contract Forfeited: ${contract.title} (-${xpPenalty} XP for ${company.name})`);

    return {
      companies: newCompanies,
      activeContract: null,
    };
  }),
   toggleAutoBuild: () => set(state => ({ autoBuildActive: !state.autoBuildActive })),
   toggleAutoSalvage: () => set(state => ({ autoSalvageActive: !state.autoSalvageActive })),
   unlockNode: (nodeId: string) => set(state => {
    const node = researchTree.find(n => n.id === nodeId);
    if (!node) return {};
    
    // Check if already researched
    if (state.researchedNodes.includes(nodeId)) return {};
    
    // Check prerequisites
    const metPrereqs = node.prerequisites.every(p => state.researchedNodes.includes(p));
    if (!metPrereqs) return {};
    
    // Check science cost
    if (state.science < node.scienceCost) return {};
    
    get().addNotification(`Technology Unlocked: ${node.name}`);
    
    return {
      science: state.science - node.scienceCost,
      researchedNodes: [...state.researchedNodes, nodeId]
    };
  }),
}))

