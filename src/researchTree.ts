export type ResearchBranch = 'propulsion' | 'infrastructure' | 'commercial' | 'orbital' | 'control';

// All valid effect types used by research nodes
export type EffectType = 
  | 'explosionChanceMultiplier'
  | 'spaceportCapacityBonus'
  | 'buildRocketMultiplier'
  | 'clearExplosionMultiplier'
  | 'fuelCostMultiplier'
  | 'cargoGenerationMultiplier'
  | 'refineryOutputMultiplier'
  | 'constructionCostMultiplier'
  | 'profitMultiplier'
  | 'contractMoneyMultiplier'
  | 'unlockHighValueContracts'
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
  | 'autoSalvageEnabled';

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  branch: ResearchBranch;
  scienceCost: number;
  prerequisites: string[];
  // Benefits are represented as multipliers or flat bonuses
  // The store logic will apply these during tick or action execution
  effect: {
    type: EffectType;
    value: number;
  };
  maxLevel?: number; // Optional: if set, this research can be leveled up (e.g., p2-1, p2-2, p2-3)
  levelSuffix?: boolean; // If true, use format "p2-1", "p2-2", etc. instead of "p2"
}

// Generate Safety Protocols (100 levels)
const generateSafetyProtocols = (): ResearchNode[] => {
  const levels = 100;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `p2-${i}`,
      name: `Safety Protocols ${i === 1 ? 'I' : i}`,
      description: i === 1 ? 'Reduces explosion chance by 5% (multiplicative).' : 'Further reduces explosion chance by 5%.',
      branch: 'propulsion',
      scienceCost: 5 * i,
      prerequisites: [],
      effect: { type: 'explosionChanceMultiplier', value: 0.95 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true
    });
  }
  return nodes;
};

// Generate Modular Spaceports (10 levels)
const generateModularSpaceports = (): ResearchNode[] => {
  const levels = 10;
  const baseCosts = [55, 80, 125, 150, 175, 200, 225, 250, 275, 300];
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `i1-${i}`,
      name: `Modular Spaceports ${toRoman(i)}`,
      description: i === 1 ? 'Increases spaceport capacity by 3 slots.' : 'Increases spaceport capacity by another 3 slots.',
      branch: 'infrastructure',
      scienceCost: baseCosts[i - 1] || 300 + (i - 10) * 25,
      prerequisites: [],
      effect: { type: 'spaceportCapacityBonus', value: 3 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true
    });
  }
  return nodes;
};

// Generate Assembly Optimization (5 levels)
const generateAssemblyOptimization = (): ResearchNode[] => {
  const levels = 5;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `u1-${i}`,
      name: `Assembly Optimization ${toRoman(i)}`,
      description: i === 1 ? 'Build button ×1.2 more effective.' : 'Build button ×1.2 more effective (stacking).',
      branch: 'control',
      scienceCost: 20 + i * 10,
      prerequisites: [],
      effect: { type: 'buildRocketMultiplier', value: 1.2 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true
    });
  }
  return nodes;
};

