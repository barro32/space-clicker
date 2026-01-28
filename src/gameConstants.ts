/**
 * Game Constants
 * Centralized configuration for all game mechanics to avoid magic numbers
 */

// Company Perk Effect Types
export type CompanyPerkEffect = 
  // Titan Mining (Money)
  | 'profitMultiplier'
  | 'rocketCostMultiplier'
  | 'spaceportCostMultiplier'
  | 'passiveMoneyBonus'
  | 'fuelToMoneyBonus' // Money gen scales with fuel %
  | 'globalMoneyMultiplier' // Flat global money multiplier
  // Nova Research (Science)
  | 'sciencePerRocketBonus'
  | 'sciencePerSalvageBonus'
  | 'researchCostMultiplier'
  | 'passiveScienceBonus'
  | 'sciencePerExplosionBonus'
  | 'satelliteScienceBonus' // Satellites generate passive science
  | 'stationScienceScale' // Science scales with station levels
  // Zenith Logistics (Cargo)
  | 'cargoPerLaunchMultiplier'
  | 'stationBonusMultiplier'
  | 'stationCostMultiplier'
  | 'passiveCargoBonus'
  | 'dockingDurationReduction'
  | 'transitSpeedMultiplier' // Reduces Earth-to-Orbit transit time
   // Galactic Energy (Fuel)
   | 'fuelCostMultiplier'
   | 'refineryOutputMultiplier'
   | 'fuelCapacityBonus'
   | 'refineryCostMultiplier'
   // Aegis Security (Safety)
  | 'explosionChanceMultiplier'
  | 'salvageSpeedMultiplier'
  | 'autoSalvageSpeedMultiplier'
   | 'hazardDurationReduction'
   | 'scienceFromExplosions' // Explosions grant science based on rocket cost
  // Atlas Engineering (Speed/Capacity)
  | 'spaceportCapacityBonus'
  | 'batchBuildBonus'
  | 'buildSpeedMultiplier'
  | 'autoBuildSpeedMultiplier'
  | 'maxActiveContractsBonus';

// Company Perk Definition
export interface CompanyPerk {
  level: number;
  name: string;
  description: string;
  effect: CompanyPerkEffect;
  value: number;
}

// Company Definition with Perks
export interface CompanyDefinition {
  id: string;
  name: string;
  focus: string;
  color: string;
  perks: CompanyPerk[];
}

