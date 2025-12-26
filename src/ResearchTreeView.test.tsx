import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchTreeView } from './ResearchTreeView';
import { useGameStore } from './useGameStore';
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
      unlockNode: vi.fn(),
    });

    render(<ResearchTreeView />);
    
    expect(screen.getByRole('heading', { name: /propulsion/i, level: 2 })).toBeDefined();
    expect(screen.getByRole('heading', { name: /infrastructure/i, level: 2 })).toBeDefined();
    expect(screen.getByRole('heading', { name: /commercial/i, level: 2 })).toBeDefined();
    expect(screen.getByRole('heading', { name: /orbital/i, level: 2 })).toBeDefined();
  });

  it('allows unlocking available nodes', () => {
    const unlockSpy = vi.fn();
    (useGameStore as any).mockReturnValue({
      researchedNodes: [],
      science: 1000,
      unlockNode: unlockSpy,
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
      unlockNode: vi.fn(),
    });

    render(<ResearchTreeView />);
    
    const p1Node = screen.getByTestId('node-p1');
    // Check if it has the green border class
    expect(p1Node.className).toContain('border-green-500');
  });
});
