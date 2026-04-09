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
      
      // Surface-layer branches only (commercial is now in Contracts sidebar)
      expect(screen.getByRole('heading', { name: /propulsion/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /infrastructure/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /orbital/i, level: 2 })).toBeDefined();
      expect(screen.getByRole('heading', { name: /control/i, level: 2 })).toBeDefined();

       // At least one control node should render (u3 has no prerequisites)
       const u3Node = screen.getByTestId('node-u3');
       expect(u3Node).toBeDefined();
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
     
     // p1 is now "Efficient Engines" which is multi-level (p1-1, p1-2, etc)
     const p1Node = screen.getByTestId('node-p1');
     fireEvent.click(p1Node);
     expect(unlockSpy).toHaveBeenCalledWith('p1-1');
   });

    it('shows style for researched nodes', () => {
      (useGameStore as any).mockReturnValue({
        researchedNodes: ['p1-1'],
        science: 1000,
        rocketExplosionChance: 0.75,
        unlockNode: vi.fn(),
        getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
      });

      render(<ResearchTreeView />);
      
      // Node with partial completion (only p1-1 of 5 levels researched)
      const p1Node = screen.getByTestId('node-p1');
      expect(p1Node).toBeDefined();
      // Partially researched multi-level nodes show blue styling (available for next level)
      expect(p1Node.className).toContain('blue');
    });
});
