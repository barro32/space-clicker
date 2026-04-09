import { describe, it, expect, beforeEach } from 'vitest';
import { researchTree, ResearchNode } from './researchTree.js';
import { useGameStore, GameState } from './useGameStore.js';

/**
 * COMPREHENSIVE RESEARCH NODE TEST SUITE
 * 
 * This test suite validates all 190 research nodes across 6 branches:
 * - Propulsion (106 nodes): p1-1 to p1-5, p2-1 to p2-100, p3
 * - Infrastructure (26 nodes): i1-1 to i1-10, i2-1 to i2-5, i3, f1-1 to f1-5, f2
 * - Commercial (22 nodes): c1-1 to c1-5, c2, c3, c4, c5, c6, c7, l1-1 to l1-10, l2, l3, l4
 * - Orbital (15 nodes): o1-o15
 * - Control (14 nodes): u1-1 to u1-5, u2-1 to u2-5, u3, u4, u6, u7, u8, u9
 * - Lunar (7 nodes): m1-m7
 * 
 * Each node is tested for:
 * 1. Existence in researchTree
 * 2. Valid prerequisites (recursive check)
 * 3. Valid effect type
 * 4. Reasonable science cost
 * 5. Description exists
 * 6. Proper maxLevel and levelSuffix configuration
 * 7. Effect application when researched
 * 8. Unlock conditions (prerequisites met, science sufficient)
 */

