import * as React from 'react';
import { useGameStore } from './useGameStore.js';

export function DevConsole() {
  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem('gameState');
    
    // Reset the Zustand store to initial defaults
    useGameStore.setState({
      money: 10,
      science: 0,
      fuel: 100,
      cargo: 0,
      currentView: "surface",
       notifications: ['Game state reset to defaults'],
       rockets: [],
       nextRocketId: 0,
       rocketCost: 1,
       profitPerRocket: 1,
        spaceportCapacity: 3,
        spaceports: [{ type: "cargo" }],
        spaceStations: [],
        spaceportCost: 200,
       fuelRefineries: 0,
       fuelProductionPerRefinery: 1,
       fuelCostPerRocket: 1,
       fuelRefineryCost: 20,
       explodedRocketIds: [],
       rocketExplosionChance: 0.75,
       researchedNodes: [],
       autoBuildActive: false,
       previouslyAvailableResearch: [],
       companies: [
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
