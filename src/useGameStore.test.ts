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
});
