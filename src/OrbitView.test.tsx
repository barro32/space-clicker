import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OrbitView } from './OrbitView.js';
import { useGameStore } from './useGameStore.js';
import React from 'react';

// Mock the store
vi.mock('./useGameStore', () => ({
  useGameStore: vi.fn(),
}));

// Helper to create default mock values for OrbitView
const createDefaultMock = (overrides = {}) => ({
  spaceStations: [],
  buildSpaceStation: vi.fn(),
  upgradeStation: vi.fn(),
  cargo: 1000,
  science: 1000,
  lunarComponents: 0,
  satellites: 0,
  maxSatellites: 10,
  launchSatellite: vi.fn(),
  spaceDebris: [],
  clearDebris: vi.fn(),
  transitRockets: [],
  dockedRockets: [],
  getEffectMultiplier: vi.fn().mockReturnValue(0), // Default: satellites not unlocked
  getCompanyPerkValue: vi.fn().mockReturnValue(0),
  ...overrides,
});

describe('OrbitView Component', () => {
  it('renders planet and build buttons', () => {
    (useGameStore as any).mockReturnValue(createDefaultMock());

    render(<OrbitView />);
    
    // Use getAllByText since the new UI has multiple mentions of station types
    const researchTexts = screen.getAllByText(/Research Station/i);
    const logisticsTexts = screen.getAllByText(/Logistics Station/i);
    expect(researchTexts.length).toBeGreaterThan(0);
    expect(logisticsTexts.length).toBeGreaterThan(0);
  });

  it('displays stations in orbit', () => {
     (useGameStore as any).mockReturnValue(createDefaultMock({
      spaceStations: [
        { id: '1', type: 'research', level: 1, maxDocks: 2, dockedRockets: [] },
        { id: '2', type: 'logistics', level: 2, maxDocks: 2, dockedRockets: [] },
      ],
    }));

    render(<OrbitView />);
    
    // The level badges now show "L1" and "L2" format
    expect(screen.getByText(/L1/i)).toBeDefined();
    expect(screen.getByText(/L2/i)).toBeDefined();
  });

  it('calls buildSpaceStation when buttons are clicked', () => {
    const buildSpy = vi.fn();
    (useGameStore as any).mockReturnValue(createDefaultMock({
      buildSpaceStation: buildSpy,
    }));

    render(<OrbitView />);
    
    // Find the build buttons by their container with specific class pattern
    const buildButtons = screen.getAllByText(/Research Station/i);
    // The build button should be inside a clickable div with border class
    const researchBuildButton = buildButtons.find(el => 
      el.closest('div[class*="cursor-pointer"]')
    )?.closest('div[class*="cursor-pointer"]');
    
    if (researchBuildButton) {
      fireEvent.click(researchBuildButton);
      expect(buildSpy).toHaveBeenCalledWith('research');
    }

    const logisticsButtons = screen.getAllByText(/Logistics Station/i);
    const logisticsBuildButton = logisticsButtons.find(el =>
      el.closest('div[class*="cursor-pointer"]')
    )?.closest('div[class*="cursor-pointer"]');
    
    if (logisticsBuildButton) {
      fireEvent.click(logisticsBuildButton);
      expect(buildSpy).toHaveBeenCalledWith('logistics');
    }
  });
});
