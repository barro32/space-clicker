import { useEffect } from 'react'
import { useGameStore, GameState } from "./useGameStore"
import { FaMoneyBillAlt, FaFlask } from 'react-icons/fa'
import { SpaceportView } from "./SpaceportView"
import { DevConsole } from './DevConsole'

export function App() {
  const { money, science, tick, availableUpgrades, selectUpgrade } = useGameStore()

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const state = JSON.parse(savedState);
      useGameStore.setState(state);
    }

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const stateToSave = {
        money: state.money,
        science: state.science,
        rockets: state.rockets,
        nextRocketId: state.nextRocketId,
        rocketCost: state.rocketCost,
        profitPerRocket: state.profitPerRocket,
        spaceportCapacity: state.spaceportCapacity,
        spaceports: state.spaceports,
        spaceportCost: state.spaceportCost,
        explodedRocketIds: state.explodedRocketIds,
        upgradeLevel: state.upgradeLevel,
        availableUpgrades: state.availableUpgrades,
        rocketExplosionChance: state.rocketExplosionChance,
        upgradeScienceRequirement: state.upgradeScienceRequirement,
      };
      localStorage.setItem('gameState', JSON.stringify(stateToSave));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-900 text-white overflow-hidden">
      <SpaceportView />
      <div className="z-10">
        <p className="flex justify-center items-center text-2xl">
          <FaMoneyBillAlt className="mr-2"/> {money}
        </p>
        <p className="flex justify-center items-center text-2xl">
          <FaFlask className="mr-2"/> {science}
        </p>
      </div>
      {availableUpgrades.length > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg">
            <h2 className="text-2xl mb-4">Select an Upgrade</h2>
            <div className="grid grid-cols-3 gap-4">
              {availableUpgrades.map(upgrade => {
                const state = useGameStore.getState();
                const newState = upgrade.apply(state);
                const changedValueKey = Object.keys(newState)[0] as keyof GameState;
                const oldValue = state[changedValueKey];
                const newValue = newState[changedValueKey];

                let oldValueDisplay: React.ReactNode = '';
                let newValueDisplay: React.ReactNode = '';
                if (changedValueKey === 'rocketExplosionChance') {
                  oldValueDisplay = `${((oldValue as number) * 100).toFixed(2)}%`;
                  newValueDisplay = `${((newValue as number) * 100).toFixed(2)}%`;
                } else if (typeof oldValue === 'number' && typeof newValue === 'number') {
                  oldValueDisplay = oldValue.toLocaleString();
                  newValueDisplay = newValue.toLocaleString();
                } else {
                  oldValueDisplay = String(oldValue);
                  newValueDisplay = String(newValue);
                }

                return (
                  <div key={upgrade.id} className="bg-gray-700 p-4 rounded-lg cursor-pointer" onClick={() => selectUpgrade(upgrade.id)}>
                    <h3 className="text-xl">{upgrade.name}</h3>
                    <p>{upgrade.description}</p>
                    <p>
                      {oldValueDisplay}{" -> "}{newValueDisplay}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
      <DevConsole />
    </div>
  )
}
