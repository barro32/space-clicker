import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContractsView } from './ContractsView.js';
import { useGameStore } from './useGameStore.js';
import React from 'react';

// Mock the store
vi.mock('./useGameStore', () => ({
  useGameStore: vi.fn(),
}));

describe('ContractsView Component', () => {
  it('renders companies and titles', () => {
    (useGameStore as any).mockReturnValue({
      companies: [{ id: 'titan', name: 'Titan Mining', level: 1, experience: 0, contractsCompleted: 0 }],
      availableContracts: [],
      activeContracts: [],
      contractRefreshTimer: 300,
      generateContracts: vi.fn(),
      acceptContract: vi.fn(),
      forfeitContract: vi.fn(),
      getMaxActiveContracts: () => 1,
    });

    render(<ContractsView />);
    
    // Two-column layout - company reputation on left, contracts on right
    expect(screen.getByText(/Titan Mining/i)).toBeDefined();
    expect(screen.getByText(/COMPANY REPUTATION/i)).toBeDefined();
    expect(screen.getAllByText(/ACTIVE CONTRACTS/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AVAILABLE OFFERS/i).length).toBeGreaterThan(0);
  });

  it('displays available contracts and allows acceptance', () => {
    const acceptSpy = vi.fn();
    (useGameStore as any).mockReturnValue({
      companies: [],
      availableContracts: [
        { 
          id: 'c1', 
          title: 'Supply Mission', 
          description: 'desc', 
          requiredCargo: 10, 
          requiredScience: 0, 
          requiredMoney: 0,
          deliveredCargo: 0,
          deliveredScience: 0,
          deliveredMoney: 0,
          rewardMoney: 100, 
          rewardScience: 0, 
          rewardExperience: 10, 
          status: 'available',
          timeLimitSeconds: 0,
          elapsedSeconds: 0,
          maxExplosions: -1,
          currentExplosions: 0,
        }
      ],
      activeContracts: [],
      contractRefreshTimer: 300,
      generateContracts: vi.fn(),
      acceptContract: acceptSpy,
      forfeitContract: vi.fn(),
      getMaxActiveContracts: () => 1,
    });

    render(<ContractsView />);
    
    expect(screen.getByText(/Supply Mission/i)).toBeDefined();
    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);
    expect(acceptSpy).toHaveBeenCalledWith('c1');
  });
});
