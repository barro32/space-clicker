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

export const useGameStore = create<GameState>((set, get) => ({
  money: 10,
  rockets: 1,
  rocketCost: 10,
  profitPerRocket: 1,
  spaceportCapacity: 10,
  spaceports: 1,
  spaceportCost: 100,
  tick: () => set(state => ({ money: state.money + state.rockets * state.profitPerRocket })),
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