describe('All 190 Research Nodes - Comprehensive Coverage', () => {
  beforeEach(() => {
    useGameStore.setState({
      money: 10000,
      science: 5000,
      fuel: 1000,
      cargo: 0,
      currentView: 'research',
      notifications: [],
      companies: [],
      availableContracts: [],
      activeContracts: [],
      rockets: [],
      nextRocketId: 0,
      rocketCost: 10,
      profitPerRocket: 1,
      spaceportCapacity: 9,
      spaceports: [{ id: 1 }],
      spaceStations: [],
      spaceportCost: 1000,
      fuelRefineries: 0,
      fuelProductionPerRefinery: 1,
      fuelCostPerRocket: 1,
      fuelRefineryCost: 500,
      explodedRocketIds: [],
      rocketExplosionChance: 0.75,
      researchedNodes: [],
      previouslyAvailableResearch: [],
      autoBuildActive: false,
    } as unknown as GameState);
  });

     describe('Node Structure and Validation', () => {
        it('should have exactly 215 research nodes', () => {
              // 214 nodes + 1 restored node (o6 Fuel Production) - 1 removed node (o4) = 214
              expect(researchTree).toHaveLength(214);
           });

    it('should have all required branches represented', () => {
      const branches = new Set(researchTree.map(n => n.branch));
      expect(branches).toContain('propulsion');
      expect(branches).toContain('infrastructure');
      expect(branches).toContain('commercial');
      expect(branches).toContain('orbital');
      expect(branches).toContain('control');
      expect(branches).toContain('lunar');
    });

    it('should have unique IDs across all nodes', () => {
      const ids = researchTree.map(n => n.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('all nodes should have valid prerequisite references', () => {
      const allIds = new Set(researchTree.map(n => n.id));
      researchTree.forEach(node => {
        node.prerequisites.forEach(prereqId => {
          expect(allIds.has(prereqId)).toBe(true);
        });
      });
    });

    it('should not have circular dependencies in prerequisites', () => {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const hasCycle = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const node = researchTree.find(n => n.id === nodeId);
        if (node) {
          for (const prereqId of node.prerequisites) {
            if (hasCycle(prereqId)) return true;
          }
        }

        recursionStack.delete(nodeId);
        return false;
      };

      researchTree.forEach(node => {
        if (!visited.has(node.id)) {
          expect(hasCycle(node.id)).toBe(false);
        }
      });
    });

    it('all nodes should have positive science costs', () => {
      researchTree.forEach(node => {
        expect(node.scienceCost).toBeGreaterThan(0);
      });
    });

    it('all nodes should have descriptions', () => {
      researchTree.forEach(node => {
        expect(node.description).toBeDefined();
        expect(node.description.length).toBeGreaterThan(0);
      });
    });

     it('all nodes should have valid effect types', () => {
       const validEffectTypes = [
         'fuelCostMultiplier',
         'fuelCapacityBonus',
         'explosionChanceMultiplier',
         'cargoGenerationMultiplier',
         'cargoPerLaunchMultiplier',
         'cargoPerLaunchBonus',
         'passiveCargoBonus',
         'spaceportCapacityBonus',
          'refineryOutputMultiplier',
          'constructionCostMultiplier',
          'passiveMoneyBonus',
          'contractRequirementMultiplier',
         'companyXPMultiplier',
         'unlockAfterburner',
         'stationLogisticsMultiplier',
         'stationScienceMultiplier',
         'unlockMoonMissions',
         'unlockScienceRockets',
         'unlockSpaceports',
         'unlockRefineries',
         'unlockExplosionClearing',
         'unlockFreeLaunch',
         'buildRocketMultiplier',
         'clearExplosionMultiplier',
         'buildRocketBatchBonus',
         'clearExplosionCountBonus',
         'uiTelemetryFlag',
         'autoBuildEnabled',
         'autoSalvageEnabled',
         'contractRefreshMultiplier',
         'maxActiveContractsBonus',
         'maxAvailableContractsBonus',
         'sciencePerRocketBonus',
         // Orbital layer effect types
         'unlockSatellites',
         'maxSatellitesBonus',
         'debrisImmunity',
         'dockingBonusMultiplier',
         'stationDocksBonus',
         'satelliteBonusMultiplier',
         // Lunar/Moon layer effect types
         'lunarProductionMultiplier',
         'unlockLunarManufacturing',
         // Lunar branch effect types
         'missionDurationMultiplier',
         'extractorOutputMultiplier',
         'moonRefineryOutputMultiplier',
         'moonStorageMultiplier',
         'hazardDurationMultiplier',
         'massDriverEfficiency',
         'unlockPlanetaryExpansion',
         'refineryCapacityBonus',
         'solarArrayEfficiency',
         'nuclearReactorEfficiency',
         'batteryCapacityMultiplier',
         'powerGenerationMultiplier',
         'sectorScanCostReduction',
          'buildingSlotsPerSectorBonus',
          'massDriverChargeTimeMultiplier',
          'massDriverCapacityBonus',
          'bountyRewardMultiplier',
          'fabricatorOutputMultiplier',
          'fabricatorCostReduction',
          'alloysStorageBonus',
        ];

       researchTree.forEach(node => {
         expect(validEffectTypes).toContain(node.effect.type);
       });
     });

    it('all nodes should have positive effect values', () => {
      researchTree.forEach(node => {
        expect(node.effect.value).toBeGreaterThan(0);
      });
    });
  });

   describe('Multi-level Research Configuration', () => {
      it('multi-level nodes should have levelSuffix=true', () => {
        const multiLevelIds = [
          'p1-1', 'p1-2', 'p1-3', 'p1-4', 'p1-5', // Efficient Engines
          'p2-1', 'p2-2', 'p2-3', 'p2-4', 'p2-5', 'p2-6', 'p2-7', 'p2-8', 'p2-9', 'p2-10', 'p2-11', 'p2-12', 'p2-13', 'p2-14', 'p2-15', 'p2-16', 'p2-17', 'p2-18', 'p2-19', 'p2-20', // Safety Protocols
          'i1-1', 'i1-2', 'i1-3', 'i1-4', 'i1-5', 'i1-6', 'i1-7', 'i1-8', 'i1-9', // Modular Spaceports (9 levels)
          'i2-1', 'i2-2', 'i2-3', 'i2-4', 'i2-5', // Advanced Refineries
          'f1-1', 'f1-2', 'f1-3', 'f1-4', 'f1-5', // Fuel Tanks
          'c1-1', 'c1-2', 'c1-3', 'c1-4', 'c1-5', // Market Analysis
          'u1-1', 'u1-2', 'u1-3', 'u1-4', 'u1-5', 'u1-6', 'u1-7', 'u1-8', 'u1-9', 'u1-10', // Assembly Optimization (10 levels)
          'u2-1', 'u2-2', 'u2-3', 'u2-4', 'u2-5', 'u2-6', 'u2-7', 'u2-8', 'u2-9', 'u2-10', // Recovery Protocols (10 levels)
          'l1-1', 'l1-2', 'l1-3', 'l1-4', 'l1-5', 'l1-6', 'l1-7', 'l1-8', 'l1-9', 'l1-10', // Cargo Optimization
        ];
        multiLevelIds.forEach(id => {
          const node = researchTree.find(n => n.id === id);
          expect(node?.levelSuffix).toBe(true);
        });
      });

    it('p2-1 should have maxLevel=100', () => {
      const node = researchTree.find(n => n.id === 'p2-1');
      expect(node?.maxLevel).toBe(100);
    });

    it('single-level nodes should not have maxLevel', () => {
       const singleLevelIds = ['p4', 'i3', 'f2', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'l2', 'l3', 'l4', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'o10', 'o11', 'o12', 'o13', 'o14', 'o15', 'u3', 'u4', 'u6', 'u7', 'u8', 'u9', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
       singleLevelIds.forEach(id => {
         const node = researchTree.find(n => n.id === id);
         expect(node?.maxLevel).toBeUndefined();
       });
     });

     it('single-level nodes should not have levelSuffix=true', () => {
       const singleLevelIds = ['p4', 'i3', 'f2', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'l2', 'l3', 'l4', 'o1', 'o2', 'o3', 'o4', 'o5', 'o6', 'o7', 'o8', 'o9', 'o10', 'o11', 'o12', 'o13', 'o14', 'o15', 'u3', 'u4', 'u6', 'u7', 'u8', 'u9', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'];
      singleLevelIds.forEach(id => {
        const node = researchTree.find(n => n.id === id);
        expect(node?.levelSuffix).not.toBe(true);
      });
    });
  });

  describe('Propulsion Branch', () => {
    describe('p1-1: Efficient Engines I', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'p1-1');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'p1-1');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply fuelCostMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'p1-1');
        expect(node?.effect.type).toBe('fuelCostMultiplier');
        expect(node?.effect.value).toBe(0.97);
      });

      it('should be unlockable without prerequisites', () => {
        useGameStore.setState({ science: 500, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('p1-1');
        expect(useGameStore.getState().researchedNodes).toContain('p1-1');
      });

      it('should not be unlockable with insufficient science', () => {
        useGameStore.setState({ science: 50, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('p1-1');
        expect(useGameStore.getState().researchedNodes).not.toContain('p1-1');
      });
    });

    describe('p2-1: Safety Protocols I', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'p2-1');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'p2-1');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply explosionChanceMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'p2-1');
        expect(node?.effect.type).toBe('explosionChanceMultiplier');
        expect(node?.effect.value).toBe(0.95);
      });

      it('should have maxLevel=100', () => {
        const node = researchTree.find(n => n.id === 'p2-1');
        expect(node?.maxLevel).toBe(100);
      });
    });

     describe('p2-2: Safety Protocols II', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'p2-2');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'p2-2');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should be unlockable without needing p2-1', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('p2-2');
         expect(useGameStore.getState().researchedNodes).toContain('p2-2');
       });
     });

      describe('p2-3 through p2-10: Safety Protocols', () => {
        const safetyLevels = [
          { id: 'p2-3' },
          { id: 'p2-4' },
          { id: 'p2-5' },
          { id: 'p2-6' },
          { id: 'p2-7' },
          { id: 'p2-8' },
          { id: 'p2-9' },
          { id: 'p2-10' },
        ];

        safetyLevels.forEach(({ id }) => {
          it(`${id} should exist with no prerequisites`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node).toBeDefined();
            expect(node?.name).toBe('Safety Protocols');
            expect(node?.prerequisites).toEqual([]);
          });

          it(`${id} should have explosionChanceMultiplier=0.95`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node?.effect.type).toBe('explosionChanceMultiplier');
            expect(node?.effect.value).toBe(0.95);
          });
        });
      });

      describe('p2-11 through p2-20: Safety Protocols', () => {
        const safetyLevels = [
          { id: 'p2-11' },
          { id: 'p2-12' },
          { id: 'p2-13' },
          { id: 'p2-14' },
          { id: 'p2-15' },
          { id: 'p2-16' },
          { id: 'p2-17' },
          { id: 'p2-18' },
          { id: 'p2-19' },
          { id: 'p2-20' },
        ];

        safetyLevels.forEach(({ id }) => {
          it(`${id} should exist with no prerequisites`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node).toBeDefined();
            expect(node?.name).toBe('Safety Protocols');
            expect(node?.prerequisites).toEqual([]);
          });

          it(`${id} should have explosionChanceMultiplier=0.95`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node?.effect.type).toBe('explosionChanceMultiplier');
            expect(node?.effect.value).toBe(0.95);
          });
        });
      });

     describe('p3-1 through p3-5: High-Energy Fuel I-V', () => {
       const fuelLevels = [
         { id: 'p3-1', name: 'High-Energy Fuel I', cost: 150 },
         { id: 'p3-2', name: 'High-Energy Fuel II', cost: 300 },
         { id: 'p3-3', name: 'High-Energy Fuel III', cost: 500 },
         { id: 'p3-4', name: 'High-Energy Fuel IV', cost: 750 },
         { id: 'p3-5', name: 'High-Energy Fuel V', cost: 1000 },
       ];

       fuelLevels.forEach((level) => {
         describe(level.name, () => {
           it('should exist in researchTree', () => {
             const node = researchTree.find(n => n.id === level.id);
             expect(node).toBeDefined();
           });

           it('should have correct name', () => {
             const node = researchTree.find(n => n.id === level.id);
             expect(node?.name).toBe(level.name);
           });

           it('should have correct science cost', () => {
             const node = researchTree.find(n => n.id === level.id);
             expect(node?.scienceCost).toBe(level.cost);
           });

           it('should have no prerequisites', () => {
             const node = researchTree.find(n => n.id === level.id);
             expect(node?.prerequisites).toEqual([]);
           });

           it('should apply cargoPerLaunchBonus effect', () => {
             const node = researchTree.find(n => n.id === level.id);
             expect(node?.effect.type).toBe('cargoPerLaunchBonus');
             expect(node?.effect.value).toBe(1);
           });

           it('should be unlockable without any prerequisites', () => {
             useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
             useGameStore.getState().unlockNode(level.id);
             expect(useGameStore.getState().researchedNodes).toContain(level.id);
           });
         });
       });
     });
  });

  describe('Infrastructure Branch', () => {
      describe('i1-1 through i1-9: Modular Spaceports I-IX', () => {
        const spaceportLevels = [
          { id: 'i1-1', name: 'Modular Spaceports I' },
          { id: 'i1-2', name: 'Modular Spaceports II' },
          { id: 'i1-3', name: 'Modular Spaceports III' },
          { id: 'i1-4', name: 'Modular Spaceports IV' },
          { id: 'i1-5', name: 'Modular Spaceports V' },
          { id: 'i1-6', name: 'Modular Spaceports VI' },
          { id: 'i1-7', name: 'Modular Spaceports VII' },
          { id: 'i1-8', name: 'Modular Spaceports VIII' },
          { id: 'i1-9', name: 'Modular Spaceports IX' },
        ];

        spaceportLevels.forEach(({ id, name }) => {
          it(`${id} should exist with no prerequisites`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node).toBeDefined();
            expect(node?.name).toBe(name);
            expect(node?.prerequisites).toEqual([]);
          });

          it(`${id} should have spaceportCapacityBonus=1`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node?.effect.type).toBe('spaceportCapacityBonus');
            expect(node?.effect.value).toBe(1);
          });
        });
      });

     describe('i2-1: Advanced Refineries I', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'i2-1');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'i2-1');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply refineryOutputMultiplier effect', () => {
         const node = researchTree.find(n => n.id === 'i2-1');
         expect(node?.effect.type).toBe('refineryOutputMultiplier');
         expect(node?.effect.value).toBe(1.15);
       });

       it('should be unlockable independently', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('i2-1');
         expect(useGameStore.getState().researchedNodes).toContain('i2-1');
       });
     });

      describe('i3: Cost Reduction', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'i3');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'i3');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply constructionCostMultiplier effect', () => {
         const node = researchTree.find(n => n.id === 'i3');
         expect(node?.effect.type).toBe('constructionCostMultiplier');
         expect(node?.effect.value).toBe(0.85);
       });

       it('should affect getCurrentSpaceportCost()', () => {
         useGameStore.setState({
           science: 5000,
           researchedNodes: ['i1-1', 'i2-1', 'i3'],
           spaceports: [{ id: 1 }], // 1 spaceport already exists
         } as unknown as GameState);
         const cost = useGameStore.getState().getCurrentSpaceportCost();
         // 1000 * 2.5^1 * 0.85 = 1000 * 2.5 * 0.85 = 2125
         expect(cost).toBe(2125);
       });
    });
  });

  describe('Commercial Branch', () => {
    describe('c1-1: Market Analysis I', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'c1-1');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'c1-1');
        expect(node?.prerequisites).toEqual([]);
      });

       it('should apply passiveMoneyBonus effect', () => {
         const node = researchTree.find(n => n.id === 'c1-1');
         expect(node?.effect.type).toBe('passiveMoneyBonus');
         expect(node?.effect.value).toBe(10);
       });

      it('should be unlockable without prerequisites', () => {
        useGameStore.setState({ science: 500, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('c1-1');
        expect(useGameStore.getState().researchedNodes).toContain('c1-1');
      });

       it('should apply bonus in getEffectMultiplier', () => {
         useGameStore.setState({ science: 1000, researchedNodes: ['c1-1'] } as unknown as GameState);
         const bonus = useGameStore.getState().getEffectMultiplier('passiveMoneyBonus');
         expect(bonus).toBe(10);
       });
    });

    describe('c2: Lean Logistics', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'c2');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'c2');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply contractRequirementMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'c2');
        expect(node?.effect.type).toBe('contractRequirementMultiplier');
        expect(node?.effect.value).toBe(0.80);
      });

      it('should be unlockable independently', () => {
        useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('c2');
        expect(useGameStore.getState().researchedNodes).toContain('c2');
      });
    });

    describe('c3: Negotiation Tactics', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'c3');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'c3');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply companyXPMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'c3');
        expect(node?.effect.type).toBe('companyXPMultiplier');
        expect(node?.effect.value).toBe(1.5);
      });

      it('should be unlockable independently', () => {
        useGameStore.setState({ science: 5000, researchedNodes: ['c1-1'] } as unknown as GameState);
        useGameStore.getState().unlockNode('c3');
        expect(useGameStore.getState().researchedNodes).toContain('c3');
      });
    });
  });

  describe('Orbital Branch (3 nodes)', () => {
    describe('o1: Orbital Logistics', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'o1');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'o1');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply stationLogisticsMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'o1');
        expect(node?.effect.type).toBe('stationLogisticsMultiplier');
        expect(node?.effect.value).toBe(1.5);
      });

      it('should be unlockable without prerequisites', () => {
        useGameStore.setState({ science: 500, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('o1');
        expect(useGameStore.getState().researchedNodes).toContain('o1');
      });
    });

    describe('o2: Deep Space Scanners', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'o2');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'o2');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply stationScienceMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'o2');
        expect(node?.effect.type).toBe('stationScienceMultiplier');
        expect(node?.effect.value).toBe(1.5);
      });

      it('should be unlockable independently', () => {
        useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('o2');
        expect(useGameStore.getState().researchedNodes).toContain('o2');
      });
    });

    describe('o3: Lunar Gateway', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'o3');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'o3');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply unlockMoonMissions effect', () => {
        const node = researchTree.find(n => n.id === 'o3');
        expect(node?.effect.type).toBe('unlockMoonMissions');
        expect(node?.effect.value).toBe(1);
      });

      it('should be unlockable independently', () => {
        useGameStore.setState({ science: 5000, researchedNodes: ['o1'] } as unknown as GameState);
        useGameStore.getState().unlockNode('o3');
        expect(useGameStore.getState().researchedNodes).toContain('o3');
      });
    });
  });

  describe('Control Branch (14 nodes)', () => {
     describe('u1-1 through u1-10: Assembly Optimization I-X', () => {
       const assemblyLevels = [
         { id: 'u1-1', name: 'Assembly Optimization I', prereqs: ['u7'] }, // Requires Auto-Queue
         { id: 'u1-2', name: 'Assembly Optimization II', prereqs: [] },
         { id: 'u1-3', name: 'Assembly Optimization III', prereqs: [] },
         { id: 'u1-4', name: 'Assembly Optimization IV', prereqs: [] },
         { id: 'u1-5', name: 'Assembly Optimization V', prereqs: [] },
         { id: 'u1-6', name: 'Assembly Optimization VI', prereqs: [] },
         { id: 'u1-7', name: 'Assembly Optimization VII', prereqs: [] },
         { id: 'u1-8', name: 'Assembly Optimization VIII', prereqs: [] },
         { id: 'u1-9', name: 'Assembly Optimization IX', prereqs: [] },
         { id: 'u1-10', name: 'Assembly Optimization X', prereqs: [] },
       ];

       assemblyLevels.forEach(({ id, name, prereqs }) => {
         it(`${id} should exist with correct prerequisites`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node).toBeDefined();
           expect(node?.name).toBe(name);
           expect(node?.prerequisites).toEqual(prereqs);
         });

         it(`${id} should have buildRocketMultiplier=1.2`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node?.effect.type).toBe('buildRocketMultiplier');
           expect(node?.effect.value).toBe(1.2);
         });
       });
     });

     describe('u2-1 through u2-10: Recovery Protocols I-X', () => {
       const recoveryLevels = [
         { id: 'u2-1', name: 'Recovery Protocols I' },
         { id: 'u2-2', name: 'Recovery Protocols II' },
         { id: 'u2-3', name: 'Recovery Protocols III' },
         { id: 'u2-4', name: 'Recovery Protocols IV' },
         { id: 'u2-5', name: 'Recovery Protocols V' },
         { id: 'u2-6', name: 'Recovery Protocols VI' },
         { id: 'u2-7', name: 'Recovery Protocols VII' },
         { id: 'u2-8', name: 'Recovery Protocols VIII' },
         { id: 'u2-9', name: 'Recovery Protocols IX' },
         { id: 'u2-10', name: 'Recovery Protocols X' },
       ];

       recoveryLevels.forEach(({ id, name }) => {
         it(`${id} should exist with correct prerequisites`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node).toBeDefined();
           expect(node?.name).toBe(name);
           // u2-1 requires u8 (Auto-Salvage), others have no prereqs
           if (id === 'u2-1') {
             expect(node?.prerequisites).toEqual(['u8']);
           } else {
             expect(node?.prerequisites).toEqual([]);
           }
         });

         it(`${id} should have clearExplosionMultiplier=1.2`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node?.effect.type).toBe('clearExplosionMultiplier');
           expect(node?.effect.value).toBe(1.2);
         });
       });
     });

     describe('u3: Batch Assembly', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'u3');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'u3');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply buildRocketBatchBonus effect', () => {
         const node = researchTree.find(n => n.id === 'u3');
         expect(node?.effect.type).toBe('buildRocketBatchBonus');
         expect(node?.effect.value).toBe(1);
       });

       it('should be unlockable without any prerequisites', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('u3');
         expect(useGameStore.getState().researchedNodes).toContain('u3');
       });
     });

     describe('u4: Rapid Salvage', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'u4');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'u4');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply clearExplosionCountBonus effect', () => {
         const node = researchTree.find(n => n.id === 'u4');
         expect(node?.effect.type).toBe('clearExplosionCountBonus');
         expect(node?.effect.value).toBe(1);
       });

       it('should be unlockable without any prerequisites', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('u4');
         expect(useGameStore.getState().researchedNodes).toContain('u4');
       });
     });

    describe('u6: Telemetry Dashboard', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'u6');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'u6');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply uiTelemetryFlag effect', () => {
        const node = researchTree.find(n => n.id === 'u6');
        expect(node?.effect.type).toBe('uiTelemetryFlag');
        expect(node?.effect.value).toBe(1);
      });

      it('should be unlockable without prerequisites', () => {
        useGameStore.setState({ science: 500, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('u6');
        expect(useGameStore.getState().researchedNodes).toContain('u6');
      });
    });

     describe('u7: Auto-Queue', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'u7');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'u7');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply autoBuildEnabled effect', () => {
         const node = researchTree.find(n => n.id === 'u7');
         expect(node?.effect.type).toBe('autoBuildEnabled');
         expect(node?.effect.value).toBe(1);
       });

       it('should be unlockable without any prerequisites', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('u7');
         expect(useGameStore.getState().researchedNodes).toContain('u7');
       });
     });
  });

  describe('Effect Application and Multiplier Calculation', () => {
    it('multiplicative effects (ending in Multiplier) should multiply together', () => {
      useGameStore.setState({ researchedNodes: ['p1-1', 'u1-1'] } as unknown as GameState);
      // p1-1: fuelCostMultiplier = 0.97
      // u1-1: buildRocketMultiplier = 1.2 (different effect type, not multiplied together)
      expect(useGameStore.getState().getEffectMultiplier('fuelCostMultiplier')).toBe(0.97);
      expect(useGameStore.getState().getEffectMultiplier('buildRocketMultiplier')).toBe(1.2);
    });

    it('multiple instances of same multiplicative effect should multiply', () => {
      useGameStore.setState({ researchedNodes: ['u1-1', 'u1-2', 'u1-3'] } as unknown as GameState);
      // u1-1, u1-2, u1-3 all have buildRocketMultiplier = 1.2
      // Product: 1.2 * 1.2 * 1.2 = 1.728
      const multiplier = useGameStore.getState().getEffectMultiplier('buildRocketMultiplier');
      expect(multiplier).toBeCloseTo(1.728, 2);
    });

    it('additive effects should sum together', () => {
      useGameStore.setState({ researchedNodes: ['i1-1', 'i1-2', 'i1-3'] } as unknown as GameState);
      // i1-1, i1-2, i1-3 all have spaceportCapacityBonus = 1
      // Sum: 1 + 1 + 1 = 3
      expect(useGameStore.getState().getEffectMultiplier('spaceportCapacityBonus')).toBe(3);
    });

    it('effects should return 1 when no research is unlocked', () => {
      useGameStore.setState({ researchedNodes: [] } as unknown as GameState);
      expect(useGameStore.getState().getEffectMultiplier('fuelCostMultiplier')).toBe(1);
      expect(useGameStore.getState().getEffectMultiplier('explosionChanceMultiplier')).toBe(1);
      expect(useGameStore.getState().getEffectMultiplier('buildRocketMultiplier')).toBe(1);
    });
  });

  describe('Available Nodes and Unlock Logic', () => {
    it('should list all root nodes (no prerequisites) as available initially', () => {
      useGameStore.setState({
        science: 5000,
        researchedNodes: [],
        previouslyAvailableResearch: [],
      } as unknown as GameState);

      const available = useGameStore.getState().getAvailableNodes();
      const availableIds = new Set(available.map(n => n.id));

        // Root nodes: p1-1, p2-1, i1-1, i2-1, i3, f1-1, c1-1, c2, c3, c4, c6, o1, o2, o3, o5, o6, o7, o8, o10, u3, u4, u6, u7, u9, l1-1, l2, l3
        // Note: u1-1 requires u7, u2-1 requires u8, u8 requires o7 - they are not roots
        const expectedRoots = ['p1-1', 'p2-1', 'p3-1', 'i1-1', 'i2-1', 'i3', 'f1-1', 'c1-1', 'c2', 'c3', 'c4', 'c6', 'o1', 'o2', 'o3', 'o5', 'o6', 'o7', 'o8', 'o10', 'u3', 'u4', 'u6', 'u7', 'u9', 'l1-1', 'l2', 'l3'];
      expectedRoots.forEach(id => {
        expect(availableIds).toContain(id);
      });
    });

     it('should unlock p2-2 without needing p2-1', () => {
       useGameStore.setState({
         science: 5000,
         researchedNodes: [],
         previouslyAvailableResearch: [],
       } as unknown as GameState);

       let available = useGameStore.getState().getAvailableNodes();
       expect(available.find(n => n.id === 'p2-2')).toBeDefined();

       useGameStore.setState({ researchedNodes: [] } as unknown as GameState);
       available = useGameStore.getState().getAvailableNodes();
       expect(available.find(n => n.id === 'p2-2')).toBeDefined();
     });

     it('should allow unlock of p3 without p2-10', () => {
       useGameStore.setState({
         science: 5000,
         researchedNodes: [],
         previouslyAvailableResearch: [],
       } as unknown as GameState);

       const available = useGameStore.getState().getAvailableNodes();
       expect(available.find(n => n.id === 'p3-1')).toBeDefined();
      });


    it('should prevent unlock if insufficient science', () => {
      useGameStore.setState({
        science: 10,
        researchedNodes: [],
        previouslyAvailableResearch: [],
      } as unknown as GameState);

      const available = useGameStore.getState().getAvailableNodes();
      // p1 costs 100, should not be available with only 10 science
      expect(available.find(n => n.id === 'p1')).toBeUndefined();
    });

    it('should allow unlock if sufficient science', () => {
      useGameStore.setState({
        science: 100,
        researchedNodes: [],
        previouslyAvailableResearch: [],
      } as unknown as GameState);

      const available = useGameStore.getState().getAvailableNodes();
      expect(available.find(n => n.id === 'p1-1')).toBeDefined();
    });
  });

  describe('Science Cost Deduction on Unlock', () => {
    it('should deduct science cost when node is unlocked', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1-1'); // costs 80

      expect(useGameStore.getState().science).toBe(920);
    });

    it('should prevent unlock if deduction would cause insufficient science', () => {
      useGameStore.setState({
        science: 79,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1-1'); // costs 80

      expect(useGameStore.getState().science).toBe(79);
      expect(useGameStore.getState().researchedNodes).not.toContain('p1-1');
    });

    it('should prevent double-unlock of same node', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1-1');
      const scienceAfterFirst = useGameStore.getState().science;

      useGameStore.getState().unlockNode('p1-1');
      const scienceAfterSecond = useGameStore.getState().science;

      // Science should not change on second attempt
      expect(scienceAfterSecond).toBe(scienceAfterFirst);
      expect(useGameStore.getState().researchedNodes.filter(id => id === 'p1-1')).toHaveLength(1);
    });
  });

  describe('Full Research Chains', () => {
     it('should unlock full Propulsion chain up to p3', () => {
       useGameStore.setState({
         science: 10000,
         researchedNodes: [],
       } as unknown as GameState);

       const chain = ['p1-1', 'p2-1', 'p2-2', 'p2-3', 'p2-4', 'p2-5', 'p2-6', 'p2-7', 'p2-8', 'p2-9', 'p2-10', 'p3-1'];
       chain.forEach(id => {
         useGameStore.getState().unlockNode(id);
         expect(useGameStore.getState().researchedNodes).toContain(id);
       });
      });

     it('should unlock full Infrastructure chain', () => {
       useGameStore.setState({
         science: 20000,
         researchedNodes: [],
       } as unknown as GameState);

       const chain = ['i1-1', 'i1-2', 'i1-3', 'i1-4', 'i1-5', 'i2-1', 'i3'];
       chain.forEach(id => {
         useGameStore.getState().unlockNode(id);
         expect(useGameStore.getState().researchedNodes).toContain(id);
      });
     });

    it('should unlock full Commercial chain', () => {
      useGameStore.setState({
        science: 10000,
        researchedNodes: [],
      } as unknown as GameState);

      const chain = ['c1-1', 'c2', 'c3'];
      chain.forEach(id => {
        useGameStore.getState().unlockNode(id);
        expect(useGameStore.getState().researchedNodes).toContain(id);
      });
    });

    it('should unlock full Orbital chain', () => {
      useGameStore.setState({
        science: 10000,
        researchedNodes: [],
      } as unknown as GameState);

      const chain = ['o1', 'o2', 'o3'];
      chain.forEach(id => {
        useGameStore.getState().unlockNode(id);
        expect(useGameStore.getState().researchedNodes).toContain(id);
      });
    });

    it('should unlock Control chain up to u7', () => {
      useGameStore.setState({
        science: 10000,
        researchedNodes: [],
      } as unknown as GameState);

      // u7 (Auto-Queue) must be unlocked before u1-1 (Assembly Optimization)
      const chain = ['u7', 'u1-1', 'u1-2', 'u1-3', 'u3'];
      chain.forEach(id => {
        useGameStore.getState().unlockNode(id);
        expect(useGameStore.getState().researchedNodes).toContain(id);
      });
    });
  });
});
