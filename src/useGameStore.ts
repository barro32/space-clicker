import { create } from 'zustand'
import { researchTree, ResearchNode } from './researchTree'

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

interface Upgrade {
  id: string;
  name: string;
  description: string;
  apply: (state: GameState) => Partial<GameState>;
  prerequisites: string[];
}

export const upgrades: Upgrade[] = [
  {
    id: 'profit',
    name: 'Increased Profits',
    description: 'Increases profit per rocket by 1.',
    apply: state => ({ profitPerRocket: state.profitPerRocket + 1 }),
    prerequisites: [],
  },
  {
    id: 'rocket_cost',
    name: 'Cheaper Rockets',
    description: 'Decreases rocket cost by 10%.',
    apply: state => ({ rocketCost: Math.max(1, Math.floor(state.rocketCost * 0.9)) }),
    prerequisites: [],
  },
  {
    id: 'spaceport_cost',
    name: 'Cheaper Spaceports',
    description: 'Decreases spaceport cost by 10%.',
    apply: state => ({ spaceportCost: Math.max(10, Math.floor(state.spaceportCost * 0.9)) }),
    prerequisites: [],
  },
  {
    id: 'explosion_chance',
    name: 'Safer Rockets',
    description: 'Decreases rocket explosion chance by 10%.',
    apply: state => ({ rocketExplosionChance: state.rocketExplosionChance * 0.9 }),
    prerequisites: [],
  },
  {
    id: 'improved_refinery_output',
    name: 'Improved Refinery Output',
    description: 'Increases fuel production per refinery by 1.',
    apply: state => ({ fuelProductionPerRefinery: state.fuelProductionPerRefinery + 1 }),
    prerequisites: [],
  },
];

export interface GameState {
  money: number
  science: number
  fuel: number;
  cargo: number;
  currentView: "surface" | "orbit" | "contracts";
  notifications: string[];
  companies: Company[];
  availableContracts: Contract[];
  activeContract: Contract | null;
  rockets: ({ id: number } | null)[];
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
  upgradeLevel: number;
  availableUpgrades: Upgrade[];
  rocketExplosionChance: number;
  upgradeScienceRequirement: number;
  getUpgradeScienceRequirement: () => number;
  getCurrentSpaceportCost: () => number;
  getEffectMultiplier: (type: string) => number;
  setView: (view: "surface" | "orbit" | "contracts") => void;
  addNotification: (message: string) => void;
  generateContracts: () => void;
  acceptContract: (contractId: string) => void;
  deliverContractResources: () => void;
  tick: () => void
  buildRocket: () => void
  buildSpaceport: () => void
  buildSpaceStation: (type: SpaceStation['type']) => void
  buildFuelRefinery: () => void;
  toggleSpaceport: (index: number) => void
  clearExplosion: (rocketId: number) => void
  checkForUpgrades: () => void;
  selectUpgrade: (upgradeId: string) => void;
  researchedUpgrades: string[];
  researchedNodes: string[];
  unlockNode: (nodeId: string) => void;
}