// 6 Specialized Companies with 10 Perks Each (one per level)
export const COMPANY_DEFINITIONS: CompanyDefinition[] = [
  {
    id: 'titan',
    name: 'Titan Mining Corp',
    focus: 'Money & Profits',
    color: 'green',
    perks: [
      { level: 1, name: 'Startup Grant', description: '+5% profit per rocket', effect: 'profitMultiplier', value: 1.05 },
      { level: 2, name: 'Profit Margins', description: '+10% profit per rocket', effect: 'profitMultiplier', value: 1.10 },
      { level: 3, name: 'Bulk Discount I', description: '-5% rocket construction cost', effect: 'rocketCostMultiplier', value: 0.95 },
      { level: 4, name: 'Bulk Discount II', description: '-10% rocket construction cost', effect: 'rocketCostMultiplier', value: 0.90 },
      { level: 5, name: 'Liquid Assets', description: 'Money scales with fuel % (up to +50% at full)', effect: 'fuelToMoneyBonus', value: 0.5 },
      { level: 6, name: 'Monopoly', description: '+25% global money production', effect: 'globalMoneyMultiplier', value: 1.25 },
      { level: 7, name: 'Infrastructure Deal', description: '-15% spaceport cost', effect: 'spaceportCostMultiplier', value: 0.85 },
      { level: 8, name: 'Mega Infrastructure', description: '-20% spaceport cost', effect: 'spaceportCostMultiplier', value: 0.80 },
      { level: 9, name: 'Passive Income', description: '+25 passive money/tick', effect: 'passiveMoneyBonus', value: 25 },
      { level: 10, name: 'Mining Empire', description: '+50 passive money/tick', effect: 'passiveMoneyBonus', value: 50 },
    ],
  },
  {
    id: 'nova',
    name: 'Nova Research',
    focus: 'Science & Tech',
    color: 'blue',
    perks: [
      { level: 1, name: 'Lab Assistant', description: '+1 science per explosion', effect: 'sciencePerExplosionBonus', value: 1 },
      { level: 2, name: 'Data Collection', description: '+1 science per science rocket', effect: 'sciencePerRocketBonus', value: 1 },
      { level: 3, name: 'Field Notes', description: '+1 science per salvage', effect: 'sciencePerSalvageBonus', value: 1 },
      { level: 4, name: 'Debris Analysis', description: '+2 science per salvage', effect: 'sciencePerSalvageBonus', value: 2 },
      { level: 5, name: 'Telemetry Link', description: 'Satellites generate +1 science/tick each', effect: 'satelliteScienceBonus', value: 1 },
      { level: 6, name: 'Orbital Labs', description: 'Each station level adds +2% global science', effect: 'stationScienceScale', value: 0.02 },
      { level: 7, name: 'Tech Transfer', description: '-10% research costs', effect: 'researchCostMultiplier', value: 0.90 },
      { level: 8, name: 'Research Network', description: '-15% research costs', effect: 'researchCostMultiplier', value: 0.85 },
      { level: 9, name: 'Think Tank', description: '+3 passive science/tick', effect: 'passiveScienceBonus', value: 3 },
      { level: 10, name: 'Science Academy', description: '+7 passive science/tick', effect: 'passiveScienceBonus', value: 7 },
    ],
  },
  {
    id: 'zenith',
    name: 'Zenith Logistics',
    focus: 'Cargo & Stations',
    color: 'purple',
    perks: [
      { level: 1, name: 'Better Packaging', description: '+10% cargo per launch', effect: 'cargoPerLaunchMultiplier', value: 1.10 },
      { level: 2, name: 'Efficient Loading', description: '+20% cargo per launch', effect: 'cargoPerLaunchMultiplier', value: 1.20 },
      { level: 3, name: 'Orbital Expertise', description: '+25% station bonuses', effect: 'stationBonusMultiplier', value: 1.25 },
      { level: 4, name: 'Orbital Synergy', description: '+40% station bonuses', effect: 'stationBonusMultiplier', value: 1.40 },
      { level: 5, name: 'Quick Turnaround', description: '-20% docking duration', effect: 'dockingDurationReduction', value: 0.20 },
      { level: 6, name: 'Express Transit', description: '-50% Earth-to-Orbit transit time', effect: 'transitSpeedMultiplier', value: 0.50 },
      { level: 7, name: 'Modular Design', description: '-15% station construction cost', effect: 'stationCostMultiplier', value: 0.85 },
      { level: 8, name: 'Prefab Stations', description: '-25% station construction cost', effect: 'stationCostMultiplier', value: 0.75 },
      { level: 9, name: 'Cargo Network', description: '+3 passive cargo/tick', effect: 'passiveCargoBonus', value: 3 },
      { level: 10, name: 'Logistics Empire', description: '+7 passive cargo/tick', effect: 'passiveCargoBonus', value: 7 },
    ],
  },
  {
    id: 'galactic',
    name: 'Galactic Energy',
    focus: 'Fuel & Refineries',
    color: 'orange',
    perks: [
      { level: 1, name: 'Fuel Saver', description: '-5% fuel cost per launch', effect: 'fuelCostMultiplier', value: 0.95 },
      { level: 2, name: 'Fuel Efficiency', description: '-10% fuel cost per launch', effect: 'fuelCostMultiplier', value: 0.90 },
      { level: 3, name: 'Better Refining', description: '+15% refinery output', effect: 'refineryOutputMultiplier', value: 1.15 },
      { level: 4, name: 'Refined Output', description: '+25% refinery output', effect: 'refineryOutputMultiplier', value: 1.25 },
      { level: 5, name: 'Extra Tanks', description: '+50 max fuel capacity', effect: 'fuelCapacityBonus', value: 50 },
      { level: 6, name: 'Reserve Tanks', description: '+100 max fuel capacity', effect: 'fuelCapacityBonus', value: 100 },
       { level: 7, name: 'Industrial Scale', description: '-15% refinery cost', effect: 'refineryCostMultiplier', value: 0.85 },
       { level: 8, name: 'Mass Production', description: '-25% refinery cost', effect: 'refineryCostMultiplier', value: 0.75 },
       { level: 9, name: 'Quantum Refining', description: '+50% refinery output', effect: 'refineryOutputMultiplier', value: 1.5 },
       { level: 10, name: 'Infinite Reserves', description: '+200 max fuel capacity', effect: 'fuelCapacityBonus', value: 200 },
    ],
  },
  {
    id: 'aegis',
    name: 'Aegis Security',
    focus: 'Safety & Salvage',
    color: 'red',
    perks: [
      { level: 1, name: 'Safety Training', description: '-5% explosion chance', effect: 'explosionChanceMultiplier', value: 0.95 },
      { level: 2, name: 'Safety Protocols', description: '-10% explosion chance', effect: 'explosionChanceMultiplier', value: 0.90 },
       { level: 3, name: 'Quick Cleanup', description: '+50% manual salvage speed', effect: 'salvageSpeedMultiplier', value: 1.5 },
       { level: 4, name: 'Salvage Expertise', description: '+3 science per salvage', effect: 'sciencePerSalvageBonus', value: 3 },
       { level: 5, name: 'Advanced Salvage', description: '+100% auto-salvage speed', effect: 'autoSalvageSpeedMultiplier', value: 2 },
       { level: 6, name: 'Black Box', description: 'Explosions grant science (50% of rocket cost)', effect: 'scienceFromExplosions', value: 0.5 },
      { level: 7, name: 'Risk Management', description: '-15% explosion chance', effect: 'explosionChanceMultiplier', value: 0.85 },
      { level: 8, name: 'Hazard Control', description: '-25% hazard duration on Moon', effect: 'hazardDurationReduction', value: 0.25 },
      { level: 9, name: 'Auto Recovery', description: '1.5x auto-salvage speed', effect: 'autoSalvageSpeedMultiplier', value: 1.5 },
      { level: 10, name: 'Safety Empire', description: '2x auto-salvage speed', effect: 'autoSalvageSpeedMultiplier', value: 2.0 },
    ],
  },
  {
    id: 'atlas',
    name: 'Atlas Engineering',
    focus: 'Speed & Capacity',
    color: 'cyan',
    perks: [
      { level: 1, name: 'Extra Pad', description: '+1 spaceport capacity', effect: 'spaceportCapacityBonus', value: 1 },
      { level: 2, name: 'Expanded Pads', description: '+2 spaceport capacity', effect: 'spaceportCapacityBonus', value: 2 },
      { level: 3, name: 'Quick Hands', description: '+20% manual build speed', effect: 'buildSpeedMultiplier', value: 1.2 },
      { level: 4, name: 'Assembly Line', description: '+1 rocket per click', effect: 'batchBuildBonus', value: 1 },
      { level: 5, name: 'Parallel Projects', description: '+1 max active contract', effect: 'maxActiveContractsBonus', value: 1 },
      { level: 6, name: 'Rapid Assembly', description: '+50% manual build speed', effect: 'buildSpeedMultiplier', value: 1.5 },
      { level: 7, name: 'Mass Assembly', description: '+2 rockets per click', effect: 'batchBuildBonus', value: 2 },
      { level: 8, name: 'Mega Hangars', description: '+5 spaceport capacity', effect: 'spaceportCapacityBonus', value: 5 },
      { level: 9, name: 'Auto Efficiency', description: '1.5x auto-build speed', effect: 'autoBuildSpeedMultiplier', value: 1.5 },
      { level: 10, name: 'Automation Master', description: '2x auto-build speed', effect: 'autoBuildSpeedMultiplier', value: 2.0 },
    ],
  },
];

