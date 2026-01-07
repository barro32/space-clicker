import { vi } from 'vitest';
vi.mock('./useGameStore', () => ({ useGameStore: vi.fn() }));

// Mock child components to avoid deep rendering and store selector complexity
vi.mock('./SpaceportView', () => ({ SpaceportView: () => null }));
vi.mock('./OrbitView', () => ({ OrbitView: () => null }));
vi.mock('./ContractsView', () => ({ ContractsView: () => null }));
vi.mock('./ResearchTreeView', () => ({ ResearchTreeView: () => null }));
vi.mock('./DevConsole', () => ({ DevConsole: () => null }));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from './App';
import { useGameStore } from './useGameStore';

describe('App navigation & persistence', () => {
  beforeEach(() => {
    // Provide a simple localStorage shim for the test environment
    (window as any).localStorage = {
      _store: {} as Record<string, string>,
      getItem(key: string) { return this._store.hasOwnProperty(key) ? this._store[key] : null },
      setItem(key: string, value: string) { this._store[key] = String(value) },
      removeItem(key: string) { delete this._store[key] },
    };

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

    // Provide a default state that covers selectors and direct calls
    const defaultState = {
      currentView: 'surface',
      setView: vi.fn(),
      money: 0,
      science: 0,
      fuel: 0,
      cargo: 0,
      tick: vi.fn(),
      notifications: [],
      rockets: [],
      spaceports: [{ type: 'cargo' }],
      spaceportCapacity: 9,
      explodedRocketIds: [],
      fuelRefineries: 0,
      spaceStations: [],
      getCurrentSpaceportCost: () => 1000,
      getEffectMultiplier: () => 1,
      toggleSpaceport: vi.fn(),
      buildSpaceport: vi.fn(),
      buildRocket: vi.fn(),
      clearExplosion: vi.fn(),
      buildFuelRefinery: vi.fn(),
      researchedNodes: [],
      unlockNode: vi.fn(),
    };

    (useGameStore as any).mockImplementation((selector?: any) => {
      if (typeof selector === 'function') return selector(defaultState);
      return defaultState;
    });

    // Provide getState and setState on the mocked hook (Zustand API)
    (useGameStore as any).getState = () => defaultState;
    (useGameStore as any).setState = setStateSpy;

    render(<App />);
    expect(setStateSpy).toHaveBeenCalled();
    const calledWith = (setStateSpy.mock.calls[0] || [])[0];
    expect(calledWith).toBeDefined();
    if (calledWith) {
      expect(calledWith.researchedNodes).toEqual(['p1']);
    }
  });
});