// Generate Recovery Protocols (5 levels)
const generateRecoveryProtocols = (): ResearchNode[] => {
  const levels = 5;
  const nodes: ResearchNode[] = [];
  for (let i = 1; i <= levels; i++) {
    nodes.push({
      id: `u2-${i}`,
      name: `Recovery Protocols ${toRoman(i)}`,
      description: i === 1 ? 'Clear action ×1.2 more effective.' : 'Clear action ×1.2 more effective (stacking).',
      branch: 'control',
      scienceCost: 20 + i * 10,
      prerequisites: [],
      effect: { type: 'clearExplosionMultiplier', value: 1.2 },
      ...(i === 1 ? { maxLevel: levels } : {}),
      levelSuffix: true
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
  // --- PROPULSION BRANCH ---
  {
    id: 'p1',
    name: 'Efficient Engines',
    description: 'Reduces rocket fuel cost by 10%.',
    branch: 'propulsion',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'fuelCostMultiplier', value: 0.9 }
  },
  // Multi-level explosion safety research (100 levels)
  ...generateSafetyProtocols(),
  {
    id: 'p3',
    name: 'High-Energy Fuel',
    description: 'Rockets generate 20% more Cargo per launch.',
    branch: 'propulsion',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'cargoGenerationMultiplier', value: 1.2 }
  },

  // --- INFRASTRUCTURE BRANCH ---
  // Modular Spaceports (10 levels)
  ...generateModularSpaceports(),
  {
    id: 'i2',
    name: 'Advanced Refineries',
    description: 'Increases fuel production per refinery by 50%.',
    branch: 'infrastructure',
    scienceCost: 300,
    prerequisites: [],
    effect: { type: 'refineryOutputMultiplier', value: 1.5 }
  },
  {
    id: 'i3',
    name: 'Automated Construction',
    description: 'Reduces construction cost of all structures by 15%.',
    branch: 'infrastructure',
    scienceCost: 600,
    prerequisites: [],
    effect: { type: 'constructionCostMultiplier', value: 0.85 }
  },

  // --- COMMERCIAL BRANCH ---
  {
    id: 'c1',
    name: 'Market Analysis',
    description: 'Increases money profit per rocket by 20%.',
    branch: 'commercial',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'profitMultiplier', value: 1.2 }
  },
  {
    id: 'c2',
    name: 'Corporate Partnerships',
    description: 'Increases contract money rewards by 25%.',
    branch: 'commercial',
    scienceCost: 250,
    prerequisites: [],
    effect: { type: 'contractMoneyMultiplier', value: 1.25 }
  },
  {
    id: 'c3',
    name: 'Interstellar Trade',
    description: 'Unlocks high-value cargo delivery contracts. (Coming soon)',
    branch: 'commercial',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'unlockHighValueContracts', value: 1 }
  },

  // --- ORBITAL BRANCH ---
  {
    id: 'o1',
    name: 'Orbital Logistics',
    description: 'Space Stations generate 50% more Cargo/Money.',
    branch: 'orbital',
    scienceCost: 300,
    prerequisites: [],
    effect: { type: 'stationLogisticsMultiplier', value: 1.5 }
  },
  {
    id: 'o2',
    name: 'Deep Space Scanners',
    description: 'Research Stations generate 50% more Science.',
    branch: 'orbital',
    scienceCost: 500,
    prerequisites: [],
    effect: { type: 'stationScienceMultiplier', value: 1.5 }
  },
  {
    id: 'o3',
    name: 'Lunar Gateway',
    description: 'Foundation for Moon missions. (Coming soon)',
    branch: 'orbital',
    scienceCost: 1000,
    prerequisites: [],
    effect: { type: 'unlockMoonMissions', value: 1 }
  },
  {
    id: 'o4',
    name: 'Science Laboratories',
    description: 'Unlocks Science Rockets that generate science instead of cargo.',
    branch: 'orbital',
    scienceCost: 750,
    prerequisites: [],
    effect: { type: 'unlockScienceRockets', value: 1 }
  },
  {
    id: 'o5',
    name: 'Expanded Facilities',
    description: 'Unlocks the ability to build new Spaceports.',
    branch: 'orbital',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'unlockSpaceports', value: 1 }
  },
  {
    id: 'o6',
    name: 'Fuel Production',
    description: 'Unlocks the ability to build Fuel Refineries.',
    branch: 'orbital',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'unlockRefineries', value: 1 }
  },
  {
    id: 'o7',
    name: 'Salvage Operations',
    description: 'Unlocks the ability to clear exploded rockets (+1 science each).',
    branch: 'orbital',
    scienceCost: 1,
    prerequisites: [],
    effect: { type: 'unlockExplosionClearing', value: 1 }
  },

  // --- CONTROL (UI) BRANCH ---
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
    effect: { type: 'buildRocketBatchBonus', value: 1 }
  },
  {
    id: 'u4',
    name: 'Rapid Salvage',
    description: 'Clear-explosion removes an additional exploded rocket per click.',
    branch: 'control',
    scienceCost: 200,
    prerequisites: [],
    effect: { type: 'clearExplosionCountBonus', value: 1 }
  },
  {
    id: 'u6',
    name: 'Telemetry Dashboard',
    description: 'Enhanced UI with detailed stats. (Coming soon)',
    branch: 'control',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'uiTelemetryFlag', value: 1 }
  },
  {
    id: 'u7',
    name: 'Auto-Queue',
    description: 'Enables a simple auto-build queue for rockets (UI toggle). Builds 1 rocket every 20 seconds.',
    branch: 'control',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'autoBuildEnabled', value: 1 }
  },
  {
    id: 'u8',
    name: 'Auto-Salvage',
    description: 'Automatically clears exploded rockets (UI toggle). Clears 1 explosion every 20 seconds.',
    branch: 'control',
    scienceCost: 300,
    prerequisites: ['o7'], // Requires Salvage Operations to be unlocked first
    effect: { type: 'autoSalvageEnabled', value: 1 }
  },
];