// Default Companies - initialized from definitions
export const DEFAULT_COMPANIES = COMPANY_DEFINITIONS.map(def => ({
  id: def.id,
  name: def.name,
  level: 0,
  contractsCompleted: 0,
}));

// Initial Game State
export const INITIAL_STATE = {
  MONEY: 10,
  SCIENCE: 0,
  FUEL: 100,
  CARGO: 0,
  SPACEPORT_CAPACITY: 1,
  ROCKET_COST: 1,
  PROFIT_PER_ROCKET: 1,
  FUEL_REFINERY_COST: 20,
  FUEL_COST_PER_ROCKET: 1,
  FUEL_PRODUCTION_PER_REFINERY: 1,
  SPACEPORT_COST: 200,
  ROCKET_EXPLOSION_CHANCE: 0.5,
  CONTRACT_REFRESH_INTERVAL: 300, // 5 minutes in seconds
  MAX_AVAILABLE_CONTRACTS: 3,
  MAX_ACTIVE_CONTRACTS: 1,
};

// Cost Scaling Factors
export const COST_SCALING = {
  ROCKET_COST_EXPONENT: 1.35,
  SPACEPORT_COST_EXPONENT: 2.5,
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
  FUEL_REFINERY_CAPACITY_BASE: 10, // Capacity per refinery
};

