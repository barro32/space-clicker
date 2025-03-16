let money = 10;
let rockets = 1;
let rocketCost = 10;
let profitPerRocket = 1;
let spaceportCapacity = 10;
let spaceports = 1;
let spaceportCost = 100;

let listeners: (() => void)[] = [];

let cachedSnapshot: {
  money: number;
  rockets: number;
  rocketCost: number;
  profitPerRocket: number;
  spaceportCapacity: number;
  spaceports: number;
  spaceportCost: number;
} | null = null;

export const game = {
  subscribe(listener: () => void) {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },
  getSnapshot() {
    const newSnapshot = {
      money,
      rockets,
      rocketCost,
      profitPerRocket,
      spaceportCapacity,
      spaceports,
      spaceportCost
    };
    if (
      cachedSnapshot &&
      cachedSnapshot.money === newSnapshot.money &&
      cachedSnapshot.rockets === newSnapshot.rockets &&
      cachedSnapshot.rocketCost === newSnapshot.rocketCost &&
      cachedSnapshot.profitPerRocket === newSnapshot.profitPerRocket &&
      cachedSnapshot.spaceportCapacity === newSnapshot.spaceportCapacity &&
      cachedSnapshot.spaceports === newSnapshot.spaceports &&
      cachedSnapshot.spaceportCost === newSnapshot.spaceportCost
    ) {
      return cachedSnapshot;
    }
    cachedSnapshot = newSnapshot;
    return newSnapshot;
  },
  tick() {
    money += rockets * profitPerRocket;
    emitChange();
  },
  buildRocket() {
    if (rockets < spaceports * spaceportCapacity && money >= rocketCost) {
      money -= rocketCost;
      rockets++;
      emitChange();
    }
  },
  buySpaceport() {
    if (money >= spaceportCost) {
      money -= spaceportCost;
      spaceports++;
      emitChange();
    }
  }
};

function emitChange() {
  listeners.forEach(l => l());
}

setInterval(() => {
  game.tick();
}, 1000);
