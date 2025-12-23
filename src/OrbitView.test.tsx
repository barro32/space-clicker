import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrbitView } from './OrbitView';
import { useGameStore } from './useGameStore';
import React from 'react';

// Mock the store
vi.mock('./useGameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('OrbitView Component', () => {
  it('renders planet and build buttons', () => {
    (useGameStore as any).mockReturnValue({
      spaceStations: [],
      money: 100000,
      science: 1000,
      buildSpaceStation: vi.fn(),
    });

    render(<OrbitView />);
    
    expect(screen.getByText(/Build Research Station/i)).toBeDefined();
    expect(screen.getByText(/Build Logistics Station/i)).toBeDefined();
  });

  it('displays stations in orbit', () => {
     (useGameStore as any).mockReturnValue({
      spaceStations: [
        { id: '1', type: 'research', level: 1 },
        { id: '2', type: 'logistics', level: 2 },
      ],
      money: 0,
      science: 0,
      buildSpaceStation: vi.fn(),
    });

    render(<OrbitView />);
    
    expect(screen.getByText(/Lvl 1/i)).toBeDefined();
    expect(screen.getByText(/Lvl 2/i)).toBeDefined();
  });

  it('calls buildSpaceStation when buttons are clicked', () => {
    const buildSpy = vi.fn();
    (useGameStore as any).mockReturnValue({
      spaceStations: [],
      money: 100000,
      science: 1000,
      buildSpaceStation: buildSpy,
    });

    render(<OrbitView />);
    
    const researchButton = screen.getByText(/Build Research Station/i).closest('div');
    fireEvent.click(researchButton!);
    expect(buildSpy).toHaveBeenCalledWith('research');

    const logisticsButton = screen.getByText(/Build Logistics Station/i).closest('div');
    fireEvent.click(logisticsButton!);
    expect(buildSpy).toHaveBeenCalledWith('logistics');
  });
});
