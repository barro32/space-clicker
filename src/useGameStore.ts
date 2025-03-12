import { create } from 'zustand';

interface Spaceport {
  type: "cargo" | "science";
}

interface GameState {
  money: number;
  science: number;
  rockets: number;
  rocketCost: number;
  profitPerRocket: number;
  spaceportCapacity: number;
  spaceports: Spaceport[];
  spaceportCost: number;
  tick: () => void;
  buildRocket: () => void;
  buildSpaceport: () => void;
  toggleSpaceport: (index: number) => void;
}

const ROCKET_EXPLODE = 0.01;
const SPACEPORT_EXPLODE = 0.01;

export const useGameStore = create<GameState>((set, get) => ({
  money: 1000,
  science: 0,
  rockets: 1,
  rocketCost: 10,
  profitPerRocket: 1,
  spaceportCapacity: 9,
  spaceports: [{ type: "cargo" }],
  spaceportCost: 100,
  tick: () => set(state => {
    let newMoney = state.money + state.rockets * state.profitPerRocket;
    let newScience = state.science + state.rockets * 0.1;
    let newRockets = state.rockets;
    let newSpaceports = [...state.spaceports];

    if (Math.random() < ROCKET_EXPLODE) {
      newRockets = Math.max(0, newRockets - 1);
      if (Math.random() < SPACEPORT_EXPLODE && newSpaceports.length > 0) {
        newSpaceports.pop();
      }
    }

    return {
      money: newMoney,
      science: newScience,
      rockets: newRockets,
      spaceports: newSpaceports,
    };
  }),
  buildRocket: () =>
    set(state => {
      if (state.rockets < state.spaceports.length * state.spaceportCapacity && state.money >= state.rocketCost) {
        return { money: state.money - state.rocketCost, rockets: state.rockets + 1 };
      }
      return {};
    }),
  buildSpaceport: () =>
    set(state => {
      if (state.money >= state.spaceportCost) {
        return { money: state.money - state.spaceportCost, spaceports: [...state.spaceports, { type: "cargo" }] };
      }
      return {};
    }),
  toggleSpaceport: (index: number) =>
    set(state => {
      const newSpaceports = state.spaceports.map((sp, i) => i === index ? { type: sp.type === "cargo" ? "science" : "cargo" } : sp);
      return { spaceports: newSpaceports };
    }),
}));
