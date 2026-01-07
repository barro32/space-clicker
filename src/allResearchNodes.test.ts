import { describe, it, expect, beforeEach } from 'vitest';
import { researchTree, ResearchNode } from './researchTree.js';
import { useGameStore, GameState } from './useGameStore.js';

/**
 * COMPREHENSIVE RESEARCH NODE TEST SUITE
 * 
 * This test suite validates all 54 research nodes across 5 branches:
 * - Propulsion (22 nodes): p1, p2-1 to p2-20, p3
 * - Infrastructure (12 nodes): i1-1 to i1-10, i2, i3
 * - Commercial (3 nodes): c1, c2, c3
 * - Orbital (3 nodes): o1, o2, o3
 * - Control (14 nodes): u1-1 to u1-5, u2-1 to u2-5, u3, u4, u6, u7
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

describe('All 35 Research Nodes - Comprehensive Coverage', () => {
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
      activeContract: null,
      rockets: [],
      nextRocketId: 0,
      rocketCost: 10,
      profitPerRocket: 1,
      spaceportCapacity: 9,
      spaceports: [{ type: 'cargo' }],
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
      it('should have exactly 58 research nodes', () => {
        expect(researchTree).toHaveLength(58);
      });

    it('should have all required branches represented', () => {
      const branches = new Set(researchTree.map(n => n.branch));
      expect(branches).toContain('propulsion');
      expect(branches).toContain('infrastructure');
      expect(branches).toContain('commercial');
      expect(branches).toContain('orbital');
      expect(branches).toContain('control');
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
        'explosionChanceMultiplier',
        'cargoGenerationMultiplier',
        'spaceportCapacityBonus',
        'refineryOutputMultiplier',
        'constructionCostMultiplier',
        'profitMultiplier',
        'contractMoneyMultiplier',
        'unlockHighValueContracts',
        'stationLogisticsMultiplier',
        'stationScienceMultiplier',
        'unlockMoonMissions',
        'unlockScienceRockets',
        'unlockSpaceports',
        'unlockRefineries',
        'unlockExplosionClearing',
        'buildRocketMultiplier',
        'clearExplosionMultiplier',
        'buildRocketBatchBonus',
        'clearExplosionCountBonus',
        'uiTelemetryFlag',
        'autoBuildEnabled',
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
        const multiLevelIds = ['p2-1', 'p2-2', 'p2-3', 'p2-4', 'p2-5', 'p2-6', 'p2-7', 'p2-8', 'p2-9', 'p2-10', 'p2-11', 'p2-12', 'p2-13', 'p2-14', 'p2-15', 'p2-16', 'p2-17', 'p2-18', 'p2-19', 'p2-20', 'i1-1', 'i1-2', 'i1-3', 'i1-4', 'i1-5', 'i1-6', 'i1-7', 'i1-8', 'i1-9', 'i1-10', 'u1-1', 'u1-2', 'u1-3', 'u1-4', 'u1-5', 'u2-1', 'u2-2', 'u2-3', 'u2-4', 'u2-5'];
        multiLevelIds.forEach(id => {
          const node = researchTree.find(n => n.id === id);
          expect(node?.levelSuffix).toBe(true);
        });
      });

    it('p2-1 should have maxLevel=20', () => {
      const node = researchTree.find(n => n.id === 'p2-1');
      expect(node?.maxLevel).toBe(20);
    });

    it('single-level nodes should not have maxLevel', () => {
      const singleLevelIds = ['p1', 'p3', 'i2', 'i3', 'c1', 'c2', 'c3', 'o1', 'o2', 'o3', 'o4', 'u3', 'u4', 'u6', 'u7'];
      singleLevelIds.forEach(id => {
        const node = researchTree.find(n => n.id === id);
        expect(node?.maxLevel).toBeUndefined();
      });
    });

    it('single-level nodes should not have levelSuffix=true', () => {
      const singleLevelIds = ['p1', 'p3', 'i2', 'i3', 'c1', 'c2', 'c3', 'o1', 'o2', 'o3', 'o4', 'u3', 'u4', 'u6', 'u7'];
      singleLevelIds.forEach(id => {
        const node = researchTree.find(n => n.id === id);
        expect(node?.levelSuffix).not.toBe(true);
      });
    });
  });

  describe('Propulsion Branch (12 nodes)', () => {
    describe('p1: Efficient Engines', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'p1');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'p1');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply fuelCostMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'p1');
        expect(node?.effect.type).toBe('fuelCostMultiplier');
        expect(node?.effect.value).toBe(0.9);
      });

      it('should be unlockable without prerequisites', () => {
        useGameStore.setState({ science: 500, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('p1');
        expect(useGameStore.getState().researchedNodes).toContain('p1');
      });

      it('should not be unlockable with insufficient science', () => {
        useGameStore.setState({ science: 50, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('p1');
        expect(useGameStore.getState().researchedNodes).not.toContain('p1');
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

      it('should have maxLevel=20', () => {
        const node = researchTree.find(n => n.id === 'p2-1');
        expect(node?.maxLevel).toBe(20);
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

     describe('p2-3 through p2-10: Safety Protocols III-X', () => {
       const safetyLevels = [
         { id: 'p2-3', name: 'Safety Protocols III' },
         { id: 'p2-4', name: 'Safety Protocols IV' },
         { id: 'p2-5', name: 'Safety Protocols V' },
         { id: 'p2-6', name: 'Safety Protocols VI' },
         { id: 'p2-7', name: 'Safety Protocols VII' },
         { id: 'p2-8', name: 'Safety Protocols VIII' },
         { id: 'p2-9', name: 'Safety Protocols IX' },
         { id: 'p2-10', name: 'Safety Protocols X' },
       ];

       safetyLevels.forEach(({ id, name }) => {
         it(`${id} should exist with no prerequisites`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node).toBeDefined();
           expect(node?.name).toBe(name);
           expect(node?.prerequisites).toEqual([]);
         });

         it(`${id} should have explosionChanceMultiplier=0.95`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node?.effect.type).toBe('explosionChanceMultiplier');
           expect(node?.effect.value).toBe(0.95);
         });
       });
     });

     describe('p2-11 through p2-20: Safety Protocols XI-XX', () => {
       const safetyLevels = [
         { id: 'p2-11', name: 'Safety Protocols XI' },
         { id: 'p2-12', name: 'Safety Protocols XII' },
         { id: 'p2-13', name: 'Safety Protocols XIII' },
         { id: 'p2-14', name: 'Safety Protocols XIV' },
         { id: 'p2-15', name: 'Safety Protocols XV' },
         { id: 'p2-16', name: 'Safety Protocols XVI' },
         { id: 'p2-17', name: 'Safety Protocols XVII' },
         { id: 'p2-18', name: 'Safety Protocols XVIII' },
         { id: 'p2-19', name: 'Safety Protocols XIX' },
         { id: 'p2-20', name: 'Safety Protocols XX' },
       ];

       safetyLevels.forEach(({ id, name }) => {
         it(`${id} should exist with no prerequisites`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node).toBeDefined();
           expect(node?.name).toBe(name);
           expect(node?.prerequisites).toEqual([]);
         });

         it(`${id} should have explosionChanceMultiplier=0.95`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node?.effect.type).toBe('explosionChanceMultiplier');
           expect(node?.effect.value).toBe(0.95);
         });
       });
     });

     describe('p3: High-Energy Fuel', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'p3');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'p3');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply cargoGenerationMultiplier effect', () => {
         const node = researchTree.find(n => n.id === 'p3');
         expect(node?.effect.type).toBe('cargoGenerationMultiplier');
         expect(node?.effect.value).toBe(1.2);
       });

       it('should be unlockable without any prerequisites', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('p3');
         expect(useGameStore.getState().researchedNodes).toContain('p3');
       });
     });
  });

  describe('Infrastructure Branch (3 nodes)', () => {
      describe('i1-1 through i1-10: Modular Spaceports I-X', () => {
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
          { id: 'i1-10', name: 'Modular Spaceports X' },
        ];

        spaceportLevels.forEach(({ id, name }) => {
          it(`${id} should exist with no prerequisites`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node).toBeDefined();
            expect(node?.name).toBe(name);
            expect(node?.prerequisites).toEqual([]);
          });

          it(`${id} should have spaceportCapacityBonus=3`, () => {
            const node = researchTree.find(n => n.id === id);
            expect(node?.effect.type).toBe('spaceportCapacityBonus');
            expect(node?.effect.value).toBe(3);
          });
        });
      });

     describe('i2: Advanced Refineries', () => {
       it('should exist in researchTree', () => {
         const node = researchTree.find(n => n.id === 'i2');
         expect(node).toBeDefined();
       });

       it('should have no prerequisites', () => {
         const node = researchTree.find(n => n.id === 'i2');
         expect(node?.prerequisites).toEqual([]);
       });

       it('should apply refineryOutputMultiplier effect', () => {
         const node = researchTree.find(n => n.id === 'i2');
         expect(node?.effect.type).toBe('refineryOutputMultiplier');
         expect(node?.effect.value).toBe(1.5);
       });

       it('should be unlockable independently', () => {
         useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
         useGameStore.getState().unlockNode('i2');
         expect(useGameStore.getState().researchedNodes).toContain('i2');
       });
     });

     describe('i3: Automated Construction', () => {
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
          researchedNodes: ['i1', 'i2', 'i3'],
          spaceports: [{ type: 'cargo' }], // 1 spaceport already exists
        } as unknown as GameState);
        const cost = useGameStore.getState().getCurrentSpaceportCost();
        // 1000 * 1.5^1 * 0.85 = 1000 * 1.5 * 0.85 = 1275
        expect(cost).toBe(1275);
      });
    });
  });

  describe('Commercial Branch (3 nodes)', () => {
    describe('c1: Market Analysis', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'c1');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'c1');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply profitMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'c1');
        expect(node?.effect.type).toBe('profitMultiplier');
        expect(node?.effect.value).toBe(1.2);
      });

      it('should be unlockable without prerequisites', () => {
        useGameStore.setState({ science: 500, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('c1');
        expect(useGameStore.getState().researchedNodes).toContain('c1');
      });

      it('should apply multiplier in getEffectMultiplier', () => {
        useGameStore.setState({ science: 1000, researchedNodes: ['c1'] } as unknown as GameState);
        const multiplier = useGameStore.getState().getEffectMultiplier('profitMultiplier');
        expect(multiplier).toBe(1.2);
      });
    });

    describe('c2: Corporate Partnerships', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'c2');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'c2');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply contractMoneyMultiplier effect', () => {
        const node = researchTree.find(n => n.id === 'c2');
        expect(node?.effect.type).toBe('contractMoneyMultiplier');
        expect(node?.effect.value).toBe(1.25);
      });

      it('should be unlockable independently', () => {
        useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
        useGameStore.getState().unlockNode('c2');
        expect(useGameStore.getState().researchedNodes).toContain('c2');
      });
    });

    describe('c3: Interstellar Trade', () => {
      it('should exist in researchTree', () => {
        const node = researchTree.find(n => n.id === 'c3');
        expect(node).toBeDefined();
      });

      it('should have no prerequisites', () => {
        const node = researchTree.find(n => n.id === 'c3');
        expect(node?.prerequisites).toEqual([]);
      });

      it('should apply unlockHighValueContracts effect', () => {
        const node = researchTree.find(n => n.id === 'c3');
        expect(node?.effect.type).toBe('unlockHighValueContracts');
        expect(node?.effect.value).toBe(1);
      });

      it('should be unlockable independently', () => {
        useGameStore.setState({ science: 5000, researchedNodes: ['c1'] } as unknown as GameState);
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
     describe('u1-1 through u1-5: Assembly Optimization I-V', () => {
       const assemblyLevels = [
         { id: 'u1-1', name: 'Assembly Optimization I' },
         { id: 'u1-2', name: 'Assembly Optimization II' },
         { id: 'u1-3', name: 'Assembly Optimization III' },
         { id: 'u1-4', name: 'Assembly Optimization IV' },
         { id: 'u1-5', name: 'Assembly Optimization V' },
       ];

       assemblyLevels.forEach(({ id, name }) => {
         it(`${id} should exist with no prerequisites`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node).toBeDefined();
           expect(node?.name).toBe(name);
           expect(node?.prerequisites).toEqual([]);
         });

         it(`${id} should have buildRocketMultiplier=1.2`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node?.effect.type).toBe('buildRocketMultiplier');
           expect(node?.effect.value).toBe(1.2);
         });
       });
     });

     describe('u2-1 through u2-5: Recovery Protocols I-V', () => {
       const recoveryLevels = [
         { id: 'u2-1', name: 'Recovery Protocols I' },
         { id: 'u2-2', name: 'Recovery Protocols II' },
         { id: 'u2-3', name: 'Recovery Protocols III' },
         { id: 'u2-4', name: 'Recovery Protocols IV' },
         { id: 'u2-5', name: 'Recovery Protocols V' },
       ];

       recoveryLevels.forEach(({ id, name }) => {
         it(`${id} should exist with no prerequisites`, () => {
           const node = researchTree.find(n => n.id === id);
           expect(node).toBeDefined();
           expect(node?.name).toBe(name);
           expect(node?.prerequisites).toEqual([]);
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
      useGameStore.setState({ researchedNodes: ['p1', 'c1'] } as unknown as GameState);
      // p1: fuelCostMultiplier = 0.9
      // c1: profitMultiplier = 1.2 (different effect type, not multiplied together)
      expect(useGameStore.getState().getEffectMultiplier('fuelCostMultiplier')).toBe(0.9);
      expect(useGameStore.getState().getEffectMultiplier('profitMultiplier')).toBe(1.2);
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
      // i1-1, i1-2, i1-3 all have spaceportCapacityBonus = 3
      // Sum: 3 + 3 + 3 = 9
      expect(useGameStore.getState().getEffectMultiplier('spaceportCapacityBonus')).toBe(9);
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

      // Root nodes: p1, p2-1, i1-1, i2, i3, c1, c2, c3, o1, o2, o3, o4, u1-1, u2-1, u6
      const expectedRoots = ['p1', 'p2-1', 'i1-1', 'i2', 'i3', 'c1', 'c2', 'c3', 'o1', 'o2', 'o3', 'o4', 'u1-1', 'u2-1', 'u6'];
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
       expect(available.find(n => n.id === 'p3')).toBeDefined();
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
      expect(available.find(n => n.id === 'p1')).toBeDefined();
    });
  });

  describe('Science Cost Deduction on Unlock', () => {
    it('should deduct science cost when node is unlocked', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1'); // costs 80

      expect(useGameStore.getState().science).toBe(920);
    });

    it('should prevent unlock if deduction would cause insufficient science', () => {
      useGameStore.setState({
        science: 79,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1'); // costs 80

      expect(useGameStore.getState().science).toBe(79);
      expect(useGameStore.getState().researchedNodes).not.toContain('p1');
    });

    it('should prevent double-unlock of same node', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1');
      const scienceAfterFirst = useGameStore.getState().science;

      useGameStore.getState().unlockNode('p1');
      const scienceAfterSecond = useGameStore.getState().science;

      // Science should not change on second attempt
      expect(scienceAfterSecond).toBe(scienceAfterFirst);
      expect(useGameStore.getState().researchedNodes.filter(id => id === 'p1')).toHaveLength(1);
    });
  });

  describe('Full Research Chains', () => {
     it('should unlock full Propulsion chain up to p3', () => {
       useGameStore.setState({
         science: 10000,
         researchedNodes: [],
       } as unknown as GameState);

       const chain = ['p1', 'p2-1', 'p2-2', 'p2-3', 'p2-4', 'p2-5', 'p2-6', 'p2-7', 'p2-8', 'p2-9', 'p2-10', 'p3'];
       chain.forEach(id => {
         useGameStore.getState().unlockNode(id);
         expect(useGameStore.getState().researchedNodes).toContain(id);
       });
     });

     it('should unlock full Infrastructure chain', () => {
       useGameStore.setState({
         science: 10000,
         researchedNodes: [],
       } as unknown as GameState);

       const chain = ['i1-1', 'i1-2', 'i1-3', 'i1-4', 'i1-5', 'i2', 'i3'];
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

      const chain = ['c1', 'c2', 'c3'];
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

      const chain = ['u1-1', 'u1-2', 'u1-3', 'u3', 'u7'];
      chain.forEach(id => {
        useGameStore.getState().unlockNode(id);
        expect(useGameStore.getState().researchedNodes).toContain(id);
      });
    });
  });
});
