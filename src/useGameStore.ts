import { create } from 'zustand'
import { researchTree, ResearchNode } from './researchTree.js'
import { INITIAL_STATE, COST_SCALING, PRODUCTION } from './gameConstants.js'

interface Spaceport {
  type: "cargo" | "science"
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
  rewardMoney: number;
  rewardScience: number;
  rewardExperience: number;
  timeLimitSeconds: number; // 0 for no limit
  elapsedSeconds: number;
  maxExplosions: number; // -1 for no limit
  currentExplosions: number;
  status: 'available' | 'active' | 'completed' | 'failed';
}

interface Explosion {
  spIndex: number
  slot: number
}

export interface GameState {
   money: number
   science: number
   fuel: number;
   cargo: number;
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
  getCurrentSpaceportCost: () => number;
  getEffectMultiplier: (type: string) => number;
  setView: (view: "surface" | "orbit" | "contracts" | "research") => void;
  addNotification: (message: string) => void;
  generateContracts: () => void;
  acceptContract: (contractId: string) => void;
  deliverContractResources: () => void;
  tick: () => void
   buildRocket: () => void
   buildScienceRocket: () => void
   buildSpaceport: () => void
   buildSpaceStation: (type: SpaceStation['type']) => void
   buildFuelRefinery: () => void;
   toggleSpaceport: (index: number) => void
   clearExplosion: (rocketId: number) => void;
   researchedNodes: string[];
   previouslyAvailableResearch: string[];
   autoBuildActive: boolean;
   toggleAutoBuild: () => void;
   unlockNode: (nodeId: string) => void;
   getAvailableNodes: () => ResearchNode[];
}



