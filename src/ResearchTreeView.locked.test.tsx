import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchTreeView } from './ResearchTreeView';
import { useGameStore } from './useGameStore';
import { vi } from 'vitest';

vi.mock('./useGameStore', () => ({ useGameStore: vi.fn() }));

describe('ResearchTreeView - locked interactions', () => {
  it('does NOT call unlockNode when science is insufficient', () => {
    const unlockSpy = vi.fn();
    (useGameStore as any).mockReturnValue({
      researchedNodes: [],
      science: 0, // insufficient for p1 (cost 100)
      unlockNode: unlockSpy,
    });
    render(<ResearchTreeView />);
    const p1 = screen.getByTestId('node-p1');
    fireEvent.click(p1);
    expect(unlockSpy).not.toHaveBeenCalled();
  });

  it('does NOT call unlockNode when prerequisites are unmet', () => {
    const unlockSpy = vi.fn();
    (useGameStore as any).mockReturnValue({
      researchedNodes: [], // p2 requires p1
      science: 1000, // enough science but prereqs unmet
      unlockNode: unlockSpy,
    });
    render(<ResearchTreeView />);
    const p2 = screen.getByTestId('node-p2');
    fireEvent.click(p2);
    expect(unlockSpy).not.toHaveBeenCalled();
  });
});
