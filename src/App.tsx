import { useEffect } from 'react'
import { useGameStore, GameState, upgrades } from "./useGameStore"
import { FaMoneyBillAlt, FaFlask, FaGasPump, FaBoxOpen } from 'react-icons/fa' // Added FaGasPump
import { SpaceportView } from "./SpaceportView"
import { OrbitView } from "./OrbitView"
import { ContractsView } from "./ContractsView"
import { DevConsole } from './DevConsole'


export function App() {
  const { money, science, fuel, cargo, tick, availableUpgrades, selectUpgrade, currentView, setView, notifications } = useGameStore()

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  useEffect(() => {
    const savedState = localStorage.getItem('gameState');
    if (savedState) {
      const state = JSON.parse(savedState);
      // Ensure spaceStations is initialized
      if (!state.spaceStations) {
        state.spaceStations = [];
      }
      if (!state.currentView) {
        state.currentView = "surface";
      }
      if (!state.notifications) {
        state.notifications = [];
      }
      if (!state.companies) {
        state.companies = useGameStore.getState().companies;
      }
      if (!state.availableContracts) {
        state.availableContracts = [];
      }
      // Re-hydrate availableUpgrades
      if (state.availableUpgrades && state.availableUpgrades.length > 0) {
        state.availableUpgrades = state.availableUpgrades.map((savedUpgrade: { id: string }) => {
          const fullUpgrade = upgrades.find(u => u.id === savedUpgrade.id);
          return fullUpgrade || savedUpgrade; // Return full upgrade or original if not found
        });
      }
      useGameStore.setState(state);
    }

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const stateToSave = {
        money: state.money,
        science: state.science,
        fuel: state.fuel,
        cargo: state.cargo,
        currentView: state.currentView,
        notifications: state.notifications,
        companies: state.companies,
        availableContracts: state.availableContracts,
        activeContract: state.activeContract,
        rockets: state.rockets,
        nextRocketId: state.nextRocketId,
        rocketCost: state.rocketCost,
        profitPerRocket: state.profitPerRocket,
        spaceportCapacity: state.spaceportCapacity,
        spaceports: state.spaceports,
        spaceStations: state.spaceStations,
        spaceportCost: state.spaceportCost,
        fuelRefineries: state.fuelRefineries,
        fuelProductionPerRefinery: state.fuelProductionPerRefinery,
        fuelCostPerRocket: state.fuelCostPerRocket,
        fuelRefineryCost: state.fuelRefineryCost,
        explodedRocketIds: state.explodedRocketIds,
        upgradeLevel: state.upgradeLevel,
        availableUpgrades: state.availableUpgrades,
        rocketExplosionChance: state.rocketExplosionChance,
        upgradeScienceRequirement: state.upgradeScienceRequirement,
        researchedUpgrades: state.researchedUpgrades, // Add researchedUpgrades
      };
      localStorage.setItem('gameState', JSON.stringify(stateToSave));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-900 text-white overflow-hidden">
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <button 
          onClick={() => setView("surface")} 
          className={`px-4 py-2 rounded ${currentView === "surface" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Surface
        </button>
                <button 
                  onClick={() => setView("orbit")} 
                  className={`px-4 py-2 rounded ${currentView === "orbit" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  Orbit
                </button>
                <button 
                  onClick={() => setView("contracts")} 
                  className={`px-4 py-2 rounded ${currentView === "contracts" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
                >
                  Contracts
                </button>
              </div>
              {currentView === "surface" ? <SpaceportView /> : currentView === "orbit" ? <OrbitView /> : <ContractsView />}
              {/* Notifications Overlay */}
      <div className="absolute top-16 left-4 z-30 flex flex-col gap-2 pointer-events-none">
        {notifications.map((msg, i) => (
          <div key={i} className="bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm opacity-90 animate-pulse">
            {msg}
          </div>
        ))}
      </div>

      <div className="z-10">
        <p className="flex justify-center items-center text-2xl">
          <FaMoneyBillAlt className="mr-2"/> {money}
        </p>
        <p className="flex justify-center items-center text-2xl">
          <FaFlask className="mr-2"/> {science}
        </p>
        <p className="flex justify-center items-center text-2xl">
          <FaGasPump className="mr-2"/> {fuel}
        </p>
        <p className="flex justify-center items-center text-2xl">
          <FaBoxOpen className="mr-2"/> {Math.floor(cargo)}
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
