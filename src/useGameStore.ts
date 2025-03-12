import { create } from 'zustand';

interface GameState {
  money: number;
  rockets: number;
  rocketCost: number;
  profitPerRocket: number;
  spaceportCapacity: number;
  spaceports: number;
  spaceportCost: number;
  tick: () => void;
  buildRocket: () => void;
  buySpaceport: () => void;
}

const ROCKET_EXPLODE = 0.01;
const SPACEPORT_EXPLODE = 0.01;

export const useGameStore = create<GameState>((set, get) => ({
  money: 1000,
  rockets: 1,
  rocketCost: 10,
  profitPerRocket: 1,
  spaceportCapacity: 10,
  spaceports: 1,
  spaceportCost: 100,
  tick: () => set(state => {
    let newMoney = state.money + state.rockets * state.profitPerRocket;
    let newRockets = state.rockets;
    let newSpaceports = state.spaceports;

    if (Math.random() < ROCKET_EXPLODE) {
      newRockets = Math.max(0, newRockets - 1);
      if (Math.random() < SPACEPORT_EXPLODE) {
        newSpaceports = Math.max(0, newSpaceports - 1);
      }
    }

    return {
      money: newMoney,
      rockets: newRockets,
      spaceports: newSpaceports,
    };
  }),
  buildRocket: () =>
    set(state => {
      if (state.rockets < state.spaceports * state.spaceportCapacity && state.money >= state.rocketCost) {
        return { money: state.money - state.rocketCost, rockets: state.rockets + 1 };
      }
      return {};
    }),
  buySpaceport: () =>
    set(state => {
      if (state.money >= state.spaceportCost) {
        return { money: state.money - state.spaceportCost, spaceports: state.spaceports + 1 };
      }
      return {};
    })
}));
