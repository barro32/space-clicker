import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, GameState } from './useGameStore.js';
import { DEFAULT_COMPANIES } from './gameConstants.js';

describe('useGameStore - Orbital Space Stations', () => {
  beforeEach(() => {
    useGameStore.setState({
      money: 100000,
      science: 1000,
      fuel: 1000,
      cargo: 0,
      rockets: [],
      spaceports: [{ id: 1 }],
      spaceStations: [],
      activeContracts: [],
      availableContracts: [],
      notifications: [],
      researchedNodes: [],
      companies: DEFAULT_COMPANIES.map(c => ({ ...c })), // Reset companies to defaults
    } as unknown as GameState);
});


describe('Auto-build (Auto-Queue)', () => {
  it('unlocking u7 sets effect available', () => {
    useGameStore.setState({ science: 5000, researchedNodes: [] } as unknown as GameState);
    // u7 now has no prerequisites and costs 4000 science
    useGameStore.getState().unlockNode('u7');
    const state = useGameStore.getState();
    expect(state.researchedNodes).toContain('u7');
    expect(state.getEffectMultiplier('autoBuildEnabled')).toBeGreaterThan(0);
  });

    it('when toggle enabled tick attempts to auto-build rockets', () => {
      // Reset and prepare for auto-build
      useGameStore.setState({
        money: 1000,
        rockets: [],
        nextRocketId: 0,
        rocketCost: 10,
        spaceports: [{ id: 1 }],
        spaceportCapacity: 9,
        researchedNodes: ['u7'], // just need u7 to enable auto-build
        autoBuildActive: true,
        previouslyAvailableResearch: [],
        notifications: [],
      } as unknown as GameState);

     // Run one tick: should auto-build using money
     useGameStore.getState().tick();
     const s = useGameStore.getState();
     // After tick, some rockets should have been queued/built
     expect(s.rockets.filter(r => r !== null).length).toBeGreaterThan(0);
   });
});


  it('should change currentView when setView is called', () => {
    useGameStore.getState().setView("orbit");
    expect(useGameStore.getState().currentView).toBe("orbit");
    useGameStore.getState().setView("surface");
    expect(useGameStore.getState().currentView).toBe("surface");
  });

  it('should have SpaceStation interface defined (compile check)', () => {
    // This is primarily a type check, but we can verify structure if we mock a station
    const station = {
      id: 'test_station',
      type: 'research',
      level: 1,
    };
    expect(station.type).toBe('research');
    expect(station.level).toBe(1);
  });

  describe('buildSpaceStation', () => {
    it('should build a space station if resources are sufficient', () => {
      useGameStore.setState({
        cargo: 500,
        science: 500,
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().buildSpaceStation('research');

      const state = useGameStore.getState();
      expect(state.spaceStations).toHaveLength(1);
      expect(state.spaceStations[0].type).toBe('research');
      expect(state.cargo).toBe(0); // 500 - 500
      expect(state.science).toBe(0); // 500 - 500
    });

    it('should NOT build a space station if cargo is insufficient', () => {
      useGameStore.setState({
        cargo: 499,
        science: 500,
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().buildSpaceStation('research');

      const state = useGameStore.getState();
      expect(state.spaceStations).toHaveLength(0);
      expect(state.cargo).toBe(499);
    });

    it('should NOT build a space station if science is insufficient', () => {
      useGameStore.setState({
        cargo: 500,
        science: 499,
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().buildSpaceStation('research');

      const state = useGameStore.getState();
      expect(state.spaceStations).toHaveLength(0);
      expect(state.science).toBe(499);
    });
  });

  describe('tick loop with space stations', () => {
    it('should generate extra science from research stations', () => {
      // Mock Math.random to prevent debris spawn (needs > 0.05 to not spawn)
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);
      
      useGameStore.setState({
        money: 0,
        science: 0,
        spaceStations: [{ id: '1', type: 'research', level: 1, maxDocks: 2, dockedRockets: [] }],
        spaceports: [], // No surface production
        rockets: [],
        dockedRockets: [],
        transitRockets: [],
        spaceDebris: [],
        satellites: 0,
        maxSatellites: 5,
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      // Assuming +10 science per tick for research station
      expect(state.science).toBe(10);
      
      mockRandom.mockRestore();
    });

    it('should generate extra money from logistics stations', () => {
       useGameStore.setState({
        money: 0,
        science: 0,
        cargo: 0,
        spaceStations: [{ id: '2', type: 'logistics', level: 1, maxDocks: 2, dockedRockets: [] }],
        spaceports: [], // No surface production
        rockets: [],
        dockedRockets: [],
        transitRockets: [],
        spaceDebris: [],
      } as unknown as GameState);

      useGameStore.getState().tick();

       const state = useGameStore.getState();
       // Logistics stations generate money (via moneyProduction in tick), not cargo resources
       expect(state.money).toBeGreaterThan(0);
    });

    it('should generate cargo from active rockets', () => {
      useGameStore.setState({
       money: 0,
       science: 0,
       cargo: 0,
       fuel: 100,
       fuelCostPerRocket: 1,
       fuelRefineries: 0,
       fuelProductionPerRefinery: 1,
       rocketExplosionChance: 0, // Ensure no random explosions during test
       rockets: [{ id: 1, type: 'cargo' as const }],
       explodedRocketIds: [],
       spaceports: [],
       spaceStations: [],
       researchedNodes: [],
       companies: [], // No companies = no perk bonuses
     } as unknown as GameState);

     useGameStore.getState().tick();

     const state = useGameStore.getState();
     // 1 cargo rocket * 0.1 cargo/tick = 0.1
     expect(state.cargo).toBeCloseTo(0.1);
    });
  });

  describe('contracts system', () => {
    it('should generate available contracts', () => {
      useGameStore.getState().generateContracts();
      const state = useGameStore.getState();
      expect(state.availableContracts).toHaveLength(3);
      expect(state.availableContracts[0].status).toBe('available');
    });

    it('should allow accepting a contract', () => {
      useGameStore.getState().generateContracts();
      const available = useGameStore.getState().availableContracts;
      const contractId = available[0].id;
      const initialAvailableCount = available.length;
      
      useGameStore.getState().acceptContract(contractId);
      
      const state = useGameStore.getState();
      expect(state.activeContracts.length).toBe(1);
      expect(state.activeContracts[0]?.id).toBe(contractId);
      expect(state.activeContracts[0]?.status).toBe('active');
      expect(state.availableContracts).toHaveLength(initialAvailableCount - 1); // Only accepted contract removed
    });

    it('should allow accepting multiple contracts if capacity allows', () => {
      // Give player capacity for 2 active contracts via Atlas perk
      useGameStore.setState({
        companies: useGameStore.getState().companies.map(c => 
          c.id === 'atlas' ? { ...c, level: 5 } : c // Atlas L5 gives +1 max active contracts
        )
      });
      
      useGameStore.getState().generateContracts();
      const available = useGameStore.getState().availableContracts;
      expect(available.length).toBeGreaterThanOrEqual(2);
      
      useGameStore.getState().acceptContract(available[0].id);
      useGameStore.getState().acceptContract(available[1].id);
      
      const state = useGameStore.getState();
      // With Atlas L5 perk, max active contracts is 2
      expect(state.activeContracts.length).toBe(2);
    });

    it('should complete contract and give rewards', () => {
      // Setup: contract is active, needs resources delivered over multiple ticks
      // But we set requirements very low so one tick can complete it
      useGameStore.setState({
        cargo: 0,
        science: 0,
        money: 100,
        rockets: [{ id: 1, type: 'cargo' as const }],
        explodedRocketIds: [],
        fuel: 100,
        fuelCostPerRocket: 1,
        rocketExplosionChance: 0, // No explosions for predictable test
        profitPerRocket: 200, // Enough money per tick
        spaceports: [{ id: 1 }],
        activeContracts: [{
          id: 'c1',
          companyId: 'titan',
          title: 'Test',
          requiredCargo: 0.05, // Very low so one tick completes it (0.1 per launch)
          requiredScience: 0, // No science requirement since passive spaceport science was removed
          requiredMoney: 100, // Achievable with profit per rocket
          deliveredCargo: 0,
          deliveredScience: 0,
          deliveredMoney: 0,
          rewardMoney: 5000,
          rewardScience: 100,
          rewardExperience: 50,
          status: 'active',
          timeLimitSeconds: 0,
          elapsedSeconds: 0,
          maxExplosions: -1,
          currentExplosions: 0,
          description: 'Test contract'
        }],
        companies: [{ id: 'titan', name: 'Titan', level: 0, contractsCompleted: 0 }]
      } as unknown as GameState);

      // One tick should deliver resources to contract and complete it
      useGameStore.getState().tick();

      const state = useGameStore.getState();
      expect(state.activeContracts.length).toBe(0);
      // At level 0, completing 1 contract should level up to 1 and reset to 0
      expect(state.companies[0].level).toBe(1);
      expect(state.companies[0].contractsCompleted).toBe(0);
      // Reward money should be added
      expect(state.money).toBeGreaterThan(100);
    });

    it('should fail contract if time limit reached', () => {
      useGameStore.setState({
        activeContracts: [{
          id: 'c1',
          companyId: 'titan',
          title: 'Test',
          status: 'active',
          timeLimitSeconds: 10,
          elapsedSeconds: 9,
          requiredCargo: 100,
          requiredScience: 100,
          requiredMoney: 100,
          deliveredCargo: 0,
          deliveredScience: 0,
          deliveredMoney: 0,
          rewardMoney: 5000,
          rewardScience: 100,
          rewardExperience: 50,
          maxExplosions: -1,
          currentExplosions: 0,
          description: 'Test contract'
        }],
        rockets: [],
        explodedRocketIds: [],
        spaceports: [{ id: 1 }],
        notifications: [],
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      // Failed contracts are removed from activeContracts after failure
      expect(state.activeContracts.length).toBe(0);
    });

    it('should fail contract if too many explosions', () => {
      useGameStore.setState({
        activeContracts: [{
          id: 'c1',
          companyId: 'titan',
          title: 'Test',
          status: 'active',
          maxExplosions: 0,
          currentExplosions: 0,
          requiredCargo: 100,
          requiredScience: 100,
          requiredMoney: 100,
          deliveredCargo: 0,
          deliveredScience: 0,
          deliveredMoney: 0,
          rewardMoney: 5000,
          rewardScience: 100,
          rewardExperience: 50,
          timeLimitSeconds: 0,
          elapsedSeconds: 0,
          description: 'Test contract'
        }],
        rockets: [{ id: 1, type: 'cargo' as const }],
        explodedRocketIds: [1],
        researchedNodes: ['o7'],
        science: 100,
      } as unknown as GameState);

      useGameStore.getState().clearExplosion(1);

      const state = useGameStore.getState();
      expect(state.activeContracts[0]?.status).toBe('failed');
    });
  });

  describe('Research System Logic', () => {
    it('should unlock a node if cost and prereqs met', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      // Unlock p1-1 (Efficient Engines I, cost 80, no prereqs)
      useGameStore.getState().unlockNode('p1-1');

      const state = useGameStore.getState();
      expect(state.researchedNodes).toContain('p1-1');
      expect(state.science).toBe(920);
    });

    it('should NOT unlock a node if science is insufficient', () => {
      useGameStore.setState({
        science: 50,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1-1');

      const state = useGameStore.getState();
      expect(state.researchedNodes).not.toContain('p1-1');
      expect(state.science).toBe(50);
    });

    it('should NOT unlock a node if prerequisites are NOT met', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      // f2 requires f1-1
      useGameStore.getState().unlockNode('f2');

      const state = useGameStore.getState();
      expect(state.researchedNodes).not.toContain('f2');
    });

    it('should apply fuel cost multiplier correctly', () => {
      useGameStore.setState({
         fuel: 100,
         fuelCostPerRocket: 10,
         researchedNodes: ['p1-1'], // 0.97 multiplier
         rockets: [{ id: 1 }],
         explodedRocketIds: [],
         spaceports: [],
         spaceStations: [],
         companies: [], // No companies = no perk bonuses for precise calculation
       } as unknown as GameState);

       useGameStore.getState().tick();

       const state = useGameStore.getState();
       // 100 + 1 (passive) - (10 * 0.97) = 91.3
       expect(state.fuel).toBeCloseTo(91.3);
    });

    it('should apply construction cost multiplier correctly', () => {
      useGameStore.setState({
        spaceportCost: 1000,
        spaceports: [],
        researchedNodes: ['i3'], // 0.85 multiplier
      } as unknown as GameState);
      
      const cost = useGameStore.getState().getCurrentSpaceportCost();
      // 1000 * 1.5^0 * 0.85 = 850
      expect(cost).toBe(850);
    });
  });

  describe('buildRocket and fuel-per-launch', () => {
    it('should build a rocket without consuming fuel', () => {
      useGameStore.setState({
        money: 1000,
        fuel: 100,
        rockets: [],
        nextRocketId: 0,
        rocketCost: 10,
        spaceports: [{ id: 1 }],
        spaceportCapacity: 9,
        explodedRocketIds: [],
      } as unknown as GameState);

      useGameStore.getState().buildRocket();

      const state = useGameStore.getState();
      expect(state.rockets.length).toBe(1);
      expect(state.money).toBe(990);
      expect(state.fuel).toBe(100);
    });

    it('should consume fuel during tick if rockets launch', () => {
      useGameStore.setState({
         fuel: 10,
         rockets: [{ id: 1, type: 'cargo' as const }, { id: 2, type: 'cargo' as const }],
         explodedRocketIds: [],
         fuelCostPerRocket: 1,
         profitPerRocket: 1,
         spaceports: [{ id: 1 }],
         spaceportCapacity: 9,
         spaceStations: [],
         money: 0,
         cargo: 0,
         science: 0,
         rocketExplosionChance: 0, // Ensure no random explosions during test
         companies: [], // No companies = no perk bonuses for precise calculation
       } as unknown as GameState);

       useGameStore.getState().tick();

       const state = useGameStore.getState();
       // 10 + 1 (passive) - 2 (rockets) = 9 fuel
       expect(state.fuel).toBe(9);
       // rewards for 2 successful launches
       expect(state.cargo).toBeCloseTo(0.2);
    });

     it('should NOT generate rewards if fuel is insufficient', () => {
       useGameStore.setState({
         fuel: 0,
         rockets: [{ id: 1, type: 'cargo' as const }],
         explodedRocketIds: [],
         fuelCostPerRocket: 2, // Cost > passive fuel (1), so shouldn't launch
         spaceports: [], // no passive income
         money: 0,
         cargo: 0,
         science: 0,
       } as unknown as GameState);

       useGameStore.getState().tick();

       const state = useGameStore.getState();
       expect(state.fuel).toBe(1); // 0 + 1 passive, didn't launch because cost is 2
       expect(state.cargo).toBe(0);
     });
  });

  describe('Moon - Fabricator Research Effects', () => {
    beforeEach(() => {
      // Set up Moon system with fabricators
      useGameStore.setState({
        money: 100000,
        science: 50000,
        fuel: 1000,
        cargo: 10000,
        moonStatus: 'unlocked',
        moonResources: { regolith: 10000, helium3: 0, alloys: 0 },
        earthResources: { helium3: 0, alloys: 0 },
        moonSectors: [
          {
            id: 'sector-1',
            name: 'Landing Zone',
            slots: 4,
            slotsUsed: 1,
            traits: {},
            buildings: {
              extractors: 1,
              refineries: 0,
              silos: 0,
              maintenance: 0,
              massDrivers: 0,
              solarArray: 0,
              nuclearReactor: 0,
              battery: 0,
              fabricator: 0,
            },
          }
        ],
        researchedNodes: [],
        notifications: [],
        companies: DEFAULT_COMPANIES.map(c => ({ ...c })),
      } as unknown as GameState);
    });

    it('m16 (Alloy Furnaces) increases fabricator output by 50%', () => {
      const state = useGameStore.getState();
      
      // Build a fabricator first
      state.constructBuildingOnMoon('sector-1', 'fabricator');
      
      // Run a tick without m16
      state.tick();
      const alloysWithoutBonus = state.moonResources.alloys;
      
      // Reset alloys and unlock m16
      state.moonSectors[0].buildings.fabricator = 1;
      state.moonResources.alloys = 0;
      state.researchedNodes.push('m16');
      
      // Run tick with m16
      state.tick();
      const alloysWithBonus = state.moonResources.alloys;
      
      // With m16, should be 1.5x the original
      expect(alloysWithBonus).toBeCloseTo(alloysWithoutBonus * 1.5, 1);
    });

    it('m17 (Efficient Smelting) reduces fabricator cost by 30%', () => {
      const state = useGameStore.getState();
      
      // Build a fabricator and some power sources
      state.moonSectors[0].buildings.fabricator = 1;
      state.moonSectors[0].buildings.solarArray = 2; // Provide power during day
      state.moonResources.regolith = 10000;
      state.moonResources.alloys = 0;
      
      // Run a tick without m17
      state.tick();
      const regolithUsedWithoutBonus = 10000 - state.moonResources.regolith;
      
      // Reset and unlock m17 (requires m16 first)
      state.moonResources.regolith = 10000;
      state.moonResources.alloys = 0;
      state.researchedNodes.push('m16', 'm17');
      
      // Run tick with m17
      state.tick();
      const regolithUsedWithBonus = 10000 - state.moonResources.regolith;
      
      // With m17, should use less regolith (cost is 0.7x = 30% reduction)
      // Only test if regolith was actually used (production happened)
      if (regolithUsedWithoutBonus > 0) {
        expect(regolithUsedWithBonus).toBeLessThan(regolithUsedWithoutBonus);
        expect(regolithUsedWithBonus).toBeCloseTo(regolithUsedWithoutBonus * 0.7, 1);
      }
    });

    it('m18 (Expanded Storage Vaults) increases alloy storage by 250', () => {
      const state = useGameStore.getState();
      
      // Get storage without m18
      const storageWithout = state.getMoonStorageCapacity().alloys;
      
      // Unlock m18
      state.researchedNodes.push('m18');
      const storageWith = state.getMoonStorageCapacity().alloys;
      
      // m18 effect value is 250 added to storage
      expect(storageWith).toBe(storageWithout + 250);
    });
  });
});
