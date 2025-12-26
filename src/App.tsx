import { useEffect } from 'react'
import { useGameStore, GameState } from "./useGameStore"
import { FaMoneyBillAlt, FaFlask, FaGasPump, FaBoxOpen } from 'react-icons/fa' // Added FaGasPump
import { SpaceportView } from "./SpaceportView"
import { OrbitView } from "./OrbitView"
import { ContractsView } from "./ContractsView"
import { ResearchTreeView } from "./ResearchTreeView"
import { DevConsole } from './DevConsole'


export function App() {
  const { money, science, fuel, cargo, tick, currentView, setView, notifications } = useGameStore()

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
        rocketExplosionChance: state.rocketExplosionChance,
        researchedNodes: state.researchedNodes,
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
        <button 
          onClick={() => setView("research")} 
          className={`px-4 py-2 rounded ${currentView === "research" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Research
        </button>
      </div>
      {currentView === "surface" ? <SpaceportView /> : currentView === "orbit" ? <OrbitView /> : currentView === "contracts" ? <ContractsView /> : <ResearchTreeView />}
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
      <DevConsole />

    </div>
  )
}
