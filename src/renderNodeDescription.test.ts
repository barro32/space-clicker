import { renderNodeDescription } from './renderNodeDescription.js';
import type { ResearchNode } from './researchTree.js';

describe('renderNodeDescription', () => {
  describe('percentage reductions (multiplier < 1)', () => {
    it('calculates 3% reduction from 0.97 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-reduction',
        name: 'Test Reduction',
        description: '-{reduction}% fuel cost',
        cost: 100,
        effect: { type: 'fuelCostMultiplier', value: 0.97 },
      };
      expect(renderNodeDescription(node)).toBe('-3% fuel cost');
    });

    it('calculates 10% reduction from 0.9 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-reduction-10',
        name: 'Test Reduction 10%',
        description: '-{reduction}% construction cost',
        cost: 100,
        effect: { type: 'constructionCostMultiplier', value: 0.9 },
      };
      expect(renderNodeDescription(node)).toBe('-10% construction cost');
    });

    it('calculates 2% reduction from 0.98 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-reduction-2',
        name: 'Test Reduction 2%',
        description: 'Reduce explosion chance by {reduction}%',
        cost: 100,
        effect: { type: 'explosionChanceMultiplier', value: 0.98 },
      };
      expect(renderNodeDescription(node)).toBe('Reduce explosion chance by 2%');
    });

    it('calculates 5% reduction from 0.95 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-reduction-5',
        name: 'Test Reduction 5%',
        description: 'Mission duration -{reduction}%',
        cost: 100,
        effect: { type: 'missionDurationMultiplier', value: 0.95 },
      };
      expect(renderNodeDescription(node)).toBe('Mission duration -5%');
    });
  });

  describe('percentage increases (multiplier > 1)', () => {
    it('calculates 20% increase from 1.2 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-increase-20',
        name: 'Test Increase 20%',
        description: '+{increase}% cargo per launch',
        cost: 100,
        effect: { type: 'cargoGenerationMultiplier', value: 1.2 },
      };
      expect(renderNodeDescription(node)).toBe('+20% cargo per launch');
    });

    it('calculates 50% increase from 1.5 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-increase-50',
        name: 'Test Increase 50%',
        description: 'Profit +{increase}%',
        cost: 100,
        effect: { type: 'profitMultiplier', value: 1.5 },
      };
      expect(renderNodeDescription(node)).toBe('Profit +50%');
    });

    it('calculates 100% increase from 2.0 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-increase-100',
        name: 'Test Increase 100%',
        description: 'Build rocket ×{increase}%',
        cost: 100,
        effect: { type: 'buildRocketMultiplier', value: 2.0 },
      };
      expect(renderNodeDescription(node)).toBe('Build rocket ×100%');
    });

    it('calculates 5% increase from 1.05 multiplier', () => {
      const node: ResearchNode = {
        id: 'test-increase-5',
        name: 'Test Increase 5%',
        description: 'Contract money +{increase}%',
        cost: 100,
        effect: { type: 'contractMoneyMultiplier', value: 1.05 },
      };
      expect(renderNodeDescription(node)).toBe('Contract money +5%');
    });
  });

  describe('direct additive values', () => {
    it('passes through spaceport capacity bonus', () => {
      const node: ResearchNode = {
        id: 'test-capacity',
        name: 'Test Capacity',
        description: '+{value} spaceport capacity',
        cost: 100,
        effect: { type: 'spaceportCapacityBonus', value: 1 },
      };
      expect(renderNodeDescription(node)).toBe('+1 spaceport capacity');
    });

    it('passes through passive cargo bonus', () => {
      const node: ResearchNode = {
        id: 'test-passive-cargo',
        name: 'Test Passive Cargo',
        description: 'Passive cargo +{value}',
        cost: 100,
        effect: { type: 'passiveCargoBonus', value: 50 },
      };
      expect(renderNodeDescription(node)).toBe('Passive cargo +50');
    });

    it('passes through fuel capacity bonus', () => {
      const node: ResearchNode = {
        id: 'test-fuel-capacity',
        name: 'Test Fuel Capacity',
        description: 'Fuel capacity +{value}',
        cost: 100,
        effect: { type: 'fuelCapacityBonus', value: 25 },
      };
      expect(renderNodeDescription(node)).toBe('Fuel capacity +25');
    });

    it('passes through multiple slots', () => {
      const node: ResearchNode = {
        id: 'test-slots',
        name: 'Test Slots',
        description: '{value} additional building slots per sector',
        cost: 100,
        effect: { type: 'buildingSlotsPerSectorBonus', value: 3 },
      };
      expect(renderNodeDescription(node)).toBe('3 additional building slots per sector');
    });
  });

  describe('direct multiplier values', () => {
    it('passes through docking bonus multiplier', () => {
      const node: ResearchNode = {
        id: 'test-docking',
        name: 'Test Docking',
        description: 'Docking ×{multiplier}',
        cost: 100,
        effect: { type: 'dockingBonusMultiplier', value: 2 },
      };
      expect(renderNodeDescription(node)).toBe('Docking ×2');
    });

    it('passes through moon storage multiplier', () => {
      const node: ResearchNode = {
        id: 'test-moon-storage',
        name: 'Test Moon Storage',
        description: 'Moon storage ×{multiplier}',
        cost: 100,
        effect: { type: 'moonStorageMultiplier', value: 5 },
      };
      expect(renderNodeDescription(node)).toBe('Moon storage ×5');
    });

    it('passes through satellite bonus multiplier', () => {
      const node: ResearchNode = {
        id: 'test-satellite',
        name: 'Test Satellite',
        description: 'Satellite bonus ×{multiplier}',
        cost: 100,
        effect: { type: 'satelliteBonusMultiplier', value: 3 },
      };
      expect(renderNodeDescription(node)).toBe('Satellite bonus ×3');
    });
  });

  describe('multi-level cumulative calculations', () => {
    it('calculates cumulative reduction for multi-level explosion chance', () => {
      const node: ResearchNode = {
        id: 'test-multi-reduction',
        name: 'Safety Protocol Level 5',
        description: 'Reduce explosion by {totalReduction}%',
        cost: 100,
        effect: { type: 'explosionChanceMultiplier', value: 0.98 },
      };
      // 0.98^5 = 0.9039... = ~9.6% total reduction
      expect(renderNodeDescription(node, 5)).toBe('Reduce explosion by 10%');
    });

    it('calculates cumulative multiplier for cargo generation', () => {
      const node: ResearchNode = {
        id: 'test-multi-multiplier',
        name: 'Cargo Opt Level 3',
        description: 'Cargo ×{totalMultiplier}',
        cost: 100,
        effect: { type: 'cargoPerLaunchMultiplier', value: 1.05 },
      };
      // 1.05^3 = 1.157625 ≈ 1.16
      expect(renderNodeDescription(node, 3)).toBe('Cargo ×1.16');
    });

    it('calculates total value for multi-level spaceport capacity', () => {
      const node: ResearchNode = {
        id: 'test-multi-value',
        name: 'Capacity Level 10',
        description: 'Total capacity {totalValue}',
        cost: 100,
        effect: { type: 'spaceportCapacityBonus', value: 1 },
      };
      // 1 * 10 = 10
      expect(renderNodeDescription(node, 10)).toBe('Total capacity 10');
    });

    it('returns single-level value when currentLevel is not provided', () => {
      const node: ResearchNode = {
        id: 'test-single-level',
        name: 'Build Rocket',
        description: 'Build ×{increase}% speed',
        cost: 100,
        effect: { type: 'buildRocketMultiplier', value: 1.1 },
      };
      expect(renderNodeDescription(node)).toBe('Build ×10% speed');
    });
  });

  describe('multiple placeholders in one description', () => {
    it('replaces multiple different placeholders', () => {
      const node: ResearchNode = {
        id: 'test-multi-placeholder',
        name: 'Multi Test',
        description: 'Increase {increase}% with multiplier ×{multiplier}',
        cost: 100,
        effect: { type: 'dockingBonusMultiplier', value: 2 },
      };
      // dockingBonusMultiplier should have multiplier, but not increase
      const result = renderNodeDescription(node);
      expect(result).toContain('×2');
      // increase placeholder should remain as-is since dockingBonusMultiplier doesn't set it
      expect(result).toContain('{increase}');
    });
  });

  describe('placeholder fallback behavior', () => {
    it('returns description unchanged if no effect', () => {
      const node: ResearchNode = {
        id: 'test-no-effect',
        name: 'Test No Effect',
        description: 'Static description without placeholders',
      };
      expect(renderNodeDescription(node)).toBe('Static description without placeholders');
    });

    it('keeps unknown placeholder as-is', () => {
      const node: ResearchNode = {
        id: 'test-unknown-placeholder',
        name: 'Test Unknown',
        description: 'Reduce by {reduction}% with {unknown} placeholder',
        cost: 100,
        effect: { type: 'fuelCostMultiplier', value: 0.97 },
      };
      const result = renderNodeDescription(node);
      expect(result).toContain('{unknown}');
      expect(result).toContain('3%');
    });

    it('ignores placeholder if effect type does not define it', () => {
      const node: ResearchNode = {
        id: 'test-missing-placeholder',
        name: 'Test Missing',
        description: 'Value: {value}',
        cost: 100,
        effect: { type: 'fuelCostMultiplier', value: 0.97 },
      };
      const result = renderNodeDescription(node);
      // fuelCostMultiplier defines 'reduction', not 'value'
      expect(result).toContain('{value}');
    });
  });

  describe('all major effect types', () => {
    it('handles explosionChanceMultiplier', () => {
      const node: ResearchNode = {
        id: 'test-explosion',
        name: 'Test',
        description: '{reduction}%',
        cost: 100,
        effect: { type: 'explosionChanceMultiplier', value: 0.98 },
      };
      expect(renderNodeDescription(node)).toBe('2%');
    });

    it('handles refineryOutputMultiplier', () => {
      const node: ResearchNode = {
        id: 'test-refinery',
        name: 'Test',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'refineryOutputMultiplier', value: 1.15 },
      };
      expect(renderNodeDescription(node)).toBe('15%');
    });

    it('handles stationLogisticsMultiplier', () => {
      const node: ResearchNode = {
        id: 'test-logistics',
        name: 'Test',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'stationLogisticsMultiplier', value: 1.1 },
      };
      expect(renderNodeDescription(node)).toBe('10%');
    });

    it('handles maxActiveContractsBonus', () => {
      const node: ResearchNode = {
        id: 'test-contracts',
        name: 'Test',
        description: '+{value}',
        cost: 100,
        effect: { type: 'maxActiveContractsBonus', value: 2 },
      };
      expect(renderNodeDescription(node)).toBe('+2');
    });

    it('handles lunarProductionMultiplier', () => {
      const node: ResearchNode = {
        id: 'test-lunar',
        name: 'Test',
        description: '×{multiplier}',
        cost: 100,
        effect: { type: 'lunarProductionMultiplier', value: 2 },
      };
      expect(renderNodeDescription(node)).toBe('×2');
    });

    it('handles extractorOutputMultiplier', () => {
      const node: ResearchNode = {
        id: 'test-extractor',
        name: 'Test',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'extractorOutputMultiplier', value: 1.25 },
      };
      expect(renderNodeDescription(node)).toBe('25%');
    });

    it('handles fabricatorOutputMultiplier', () => {
      const node: ResearchNode = {
        id: 'test-fabricator',
        name: 'Test',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'fabricatorOutputMultiplier', value: 1.3 },
      };
      expect(renderNodeDescription(node)).toBe('30%');
    });

    it('handles fabricatorCostReduction', () => {
      const node: ResearchNode = {
        id: 'test-fab-cost',
        name: 'Test',
        description: '{reduction}%',
        cost: 100,
        effect: { type: 'fabricatorCostReduction', value: 0.85 },
      };
      expect(renderNodeDescription(node)).toBe('15%');
    });

    it('handles alloysStorageBonus', () => {
      const node: ResearchNode = {
        id: 'test-alloys',
        name: 'Test',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'alloysStorageBonus', value: 1.4 },
      };
      expect(renderNodeDescription(node)).toBe('40%');
    });
  });

  describe('real-world examples from research tree', () => {
    it('renders Safety Protocol description', () => {
      const node: ResearchNode = {
        id: 'safety-protocol-1',
        name: 'Safety Protocol',
        description: 'Reduce explosion chance by {reduction}%',
        cost: 50,
        effect: { type: 'explosionChanceMultiplier', value: 0.98 },
      };
      expect(renderNodeDescription(node)).toBe('Reduce explosion chance by 2%');
    });

    it('renders Assembly Optimization description', () => {
      const node: ResearchNode = {
        id: 'assembly-1',
        name: 'Assembly Optimization',
        description: 'Reduce build time by {reduction}%',
        cost: 100,
        effect: { type: 'constructionCostMultiplier', value: 0.95 },
      };
      expect(renderNodeDescription(node)).toBe('Reduce build time by 5%');
    });

    it('renders Cargo Optimization description with multi-level', () => {
      const node: ResearchNode = {
        id: 'cargo-opt-1',
        name: 'Cargo Optimization',
        description: '+{increase}% cargo per launch',
        cost: 200,
        effect: { type: 'cargoPerLaunchMultiplier', value: 1.05 },
      };
      expect(renderNodeDescription(node)).toBe('+5% cargo per launch');
      // When called with currentLevel > 1, it would add totalMultiplier if description has it
      // But this description only has {increase}, so it still renders as +5%
      expect(renderNodeDescription(node, 3)).toBe('+5% cargo per launch');
    });

    it('renders Modular Spaceports description', () => {
      const node: ResearchNode = {
        id: 'modular-spaceport-1',
        name: 'Modular Spaceports',
        description: '+{value} spaceport slot',
        cost: 150,
        effect: { type: 'spaceportCapacityBonus', value: 1 },
      };
      expect(renderNodeDescription(node)).toBe('+1 spaceport slot');
    });

    it('renders Lunar Production description', () => {
      const node: ResearchNode = {
        id: 'lunar-production-1',
        name: 'Lunar Production',
        description: 'Moon ore production ×{multiplier}',
        cost: 300,
        effect: { type: 'lunarProductionMultiplier', value: 1.5 },
      };
      expect(renderNodeDescription(node)).toBe('Moon ore production ×1.5');
    });
  });

  describe('edge cases', () => {
    it('handles very small reduction (1% from 0.99)', () => {
      const node: ResearchNode = {
        id: 'test-small',
        name: 'Test Small',
        description: '{reduction}%',
        cost: 100,
        effect: { type: 'fuelCostMultiplier', value: 0.99 },
      };
      expect(renderNodeDescription(node)).toBe('1%');
    });

    it('handles very large increase (900% from 10.0)', () => {
      const node: ResearchNode = {
        id: 'test-large',
        name: 'Test Large',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'cargoGenerationMultiplier', value: 10.0 },
      };
      expect(renderNodeDescription(node)).toBe('900%');
    });

    it('handles value of 1.0 (0% increase)', () => {
      const node: ResearchNode = {
        id: 'test-neutral',
        name: 'Test Neutral',
        description: '{increase}%',
        cost: 100,
        effect: { type: 'cargoGenerationMultiplier', value: 1.0 },
      };
      expect(renderNodeDescription(node)).toBe('0%');
    });

    it('handles decimal values in bonus (fractional capacity)', () => {
      const node: ResearchNode = {
        id: 'test-decimal',
        name: 'Test Decimal',
        description: '{value}',
        cost: 100,
        effect: { type: 'passiveCargoBonus', value: 2.5 },
      };
      expect(renderNodeDescription(node)).toBe('2.5');
    });

    it('handles currentLevel of 1 (single level)', () => {
      const node: ResearchNode = {
        id: 'test-level-1',
        name: 'Test Level 1',
        description: 'Cargo ×{increase}%',
        cost: 100,
        effect: { type: 'cargoPerLaunchMultiplier', value: 1.05 },
      };
      // With level 1, the condition `level <= 1` skips totalMultiplier calculation
      // So it won't set totalMultiplier in values, and {totalMultiplier} stays unreplaced
      // But {increase} is always set for this effect type, so use {increase} instead
      const result = renderNodeDescription(node, 1);
      expect(result).toBe('Cargo ×5%');
    });

    it('handles fallback for unknown effect type', () => {
      const node: ResearchNode = {
        id: 'test-unknown-type',
        name: 'Test Unknown Type',
        description: 'Custom ×{multiplier}',
        cost: 100,
        effect: { type: 'someCompletelyUnknownMultiplierType', value: 2 },
      };
      // The implementation tries fallback pattern matching for types ending in "Multiplier"
      // but only after checking the specific type. Since this exact type is not in the switch,
      // it would hit the else block and try to match the pattern. Let's test that it doesn't error.
      const result = renderNodeDescription(node);
      // The unknown type won't match any specific handler, so multiplier won't be set
      // and the placeholder will remain unreplaced
      expect(result).toContain('{multiplier}');
    });

    it('handles fallback for bonus type', () => {
      const node: ResearchNode = {
        id: 'test-unknown-bonus',
        name: 'Test Unknown Bonus',
        description: '+{value}',
        cost: 100,
        effect: { type: 'unknownBonus', value: 5 },
      };
      // Should use fallback pattern matching (ends with Bonus)
      expect(renderNodeDescription(node)).toBe('+5');
    });
  });
});
