import { useGameStore } from './useGameStore.js';
import { INITIAL_STATE, DEFAULT_COMPANIES } from './gameConstants.js';

export function DevConsole() {
  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem('gameState');
    
    // Reset the Zustand store to initial defaults
    useGameStore.setState({
      money: INITIAL_STATE.MONEY,
      science: INITIAL_STATE.SCIENCE,
      fuel: INITIAL_STATE.FUEL,
      bonusFuelCapacity: 0,
      cargo: INITIAL_STATE.CARGO,
      tickCount: 0,
      currentView: "surface",
      notifications: ['Game state reset to defaults'],
      // Layer unlock tracking
      totalSuccessfulLaunches: 0,
      orbitLayerUnlocked: false,
      contractsLayerUnlocked: false,
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
      companies: DEFAULT_COMPANIES.map(c => ({ ...c })),
      availableContracts: [],
      activeContracts: [],
      contractRefreshTimer: INITIAL_STATE.CONTRACT_REFRESH_INTERVAL,
    });
  };

  const handleSetExplosionChance = () => {
    useGameStore.setState({ rocketExplosionChance: 0 });
  };

  const handleAddMoney = () => {
    const currentMoney = useGameStore.getState().money;
    useGameStore.setState({ money: currentMoney + 1000 });
  };

  const handleAddScience = () => {
    const currentScience = useGameStore.getState().science;
    useGameStore.setState({ science: currentScience + 1000 });
  };

  const handleRefreshContracts = () => {
    useGameStore.getState().generateContracts();
  };

  const handleAddFuelAndCapacity = () => {
    const state = useGameStore.getState();
    useGameStore.setState({
      fuel: state.fuel + 1000,
      bonusFuelCapacity: state.bonusFuelCapacity + 1000,
    });
  };

  const buttonStyle = {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px',
    marginBottom: '8px',
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
      maxWidth: '300px',
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '10px' }}>Dev Console</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <button onClick={handleReset} style={buttonStyle}>
          Reset State
        </button>
        <button onClick={handleSetExplosionChance} style={{ ...buttonStyle, backgroundColor: '#f44336' }}>
          0% Explosions
        </button>
        <button onClick={handleAddMoney} style={{ ...buttonStyle, backgroundColor: '#2196F3' }}>
          +1000 Money
        </button>
        <button onClick={handleAddScience} style={{ ...buttonStyle, backgroundColor: '#9C27B0' }}>
          +1000 Science
        </button>
        <button onClick={handleRefreshContracts} style={{ ...buttonStyle, backgroundColor: '#FF9800' }}>
          Refresh Contracts
        </button>
        <button onClick={handleAddFuelAndCapacity} style={{ ...buttonStyle, backgroundColor: '#00BCD4' }}>
          +1000 Fuel & Capacity
        </button>
      </div>
    </div>
  );
}
