import { describe, it, expect } from 'vitest';
import { useGameStore } from './useGameStore.js';

describe('Research effect multipliers and special effects', () => {
  it('getEffectMultiplier returns multiplicative product for *Multiplier types', () => {
    useGameStore.setState({ researchedNodes: ['p1-1', 'u1-1'] } as any);

    const valFuel = useGameStore.getState().getEffectMultiplier('fuelCostMultiplier');
    expect(valFuel).toBeCloseTo(0.97);

    const valBuild = useGameStore.getState().getEffectMultiplier('buildRocketMultiplier');
    expect(valBuild).toBeCloseTo(1.2);
  });

  it('unlocking special nodes updates researchedNodes', () => {
    useGameStore.setState({ science: 1000, researchedNodes: [] } as any);
    // Unlock a node with no prerequisites (c1-1 has no prereqs)
    useGameStore.getState().unlockNode('c1-1');
    const state = useGameStore.getState();
    expect(state.researchedNodes).toContain('c1-1');
  });
});
