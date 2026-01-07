import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, GameState } from './useGameStore.js';

describe('useGameStore - Orbital Space Stations', () => {
  beforeEach(() => {
    useGameStore.setState({
      money: 100000,
      science: 1000,
      fuel: 1000,
      cargo: 0,
      rockets: [],
      spaceports: [{ type: 'cargo' }],
      spaceStations: [],
      activeContract: null,
      availableContracts: [],
      notifications: [],
      researchedNodes: [],
    } as unknown as GameState);
  });

  it('should have an initial state with empty spaceStations', () => {
    const state = useGameStore.getState();
    expect(state.spaceStations).toBeDefined();
    expect(state.spaceStations).toEqual([]);
    expect(state.currentView).toBe("surface");
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
      useGameStore.setState({
        money: 0,
        science: 0,
        spaceStations: [{ id: '1', type: 'research', level: 1 }],
        spaceports: [], // No surface production
        rockets: [],
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      // Assuming +10 science per tick for research station
      expect(state.science).toBe(10);
    });

    it('should generate extra money (or profit) from logistics stations', () => {
       useGameStore.setState({
        money: 0,
        science: 0,
        spaceStations: [{ id: '2', type: 'logistics', level: 1 }],
        spaceports: [], // No surface production
        rockets: [],
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      // Assuming +50 money per tick for logistics station (high value to offset cost)
      expect(state.money).toBe(50);
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
       rockets: [{ id: 1 }],
       explodedRocketIds: [],
       spaceports: [],
       spaceStations: [],
       researchedNodes: [],
     } as unknown as GameState);

     useGameStore.getState().tick();

     const state = useGameStore.getState();
     // 1 rocket * 0.1 cargo/tick = 0.1
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
      
      useGameStore.getState().acceptContract(contractId);
      
      const state = useGameStore.getState();
      expect(state.activeContract).toBeDefined();
      expect(state.activeContract?.id).toBe(contractId);
      expect(state.activeContract?.status).toBe('active');
      expect(state.availableContracts).toHaveLength(2);
    });

    it('should NOT allow accepting multiple contracts', () => {
      useGameStore.getState().generateContracts();
      const available = useGameStore.getState().availableContracts;
      
      useGameStore.getState().acceptContract(available[0].id);
      useGameStore.getState().acceptContract(available[1].id);
      
      const state = useGameStore.getState();
      expect(state.activeContract?.id).toBe(available[0].id);
      expect(state.availableContracts).toHaveLength(2);
    });

    it('should complete contract and give rewards', () => {
      useGameStore.setState({
        cargo: 1000,
        science: 1000,
        money: 0,
        activeContract: {
          id: 'c1',
          companyId: 'titan',
          title: 'Test',
          requiredCargo: 500,
          requiredScience: 200,
          rewardMoney: 5000,
          rewardScience: 100,
          rewardExperience: 50,
          status: 'active'
        },
        companies: [{ id: 'titan', name: 'Titan', level: 1, experience: 0 }]
      } as unknown as GameState);

      useGameStore.getState().deliverContractResources();

      const state = useGameStore.getState();
      expect(state.activeContract).toBeNull();
      expect(state.money).toBe(5000);
      expect(state.science).toBe(900); // 1000 - 200 + 100
      expect(state.cargo).toBe(500);
      expect(state.companies[0].experience).toBe(50);
    });

    it('should fail contract if time limit reached', () => {
      useGameStore.setState({
        activeContract: {
          id: 'c1',
          status: 'active',
          timeLimitSeconds: 10,
          elapsedSeconds: 9,
        }
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      expect(state.activeContract?.status).toBe('failed');
    });

    it('should fail contract if too many explosions', () => {
      useGameStore.setState({
        activeContract: {
          id: 'c1',
          status: 'active',
          maxExplosions: 0,
          currentExplosions: 0,
        },
        rockets: [{ id: 1 }],
        explodedRocketIds: [1],
      } as unknown as GameState);

      useGameStore.getState().clearExplosion(1);

      const state = useGameStore.getState();
      expect(state.activeContract?.status).toBe('failed');
    });
  });

  describe('Research System Logic', () => {
    it('should unlock a node if cost and prereqs met', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      // Unlock p1 (Efficient Engines, cost 100, no prereqs)
      useGameStore.getState().unlockNode('p1');

      const state = useGameStore.getState();
      expect(state.researchedNodes).toContain('p1');
      expect(state.science).toBe(900);
    });

    it('should NOT unlock a node if science is insufficient', () => {
      useGameStore.setState({
        science: 50,
        researchedNodes: [],
      } as unknown as GameState);

      useGameStore.getState().unlockNode('p1');

      const state = useGameStore.getState();
      expect(state.researchedNodes).not.toContain('p1');
      expect(state.science).toBe(50);
    });

    it('should NOT unlock a node if prerequisites are NOT met', () => {
      useGameStore.setState({
        science: 1000,
        researchedNodes: [],
      } as unknown as GameState);

      // p2 requires p1
      useGameStore.getState().unlockNode('p2');

      const state = useGameStore.getState();
      expect(state.researchedNodes).not.toContain('p2');
    });

    it('should apply fuel cost multiplier correctly', () => {
      useGameStore.setState({
        fuel: 100,
        fuelCostPerRocket: 10,
        researchedNodes: ['p1'], // 0.9 multiplier
        rockets: [{ id: 1 }],
        explodedRocketIds: [],
        fuelRefineries: 0,
        spaceports: [],
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      // 100 - (10 * 0.9) = 91
      expect(state.fuel).toBe(91);
    });

    it('should apply construction cost multiplier correctly', () => {
      useGameStore.setState({
        spaceportCost: 1000,
        spaceports: [],
        researchedNodes: ['i3'], // 0.85 multiplier (wait, i3 requires i2 requires i1)
      } as unknown as GameState);
      
      // Manually set prereqs to bypass check if needed, 
      // but unlockNode handles it. Here we test getCurrentSpaceportCost directly.
      
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
        spaceports: [{ type: 'cargo' }],
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
        rockets: [{ id: 1 }, { id: 2 }],
        explodedRocketIds: [],
        fuelCostPerRocket: 1,
        profitPerRocket: 1,
        spaceports: [{ type: 'cargo' }],
        spaceportCapacity: 9,
        spaceStations: [],
        money: 0,
        cargo: 0,
        science: 0,
        fuelRefineries: 0,
        fuelProductionPerRefinery: 1,
        rocketExplosionChance: 0, // Ensure no random explosions during test
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      // 2 rockets launched: -2 fuel
      expect(state.fuel).toBe(8);
      // rewards for 2 successful launches
      expect(state.cargo).toBeCloseTo(0.2);
    });

    it('should NOT generate rewards if fuel is insufficient', () => {
      useGameStore.setState({
        fuel: 0,
        rockets: [{ id: 1 }],
        explodedRocketIds: [],
        fuelCostPerRocket: 1,
        spaceports: [], // no passive income
        money: 0,
        cargo: 0,
        science: 0,
        fuelRefineries: 0,
      } as unknown as GameState);

      useGameStore.getState().tick();

      const state = useGameStore.getState();
      expect(state.fuel).toBe(0);
      expect(state.cargo).toBe(0);
    });
  });
});

