import { useGameStore } from "./useGameStore.js"
import { researchTree, ResearchBranch, ResearchNode } from "./researchTree.js"
import { FaFlask, FaLock, FaCheckCircle, FaRocket, FaCogs, FaHandHoldingUsd, FaSatellite, FaBolt } from "react-icons/fa"

const BranchIcon = ({ branch }: { branch: ResearchBranch }) => {
  switch (branch) {
    case 'propulsion': return <FaRocket />;
    case 'infrastructure': return <FaCogs />;
    case 'commercial': return <FaHandHoldingUsd />;
    case 'orbital': return <FaSatellite />;
    case 'control': return <FaBolt />;
    default: return <FaFlask />;
  }
};

const BranchColor = ({ branch }: { branch: ResearchBranch }) => {
  switch (branch) {
    case 'propulsion': return 'from-orange-900 to-orange-950';
    case 'infrastructure': return 'from-cyan-900 to-cyan-950';
    case 'commercial': return 'from-green-900 to-green-950';
    case 'orbital': return 'from-purple-900 to-purple-950';
    case 'control': return 'from-blue-900 to-blue-950';
    default: return 'from-gray-900 to-gray-950';
  }
};

export function ResearchTreeView() {
  const { researchedNodes, unlockNode, science, rocketExplosionChance, getEffectMultiplier, newlyAvailableResearchIds } = useGameStore()

  const branches: ResearchBranch[] = Array.from(new Set(researchTree.map(n => n.branch)));
  const preferredOrder = ['propulsion', 'infrastructure', 'commercial', 'orbital', 'control'] as ResearchBranch[];
  branches.sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

  const isUnlocked = (id: string) => researchedNodes.includes(id);
  const canUnlock = (node: ResearchNode) => {
    if (isUnlocked(node.id)) return false;
    if (science < node.scienceCost) return false;
    return node.prerequisites.every((pId: string) => isUnlocked(pId));
  };

  // ===== HELPER FUNCTIONS FOR MULTI-LEVEL RESEARCH =====

  const getBaseId = (nodeId: string): string | null => {
    const parts = nodeId.split('-');
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      return parts[0];
    }
    return null;
  };

  const getMultiLevelGroup = (baseId: string): ResearchNode[] => {
    return researchTree.filter(n => n.levelSuffix && n.id.startsWith(baseId + '-'))
      .sort((a, b) => {
        const aLevel = parseInt(a.id.split('-')[1]);
        const bLevel = parseInt(b.id.split('-')[1]);
        return aLevel - bLevel;
      });
  };

  const getCurrentLevel = (baseId: string): number => {
    const group = getMultiLevelGroup(baseId);
    let maxLevel = 0;
    for (const node of group) {
      const level = parseInt(node.id.split('-')[1]);
      if (isUnlocked(node.id)) {
        maxLevel = Math.max(maxLevel, level);
      }
    }
    return maxLevel;
  };

  const getNextAvailableNode = (baseId: string): ResearchNode | null => {
    const group = getMultiLevelGroup(baseId);
    const currentLevel = getCurrentLevel(baseId);
    return group.find(n => parseInt(n.id.split('-')[1]) === currentLevel + 1) || null;
  };

  const getTotalLevels = (baseId: string): number => {
    return getMultiLevelGroup(baseId).length;
  };

  // Get clean name without roman numerals for multi-level research
  const getCleanName = (name: string): string => {
    // Remove trailing roman numerals like " I", " II", " III", " IV", " V", etc.
    return name.replace(/\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX)$/i, '');
  };

  // Render human-readable effect description
  const renderEffectDescription = (effect: { type: string; value: number }, currentLevel?: number) => {
    const efType = effect.type;
    const efVal = effect.value;

    // For multiplicative effects, calculate the actual impact
    if (efType === 'explosionChanceMultiplier') {
      const reduction = Math.round((1 - efVal) * 100);
      if (currentLevel && currentLevel > 1) {
        const totalReduction = Math.round((1 - Math.pow(efVal, currentLevel)) * 100);
        return `−${reduction}% explosion chance per level (−${totalReduction}% total)`;
      }
      return `−${reduction}% explosion chance`;
    } else if (efType === 'fuelCostMultiplier') {
      const reduction = Math.round((1 - efVal) * 100);
      return `−${reduction}% fuel cost`;
    } else if (efType === 'constructionCostMultiplier') {
      const reduction = Math.round((1 - efVal) * 100);
      return `−${reduction}% build costs`;
    } else if (efType === 'buildRocketMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      if (currentLevel && currentLevel > 1) {
        const totalMultiplier = Math.pow(efVal, currentLevel);
        return `+${increase}% build speed per level (×${totalMultiplier.toFixed(2)} total)`;
      }
      return `+${increase}% build speed`;
    } else if (efType === 'clearExplosionMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      if (currentLevel && currentLevel > 1) {
        const totalMultiplier = Math.pow(efVal, currentLevel);
        return `+${increase}% clear speed per level (×${totalMultiplier.toFixed(2)} total)`;
      }
      return `+${increase}% clear speed`;
    } else if (efType === 'profitMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      return `+${increase}% profit per rocket`;
    } else if (efType === 'cargoGenerationMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      return `+${increase}% cargo per launch`;
    } else if (efType === 'refineryOutputMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      return `+${increase}% fuel production`;
    } else if (efType === 'contractMoneyMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      return `+${increase}% contract rewards`;
    } else if (efType === 'stationLogisticsMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      return `+${increase}% station cargo output`;
    } else if (efType === 'stationScienceMultiplier') {
      const increase = Math.round((efVal - 1) * 100);
      return `+${increase}% station science output`;
    } else if (efType === 'spaceportCapacityBonus') {
      if (currentLevel && currentLevel > 1) {
        return `+${efVal} slots per level (+${efVal * currentLevel} total)`;
      }
      return `+${efVal} spaceport slots`;
    } else if (efType === 'buildRocketBatchBonus') {
      return `+${efVal} rocket per click`;
    } else if (efType === 'clearExplosionCountBonus') {
      return `+${efVal} cleared per click`;
    } else if (efType === 'autoBuildEnabled') {
      return 'Enables auto-build toggle';
    } else if (efType === 'uiTelemetryFlag') {
      return 'Enhanced stats display';
    } else if (efType === 'unlockHighValueContracts') {
      return 'Unlocks premium contracts';
    } else if (efType === 'unlockMoonMissions') {
      return 'Unlocks lunar operations';
    } else if (efType === 'unlockScienceRockets') {
      return 'Build rockets that generate science';
    } else if (efType === 'unlockSpaceports') {
      return 'Build additional spaceports';
    } else if (efType === 'unlockRefineries') {
      return 'Build fuel refineries';
    } else if (efType === 'unlockExplosionClearing') {
      return 'Clear exploded rockets for +1 science';
    }
    return efType;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-transparent p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-mono">RESEARCH LAB</h1>
          <div className="flex items-center gap-2 text-gray-300">
            <FaFlask className="text-blue-400" />
            <span className="font-mono text-xl font-bold text-blue-400">{Math.floor(science)}</span>
            <span className="text-sm">science available</span>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {branches.map(branch => (
            <div key={branch} className="flex flex-col gap-3">
              {/* Branch Header */}
              <div className={`bg-gradient-to-r ${BranchColor({ branch })} rounded-lg p-3 border border-gray-700`}>
                <div className="flex items-center gap-2">
                  <div className="text-xl text-white">
                    <BranchIcon branch={branch} />
                  </div>
                  <h2 className="text-lg font-bold text-white capitalize">
                    {branch}
                  </h2>
                </div>
              </div>

              {/* Single-Level Research Nodes */}
              {researchTree
                .filter(node => node.branch === branch && !node.levelSuffix && !isUnlocked(node.id))
                .sort((a, b) => (canUnlock(b) ? 1 : 0) - (canUnlock(a) ? 1 : 0))
                .map(node => {
                  const available = canUnlock(node);
                  const canAfford = science >= node.scienceCost;
                  const isNewlyAvailable = (newlyAvailableResearchIds || []).includes(node.id);

                  return (
                    <div
                      key={node.id}
                      onClick={() => available && unlockNode(node.id)}
                      data-testid={`node-${node.id}`}
                      className={`rounded-lg p-3 border transition-all ${
                        available
                          ? `border-blue-500/60 bg-blue-900/30 hover:bg-blue-800/40 cursor-pointer ${isNewlyAvailable ? 'animate-new-research' : ''}`
                          : 'border-gray-700/50 bg-gray-800/20 opacity-50'
                      }`}
                    >
                      {/* Title */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm text-white">{node.name}</h3>
                        {!available && (
                          <FaLock className="text-gray-500 text-xs" />
                        )}
                      </div>

                      {/* Effect */}
                      <p className="text-xs text-gray-300 mb-2">
                        {renderEffectDescription(node.effect)}
                      </p>

                      {/* Cost */}
                      <div className={`flex items-center gap-1 text-xs font-mono ${
                        canAfford ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        <FaFlask />
                        <span>{node.scienceCost}</span>
                      </div>
                    </div>
                  );
                })}

              {/* Multi-Level Research Groups */}
              {Array.from(new Set(
                researchTree
                  .filter(node => node.branch === branch && node.levelSuffix)
                  .map(node => getBaseId(node.id))
                  .filter((id): id is string => id !== null)
              )).map(baseId => {
                const totalLevels = getTotalLevels(baseId);
                const currentLevel = getCurrentLevel(baseId);
                const nextNode = getNextAvailableNode(baseId);
                const firstNode = getMultiLevelGroup(baseId)[0];
                const isFullyUnlocked = currentLevel === totalLevels;

                if (isFullyUnlocked) return null;

                const canUnlockNext = nextNode && canUnlock(nextNode);
                const canAffordNext = nextNode && science >= nextNode.scienceCost;
                const cleanName = getCleanName(firstNode.name);

                return (
                  <div
                    key={baseId}
                    onClick={() => canUnlockNext && nextNode && unlockNode(nextNode.id)}
                    data-testid={`node-${baseId}`}
                    className={`rounded-lg p-3 border transition-all ${
                      canUnlockNext
                        ? 'border-blue-500/60 bg-blue-900/30 hover:bg-blue-800/40 cursor-pointer'
                        : currentLevel > 0
                        ? 'border-purple-500/40 bg-purple-900/20'
                        : 'border-gray-700/50 bg-gray-800/20 opacity-50'
                    }`}
                  >
                    {/* Title with Level */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-white">{cleanName}</h3>
                        {currentLevel > 0 && (
                          <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-mono">
                            {currentLevel}/{totalLevels}
                          </span>
                        )}
                      </div>
                      {!canUnlockNext && currentLevel === 0 && (
                        <FaLock className="text-gray-500 text-xs" />
                      )}
                    </div>

                    {/* Effect Description */}
                    <p className="text-xs text-gray-300 mb-2">
                      {renderEffectDescription(firstNode.effect, currentLevel > 0 ? currentLevel : undefined)}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                          style={{ width: `${(currentLevel / totalLevels) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Current Explosion Chance for Safety Protocols */}
                    {baseId === 'p2' && (
                      <div className="text-xs text-orange-400 mb-2 font-mono">
                        Current explosion rate: {(rocketExplosionChance * getEffectMultiplier('explosionChanceMultiplier') * 100).toFixed(1)}%
                      </div>
                    )}

                    {/* Next Level Cost */}
                    {nextNode && (
                      <div className={`flex items-center gap-1 text-xs font-mono ${
                        canAffordNext ? 'text-blue-400' : 'text-red-400'
                      }`}>
                        <FaFlask />
                        <span>{nextNode.scienceCost}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Completed Research (collapsed) */}
              {researchTree
                .filter(node => node.branch === branch && !node.levelSuffix && isUnlocked(node.id))
                .map(node => (
                  <div
                    key={node.id}
                    data-testid={`node-${node.id}`}
                    className="rounded-lg p-2 border border-green-700/30 bg-green-900/10 opacity-60"
                  >
                    <div className="flex items-center gap-2">
                      <FaCheckCircle className="text-green-500 text-xs" />
                      <span className="text-xs text-green-400">{node.name}</span>
                    </div>
                  </div>
                ))}

              {/* Fully Completed Multi-Level Groups */}
              {Array.from(new Set(
                researchTree
                  .filter(node => node.branch === branch && node.levelSuffix)
                  .map(node => getBaseId(node.id))
                  .filter((id): id is string => id !== null)
              )).filter(baseId => getCurrentLevel(baseId) === getTotalLevels(baseId))
                .map(baseId => {
                  const firstNode = getMultiLevelGroup(baseId)[0];
                  const cleanName = getCleanName(firstNode.name);
                  const totalLevels = getTotalLevels(baseId);

                  return (
                    <div
                      key={baseId}
                      data-testid={`node-${baseId}`}
                      className="rounded-lg p-2 border border-green-700/30 bg-green-900/10 opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className="text-green-500 text-xs" />
                        <span className="text-xs text-green-400">{cleanName}</span>
                        <span className="text-xs text-green-600 font-mono">MAX ({totalLevels})</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
