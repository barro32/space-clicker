import { create } from 'zustand'

interface Spaceport {
  type: "cargo" | "science"
}

interface Explosion {
  spIndex: number
  slot: number
}

interface GameState {
  money: number
  science: number
  rockets: number
  rocketCost: number
  profitPerRocket: number
  spaceportCapacity: number
  spaceports: Spaceport[]
  spaceportCost: number
  explosions: Explosion[]
  tick: () => void
  buildRocket: () => void
  buildSpaceport: () => void
  toggleSpaceport: (index: number) => void
  clearExplosion: (spIndex: number, slot: number) => void
}

const ROCKET_EXPLODE = 0.9
const SPACEPORT_EXPLODE = 0.1

export const useGameStore = create<GameState>((set, get) => ({
  money: 1000,
  science: 0,
  rockets: 100,
  rocketCost: 10,
  profitPerRocket: 1,
  spaceportCapacity: 100,
  spaceports: [{ type: "cargo" }],
  spaceportCost: 100,
  explosions: [],
  tick: () => set(state => {
    let cargoProd = 0
    let sciProd = 0
    for (let i = 0; i < state.spaceports.length; i++) {
      let fill = Math.max(0, Math.min(state.spaceportCapacity, state.rockets - i * state.spaceportCapacity))
      if (state.spaceports[i].type === "cargo") {
        cargoProd += fill * state.profitPerRocket
      } else {
        sciProd += fill
      }
    }
    let newMoney = state.money + cargoProd
    let newScience = state.science + sciProd
    let newRockets = state.rockets
    let newSpaceports = [...state.spaceports]
    let newExplosions = [...state.explosions]
    if (Math.random() < ROCKET_EXPLODE && newRockets > 0) {
      newRockets = newRockets - 1
      const spIndex = Math.floor((state.rockets - 1) / state.spaceportCapacity)
      const slot = (state.rockets - 1) % state.spaceportCapacity
      newExplosions.push({ spIndex, slot })
      if (Math.random() < SPACEPORT_EXPLODE) {
        let spRocketCount = Math.max(0, Math.min(state.spaceportCapacity, state.rockets - spIndex * state.spaceportCapacity))
        newRockets = state.rockets - spRocketCount
        newExplosions = Array.from({ length: spRocketCount }, (_, j) => ({ spIndex, slot: j }))
      }
    }
    return {
      money: newMoney,
      science: newScience,
      rockets: newRockets,
      spaceports: newSpaceports,
      explosions: newExplosions,
    }
  }),
  buildRocket: () =>
    set(state => {
      if (state.money >= state.rocketCost) {
        return { money: state.money - state.rocketCost, rockets: state.rockets + 1 }
      }
      return {}
    }),
  buildSpaceport: () =>
    set(state => {
      if (state.money >= state.spaceportCost) {
        return { money: state.money - state.spaceportCost, spaceports: [...state.spaceports, { type: "cargo" }] }
      }
      return {}
    }),
  toggleSpaceport: (index: number) =>
    set(state => {
      const newSpaceports = state.spaceports.map((sp, i) => i === index ? { type: sp.type === "cargo" ? "science" : "cargo" } : sp)
      return { spaceports: newSpaceports }
    }),
  clearExplosion: (spIndex: number, slot: number) =>
    set(state => ({
      explosions: state.explosions.filter(exp => !(exp.spIndex === spIndex && exp.slot === slot)),
      money: state.money + 10
    }))
}))
