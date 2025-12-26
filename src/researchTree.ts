export type ResearchBranch = 'propulsion' | 'infrastructure' | 'commercial' | 'orbital';

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
}

export const researchTree: ResearchNode[] = [
  // --- PROPULSION BRANCH ---
  {
    id: 'p1',
    name: 'Efficient Engines',
    description: 'Reduces rocket fuel cost by 10%.',
    branch: 'propulsion',
    scienceCost: 100,
    prerequisites: [],
    effect: { type: 'fuelCostMultiplier', value: 0.9 }
  },
  {
    id: 'p2',
    name: 'Safety Protocols',
    description: 'Reduces explosion chance by 20%.',
    branch: 'propulsion',
    scienceCost: 200,
    prerequisites: ['p1'],
    effect: { type: 'explosionChanceMultiplier', value: 0.8 }
  },
  {
    id: 'p3',
    name: 'High-Energy Fuel',
    description: 'Rockets generate 20% more Cargo per launch.',
    branch: 'propulsion',
    scienceCost: 500,
    prerequisites: ['p2'],
    effect: { type: 'cargoGenerationMultiplier', value: 1.2 }
  },

  // --- INFRASTRUCTURE BRANCH ---
  {
    id: 'i1',
    name: 'Modular Spaceports',
    description: 'Increases spaceport capacity by 3 slots.',
    branch: 'infrastructure',
    scienceCost: 150,
    prerequisites: [],
    effect: { type: 'spaceportCapacityBonus', value: 3 }
  },
  {
    id: 'i2',
    name: 'Advanced Refineries',
    description: 'Increases fuel production per refinery by 50%.',
    branch: 'infrastructure',
    scienceCost: 300,
    prerequisites: ['i1'],
    effect: { type: 'refineryOutputMultiplier', value: 1.5 }
  },
  {
    id: 'i3',
    name: 'Automated Construction',
    description: 'Reduces construction cost of all structures by 15%.',
    branch: 'infrastructure',
    scienceCost: 600,
    prerequisites: ['i2'],
    effect: { type: 'constructionCostMultiplier', value: 0.85 }
  },

  // --- COMMERCIAL BRANCH ---
  {
    id: 'c1',
    name: 'Market Analysis',
    description: 'Increases money profit per rocket by 20%.',
    branch: 'commercial',
    scienceCost: 100,
    prerequisites: [],
    effect: { type: 'profitMultiplier', value: 1.2 }
  },
  {
    id: 'c2',
    name: 'Corporate Partnerships',
    description: 'Increases contract money rewards by 25%.',
    branch: 'commercial',
    scienceCost: 250,
    prerequisites: ['c1'],
    effect: { type: 'contractMoneyMultiplier', value: 1.25 }
  },
  {
    id: 'c3',
    name: 'Interstellar Trade',
    description: 'Unlocks high-value cargo delivery contracts.',
    branch: 'commercial',
    scienceCost: 500,
    prerequisites: ['c2'],
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
    prerequisites: ['o1'],
    effect: { type: 'stationScienceMultiplier', value: 1.5 }
  },
  {
    id: 'o3',
    name: 'Lunar Gateway',
    description: 'Necessary foundation for Moon missions.',
    branch: 'orbital',
    scienceCost: 1000,
    prerequisites: ['o2'],
    effect: { type: 'unlockMoonMissions', value: 1 }
  },
];
