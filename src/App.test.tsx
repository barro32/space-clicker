import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from './App';
import { useGameStore } from './useGameStore';
import { vi } from 'vitest';

vi.mock('./useGameStore', () => ({ useGameStore: vi.fn() }));

describe('App navigation & persistence', () => {
  beforeEach(() => {
    window.localStorage.removeItem('gameState');
    // reset mock if available
    if ((useGameStore as any).mockReset) (useGameStore as any).mockReset();
  });

  it('calls setView("research") when Research button clicked', () => {
    const setView = vi.fn();
    (useGameStore as any).mockReturnValue({
      currentView: 'surface',
      setView,
      money: 0,
      science: 0,
      fuel: 0,
      cargo: 0,
      tick: vi.fn(),
      notifications: []
    });

    render(<App />);
    const btn = screen.getByRole('button', { name: /research/i });
    fireEvent.click(btn);
    expect(setView).toHaveBeenCalledWith('research');
  });

  it('rehydrates researchedNodes from localStorage on mount', () => {
    const saved = {
      researchedNodes: ['p1'],
      currentView: 'research',
      money: 0, science: 0, fuel: 0, cargo: 0, notifications: []
    };
    window.localStorage.setItem('gameState', JSON.stringify(saved));

    const setStateSpy = vi.fn();
    (useGameStore as any).setState = setStateSpy;

    (useGameStore as any).mockReturnValue({
      currentView: 'surface',
      setView: vi.fn(),
      money: 0,
      science: 0,
      fuel: 0,
      cargo: 0,
      tick: vi.fn(),
      notifications: []
    });

    render(<App />);
    expect(setStateSpy).toHaveBeenCalled();
    const calledWith = (setStateSpy.mock.calls[0] || [])[0];
    expect(calledWith).toBeDefined();
    if (calledWith) {
      expect(calledWith.researchedNodes).toEqual(['p1']);
    }
  });
});
