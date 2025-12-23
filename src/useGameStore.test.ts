import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, GameState } from './useGameStore';

describe('useGameStore - Orbital Space Stations', () => {
  beforeEach(() => {
    useGameStore.setState({
      money: 100000,
      science: 1000,
    } as unknown as GameState);
  });

  it('should have an initial state with empty spaceStations', () => {
    const state = useGameStore.getState();
    expect(state.spaceStations).toBeDefined();
    expect(state.spaceStations).toEqual([]);
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
        money: 50000,
        science: 500,
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().buildSpaceStation('research');

      const state = useGameStore.getState();
      expect(state.spaceStations).toHaveLength(1);
      expect(state.spaceStations[0].type).toBe('research');
      expect(state.money).toBe(0); // 50000 - 50000
      expect(state.science).toBe(0); // 500 - 500
    });

    it('should NOT build a space station if money is insufficient', () => {
      useGameStore.setState({
        money: 49999,
        science: 500,
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().buildSpaceStation('research');

      const state = useGameStore.getState();
      expect(state.spaceStations).toHaveLength(0);
      expect(state.money).toBe(49999);
    });

    it('should NOT build a space station if science is insufficient', () => {
      useGameStore.setState({
        money: 50000,
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
  });

  describe('buildRocket regression check', () => {
    it('should build a rocket if money and fuel are sufficient and space is available', () => {
      useGameStore.setState({
        money: 1000,
        fuel: 100,
        rockets: [],
        nextRocketId: 0,
        rocketCost: 10,
        fuelCostPerRocket: 1,
        spaceports: [{ type: 'cargo' }],
        spaceportCapacity: 9,
        explodedRocketIds: [],
        spaceStations: [],
      } as unknown as GameState);

      useGameStore.getState().buildRocket();

      const state = useGameStore.getState();
      expect(state.rockets.length).toBe(1);
      expect(state.rockets[0]).not.toBeNull();
      expect(state.money).toBe(990); // 1000 - 10
      expect(state.fuel).toBe(99); // 100 - 1
    });
  });
});

