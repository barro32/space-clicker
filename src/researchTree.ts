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
  | 'cargoPerLaunchBonus'
  | 'passiveCargoBonus'
  | 'sciencePerRocketBonus'
   | 'refineryOutputMultiplier'
   | 'constructionCostMultiplier'
   | 'passiveMoneyBonus'
   | 'contractRequirementMultiplier'
   | 'companyXPMultiplier'
   | 'stationLogisticsMultiplier'
  | 'stationScienceMultiplier'
  | 'unlockMoonMissions'
  | 'unlockScienceRockets'
  | 'unlockSpaceports'
  | 'unlockRefineries'
   | 'unlockExplosionClearing'
   | 'unlockFreeLaunch'
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
    | 'unlockPlanetaryExpansion'
    | 'refineryCapacityBonus' // Adds capacity per refinery (retroactive)
    // Moon Power System effects - REMOVED (not implemented)
    | 'powerGenerationMultiplier'
   | 'sectorScanCostReduction'
   | 'buildingSlotsPerSectorBonus'
   | 'massDriverCapacityBonus'
   | 'fabricatorOutputMultiplier'
   | 'fabricatorCostReduction'
   | 'alloysStorageBonus';

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
// Cost scales at 1 science per level, starting at 2 (2, 3, 4, 5, ...)
const generateSafetyProtocols = (): ResearchNode[] => {
  const levels = 100;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `p2-${i}`,
      name: 'Safety Protocols',
      description: i === 1 ? '-{reduction}% explosion chance' : '-{reduction}% explosion chance',
      branch: 'propulsion',
      scienceCost: i + 1,
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
  const baseCosts = [200, 400, 700, 1150, 1800, 2700, 3900, 5400, 7200]; // Aggressive scaling (100-200 per level increase)
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `i1-${i}`,
      name: `Modular Spaceports ${toRoman(i)}`,
      description: i === 1 ? '+{value} spaceport slot' : '+{value} spaceport slot',
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 7200 + (i - 9) * 1800,
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
      description: i === 1 ? 'Build button ×{increase}%' : 'Build button ×{increase}%',
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
      description: i === 1 ? 'Clear action ×{increase}%' : 'Clear action ×{increase}%',
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
      description: i === 1 ? '+{increase}% cargo per launch' : '+{increase}% cargo per launch',
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
      description: i === 1 ? '-{reduction}% fuel cost' : '-{reduction}% fuel cost',
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
      description: i === 1 ? '+{value}/tick passive income' : '+{value}/tick passive income',
      branch: 'commercial',
      scienceCost: baseCosts[i - 1] || 700 + (i - 5) * 300,
      prerequisites: [],
      effect: { type: 'passiveMoneyBonus', value: 10 },
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
      description: i === 1 ? '+{increase}% refinery output' : '+{increase}% refinery output',
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
  const baseCosts = [500, 1000, 2000, 3500, 5500];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `f1-${i}`,
      name: `Fuel Tanks ${toRoman(i)}`,
      description: i === 1 ? '+{value} max fuel capacity (increased tank size)' : '+{value} max fuel capacity',
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 5500 + (i - 5) * 2000,
      prerequisites: [],
      effect: { type: 'fuelCapacityBonus', value: 50 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate High-Energy Fuel (5 levels) - Surface layer
// Each level adds +1 cargo per launch
const generateHighEnergyFuel = (): ResearchNode[] => {
  const levels = 5;
  const baseCosts = [150, 300, 500, 750, 1000];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `p3-${i}`,
      name: `High-Energy Fuel ${toRoman(i)}`,
      description: i === 1 ? '+{value} cargo per rocket launch' : `+${i} cargo per rocket launch`,
      branch: 'propulsion',
      scienceCost: baseCosts[i - 1] || 1000 + (i - 5) * 300,
      prerequisites: [],
      effect: { type: 'cargoPerLaunchBonus', value: 1 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true,
      assignedLayer: 'surface'
    });
  }
  return nodes;
};

