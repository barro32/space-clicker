import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchTreeView } from './ResearchTreeView.js';
import { useGameStore } from './useGameStore.js';
import React from 'react';

// Mock the store
vi.mock('./useGameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('ResearchTreeView Component', () => {
   it('renders branches and titles', () => {
      const mockState = {
        researchedNodes: [],
        science: 1000,
        rocketExplosionChance: 0.75,
        unlockNode: vi.fn(),
        getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
        newlyAvailableResearchIds: [],
      };
      (useGameStore as any).mockImplementation((selector?: (state: any) => any) =>
        typeof selector === 'function' ? selector(mockState) : mockState
      );

      render(<ResearchTreeView />);
      
      // Surface-layer branches only
      expect(screen.getByRole('heading', { name: /propulsion/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /infrastructure/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /control/i, level: 2 })).toBeDefined();
      expect(screen.queryByRole('heading', { name: /orbital/i, level: 2 })).toBeNull();

       // At least one control node should render (u3 has no prerequisites)
       const u3Node = screen.getByTestId('node-u3');
       expect(u3Node).toBeDefined();
    });

   it('allows unlocking available nodes', () => {
     const unlockSpy = vi.fn();
     const mockState = {
       researchedNodes: [],
       science: 1000,
       rocketExplosionChance: 0.75,
       unlockNode: unlockSpy,
       getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
       newlyAvailableResearchIds: [],
     };
     (useGameStore as any).mockImplementation((selector?: (state: any) => any) =>
       typeof selector === 'function' ? selector(mockState) : mockState
     );

     render(<ResearchTreeView />);
     
     // p1 is now "Efficient Engines" which is multi-level (p1-1, p1-2, etc)
     const p1Node = screen.getByTestId('node-p1');
     fireEvent.click(p1Node);
     expect(unlockSpy).toHaveBeenCalledWith('p1-1');
   });

    it('shows style for researched nodes', () => {
      const mockState = {
        researchedNodes: ['p1-1'],
        science: 1000,
        rocketExplosionChance: 0.75,
        unlockNode: vi.fn(),
        getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
        newlyAvailableResearchIds: [],
      };
      (useGameStore as any).mockImplementation((selector?: (state: any) => any) =>
        typeof selector === 'function' ? selector(mockState) : mockState
      );

      render(<ResearchTreeView />);
      
      // Node with partial completion (only p1-1 of 5 levels researched)
      const p1Node = screen.getByTestId('node-p1');
      expect(p1Node).toBeDefined();
      // Partially researched multi-level nodes show blue styling (available for next level)
      expect(p1Node.className).toContain('blue');
    });
});
