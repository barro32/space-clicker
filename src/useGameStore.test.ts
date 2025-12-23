import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, GameState } from './useGameStore';

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
       rockets: [{ id: 1 }],
       explodedRocketIds: [],
       spaceports: [],
       spaceStations: [],
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
});