export const useGameStore = create<GameState>((set, get) => ({
  money: INITIAL_STATE.MONEY,
  science: INITIAL_STATE.SCIENCE,
  fuel: INITIAL_STATE.FUEL,
  cargo: INITIAL_STATE.CARGO,
  currentView: "surface",
  notifications: [],
  companies: [
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
  ],
  availableContracts: [],
   activeContract: null,
   rockets: [],
   nextRocketId: 0,
    rocketCost: INITIAL_STATE.ROCKET_COST,
     profitPerRocket: INITIAL_STATE.PROFIT_PER_ROCKET,
     spaceportCapacity: INITIAL_STATE.SPACEPORT_CAPACITY,
    spaceports: [{ type: "cargo" }],
    spaceStations: [],
     spaceportCost: INITIAL_STATE.SPACEPORT_COST,
    fuelRefineries: 0,
     fuelProductionPerRefinery: INITIAL_STATE.FUEL_PRODUCTION_PER_REFINERY,
     fuelCostPerRocket: INITIAL_STATE.FUEL_COST_PER_ROCKET,
     fuelRefineryCost: INITIAL_STATE.FUEL_REFINERY_COST,
      explodedRocketIds: [],
      rocketExplosionChance: INITIAL_STATE.ROCKET_EXPLOSION_CHANCE,
     researchedNodes: [],
     previouslyAvailableResearch: [],
     autoBuildActive: false,
     tick: () => set(state => {
      const activeRockets = state.rockets.filter((r): r is { id: number; type: 'cargo' | 'science' } => r !== null).filter(r => !state.explodedRocketIds.includes(r.id));
     
     const fuelProduction = state.fuelRefineries * state.fuelProductionPerRefinery * state.getEffectMultiplier('refineryOutputMultiplier');
     let fuelAvailable = state.fuel + fuelProduction;
     let successfulCargoLaunches = 0;
     let successfulScienceLaunches = 0;
     let explosionCount = 0;
     let newExplodedRocketIds = [...state.explodedRocketIds];
     let newActiveContract = state.activeContract ? { ...state.activeContract } : null;

     const effectiveFuelCost = state.fuelCostPerRocket * state.getEffectMultiplier('fuelCostMultiplier');
     const effectiveExplosionChance = state.rocketExplosionChance * state.getEffectMultiplier('explosionChanceMultiplier');

     // Process each rocket launch
     for (const rocket of activeRockets) {
       // All rockets have a chance to explode, whether fueled or not
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
       } else if (fuelAvailable >= effectiveFuelCost) {
         // Only successful launches if: (1) didn't explode AND (2) have fuel
         fuelAvailable -= effectiveFuelCost;
         if (rocket.type === 'cargo') {
           successfulCargoLaunches += 1;
         } else {
           successfulScienceLaunches += 1;
         }
       }
       // If didn't explode but no fuel: rocket stays active (waiting)
     }

    let cargoProd = successfulCargoLaunches * state.profitPerRocket * state.getEffectMultiplier('profitMultiplier');
    let sciProd = successfulScienceLaunches * PRODUCTION.SCIENCE_PER_SCIENCE_ROCKET + explosionCount * PRODUCTION.SCIENCE_PER_EXPLOSION;
    let cargoResourceProd = successfulCargoLaunches * PRODUCTION.CARGO_PER_SUCCESSFUL_LAUNCH * state.getEffectMultiplier('cargoGenerationMultiplier');

     // Passive Spaceport Bonuses
     for (let i = 0; i < state.spaceports.length; i++) {
       if (state.spaceports[i].type === "cargo") {
         cargoProd += (i + 1) * PRODUCTION.PASSIVE_CARGO_BONUS_PER_SPACEPORT;
      } else {
        const spaceportLaunches = Math.floor(successfulCargoLaunches / state.spaceports.length);
        sciProd += spaceportLaunches;
      }
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
    }

    const newScience = state.science + sciProd;

    // Auto-build logic (only during passive phase, before returning state)
    let finalMoney = state.money + cargoProd;
    let finalRockets = state.rockets;
    let finalNextId = state.nextRocketId;

    const autoBuildEnabled = state.getEffectMultiplier('autoBuildEnabled') > 0;
    if (autoBuildEnabled && state.autoBuildActive) {
      const effectiveCapacity = state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus');
      const maxRockets = state.spaceports.length * effectiveCapacity;
      let currentTotalRockets = state.rockets.filter(r => r !== null).length;

      if (currentTotalRockets < maxRockets) {
        const buildMultiplier = state.getEffectMultiplier('buildRocketMultiplier');
        const batchBonus = state.getEffectMultiplier('buildRocketBatchBonus') || 0;
        const actionSpeed = state.getEffectMultiplier('actionSpeedMultiplier') || 1;
        const desiredCountFloat = 1 * buildMultiplier * actionSpeed + batchBonus;
        let desiredCount = Math.max(1, Math.floor(desiredCountFloat));
        desiredCount = Math.min(desiredCount, maxRockets - currentTotalRockets);

        const constructionMultiplier = state.getEffectMultiplier('constructionCostMultiplier');

        // Calculate how many rockets we can afford
        let affordableCount = 0;
        let totalBatchCost = 0;
        for (let i = 0; i < desiredCount; i++) {
          const idx = currentTotalRockets + i;
          const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, idx);
          const cost = Math.round(baseCost * constructionMultiplier);
          if (finalMoney >= totalBatchCost + cost) {
            totalBatchCost += cost;
            affordableCount += 1;
          } else {
            break;
          }
        }

         if (affordableCount > 0) {
           const newRockets = [...state.rockets];
           for (let i = 0; i < affordableCount; i++) {
             const newRocket = { id: finalNextId + i, type: 'cargo' as const };
             const firstNullIndex = newRockets.findIndex(r => r === null);
             if (firstNullIndex !== -1) {
               newRockets[firstNullIndex] = newRocket;
             } else {
               newRockets.push(newRocket);
             }
           }
           finalRockets = newRockets;
           finalNextId += affordableCount;
           finalMoney -= totalBatchCost;
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
      science: newScience,
      fuel: fuelAvailable,
      cargo: state.cargo + cargoResourceProd,
      activeContract: newActiveContract,
      explodedRocketIds: newExplodedRocketIds,
      rockets: finalRockets,
      nextRocketId: finalNextId,
      previouslyAvailableResearch: currentAvailableIds,
      notifications: updatedNotifications,
    }
  }),
  buildRocket: () =>
    set(state => {
      const effectiveCapacity = state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus');
      const maxRockets = state.spaceports.length * effectiveCapacity;
      const currentTotalRockets = state.rockets.filter(r => r !== null).length;

       if (currentTotalRockets < maxRockets) {
          const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, currentTotalRockets);
         const currentRocketCost = Math.round(baseCost * state.getEffectMultiplier('constructionCostMultiplier'));
         if (state.money >= currentRocketCost) {
           const newRockets = [...state.rockets];
           const newRocket = { id: state.nextRocketId, type: 'cargo' as const };

           // Find first null slot
           const firstNullIndex = newRockets.findIndex(r => r === null);
           if (firstNullIndex !== -1) {
             newRockets[firstNullIndex] = newRocket;
           } else {
             // If no null slot, append
             newRockets.push(newRocket);
           }

           return {
             money: state.money - currentRocketCost,
             rockets: newRockets,
             nextRocketId: state.nextRocketId + 1,
           }
         }
       }
       return {}
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

        if (currentTotalRockets < maxRockets) {
         const baseCost = state.rocketCost * Math.pow(COST_SCALING.ROCKET_COST_EXPONENT, currentTotalRockets);
          const currentRocketCost = Math.round(baseCost * state.getEffectMultiplier('constructionCostMultiplier'));
          if (state.money >= currentRocketCost) {
            const newRockets = [...state.rockets];
            const newRocket = { id: state.nextRocketId, type: 'science' as const };

            // Find first null slot
            const firstNullIndex = newRockets.findIndex(r => r === null);
            if (firstNullIndex !== -1) {
              newRockets[firstNullIndex] = newRocket;
            } else {
              // If no null slot, append
              newRockets.push(newRocket);
            }

            return {
              money: state.money - currentRocketCost,
              rockets: newRockets,
              nextRocketId: state.nextRocketId + 1,
            }
          }
        }
       return {}
     }),
    buildSpaceport: () =>
      set(state => {
        // Check if spaceports are unlocked via research
        if (state.researchedNodes.indexOf('o5') === -1) {
          return {}; // Spaceports not unlocked
        }
        const currentSpaceportCost = get().getCurrentSpaceportCost()
        if (state.money >= currentSpaceportCost) {
          return { money: state.money - currentSpaceportCost, spaceports: [...state.spaceports, { type: "cargo" }] }
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
  toggleSpaceport: (index: number) =>
    set(state => {
      const newSpaceports = state.spaceports.map((sp, i) => i === index ? ({ type: sp.type === "cargo" ? "science" : "cargo" } as Spaceport) : sp)
      return { spaceports: newSpaceports }
    }),
    clearExplosion: (rocketId: number) =>
      set(state => {
        // Check if explosion clearing is unlocked via research
        if (state.researchedNodes.indexOf('o7') === -1) {
          return {}; // Explosion clearing not unlocked
        }
        
        const newRockets = [...state.rockets];
        const rocketIndex = newRockets.findIndex(r => r !== null && r.id === rocketId);
        if (rocketIndex !== -1) {
          newRockets[rocketIndex] = null; // Set the slot to null
        }

        let newActiveContract = state.activeContract ? { ...state.activeContract } : null;
        if (newActiveContract && newActiveContract.status === 'active' && newActiveContract.maxExplosions !== -1) {
          newActiveContract.currentExplosions += 1;
          if (newActiveContract.currentExplosions > newActiveContract.maxExplosions) {
            newActiveContract.status = 'failed';
            get().addNotification(`Contract Failed: ${newActiveContract.title} (Too many explosions)`);
          }
        }

        return {
          explodedRocketIds: state.explodedRocketIds.filter(id => id !== rocketId),
          rockets: newRockets,
          science: state.science + 1,
         activeContract: newActiveContract,
       }
     }),
  getCurrentSpaceportCost: () => {
    const state = get();
    return Math.round(state.spaceportCost * Math.pow(COST_SCALING.SPACEPORT_COST_EXPONENT, state.spaceports.length) * state.getEffectMultiplier('constructionCostMultiplier'));
  },
  getEffectMultiplier: (type: string) => {
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
    
    while (newContracts.length < 3 && companiesToPick.length > 0) {
      const companyIndex = Math.floor(Math.random() * companiesToPick.length);
      const company = companiesToPick.splice(companyIndex, 1)[0];
      
      const levelScale = company.level;
      const isFragile = Math.random() > 0.7;
      const isTimed = Math.random() > 0.5;

      newContracts.push({
        id: `contract-${Date.now()}-${Math.random()}`,
        companyId: company.id,
        title: `${company.name} ${['Supply', 'Research', 'Delivery', 'Project'][Math.floor(Math.random() * 4)]} #${Math.floor(Math.random() * 1000)}`,
        description: `Deliver resources to support ${company.name}'s expansion.`,
        requiredCargo: Math.round(100 * levelScale * (1 + Math.random())),
        requiredScience: Math.round(50 * levelScale * (1 + Math.random())),
        rewardMoney: Math.round(1000 * levelScale * (1 + Math.random())),
        rewardScience: Math.round(100 * levelScale * (Math.random())),
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
  deliverContractResources: () => set(state => {
    const contract = state.activeContract;
    if (!contract || contract.status !== 'active') return {};

    if (state.cargo >= contract.requiredCargo && state.science >= contract.requiredScience) {
      // Complete Contract
      const company = state.companies.find(c => c.id === contract.companyId);
      if (!company) return {};

      const newExperience = company.experience + contract.rewardExperience;
      const experienceToLevel = company.level * 100;
      let newLevel = company.level;
      let finalExperience = newExperience;

      if (finalExperience >= experienceToLevel) {
        finalExperience -= experienceToLevel;
        newLevel += 1;
        get().addNotification(`${company.name} leveled up to ${newLevel}!`);
      }

      const newCompanies = state.companies.map(c => 
        c.id === company.id ? { ...c, level: newLevel, experience: finalExperience } : c
      );

      get().addNotification(`Contract Completed: ${contract.title}`);

      return {
        cargo: state.cargo - contract.requiredCargo,
        science: state.science - contract.requiredScience + contract.rewardScience,
        money: state.money + contract.rewardMoney * state.getEffectMultiplier('contractMoneyMultiplier'),
        companies: newCompanies,
        activeContract: null, // Clear active contract
      };
    }
     return {};
   }),
   toggleAutoBuild: () => set(state => ({ autoBuildActive: !state.autoBuildActive })),
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

