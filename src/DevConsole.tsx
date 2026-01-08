import { useGameStore } from './useGameStore.js';
import { INITIAL_STATE } from './gameConstants.js';

export function DevConsole() {
  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem('gameState');
    
    // Reset the Zustand store to initial defaults
    useGameStore.setState({
      money: INITIAL_STATE.MONEY,
      science: INITIAL_STATE.SCIENCE,
      fuel: INITIAL_STATE.FUEL,
      cargo: INITIAL_STATE.CARGO,
      tickCount: 0,
      currentView: "surface",
      notifications: ['Game state reset to defaults'],
      rockets: [],
      nextRocketId: 0,
      rocketCost: INITIAL_STATE.ROCKET_COST,
      profitPerRocket: INITIAL_STATE.PROFIT_PER_ROCKET,
      spaceportCapacity: INITIAL_STATE.SPACEPORT_CAPACITY,
      spaceports: [{ id: 1 }],
      spaceStations: [],
      spaceportCost: INITIAL_STATE.SPACEPORT_COST,
      fuelRefineries: 0,
      fuelProductionPerRefinery: INITIAL_STATE.FUEL_PRODUCTION_PER_REFINERY,
      fuelCostPerRocket: INITIAL_STATE.FUEL_COST_PER_ROCKET,
      fuelRefineryCost: INITIAL_STATE.FUEL_REFINERY_COST,
      explodedRocketIds: [],
      rocketExplosionChance: INITIAL_STATE.ROCKET_EXPLOSION_CHANCE,
      recentlyLaunchedRocketIds: [],
      newlyAvailableResearchIds: [],
      researchedNodes: [],
      previouslyAvailableResearch: [],
      autoBuildActive: false,
      autoSalvageActive: false,
      companies: [
        { id: 'titan', name: 'Titan Mining Corp', level: 1, experience: 0 },
        { id: 'nova', name: 'Nova Research', level: 1, experience: 0 },
        { id: 'zenith', name: 'Zenith Logistics', level: 1, experience: 0 },
        { id: 'orion', name: 'Orion Heavy Industries', level: 1, experience: 0 },
        { id: 'galactic', name: 'Galactic Energy', level: 1, experience: 0 },
        { id: 'atlas', name: 'Atlas Construction', level: 1, experience: 0 },
        { id: 'pulsar', name: 'Pulsar Electronics', level: 1, experience: 0 },
        { id: 'stellar', name: 'Stellar Bio-Tech', level: 1, experience: 0 },
        { id: 'aegis', name: 'Aegis Security', level: 1, experience: 0 },
        { id: 'dse', name: 'Deep Space Exploration', level: 1, experience: 0 },
      ],
      availableContracts: [],
      activeContract: null,
    });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
    }}>
      <h3>Dev Console</h3>
      <button
        onClick={handleReset}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '8px 12px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Reset Saved State
      </button>
    </div>
  );
}