// Time-related
export const TIME = {
  TICK_INTERVAL_MS: 1000,
  DISPLAY_TIME_THRESHOLD_SECONDS: 60,
};

// Game Settings (user preferences)
export interface GameSettings {
  soundMuted: boolean;
  fullscreen: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
   soundMuted: false,
   fullscreen: false,
};

// Orbital Layer Constants
export const ORBITAL = {
  // Station construction
  STATION_COST_CARGO: 500,
  STATION_COST_SCIENCE: 500,
  
  // Station docking
  BASE_DOCKS_PER_STATION: 2,
  DOCKING_DURATION_TICKS: 15, // How long a rocket stays docked
  DOCKING_BONUS_MULTIPLIER: 3, // Station output multiplier when rocket is docked
  
  // Satellites
  SATELLITE_COST_CARGO: 100,
  SATELLITE_COST_SCIENCE: 50,
  MAX_SATELLITES_BASE: 10,
  SATELLITE_GLOBAL_BONUS: 0.005, // 0.5% per satellite
  
  // Space debris
  DEBRIS_SPAWN_CHANCE: 0.05, // 5% per tick
  DEBRIS_PENALTY_PER_PIECE: 0.05, // 5% production reduction per debris
  MAX_DEBRIS_PENALTY: 0.5, // Cap at 50% reduction
  DEBRIS_CLEAR_SCIENCE_REWARD: 2,
  
  // Station upgrade costs (multiplied by level)
  STATION_UPGRADE_CARGO_BASE: 200,
  STATION_UPGRADE_SCIENCE_BASE: 200,
  
  // Transit
  TRANSIT_DURATION_TICKS: 3, // Time for rocket to travel from surface to orbit
  
  // Lunar Components - produced by docked rockets at research stations
  LUNAR_COMPONENT_PRODUCTION_RATE: 0.1, // Per tick per docked rocket at research station
};

