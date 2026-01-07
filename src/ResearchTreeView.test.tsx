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
      (useGameStore as any).mockReturnValue({
        researchedNodes: [],
        science: 1000,
        rocketExplosionChance: 0.75,
        unlockNode: vi.fn(),
        getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
      });

      render(<ResearchTreeView />);
      
      expect(screen.getByRole('heading', { name: /propulsion/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /infrastructure/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /commercial/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /orbital/i, level: 2 })).toBeDefined();

      // At least one control node should render (u1 is now grouped under base ID)
      const u1Node = screen.getByTestId('node-u1');
      expect(u1Node).toBeDefined();
    });

   it('allows unlocking available nodes', () => {
     const unlockSpy = vi.fn();
     (useGameStore as any).mockReturnValue({
       researchedNodes: [],
       science: 1000,
       rocketExplosionChance: 0.75,
       unlockNode: unlockSpy,
       getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
     });

     render(<ResearchTreeView />);
     
     // p1 is "Efficient Engines", should be available (no prereqs)
     const p1Node = screen.getByTestId('node-p1');
     fireEvent.click(p1Node);
     expect(unlockSpy).toHaveBeenCalledWith('p1');
   });

    it('shows style for researched nodes', () => {
      (useGameStore as any).mockReturnValue({
        researchedNodes: ['p1'],
        science: 1000,
        rocketExplosionChance: 0.75,
        unlockNode: vi.fn(),
        getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
      });

      render(<ResearchTreeView />);
      
      // Researched nodes are now hidden from the UI, so p1 should NOT appear
      expect(() => screen.getByTestId('node-p1')).toThrow();
    });
});
