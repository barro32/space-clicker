import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchTreeView } from './ResearchTreeView.js';
import { useGameStore } from './useGameStore.js';
import { vi } from 'vitest';

vi.mock('./useGameStore', () => ({ useGameStore: vi.fn() }));

describe('ResearchTreeView - locked interactions', () => {
   it('does NOT call unlockNode when science is insufficient', () => {
     const unlockSpy = vi.fn();
     const mockState = {
       researchedNodes: [],
       science: 0, // insufficient for p1 (cost 100)
       rocketExplosionChance: 0.75,
       unlockNode: unlockSpy,
       getEffectMultiplier: vi.fn((type: string) => type === 'explosionChanceMultiplier' ? 1 : 1),
       newlyAvailableResearchIds: [],
     };
     (useGameStore as any).mockImplementation((selector?: (state: any) => any) =>
       typeof selector === 'function' ? selector(mockState) : mockState
     );
     render(<ResearchTreeView />);
     const p1 = screen.getByTestId('node-p1');
     fireEvent.click(p1);
     expect(unlockSpy).not.toHaveBeenCalled();
   });

   it('does NOT call unlockNode when prerequisites are unmet', () => {
      const unlockSpy = vi.fn();
      const mockState = {
        researchedNodes: ['p2-1'], // p2-1 is unlocked, p2-2 requires p2-1 so next is p2-2 which is available
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
      // Click on p2 group - p2-2 should be available to unlock (p2-1 is a prerequisite and it's unlocked)
      const p2 = screen.getByTestId('node-p2');
      fireEvent.click(p2);
      // With p2-1 unlocked, p2-2 should be available, so unlockNode SHOULD be called
      expect(unlockSpy).toHaveBeenCalledWith('p2-2');
    });
});