// Moon Layer Constants
export const MOON = {
  // Landing Mission
  MISSION_COST: {
    fuel: 10000,
    cargo: 2000,
    science: 5000,
    lunarComponents: 100,
  },
  MISSION_DURATION_BASE: 120, // Ticks (2 minutes at 1 tick/sec)
  
  // === LUNAR GRID SYSTEM ===
  // Sector mechanics
  SECTOR_SCAN_COST: { science: 500, cargo: 200 },
  BUILDING_SLOTS_PER_SECTOR: 4,
  MAX_SECTORS: 25, // Max number of sectors players can unlock
  
  // Sector Traits (applied as multipliers)
  SECTOR_TRAITS: {
    regolithRich: { name: 'Regolith Rich', extractorMultiplier: 1.5 },
    regolithPoor: { name: 'Regolith Poor', extractorMultiplier: 0.7 },
    solarRich: { name: 'Solar Rich', solarMultiplier: 1.6 },
    solarPoor: { name: 'Solar Poor', solarMultiplier: 0.6 },
    stable: { name: 'Geologically Stable', hazardChanceMultiplier: 0.5 },
    unstable: { name: 'Unstable Ground', hazardChanceMultiplier: 2.0 },
  },
  
  // === POWER MANAGEMENT SYSTEM ===
  // Day/Night cycle (in ticks)
  DAY_DURATION: 60, // 60 ticks of daylight
  NIGHT_DURATION: 60, // 60 ticks of darkness
  
  // Power generation/consumption
  SOLAR_ARRAY_OUTPUT: 50, // Per tick per array (day only)
  NUCLEAR_REACTOR_OUTPUT: 40, // Per tick per reactor (24/7)
  NUCLEAR_REACTOR_HELIUM3_COST: 0.5, // He-3 consumed per tick
  BATTERY_CAPACITY_PER_UNIT: 100, // Energy stored per battery
  
  // Power demand
  EXTRACTOR_POWER_DEMAND: 10,
  REFINERY_POWER_DEMAND: 15,
  SILO_POWER_DEMAND: 5,
  MAINTENANCE_POWER_DEMAND: 8,
  MASS_DRIVER_POWER_DEMAND: 20,
  
  // === MASS DRIVER LOGISTICS ===
  // Mass Driver mechanics
  MASS_DRIVER_CHARGE_TIME: 30, // Ticks to charge before launch
  MASS_DRIVER_CAPACITY: 100, // He-3 per payload
  MASS_DRIVER_LAUNCH_COOLDOWN: 10, // Ticks between launches
  
  // === BOUNTY SYSTEM ===
  // Earth company bounties (generated dynamically)
  BOUNTY_GENERATION_INTERVAL: 120, // Ticks between bounty refreshes
  BOUNTY_REWARD_MULTIPLIER: 2.5, // 2.5x normal export value
  BOUNTY_TIME_LIMITS: [30, 45, 60, 90], // Possible time limits
  BOUNTY_AMOUNTS: [250, 500, 750, 1000], // He-3 amounts
  
   // Legacy local storage (can be increased by Silos)
   STORAGE_BASE: {
     regolith: 1000,
     helium3: 100,
     alloys: 500,
   },
   STORAGE_PER_SILO: {
     regolith: 500,
     helium3: 50,
     alloys: 250,
   },
  
  // Building Production Rates (apply sector traits)
  EXTRACTOR_REGOLITH_RATE: 5, // Per tick per extractor
  REFINERY_HELIUM3_RATE: 0.1, // Per tick per refinery (consumes regolith)
  REFINERY_REGOLITH_COST: 10, // Regolith consumed per Helium-3 produced
  MASS_DRIVER_HELIUM3_RATE: 5, // Helium-3 transported to Earth per tick (legacy)
  
   // Building Costs
   BUILDING_COSTS: {
     extractor: { cargo: 500, science: 200 },
     refinery: { cargo: 1000, science: 500, regolith: 200 },
     silo: { cargo: 300, science: 100 },
     maintenance: { cargo: 800, science: 400 },
     massDriver: { cargo: 2000, science: 1000, regolith: 500 },
     solarArray: { cargo: 600, science: 300 },
     nuclearReactor: { cargo: 1200, science: 800 },
     battery: { cargo: 400, science: 150 },
     fabricator: { cargo: 1500, science: 600, regolith: 300 },
   },
  
  // Building Cost Scaling
  BUILDING_COST_EXPONENT: 1.4,
  
  // Hazards
  HAZARD_CHANCE: 0.02, // 2% per tick
  HAZARD_DUST_CHANCE: 0.7, // 70% chance of Moon Dust (vs 30% Solar Flare)
  HAZARDS: {
    moonDust: {
      name: 'Moon Dust Storm',
      debuff: 0.4, // 40% production reduction
      durationMin: 10,
      durationMax: 20,
    },
    solarFlare: {
      name: 'Solar Flare',
      debuff: 0.8, // 80% production reduction
      durationMin: 5,
      durationMax: 15,
    },
  },
  MAINTENANCE_DURATION_REDUCTION: 0.15, // 15% faster hazard clearing per maintenance building
  
   // Manual Transport (before Mass Drivers)
    MANUAL_TRANSPORT_REGOLITH: 100, // Per click
    MANUAL_TRANSPORT_HELIUM3: 10, // Per click
    
    // === FABRICATOR SYSTEM ===
    // Fabricator (converts regolith to alloys)
    FABRICATOR_ALLOYS_RATE: 0.05, // Per tick per fabricator
    FABRICATOR_REGOLITH_COST: 20, // Regolith consumed per alloy produced
    FABRICATOR_POWER_DEMAND: 25, // Power consumed per fabricator
    
    // === UI/LOG SETTINGS ===
    LOG_MAX_ENTRIES: 50, // Maximum moon log entries to keep in history
    INITIAL_POWER_ENERGY: 200, // Starting energy for moon power system
};

