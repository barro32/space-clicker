import { create } from 'zustand'

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
}

const SPACEPORT_EXPLODE = 0.1

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
  rocketExplosionChance: 0.9,
  upgradeScienceRequirement: 10,
  researchedUpgrades: [],
  tick: () => set(state => {
    const activeRocketIds = state.rockets.filter(r => r !== null).map(r => r!.id).filter(id => !state.explodedRocketIds.includes(id));
    
    let fuelAvailable = state.fuel + state.fuelRefineries * state.fuelProductionPerRefinery;
    let successfulLaunches = 0;
    let newExplodedRocketIds = [...state.explodedRocketIds];
    let newActiveContract = state.activeContract ? { ...state.activeContract } : null;

    // Process each rocket launch
    for (const rocketId of activeRocketIds) {
      if (fuelAvailable >= state.fuelCostPerRocket) {
        fuelAvailable -= state.fuelCostPerRocket;
        
        // Roll for explosion
        if (Math.random() < state.rocketExplosionChance) {
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

    let cargoProd = successfulLaunches * state.profitPerRocket;
    let sciProd = 0;
    let cargoResourceProd = successfulLaunches * 0.1;

    // Passive Spaceport Bonuses
    for (let i = 0; i < state.spaceports.length; i++) {
      if (state.spaceports[i].type === "cargo") {
        cargoProd += (i + 1)
      } else {
        // Science mode: generates science based on successful launches from this spaceport
        // For simplicity, we split successful launches across spaceports
        const spaceportLaunches = Math.floor(successfulLaunches / state.spaceports.length);
        sciProd += spaceportLaunches;
      }
    }

    // Apply Orbital Station Benefits
    if (state.spaceStations) {
      state.spaceStations.forEach(station => {
        if (station.type === 'research') {
          sciProd += 10 * station.level;
        } else if (station.type === 'logistics') {
          cargoProd += 50 * station.level;
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
      const maxRockets = state.spaceports.length * state.spaceportCapacity;
      const currentTotalRockets = state.rockets.filter(r => r !== null).length;

      if (currentTotalRockets < maxRockets) {
        const currentRocketCost = Math.round(state.rocketCost * Math.pow(1.2, currentTotalRockets));
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
    const costCargo = 500;
    const costScience = 500;
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
      const currentFuelRefineryCost = Math.round(state.fuelRefineryCost * Math.pow(1.5, state.fuelRefineries));
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
    return Math.round(state.spaceportCost * Math.pow(1.5, state.spaceports.length));
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
        money: state.money + contract.rewardMoney,
        companies: newCompanies,
        activeContract: null, // Clear active contract
      };
    }
    return {};
  }),
}))