// Generate Refinery Capacity upgrades (5 levels) - Surface layer
// Each level increases capacity per refinery (retroactive to existing refineries)
const generateRefineryCapacity = (): ResearchNode[] => {
  const levels = 5;
  const baseCosts = [150, 300, 500, 800, 1200];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `f2-${i}`,
      name: `Enhanced Refinery Capacity ${toRoman(i)}`,
      description: i === 1 ? '+{value} fuel per refinery' : `+${5 * i} fuel per refinery`,
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 1200 + (i - 5) * 600,
      prerequisites: i === 1 ? ['f1-1'] : [`f2-${i - 1}`],
      effect: { type: 'refineryCapacityBonus', value: 5 * i },
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
  // Multi-level high-energy fuel research (5 levels)
  ...generateHighEnergyFuel(),
  {
    id: 'p4',
    name: 'Flight Recorder System',
    description: '+1 science per rocket launch',
    branch: 'propulsion',
    scienceCost: 10,
    prerequisites: ['p2-5'], // Requires Safety Protocols level 5
    effect: { type: 'sciencePerRocketBonus', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'p5',
    name: 'Boost Initialization',
    description: 'New rockets get 1 free launch when built',
    branch: 'propulsion',
    scienceCost: 500,
    prerequisites: ['p2-20'], // Requires Safety Protocols level 20
    effect: { type: 'unlockFreeLaunch', value: 1 },
    assignedLayer: 'surface'
  },

  // --- INFRASTRUCTURE BRANCH (Surface) ---
   // Modular Spaceports (10 levels)
   ...generateModularSpaceports(),
   // Advanced Refineries (5 levels)
   ...generateAdvancedRefineries(),
    {
      id: 'i3',
      name: 'Cost Reduction',
      description: '-{reduction}% spaceport and refinery cost.',
      branch: 'infrastructure',
      scienceCost: 600,
      prerequisites: [],
      effect: { type: 'constructionCostMultiplier', value: 0.85 },
      assignedLayer: 'surface'
    },
    // Fuel Tanks (5 levels)
    ...generateFuelTanks(),
    // Refinery Capacity (5 levels)
    ...generateRefineryCapacity(),

    // --- COMMERCIAL BRANCH (Contracts) ---
  // Market Analysis (5 levels)
  ...generateMarketAnalysis(),
  {
    id: 'c2',
    name: 'Lean Logistics',
    description: '-{reduction}% contract requirements',
    branch: 'commercial',
    scienceCost: 250,
    prerequisites: [],
    effect: { type: 'contractRequirementMultiplier', value: 0.80 },
    assignedLayer: 'contracts'
  },
  {
    id: 'c3',
    name: 'Negotiation Tactics',
    description: '+{increase}% company XP from contracts',
    branch: 'commercial',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'companyXPMultiplier', value: 1.5 },
    assignedLayer: 'contracts'
  },
   {
     id: 'c4',
     name: 'Project Management',
     description: '+{value} active contract slot',
    branch: 'commercial',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'maxActiveContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
   {
     id: 'c5',
     name: 'Corporate Portfolio',
     description: '+{value} active contract slot',
    branch: 'commercial',
    scienceCost: 800,
    prerequisites: ['c4'],
    effect: { type: 'maxActiveContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
   {
     id: 'c6',
     name: 'Tender Analysis',
     description: '+{value} available contract slot',
    branch: 'commercial',
    scienceCost: 300,
    prerequisites: [],
    effect: { type: 'maxAvailableContractsBonus', value: 1 },
    assignedLayer: 'contracts'
  },
   {
     id: 'c7',
     name: 'Global Sourcing',
     description: '+{value} available contract slot',
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
    description: '+{increase}% cargo generation',
    branch: 'commercial',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'cargoGenerationMultiplier', value: 1.5 },
    assignedLayer: 'contracts'
  },
  {
    id: 'l3',
    name: 'Passive Cargo Income',
    description: '+{value}/tick passive cargo',
    branch: 'commercial',
    scienceCost: 600,
    prerequisites: [],
    effect: { type: 'passiveCargoBonus', value: 2 },
    assignedLayer: 'contracts'
  },
  {
    id: 'l4',
    name: 'Advanced Cargo Systems',
    description: '+{value}/tick passive cargo',
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
    description: '+{increase}% station output',
    branch: 'orbital',
    scienceCost: 300,
    prerequisites: [],
    effect: { type: 'stationLogisticsMultiplier', value: 1.5 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o2',
    name: 'Deep Space Scanners',
    description: '+{increase}% station science output',
    branch: 'orbital',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'stationScienceMultiplier', value: 1.5 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o3',
    name: 'Lunar Gateway',
    description: 'Unlocks Moon missions',
    branch: 'orbital',
    scienceCost: 1000,
    prerequisites: [],
    effect: { type: 'unlockMoonMissions', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o4',
    name: 'Science Laboratories',
    description: 'Unlocks Science Rockets',
    branch: 'orbital',
    scienceCost: 750,
    prerequisites: [],
    effect: { type: 'unlockScienceRockets', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o5',
    name: 'Expanded Facilities',
    description: 'Unlocks Spaceports',
    branch: 'orbital',
    scienceCost: 200,
    prerequisites: [],
    effect: { type: 'unlockSpaceports', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'o6',
    name: 'Fuel Production',
    description: 'Unlocks Fuel Refineries',
    branch: 'orbital',
    scienceCost: 20,
    prerequisites: [],
    effect: { type: 'unlockRefineries', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'o7',
    name: 'Salvage Operations',
    description: 'Unlocks explosion clearing',
    branch: 'orbital',
    scienceCost: 1,
    prerequisites: [],
    effect: { type: 'unlockExplosionClearing', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'o8',
    name: 'Satellite Constellation',
    description: 'Unlocks Satellites',
    branch: 'orbital',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'unlockSatellites', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o9',
    name: 'Orbital Defense Grid',
    description: 'Debris immunity',
    branch: 'orbital',
    scienceCost: 750,
    prerequisites: ['o8'],
    effect: { type: 'debrisImmunity', value: 1 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o10',
    name: 'Advanced Docking Clamps',
    description: 'Docking bonus ×{multiplier}',
    branch: 'orbital',
    scienceCost: 1000,
    prerequisites: [],
    effect: { type: 'dockingBonusMultiplier', value: 5 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o11',
    name: 'Orbital Shipyards',
    description: '+{value} docking slots per station',
    branch: 'orbital',
    scienceCost: 1500,
    prerequisites: ['o10'],
    effect: { type: 'stationDocksBonus', value: 2 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o12',
    name: 'Expanded Satellite Network',
    description: '+{value} max satellites',
    branch: 'orbital',
    scienceCost: 800,
    prerequisites: ['o8'],
    effect: { type: 'maxSatellitesBonus', value: 10 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o13',
    name: 'Enhanced Satellite Arrays',
    description: '×{multiplier} satellite production bonus',
    branch: 'orbital',
    scienceCost: 1200,
    prerequisites: ['o12'],
    effect: { type: 'satelliteBonusMultiplier', value: 2 },
    assignedLayer: 'orbit'
  },
  {
    id: 'o14',
    name: 'Lunar Prototype',
    description: 'Unlocks lunar manufacturing',
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
    description: '×{multiplier} lunar component production',
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
    description: 'Build action queues +{value} rocket',
    branch: 'control',
    scienceCost: 250,
    prerequisites: [],
    effect: { type: 'buildRocketBatchBonus', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u4',
    name: 'Rapid Salvage',
    description: 'Clear action clears +{value} explosion',
    branch: 'control',
    scienceCost: 200,
    prerequisites: [],
    effect: { type: 'clearExplosionCountBonus', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u6',
    name: 'Telemetry Dashboard',
    description: 'Enhanced UI stats',
    branch: 'control',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'uiTelemetryFlag', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u7',
    name: 'Auto-Queue',
    description: 'Unlocks auto-build (20s interval)',
    branch: 'control',
    scienceCost: 4000,
    prerequisites: [],
    effect: { type: 'autoBuildEnabled', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u8',
    name: 'Auto-Salvage',
    description: 'Unlocks auto-salvage (20s interval)',
    branch: 'control',
    scienceCost: 3000,
    prerequisites: ['o7'], // Requires Salvage Operations to be unlocked first
    effect: { type: 'autoSalvageEnabled', value: 1 },
    assignedLayer: 'surface'
  },
  {
    id: 'u9',
    name: 'High-Frequency Logistics',
    description: '×{multiplier} contract refresh rate',
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
    description: '-{reduction}% mission transit time',
    branch: 'lunar',
    scienceCost: 3000,
    prerequisites: ['o14'],
    effect: { type: 'missionDurationMultiplier', value: 0.75 },
    assignedLayer: 'moon'
  },
  {
    id: 'm2',
    name: 'Regolith Sifting',
    description: '+{increase}% extractor output',
    branch: 'lunar',
    scienceCost: 4000,
    prerequisites: ['o14'],
    effect: { type: 'extractorOutputMultiplier', value: 1.5 },
    assignedLayer: 'moon'
  },
  {
    id: 'm3',
    name: 'Helium-3 Fusion Catalysts',
    description: '+{increase}% Moon Refinery output',
    branch: 'lunar',
    scienceCost: 6000,
    prerequisites: ['m2'],
    effect: { type: 'moonRefineryOutputMultiplier', value: 1.75 },
    assignedLayer: 'moon'
  },
  {
    id: 'm4',
    name: 'Reinforced Silos',
    description: '×{multiplier} storage capacity',
    branch: 'lunar',
    scienceCost: 5000,
    prerequisites: ['o14'],
    effect: { type: 'moonStorageMultiplier', value: 2 },
    assignedLayer: 'moon'
  },
  {
    id: 'm5',
    name: 'Lead Shielding',
    description: '-{reduction}% hazard duration',
    branch: 'lunar',
    scienceCost: 7000,
    prerequisites: ['o14'],
    effect: { type: 'hazardDurationMultiplier', value: 0.6 },
    assignedLayer: 'moon'
  },
  {
    id: 'm6',
    name: 'Electromagnetic Mass Drivers',
    description: '×{multiplier} Mass Driver efficiency',
    branch: 'lunar',
    scienceCost: 8000,
    prerequisites: ['m2', 'm3'],
    effect: { type: 'massDriverEfficiency', value: 2 },
    assignedLayer: 'moon'
  },
   {
     id: 'm7',
     name: 'Planetary Trajectory',
      description: 'Unlocks planetary expansion',
     branch: 'lunar',
     scienceCost: 15000,
     cargoCost: 5000,
     helium3Cost: 500,
     prerequisites: ['m3', 'm6'],
     effect: { type: 'unlockPlanetaryExpansion', value: 1 },
     assignedLayer: 'moon'
    },

    // GRID SYSTEM RESEARCH
   {
     id: 'm11',
     name: 'Efficient Terraforming',
      description: '-{reduction}% sector scan cost',
     branch: 'lunar',
     scienceCost: 2500,
     prerequisites: ['o14'],
     effect: { type: 'sectorScanCostReduction', value: 0.6 },
     assignedLayer: 'moon'
   },
   {
     id: 'm12',
     name: 'Expanded Habitats',
      description: '+{value} building slots per sector',
     branch: 'lunar',
     scienceCost: 4500,
     prerequisites: ['m11'],
     effect: { type: 'buildingSlotsPerSectorBonus', value: 2 },
     assignedLayer: 'moon'
    },
    
    // MASS DRIVER LOGISTICS RESEARCH
    {
      id: 'm14',
     name: 'Expanded Payload Bays',
      description: '×{multiplier} Mass Driver capacity',
     branch: 'lunar',
     scienceCost: 4000,
     prerequisites: ['m6'],
     effect: { type: 'massDriverCapacityBonus', value: 2 },
     assignedLayer: 'moon'
   },
     {
       id: 'm16',
      name: 'Alloy Furnaces',
       description: '+{increase}% fabricator output',
      branch: 'lunar',
      scienceCost: 5000,
      prerequisites: ['o14'],
      effect: { type: 'fabricatorOutputMultiplier', value: 1.5 },
      assignedLayer: 'moon'
    },
    {
      id: 'm17',
      name: 'Efficient Smelting',
       description: '-{reduction}% fabricator regolith cost',
      branch: 'lunar',
      scienceCost: 4000,
      prerequisites: ['m16'],
      effect: { type: 'fabricatorCostReduction', value: 0.7 },
      assignedLayer: 'moon'
    },
    {
      id: 'm18',
      name: 'Expanded Storage Vaults',
       description: '+{increase}% alloy storage capacity',
      branch: 'lunar',
      scienceCost: 3500,
      prerequisites: ['o14'],
      effect: { type: 'alloysStorageBonus', value: 250 },
      assignedLayer: 'moon'
    },
];