export const useGameStore = create<GameState>((set, get) => ({
  money: 10,
  science: 0,
  fuel: 100,
  cargo: 0,
  currentView: "surface" as "surface" | "orbit" | "contracts",
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
  rocketCost: 10,
  profitPerRocket: 1,
  spaceportCapacity: 9,
  spaceports: [{ type: "cargo" }],
  spaceStations: [],
  spaceportCost: 1000,
  fuelRefineries: 0,
  fuelProductionPerRefinery: 1,
  fuelCostPerRocket: 1,
  fuelRefineryCost: 500,
  explodedRocketIds: [],
  upgradeLevel: 1,
  availableUpgrades: [],
  rocketExplosionChance: 0.05,
  upgradeScienceRequirement: 10,
  researchedUpgrades: [],
  researchedNodes: [],
  tick: () => set(state => {
    const activeRocketIds = state.rockets.filter(r => r !== null).map(r => r!.id).filter(id => !state.explodedRocketIds.includes(id));
    
    const fuelProduction = state.fuelRefineries * state.fuelProductionPerRefinery * state.getEffectMultiplier('refineryOutputMultiplier');
    let fuelAvailable = state.fuel + fuelProduction;
    let successfulLaunches = 0;
    let newExplodedRocketIds = [...state.explodedRocketIds];
    let newActiveContract = state.activeContract ? { ...state.activeContract } : null;

    const effectiveFuelCost = state.fuelCostPerRocket * state.getEffectMultiplier('fuelCostMultiplier');
    const effectiveExplosionChance = state.rocketExplosionChance * state.getEffectMultiplier('explosionChanceMultiplier');

    // Process each rocket launch
    for (const rocketId of activeRocketIds) {
      if (fuelAvailable >= effectiveFuelCost) {
        fuelAvailable -= effectiveFuelCost;
        
        // Roll for explosion
        if (Math.random() < effectiveExplosionChance) {
          newExplodedRocketIds.push(rocketId);
          // Handle contract fragility
          if (newActiveContract && newActiveContract.status === 'active' && newActiveContract.maxExplosions !== -1) {
            newActiveContract.currentExplosions += 1;
            if (newActiveContract.currentExplosions > newActiveContract.maxExplosions) {
              newActiveContract.status = 'failed';
              get().addNotification(`Contract Failed: ${newActiveContract.title} (Too many explosions)`);
            }
          }
        } else {
          successfulLaunches += 1;
        }
      }
    }

    let cargoProd = successfulLaunches * state.profitPerRocket * state.getEffectMultiplier('profitMultiplier');
    let sciProd = 0;
    let cargoResourceProd = successfulLaunches * 0.1 * state.getEffectMultiplier('cargoGenerationMultiplier');

    // Passive Spaceport Bonuses
    for (let i = 0; i < state.spaceports.length; i++) {
      if (state.spaceports[i].type === "cargo") {
        cargoProd += (i + 1)
      } else {
        const spaceportLaunches = Math.floor(successfulLaunches / state.spaceports.length);
        sciProd += spaceportLaunches;
      }
    }

    // Apply Orbital Station Benefits
    if (state.spaceStations) {
      state.spaceStations.forEach(station => {
        if (station.type === 'research') {
          sciProd += 10 * station.level * state.getEffectMultiplier('stationScienceMultiplier');
        } else if (station.type === 'logistics') {
          cargoProd += 50 * station.level * state.getEffectMultiplier('stationLogisticsMultiplier');
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
    if (newScience >= get().getUpgradeScienceRequirement() && state.availableUpgrades.length === 0) {
      get().checkForUpgrades();
    }

    return {
      money: state.money + cargoProd,
      science: newScience,
      fuel: fuelAvailable,
      cargo: state.cargo + cargoResourceProd,
      activeContract: newActiveContract,
      explodedRocketIds: newExplodedRocketIds,
    }
  }),
  buildRocket: () =>
    set(state => {
      const effectiveCapacity = state.spaceportCapacity + state.getEffectMultiplier('spaceportCapacityBonus');
      const maxRockets = state.spaceports.length * effectiveCapacity;
      const currentTotalRockets = state.rockets.filter(r => r !== null).length;

      if (currentTotalRockets < maxRockets) {
        const baseCost = state.rocketCost * Math.pow(1.2, currentTotalRockets);
        const currentRocketCost = Math.round(baseCost * state.getEffectMultiplier('constructionCostMultiplier'));
        if (state.money >= currentRocketCost) {
          const newRockets = [...state.rockets];
          const newRocket = { id: state.nextRocketId };

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
      const baseCost = state.fuelRefineryCost * Math.pow(1.5, state.fuelRefineries);
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
  checkForUpgrades: () => set(state => {
    if (state.availableUpgrades.length > 0) {
      return {};
    }
    const chosenUpgrades = [];
    const available = upgrades.filter(u => u.prerequisites.every(p => state.researchedUpgrades.includes(p)));
    for (let i = 0; i < 3; i++) {
      if (available.length === 0) break;
      const randomIndex = Math.floor(Math.random() * available.length);
      chosenUpgrades.push(available.splice(randomIndex, 1)[0]);
    }
    return { availableUpgrades: chosenUpgrades };
  }),
  selectUpgrade: (upgradeId: string) => set(state => {
    const upgrade = upgrades.find(u => u.id === upgradeId);
    if (!upgrade) {
      return {};
    }

    const newState = upgrade.apply(get());

    return {
      ...newState,
      science: state.science - get().getUpgradeScienceRequirement(),
      upgradeLevel: state.upgradeLevel + 1,
      availableUpgrades: [],
      researchedUpgrades: [...state.researchedUpgrades, upgradeId],
    };
  }),
  getUpgradeScienceRequirement: () => {
    const state = get();
    return Math.floor(state.upgradeScienceRequirement * Math.pow(1.1, state.upgradeLevel));
  },
  getCurrentSpaceportCost: () => {
    const state = get();
    return Math.round(state.spaceportCost * Math.pow(1.5, state.spaceports.length) * state.getEffectMultiplier('constructionCostMultiplier'));
  },
  getEffectMultiplier: (type: string) => {
    const state = get();
    const multipliers = researchTree
      .filter(node => state.researchedNodes.includes(node.id) && node.effect.type === type)
      .map(node => node.effect.value);
    
    if (multipliers.length === 0) return 1;
    
    // Most effects are multiplicative, but some might be additive bonuses
    // We treat 'Multiplier' suffix as multiplicative, others as additive
    if (type.endsWith('Multiplier')) {
      return multipliers.reduce((acc, val) => acc * val, 1);
    } else {
      return multipliers.reduce((acc, val) => acc + val, 0); // Wait, base is usually different for additive
    }
  },
  setView: (view: "surface" | "orbit" | "contracts") => set({ currentView: view }),
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

