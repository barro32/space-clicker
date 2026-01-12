export type ResearchBranch = 'propulsion' | 'infrastructure' | 'commercial' | 'orbital' | 'control' | 'lunar';

// All valid effect types used by research nodes
export type EffectType = 
  | 'explosionChanceMultiplier'
  | 'spaceportCapacityBonus'
  | 'buildRocketMultiplier'
  | 'clearExplosionMultiplier'
  | 'fuelCostMultiplier'
  | 'fuelCapacityBonus'
  | 'cargoGenerationMultiplier'
  | 'cargoPerLaunchMultiplier'
  | 'passiveCargoBonus'
  | 'refineryOutputMultiplier'
  | 'constructionCostMultiplier'
  | 'profitMultiplier'
  | 'contractRequirementMultiplier'
  | 'companyXPMultiplier'
  | 'unlockAfterburner'
  | 'stationLogisticsMultiplier'
  | 'stationScienceMultiplier'
  | 'unlockMoonMissions'
  | 'unlockScienceRockets'
  | 'unlockSpaceports'
  | 'unlockRefineries'
  | 'unlockExplosionClearing'
  | 'buildRocketBatchBonus'
  | 'clearExplosionCountBonus'
  | 'uiTelemetryFlag'
  | 'autoBuildEnabled'
  | 'autoSalvageEnabled'
  | 'contractRefreshMultiplier'
  | 'maxActiveContractsBonus'
  | 'maxAvailableContractsBonus'
  // Orbital layer effects
  | 'unlockSatellites'
  | 'maxSatellitesBonus'
  | 'debrisImmunity'
  | 'dockingBonusMultiplier'
  | 'stationDocksBonus'
  | 'satelliteBonusMultiplier'
  // Lunar/Moon layer effects
  | 'lunarProductionMultiplier'
  | 'unlockLunarManufacturing'
  | 'missionDurationMultiplier'
  | 'extractorOutputMultiplier'
  | 'moonRefineryOutputMultiplier'
  | 'moonStorageMultiplier'
  | 'hazardDurationMultiplier'
  | 'massDriverEfficiency'
  | 'unlockPlanetaryExpansion';

// Layer assignment for research sidebar filtering
export type ResearchLayer = 'surface' | 'orbit' | 'contracts' | 'moon';

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  branch: ResearchBranch;
  scienceCost: number;
  cargoCost?: number; // Optional cargo cost
  lunarComponentCost?: number; // Optional lunar component cost for Moon-gate research
  helium3Cost?: number; // Optional Helium-3 cost for planetary-gate research
  prerequisites: string[];
  // Benefits are represented as multipliers or flat bonuses
  // The store logic will apply these during tick or action execution
  effect: {
    type: EffectType;
    value: number;
  };
  maxLevel?: number; // Optional: if set, this research can be leveled up (e.g., p2-1, p2-2, p2-3)
  levelSuffix?: boolean; // If true, use format "p2-1", "p2-2", etc. instead of "p2"
  assignedLayer?: ResearchLayer; // Which layer's sidebar this research appears in (undefined = main Research view)
}

