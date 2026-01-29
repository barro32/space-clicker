import type { ResearchNode } from './researchTree.js';

/**
 * Calculates effect values from a node's effect object
 * Returns an object with calculated values that can be used in templates
 */
function calculateEffectValues(
  effect: { type: string; value: number },
  currentLevel?: number
): Record<string, string | number> {
  const { type, value } = effect;

  // Helper functions
  const percentReduction = () => Math.round((1 - value) * 100);
  const percentIncrease = () => Math.round((value - 1) * 100);
  const multiplier = (level?: number) => {
    if (!level || level <= 1) return value;
    return Math.pow(value, level);
  };

  // Calculate values based on effect type
  const values: Record<string, string | number> = {};

  if (type === 'explosionChanceMultiplier') {
    values.reduction = percentReduction();
    if (currentLevel && currentLevel > 1) {
      values.totalReduction = Math.round((1 - Math.pow(value, currentLevel)) * 100);
    }
  } else if (type === 'fuelCostMultiplier') {
    values.reduction = percentReduction();
  } else if (type === 'constructionCostMultiplier') {
    values.reduction = percentReduction();
  } else if (type === 'buildRocketMultiplier' || type === 'clearExplosionMultiplier') {
    values.increase = percentIncrease();
    if (currentLevel && currentLevel > 1) {
      values.totalMultiplier = multiplier(currentLevel).toFixed(2);
    }
  } else if (type === 'profitMultiplier' || type === 'cargoGenerationMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'refineryOutputMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'contractMoneyMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'stationLogisticsMultiplier' || type === 'stationScienceMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'spaceportCapacityBonus') {
    values.value = value;
    if (currentLevel && currentLevel > 1) {
      values.totalValue = value * currentLevel;
    }
  } else if (type === 'cargoPerLaunchMultiplier') {
    values.increase = percentIncrease();
    if (currentLevel && currentLevel > 1) {
      values.totalMultiplier = multiplier(currentLevel).toFixed(2);
    }
  } else if (type === 'passiveCargoBonus') {
    values.value = value;
  } else if (type === 'passiveMoneyBonus') {
    values.value = value;
  } else if (type === 'maxActiveContractsBonus' || type === 'maxAvailableContractsBonus') {
    values.value = value;
  } else if (type === 'fuelCapacityBonus') {
    values.value = value;
  } else if (type === 'refineryCapacityBonus') {
    values.value = value;
  } else if (type === 'buildingSlotsPerSectorBonus') {
    values.value = value;
  } else if (type === 'stationDocksBonus') {
    values.value = value;
  } else if (type === 'maxSatellitesBonus') {
    values.value = value;
  } else if (type === 'dockingBonusMultiplier') {
    values.multiplier = value;
  } else if (type === 'satelliteBonusMultiplier') {
    values.multiplier = value;
  } else if (type === 'lunarProductionMultiplier') {
    values.multiplier = value;
  } else if (type === 'missionDurationMultiplier') {
    values.reduction = percentReduction();
  } else if (type === 'extractorOutputMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'moonRefineryOutputMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'moonStorageMultiplier') {
    values.multiplier = value;
  } else if (type === 'hazardDurationMultiplier') {
    values.reduction = percentReduction();
  } else if (type === 'massDriverEfficiency') {
    values.multiplier = value;
  } else if (type === 'sectorScanCostReduction') {
    values.reduction = percentReduction();
  } else if (type === 'massDriverCapacityBonus') {
    values.multiplier = value;
  } else if (type === 'fabricatorOutputMultiplier') {
    values.increase = percentIncrease();
  } else if (type === 'fabricatorCostReduction') {
    values.reduction = percentReduction();
  } else if (type === 'alloysStorageBonus') {
    values.increase = percentIncrease();
  } else if (type === 'contractRefreshMultiplier') {
    values.multiplier = value;
  } else if (type === 'companyXPMultiplier') {
    values.increase = percentIncrease();
  } else {
    // Fallback for unknown types
    if (type.endsWith('Multiplier')) {
      values.multiplier = value;
    } else if (type.endsWith('Bonus')) {
      values.value = value;
    }
  }

  return values;
}

/**
 * Renders a research node's description with actual effect values
 * Supports template placeholders like {reduction}, {increase}, {value}, {multiplier}, {totalValue}, {totalMultiplier}
 * Falls back to static description if no matching template or placeholder
 */
export function renderNodeDescription(node: ResearchNode, currentLevel?: number): string {
  const { description, effect } = node;

  // If no effect, return description as-is
  if (!effect) {
    return description;
  }

  // Calculate all possible effect values
  const values = calculateEffectValues(effect, currentLevel);

  // Replace placeholders in description
  // Pattern: {key} where key is a placeholder name
  const rendered = description.replace(/{(\w+)}/g, (match, key) => {
    if (key in values) {
      return String(values[key]);
    }
    // If placeholder not found, keep it as-is (will show {key})
    return match;
  });

  return rendered;
}
