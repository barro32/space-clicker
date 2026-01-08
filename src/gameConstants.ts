/**
 * Game Constants
 * Centralized configuration for all game mechanics to avoid magic numbers
 */

// Default Companies - used across App.tsx and useGameStore.ts
export const DEFAULT_COMPANIES = [
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
];

// Initial Game State
export const INITIAL_STATE = {
  MONEY: 10,
  SCIENCE: 0,
  FUEL: 100,
  CARGO: 0,
  SPACEPORT_CAPACITY: 2,
  ROCKET_COST: 1,
  PROFIT_PER_ROCKET: 1,
  FUEL_REFINERY_COST: 20,
  FUEL_COST_PER_ROCKET: 1,
  FUEL_PRODUCTION_PER_REFINERY: 1,
  SPACEPORT_COST: 200,
  ROCKET_EXPLOSION_CHANCE: 0.5,
};

// Cost Scaling Factors
export const COST_SCALING = {
  ROCKET_COST_EXPONENT: 1.35,
  SPACEPORT_COST_EXPONENT: 1.5,
  FUEL_REFINERY_COST_EXPONENT: 1.5,
};

// Production Values
export const PRODUCTION = {
  SCIENCE_PER_EXPLOSION: 1,
  SCIENCE_PER_SCIENCE_ROCKET: 1,
  CARGO_PER_SUCCESSFUL_LAUNCH: 0.1,
  STATION_SCIENCE_BONUS: 10,
  STATION_LOGISTICS_BONUS: 50,
  PASSIVE_CARGO_BONUS_PER_SPACEPORT: 1,
  PASSIVE_SCIENCE_PER_SPACEPORT: 1,
};

// Time-related
export const TIME = {
  TICK_INTERVAL_MS: 1000,
  DISPLAY_TIME_THRESHOLD_SECONDS: 60,
};
