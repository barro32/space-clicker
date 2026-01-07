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
      companies: [{ id: 'titan', name: 'Titan Mining', level: 1, experience: 0 }],
      availableContracts: [],
      activeContract: null,
      generateContracts: vi.fn(),
      acceptContract: vi.fn(),
      deliverContractResources: vi.fn(),
      cargo: 0,
      science: 0,
    });

    render(<ContractsView />);
    
    expect(screen.getByText(/Titan Mining/i)).toBeDefined();
    expect(screen.getAllByText(/Active Contract/i)).toBeDefined();
    expect(screen.getByText(/Available Offers/i)).toBeDefined();
  });

  it('displays available contracts and allows acceptance', () => {
    const acceptSpy = vi.fn();
    (useGameStore as any).mockReturnValue({
      companies: [],
      availableContracts: [
        { id: 'c1', title: 'Supply Mission', description: 'desc', requiredCargo: 10, requiredScience: 0, rewardMoney: 100, rewardScience: 0, rewardExperience: 10, status: 'available' }
      ],
      activeContract: null,
      generateContracts: vi.fn(),
      acceptContract: acceptSpy,
      deliverContractResources: vi.fn(),
      cargo: 0,
      science: 0,
    });

    render(<ContractsView />);
    
    expect(screen.getByText(/Supply Mission/i)).toBeDefined();
    const acceptButton = screen.getByRole('button', { name: /Accept/i });
    fireEvent.click(acceptButton);
    expect(acceptSpy).toHaveBeenCalledWith('c1');
  });
});
