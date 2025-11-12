import { create } from 'zustand'

interface Spaceport {
  type: "cargo" | "science"
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
}

const upgrades: Upgrade[] = [
  {
    id: 'profit',
    name: 'Increased Profits',
    description: 'Increases profit per rocket by 1.',
    apply: state => ({ profitPerRocket: state.profitPerRocket + 1 }),
  },
  {
    id: 'rocket_cost',
    name: 'Cheaper Rockets',
    description: 'Decreases rocket cost by 10%.',
    apply: state => ({ rocketCost: Math.max(1, Math.floor(state.rocketCost * 0.9)) }),
  },
  {
    id: 'spaceport_cost',
    name: 'Cheaper Spaceports',
    description: 'Decreases spaceport cost by 10%.',
    apply: state => ({ spaceportCost: Math.max(10, Math.floor(state.spaceportCost * 0.9)) }),
  },
  {
    id: 'explosion_chance',
    name: 'Safer Rockets',
    description: 'Decreases rocket explosion chance by 10%.',
    apply: state => ({ rocketExplosionChance: state.rocketExplosionChance * 0.9 }),
  },
];

export interface GameState {
  money: number
  science: number
  rockets: { id: number }[];
  nextRocketId: number;
  rocketCost: number
  profitPerRocket: number;
  spaceportCapacity: number
  spaceports: Spaceport[]
  spaceportCost: number
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
  toggleSpaceport: (index: number) => void
  clearExplosion: (rocketId: number) => void
  checkForUpgrades: () => void;
  selectUpgrade: (upgradeId: string) => void;
}

const SPACEPORT_EXPLODE = 0.1

export const useGameStore = create<GameState>((set, get) => ({
  money: 10,
  science: 0,
  rockets: [],
  nextRocketId: 0,
  rocketCost: 10,
  profitPerRocket: 1,
  spaceportCapacity: 9,
  spaceports: [{ type: "cargo" }],
  spaceportCost: 1000,
  explodedRocketIds: [],
  upgradeLevel: 1,
  availableUpgrades: [],
  rocketExplosionChance: 0.9,
  upgradeScienceRequirement: 10,
  tick: () => set(state => {
    const activeRockets = state.rockets.length - state.explodedRocketIds.length;
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
    let newMoney = state.money + cargoProd
    let newScience = state.science + sciProd
    let newExplodedRocketIds = [...state.explodedRocketIds]

    if (Math.random() < state.rocketExplosionChance && activeRockets > 0) {
      const activeRocketIds = state.rockets.map(r => r.id).filter(id => !state.explodedRocketIds.includes(id));
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
      explodedRocketIds: newExplodedRocketIds,
    }
  }),
  buildRocket: () =>
    set(state => {
      const maxRockets = state.spaceports.length * state.spaceportCapacity;
      if (state.rockets.length < maxRockets) {
        const activeRockets = state.rockets.length - state.explodedRocketIds.length;
        const currentRocketCost = Math.round(state.rocketCost * Math.pow(1.2, activeRockets));
        if (state.money >= currentRocketCost) {
          return {
            money: state.money - currentRocketCost,
            rockets: [...state.rockets, { id: state.nextRocketId }],
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
  toggleSpaceport: (index: number) =>
    set(state => {
      const newSpaceports = state.spaceports.map((sp, i) => i === index ? ({ type: sp.type === "cargo" ? "science" : "cargo" } as Spaceport) : sp)
      return { spaceports: newSpaceports }
    }),
  clearExplosion: (rocketId: number) =>
    set(state => ({
      explodedRocketIds: state.explodedRocketIds.filter(id => id !== rocketId),
      rockets: state.rockets.filter(r => r.id !== rocketId),
      science: state.science + 1,
    })),
  checkForUpgrades: () => set(state => {
    if (state.availableUpgrades.length > 0) {
      return {};
    }
    const chosenUpgrades = [];
    const available = [...upgrades];
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