// Automation Settings
export const AUTOMATION = {
  BASE_INTERVAL: 20, // Ticks between auto-build/salvage operations
  SALVAGE_TICK_OFFSET: 10, // Offset to prevent auto-build and auto-salvage on same tick
};

// Contract System
export const CONTRACT = {
  BASE_CARGO_REQ: 50,
  BASE_SCIENCE_REQ: 100,
  BASE_MONEY_REQ: 300,
  
  // Contract type multipliers (difficulty/rarity scaling)
  TYPES: {
    easyMoney: { cargoMul: 0.2, scienceMul: 0.2, moneyMul: 0.2 },
    easyScience: { cargoMul: 0.2, scienceMul: 2.0, moneyMul: 0.2 },
    hardMoney: { cargoMul: 3.0, scienceMul: 0.3, moneyMul: 3.0 },
    hardScience: { cargoMul: 0.3, scienceMul: 3.0, moneyMul: 0.3 },
    balancedSmall: { cargoMul: 1.5, scienceMul: 1.5, moneyMul: 1.0 },
    balancedLarge: { cargoMul: 1.0, scienceMul: 1.0, moneyMul: 1.5 },
    timedChallenge: { cargoMul: 1.0, scienceMul: 1.0, moneyMul: 1.0 },
    fragile: { cargoMul: 1.0, scienceMul: 1.0, moneyMul: 1.0 },
  },
  
  // Base rewards
  BASE_MONEY_REWARD: 800,
  BASE_SCIENCE_REWARD: 50,
  EXPERIENCE_PER_LEVEL: 50, // XP (contracts completed) needed per company level
  
  // Special contract properties
  FRAGILE_CHANCE: 0.7, // Probability of fragile contract type (>0.7 = fragile)
  TIMED_CHANCE: 0.5, // Probability of timed contract modifier (>0.5 = timed)
  TIME_LIMIT_BASE: 60, // Base ticks for timed contracts
  TIME_LIMIT_VARIANCE_MAX: 120, // Max additional ticks variance for timed contracts
  FRAGILE_EXPLOSION_LIMIT_MAX: 3, // Max explosions before fragile contract fails
};

// Layer Unlock Thresholds
export const LAYER_UNLOCK = {
  ORBIT_CARGO_REQUIRED: 500, // Cargo needed to unlock orbital layer
  CONTRACTS_LAUNCHES_REQUIRED: 1000, // Rocket launches needed to unlock contracts
};

// Game UI/UX Settings
export const GAME = {
  MAX_NOTIFICATIONS: 5, // Maximum notifications to display at once
  MOON_LOG_MAX_ENTRIES: 50, // Maximum moon log entries (also in MOON.LOG_MAX_ENTRIES)
};
