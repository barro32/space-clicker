import { create } from 'zustand'

interface Spaceport {
  type: "cargo" | "science"
}

export interface SpaceStation {
  id: string;
  type: "research" | "logistics";
  level: number;
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
  fuel: 0,
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
    const activeRockets = state.rockets.filter(r => r !== null).length - state.explodedRocketIds.length;
    let cargoProd = activeRockets * state.profitPerRocket;
    let sciProd = 0
    for (let i = 0; i < state.spaceports.length; i++) {
      if (state.spaceports[i].type === "cargo") {
        cargoProd += (i + 1)
      } else {
        const spaceportRockets = Math.max(0, Math.min(state.spaceportCapacity, activeRockets - i * state.spaceportCapacity));
        sciProd += spaceportRockets
      }
    }

    // Apply Orbital Station Benefits
    state.spaceStations.forEach(station => {
      if (station.type === 'research') {
        sciProd += 10 * station.level;
      } else if (station.type === 'logistics') {
        cargoProd += 50 * station.level;
      }
    });

    let newMoney = state.money + cargoProd
    let newScience = state.science + sciProd
    let newFuel = state.fuel + state.fuelRefineries * state.fuelProductionPerRefinery;
    let newExplodedRocketIds = [...state.explodedRocketIds]

    if (Math.random() < state.rocketExplosionChance && activeRockets > 0) {
      const activeRocketIds = state.rockets.filter(r => r !== null).map(r => r!.id).filter(id => !state.explodedRocketIds.includes(id));
      const rocketToExplodeId = activeRocketIds[Math.floor(Math.random() * activeRocketIds.length)];
      if (rocketToExplodeId !== undefined && !newExplodedRocketIds.includes(rocketToExplodeId)) {
        newExplodedRocketIds.push(rocketToExplodeId);
      }
    }

    if (newScience >= get().getUpgradeScienceRequirement() && state.availableUpgrades.length === 0) {
      get().checkForUpgrades();
    }

    return {
      money: newMoney,
      science: newScience,
      fuel: newFuel,
      explodedRocketIds: newExplodedRocketIds,
    }
  }),
  buildRocket: () =>
    set(state => {
      const maxRockets = state.spaceports.length * state.spaceportCapacity;
      const currentTotalRockets = state.rockets.filter(r => r !== null).length;

      if (currentTotalRockets < maxRockets && state.fuel >= state.fuelCostPerRocket) {
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
            fuel: state.fuel - state.fuelCostPerRocket,
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
    const costMoney = 50000;
    const costScience = 500;
    if (state.money >= costMoney && state.science >= costScience) {
      return {
        money: state.money - costMoney,
        science: state.science - costScience,
        spaceStations: [...state.spaceStations, {
          id: `station-${Date.now()}-${Math.random()}`,
          type,
          level: 1
        }]
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

      return {
        explodedRocketIds: state.explodedRocketIds.filter(id => id !== rocketId),
        rockets: newRockets,
        science: state.science + 1,
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
}))