// Generate Safety Protocols (100 levels) - Surface layer
// Cost scales at 4.75 science per level (5% reduction from original 5)
const generateSafetyProtocols = (): ResearchNode[] => {
  const levels = 100;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `p2-${i}`,
      name: `Safety Protocols ${i}`,
      description: i === 1 ? 'Reduces explosion chance by 5% (multiplicative).' : 'Further reduces explosion chance by 5%.',
      branch: 'propulsion',
      scienceCost: Math.round(4.75 * i),
      prerequisites: [],
      effect: { type: 'explosionChanceMultiplier', value: 0.95 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Modular Spaceports (9 levels) - Surface layer
const generateModularSpaceports = (): ResearchNode[] => {
  const levels = 9;
  const baseCosts = [9, 32, 65, 108, 173, 259, 367, 497, 648]; // 80% more expensive
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `i1-${i}`,
      name: `Modular Spaceports ${toRoman(i)}`,
      description: i === 1 ? 'Increases spaceport capacity by 1 slot.' : 'Increases spaceport capacity by another slot.',
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 648 + (i - 9) * 90,
      prerequisites: [],
      effect: { type: 'spaceportCapacityBonus', value: 1 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Assembly Optimization (10 levels) - Surface layer
// Requires Auto-Queue (u7) to be unlocked first
const generateAssemblyOptimization = (): ResearchNode[] => {
  const levels = 10;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `u1-${i}`,
      name: `Assembly Optimization ${toRoman(i)}`,
      description: i === 1 ? 'Build button ×1.2 more effective.' : 'Build button ×1.2 more effective (stacking).',
      branch: 'control',
      scienceCost: 20 + i * 10,
      prerequisites: i === 1 ? ['u7'] : [], // First level requires Auto-Queue
      effect: { type: 'buildRocketMultiplier', value: 1.2 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Recovery Protocols (10 levels) - Surface layer
// Requires Auto-Salvage (u8) to be unlocked first
const generateRecoveryProtocols = (): ResearchNode[] => {
  const levels = 10;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `u2-${i}`,
      name: `Recovery Protocols ${toRoman(i)}`,
      description: i === 1 ? 'Clear action ×1.2 more effective.' : 'Clear action ×1.2 more effective (stacking).',
      branch: 'control',
      scienceCost: 20 + i * 10,
      prerequisites: i === 1 ? ['u8'] : [], // First level requires Auto-Salvage
      effect: { type: 'clearExplosionMultiplier', value: 1.2 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Cargo Optimization (10 levels) - Contracts layer
const generateCargoOptimization = (): ResearchNode[] => {
  const levels = 10;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `l1-${i}`,
      name: `Cargo Optimization ${toRoman(i)}`,
      description: i === 1 ? 'Each rocket launch delivers 15% more cargo to fulfill contracts faster.' : 'Stacks with previous levels for +15% more cargo per launch.',
      branch: 'commercial',
      scienceCost: 50 + i * 30,
      prerequisites: [],
      effect: { type: 'cargoPerLaunchMultiplier', value: 1.15 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'contracts'
    });
  }
  return nodes;
};

// Generate Efficient Engines (5 levels) - Surface layer
const generateEfficientEngines = (): ResearchNode[] => {
  const levels = 5;
  const baseCosts = [80, 120, 180, 270, 400];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `p1-${i}`,
      name: `Efficient Engines ${toRoman(i)}`,
      description: i === 1 ? 'Reduces rocket fuel cost by 3%.' : 'Further reduces rocket fuel cost by 3%.',
      branch: 'propulsion',
      scienceCost: baseCosts[i - 1] || 400 + (i - 5) * 150,
      prerequisites: [],
      effect: { type: 'fuelCostMultiplier', value: 0.97 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Market Analysis (5 levels) - Contracts layer
const generateMarketAnalysis = (): ResearchNode[] => {
  const levels = 5;
  const baseCosts = [80, 150, 280, 450, 700];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `c1-${i}`,
      name: `Market Analysis ${toRoman(i)}`,
      description: i === 1 ? 'Better pricing strategies increase contract payouts by 6%.' : 'Stacks with previous levels for +6% contract payouts.',
      branch: 'commercial',
      scienceCost: baseCosts[i - 1] || 700 + (i - 5) * 300,
      prerequisites: [],
      effect: { type: 'profitMultiplier', value: 1.06 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'contracts'
    });
  }
  return nodes;
};

// Generate Advanced Refineries (5 levels) - Surface layer
const generateAdvancedRefineries = (): ResearchNode[] => {
  const levels = 5;
  const baseCosts = [300, 500, 800, 1200, 1800];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `i2-${i}`,
      name: `Advanced Refineries ${toRoman(i)}`,
      description: i === 1 ? 'Increases fuel production per refinery by 15%.' : 'Further increases refinery output by 15%.',
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 1800 + (i - 5) * 600,
      prerequisites: [],
      effect: { type: 'refineryOutputMultiplier', value: 1.15 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Fuel Tanks (5 levels) - Surface layer
const generateFuelTanks = (): ResearchNode[] => {
  const levels = 5;
  const baseCosts = [100, 200, 400, 700, 1100];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `f1-${i}`,
      name: `Fuel Tanks ${toRoman(i)}`,
      description: i === 1 ? 'Increases max fuel capacity by 50.' : 'Further increases max fuel capacity by 50.',
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 1100 + (i - 5) * 500,
      prerequisites: [],
      effect: { type: 'fuelCapacityBonus', value: 50 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Helper to convert number to roman numeral
const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
};

export const researchTree: ResearchNode[] = [
  // --- PROPULSION BRANCH (Surface) ---
  // Efficient Engines (5 levels)
  ...generateEfficientEngines(),
  // Multi-level explosion safety research (100 levels)
  ...generateSafetyProtocols(),
  {
    id: 'p3',
    name: 'High-Energy Fuel',
    description: 'Rockets generate 20% more Cargo per launch.',
    branch: 'propulsion',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'cargoGenerationMultiplier', value: 1.2 },
    assignedLayer: 'surface'
  },

  // --- INFRASTRUCTURE BRANCH (Surface) ---
  // Modular Spaceports (10 levels)
  ...generateModularSpaceports(),
  // Advanced Refineries (5 levels)
  ...generateAdvancedRefineries(),
  {
    id: 'i3',
    name: 'Automated Construction',
    description: 'Reduces construction cost of all structures by 15%.',
    branch: 'infrastructure',
    scienceCost: 600,
    prerequisites: [],
    effect: { type: 'constructionCostMultiplier', value: 0.85 },
    assignedLayer: 'surface'
  },
  // Fuel Tanks (5 levels)
  ...generateFuelTanks(),
  {
    id: 'f2',
    name: 'Combustion Injection',
    description: 'Unlocks the Afterburner toggle: 2x output but 3x fuel cost and +5% explosion risk.',
    branch: 'infrastructure',
    scienceCost: 500,
    prerequisites: ['f1-1'],
    effect: { type: 'unlockAfterburner', value: 1 },
    assignedLayer: 'surface'
  },

  // --- COMMERCIAL BRANCH (Contracts) ---
  // Market Analysis (5 levels)
  ...generateMarketAnalysis(),
  {
    id: 'c2',
    name: 'Lean Logistics',
    description: 'Streamlined operations reduce the cargo required to complete contracts by 20%.',
    branch: 'commercial',
    scienceCost: 250,
    prerequisites: [],
    effect: { type: 'contractRequirementMultiplier', value: 0.80 },
    assignedLayer: 'contracts'
  },
  {
    id: 'c3',
    name: 'Negotiation Tactics',
    description: 'Build stronger company relationships. Contracts award 50% more company XP on completion.',
    branch: 'commercial',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'companyXPMultiplier', value: 1.5 },
    assignedLayer: 'contracts'
  },
  {
    id: 'c4',
    name: 'Project Management',
    description: 'Improved coordination allows you to work on 2 contracts at once instead of 1.',
    branch: 'commercial',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'maxActiveContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
  {
    id: 'c5',
    name: 'Corporate Portfolio',
    description: 'Advanced management systems allow you to handle 3 active contracts simultaneously.',
    branch: 'commercial',
    scienceCost: 800,
    prerequisites: ['c4'],
    effect: { type: 'maxActiveContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
  {
    id: 'c6',
    name: 'Tender Analysis',
    description: 'Better market intelligence reveals 4 available contracts per refresh instead of 3.',
    branch: 'commercial',
    scienceCost: 300,
    prerequisites: [],
    effect: { type: 'maxAvailableContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
  {
    id: 'c7',
    name: 'Global Sourcing',
    description: 'Worldwide network connections reveal 5 available contracts per refresh.',
    branch: 'commercial',
    scienceCost: 600,
    prerequisites: ['c6'],
    effect: { type: 'maxAvailableContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
  // Cargo Optimization (10 levels)
  ...generateCargoOptimization(),
  {
    id: 'l2',
    name: 'Bulk Cargo Containers',
    description: 'Larger containers let each successful rocket launch generate 50% more cargo.',
    branch: 'commercial',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'cargoGenerationMultiplier', value: 1.5 },
    assignedLayer: 'contracts'
  },
  {
    id: 'l3',
    name: 'Passive Cargo Income',
    description: 'Ground logistics teams generate +2 cargo per tick, even without launches.',
    branch: 'commercial',
    scienceCost: 600,
    prerequisites: [],
    effect: { type: 'passiveCargoBonus', value: 2 },
    assignedLayer: 'contracts'
  },
  {
    id: 'l4',
    name: 'Advanced Cargo Systems',
    description: 'Automated warehousing generates +5 cargo per tick from improved logistics.',
    branch: 'commercial',
    scienceCost: 1200,
    prerequisites: ['l3'],
    effect: { type: 'passiveCargoBonus', value: 5 },
    assignedLayer: 'contracts'
  },

  // --- ORBITAL BRANCH (Orbit) ---
  {
    id: 'o1',
    name: 'Orbital Logistics',
    description: 'Space Stations generate 50% more Cargo/Money.',
    branch: 'orbital',
    scienceCost: 300,
    prerequisites: [],
    effect: { type: 'stationLogisticsMultiplier', value: 1.5 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o2',
    name: 'Deep Space Scanners',
    description: 'Research Stations generate 50% more Science.',
    branch: 'orbital',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'stationScienceMultiplier', value: 1.5 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o3',
    name: 'Lunar Gateway',
    description: 'Foundation for Moon missions. (Coming soon)',
    branch: 'orbital',
    scienceCost: 1000,
    prerequisites: [],
    effect: { type: 'unlockMoonMissions', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o4',
    name: 'Science Laboratories',
    description: 'Unlocks Science Rockets that generate science instead of cargo.',
    branch: 'orbital',
    scienceCost: 750,
    prerequisites: [],
    effect: { type: 'unlockScienceRockets', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o5',
    name: 'Expanded Facilities',
    description: 'Unlocks the ability to build new Spaceports.',
    branch: 'orbital',
    scienceCost: 200,
    prerequisites: [],
    effect: { type: 'unlockSpaceports', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'o6',
    name: 'Fuel Production',
    description: 'Unlocks the ability to build Fuel Refineries.',
    branch: 'orbital',
    scienceCost: 20,
    prerequisites: [],
    effect: { type: 'unlockRefineries', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'o7',
    name: 'Salvage Operations',
    description: 'Unlocks the ability to clear exploded rockets (+1 science each).',
    branch: 'orbital',
    scienceCost: 1,
    prerequisites: [],
    effect: { type: 'unlockExplosionClearing', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'o8',
    name: 'Satellite Constellation',
    description: 'Unlocks satellites that provide a global 0.5% production bonus each.',
    branch: 'orbital',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'unlockSatellites', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o9',
    name: 'Orbital Defense Grid',
    description: 'Space debris no longer spawns or reduces station output.',
    branch: 'orbital',
    scienceCost: 750,
    prerequisites: ['o8'],
    effect: { type: 'debrisImmunity', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o10',
    name: 'Advanced Docking Clamps',
    description: 'Increases docking bonus from 3x to 5x station output.',
    branch: 'orbital',
    scienceCost: 1000,
    prerequisites: [],
    effect: { type: 'dockingBonusMultiplier', value: 5 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o11',
    name: 'Orbital Shipyards',
    description: 'All stations gain +2 docking slots.',
    branch: 'orbital',
    scienceCost: 1500,
    prerequisites: ['o10'],
    effect: { type: 'stationDocksBonus', value: 2 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o12',
    name: 'Expanded Satellite Network',
    description: 'Increases maximum satellites by 10.',
    branch: 'orbital',
    scienceCost: 800,
    prerequisites: ['o8'],
    effect: { type: 'maxSatellitesBonus', value: 10 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o13',
    name: 'Enhanced Satellite Arrays',
    description: 'Doubles the production bonus from each satellite.',
    branch: 'orbital',
    scienceCost: 1200,
    prerequisites: ['o12'],
    effect: { type: 'satelliteBonusMultiplier', value: 2 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o14',
    name: 'Lunar Prototype',
    description: 'Begin manufacturing lunar components at Research Stations. Requires 50 Lunar Components to unlock.',
    branch: 'orbital',
    scienceCost: 2000,
    cargoCost: 1000,
    lunarComponentCost: 50,
    prerequisites: ['o3'], // Requires Lunar Gateway
    effect: { type: 'unlockLunarManufacturing', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o15',
    name: 'Lunar Manufacturing Efficiency',
    description: 'Doubles lunar component production rate.',
    branch: 'orbital',
    scienceCost: 3000,
    prerequisites: ['o14'],
    effect: { type: 'lunarProductionMultiplier', value: 2 },
    assignedLayer: 'orbit'
  },

  // --- CONTROL (UI) BRANCH (Surface) ---
  // Assembly Optimization (5 levels)
  ...generateAssemblyOptimization(),
  // Recovery Protocols (5 levels)
  ...generateRecoveryProtocols(),
  {
    id: 'u3',
    name: 'Batch Assembly',
    description: 'Build action queues an extra rocket per click.',
    branch: 'control',
    scienceCost: 250,
    prerequisites: [],
    effect: { type: 'buildRocketBatchBonus', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u4',
    name: 'Rapid Salvage',
    description: 'Clear-explosion removes an additional exploded rocket per click.',
    branch: 'control',
    scienceCost: 200,
    prerequisites: [],
    effect: { type: 'clearExplosionCountBonus', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u6',
    name: 'Telemetry Dashboard',
    description: 'Enhanced UI with detailed stats. (Coming soon)',
    branch: 'control',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'uiTelemetryFlag', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u7',
    name: 'Auto-Queue',
    description: 'Enables a simple auto-build queue for rockets (UI toggle). Builds 1 rocket every 20 seconds.',
    branch: 'control',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'autoBuildEnabled', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u8',
    name: 'Auto-Salvage',
    description: 'Automatically clears exploded rockets (UI toggle). Clears 1 explosion every 20 seconds.',
    branch: 'control',
    scienceCost: 300,
    prerequisites: ['o7'], // Requires Salvage Operations to be unlocked first
    effect: { type: 'autoSalvageEnabled', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u9',
    name: 'High-Frequency Logistics',
    description: 'Faster communications cut contract refresh time in half. New contracts appear twice as often.',
    branch: 'control',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'contractRefreshMultiplier', value: 2 },
    assignedLayer: 'contracts'
  },

  // --- LUNAR BRANCH (Moon) ---
  {
    id: 'm1',
    name: 'Advanced Heat Shields',
    description: 'Reduces lunar mission transit time by 25%.',
    branch: 'lunar',
    scienceCost: 3000,
    prerequisites: ['o14'],
    effect: { type: 'missionDurationMultiplier', value: 0.75 },
    assignedLayer: 'moon'
  },
  {
    id: 'm2',
    name: 'Regolith Sifting',
    description: 'Increases Extractor output by 50%.',
    branch: 'lunar',
    scienceCost: 4000,
    prerequisites: ['o14'],
    effect: { type: 'extractorOutputMultiplier', value: 1.5 },
    assignedLayer: 'moon'
  },
  {
    id: 'm3',
    name: 'Helium-3 Fusion Catalysts',
    description: 'Increases Moon Refinery output by 75%.',
    branch: 'lunar',
    scienceCost: 6000,
    prerequisites: ['m2'],
    effect: { type: 'moonRefineryOutputMultiplier', value: 1.75 },
    assignedLayer: 'moon'
  },
  {
    id: 'm4',
    name: 'Reinforced Silos',
    description: 'Doubles the storage capacity bonus from Silos.',
    branch: 'lunar',
    scienceCost: 5000,
    prerequisites: ['o14'],
    effect: { type: 'moonStorageMultiplier', value: 2 },
    assignedLayer: 'moon'
  },
  {
    id: 'm5',
    name: 'Lead Shielding',
    description: 'Reduces hazard duration by 40%.',
    branch: 'lunar',
    scienceCost: 7000,
    prerequisites: ['o14'],
    effect: { type: 'hazardDurationMultiplier', value: 0.6 },
    assignedLayer: 'moon'
  },
  {
    id: 'm6',
    name: 'Electromagnetic Mass Drivers',
    description: 'Mass Drivers transport 2x more resources per tick.',
    branch: 'lunar',
    scienceCost: 8000,
    prerequisites: ['m2', 'm3'],
    effect: { type: 'massDriverEfficiency', value: 2 },
    assignedLayer: 'moon'
  },
  {
    id: 'm7',
    name: 'Planetary Trajectory',
    description: 'Unlock the ability to expand to other planets. Requires 500 Helium-3 on Earth.',
    branch: 'lunar',
    scienceCost: 15000,
    cargoCost: 5000,
    helium3Cost: 500,
    prerequisites: ['m3', 'm6'],
    effect: { type: 'unlockPlanetaryExpansion', value: 1 },
    assignedLayer: 'moon'
  },
];
