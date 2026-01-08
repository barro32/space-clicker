export type ResearchBranch = 'propulsion' | 'infrastructure' | 'commercial' | 'orbital' | 'control';

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
    type: string;
    value: number;
  };
  maxLevel?: number; // Optional: if set, this research can be leveled up (e.g., p2-1, p2-2, p2-3)
  levelSuffix?: boolean; // If true, use format "p2-1", "p2-2", etc. instead of "p2"
}

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
   // Multi-level explosion safety research
   {
     id: 'p2-1',
     name: 'Safety Protocols I',
     description: 'Reduces explosion chance by 5%.',
     branch: 'propulsion',
     scienceCost: 5,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     maxLevel: 20,
     levelSuffix: true
   },
   {
     id: 'p2-2',
     name: 'Safety Protocols II',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 10,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-3',
     name: 'Safety Protocols III',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 15,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-4',
     name: 'Safety Protocols IV',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 20,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-5',
     name: 'Safety Protocols V',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 25,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-6',
     name: 'Safety Protocols VI',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 30,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-7',
     name: 'Safety Protocols VII',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 35,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-8',
     name: 'Safety Protocols VIII',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 40,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-9',
     name: 'Safety Protocols IX',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 45,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-10',
     name: 'Safety Protocols X',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 50,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-11',
     name: 'Safety Protocols XI',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 55,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-12',
     name: 'Safety Protocols XII',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 60,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-13',
     name: 'Safety Protocols XIII',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 65,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-14',
     name: 'Safety Protocols XIV',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 70,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-15',
     name: 'Safety Protocols XV',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 75,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-16',
     name: 'Safety Protocols XVI',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 80,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-17',
     name: 'Safety Protocols XVII',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 85,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-18',
     name: 'Safety Protocols XVIII',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 90,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-19',
     name: 'Safety Protocols XIX',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 95,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
   {
     id: 'p2-20',
     name: 'Safety Protocols XX',
     description: 'Reduces explosion chance by another 5%.',
     branch: 'propulsion',
     scienceCost: 100,
     prerequisites: [],
     effect: { type: 'explosionChanceMultiplier', value: 0.95 },
     levelSuffix: true
   },
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
   {
     id: 'i1-1',
     name: 'Modular Spaceports I',
     description: 'Increases spaceport capacity by 3 slots.',
     branch: 'infrastructure',
     scienceCost: 55,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     maxLevel: 10,
     levelSuffix: true
   },
   {
     id: 'i1-2',
     name: 'Modular Spaceports II',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 80,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-3',
     name: 'Modular Spaceports III',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 125,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-4',
     name: 'Modular Spaceports IV',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 150,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-5',
     name: 'Modular Spaceports V',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 175,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-6',
     name: 'Modular Spaceports VI',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 200,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-7',
     name: 'Modular Spaceports VII',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 225,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-8',
     name: 'Modular Spaceports VIII',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 250,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-9',
     name: 'Modular Spaceports IX',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 275,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
   {
     id: 'i1-10',
     name: 'Modular Spaceports X',
     description: 'Increases spaceport capacity by another 3 slots.',
     branch: 'infrastructure',
     scienceCost: 300,
     prerequisites: [],
     effect: { type: 'spaceportCapacityBonus', value: 3 },
     levelSuffix: true
   },
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
     description: 'Unlocks high-value cargo delivery contracts.',
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
     description: 'Necessary foundation for Moon missions.',
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
      description: 'Unlocks the ability to clear exploded rockets (1 science cost each).',
      branch: 'orbital',
      scienceCost: 1,
      prerequisites: [],
      effect: { type: 'unlockExplosionClearing', value: 1 }
    },
 
    // --- CONTROL (UI) BRANCH ---
  {
    id: 'u1-1',
    name: 'Assembly Optimization I',
    description: 'Build button ×1.2 more effective.',
    branch: 'control',
    scienceCost: 30,
    prerequisites: [],
    effect: { type: 'buildRocketMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u1-2',
    name: 'Assembly Optimization II',
    description: 'Build button ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 40,
    prerequisites: [],
    effect: { type: 'buildRocketMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u1-3',
    name: 'Assembly Optimization III',
    description: 'Build button ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 50,
    prerequisites: [],
    effect: { type: 'buildRocketMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u1-4',
    name: 'Assembly Optimization IV',
    description: 'Build button ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 60,
    prerequisites: [],
    effect: { type: 'buildRocketMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u1-5',
    name: 'Assembly Optimization V',
    description: 'Build button ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 70,
    prerequisites: [],
    effect: { type: 'buildRocketMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u2-1',
    name: 'Recovery Protocols I',
    description: 'Clear action ×1.2 more effective.',
    branch: 'control',
    scienceCost: 30,
    prerequisites: [],
    effect: { type: 'clearExplosionMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u2-2',
    name: 'Recovery Protocols II',
    description: 'Clear action ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 40,
    prerequisites: [],
    effect: { type: 'clearExplosionMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u2-3',
    name: 'Recovery Protocols III',
    description: 'Clear action ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 50,
    prerequisites: [],
    effect: { type: 'clearExplosionMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u2-4',
    name: 'Recovery Protocols IV',
    description: 'Clear action ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 60,
    prerequisites: [],
    effect: { type: 'clearExplosionMultiplier', value: 1.2 },
    levelSuffix: true
  },
  {
    id: 'u2-5',
    name: 'Recovery Protocols V',
    description: 'Clear action ×1.2 more effective (stacking).',
    branch: 'control',
    scienceCost: 70,
    prerequisites: [],
    effect: { type: 'clearExplosionMultiplier', value: 1.2 },
    levelSuffix: true
  },
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
    description: 'Improves UI feedback with richer telemetry and tooltips.',
    branch: 'control',
    scienceCost: 80,
    prerequisites: [],
    effect: { type: 'uiTelemetryFlag', value: 1 }
  },
  {
    id: 'u7',
    name: 'Auto-Queue',
    description: 'Enables a simple auto-build queue for rockets (UI toggle).',
    branch: 'control',
    scienceCost: 400,
    prerequisites: [],
    effect: { type: 'autoBuildEnabled', value: 1 }
  },
];
