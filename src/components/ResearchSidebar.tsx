import { useState, useCallback } from "react"
import { useGameStore } from "../useGameStore.js"
import { researchTree, ResearchNode, ResearchLayer, ResearchBranch } from "../researchTree.js"
import { FaFlask, FaLock, FaCheckCircle, FaRocket, FaCogs, FaHandHoldingUsd, FaSatellite, FaBolt, FaMoon, FaChevronLeft, FaChevronRight } from "react-icons/fa"

interface ResearchSidebarProps {
  layer: ResearchLayer
}

const BranchIcon = ({ branch }: { branch: ResearchBranch }) => {
  switch (branch) {
    case 'propulsion': return <FaRocket />;
    case 'infrastructure': return <FaCogs />;
    case 'commercial': return <FaHandHoldingUsd />;
    case 'orbital': return <FaSatellite />;
    case 'control': return <FaBolt />;
    case 'lunar': return <FaMoon />;
    default: return <FaFlask />;
  }
};

// Get clean name without roman numerals for multi-level research
const getCleanName = (name: string): string => {
  return name.replace(/\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XI{0,3}|XIV|XV|XVI{0,3}|XIX|XX|\d+)$/i, '');
};

// Render human-readable effect description (compact version)
const renderEffectDescription = (effect: { type: string; value: number }, currentLevel?: number) => {
  const efType = effect.type;
  const efVal = effect.value;

  if (efType === 'explosionChanceMultiplier') {
    const reduction = Math.round((1 - efVal) * 100);
    if (currentLevel && currentLevel > 1) {
      const totalReduction = Math.round((1 - Math.pow(efVal, currentLevel)) * 100);
      return `-${reduction}%/lvl (-${totalReduction}% total)`;
    }
    return `-${reduction}% explosion`;
  } else if (efType === 'fuelCostMultiplier') {
    return `-${Math.round((1 - efVal) * 100)}% fuel cost`;
  } else if (efType === 'constructionCostMultiplier') {
    return `-${Math.round((1 - efVal) * 100)}% build cost`;
  } else if (efType === 'buildRocketMultiplier' || efType === 'clearExplosionMultiplier') {
    const increase = Math.round((efVal - 1) * 100);
    if (currentLevel && currentLevel > 1) {
      return `+${increase}%/lvl (x${Math.pow(efVal, currentLevel).toFixed(2)})`;
    }
    return `+${increase}% speed`;
  } else if (efType === 'profitMultiplier' || efType === 'cargoGenerationMultiplier') {
    return `+${Math.round((efVal - 1) * 100)}% profit`;
  } else if (efType === 'refineryOutputMultiplier') {
    return `+${Math.round((efVal - 1) * 100)}% fuel prod`;
  } else if (efType === 'contractMoneyMultiplier') {
    return `+${Math.round((efVal - 1) * 100)}% rewards`;
  } else if (efType === 'stationLogisticsMultiplier' || efType === 'stationScienceMultiplier') {
    return `+${Math.round((efVal - 1) * 100)}% station output`;
  } else if (efType === 'spaceportCapacityBonus') {
    if (currentLevel && currentLevel > 1) {
      return `+${efVal}/lvl (+${efVal * currentLevel} total)`;
    }
    return `+${efVal} slots`;
  } else if (efType === 'cargoPerLaunchMultiplier') {
    const increase = Math.round((efVal - 1) * 100);
    if (currentLevel && currentLevel > 1) {
      const totalMult = Math.pow(efVal, currentLevel);
      return `+${increase}%/lvl (x${totalMult.toFixed(2)})`;
    }
    return `+${increase}% cargo`;
  } else if (efType === 'passiveCargoBonus') {
    return `+${efVal} cargo/tick`;
  } else if (efType === 'maxActiveContractsBonus' || efType === 'maxAvailableContractsBonus') {
    return `+${efVal} contract slot`;
  } else if (efType.startsWith('unlock')) {
    return 'Unlock';
  } else if (efType.endsWith('Multiplier')) {
    return `x${efVal}`;
  } else if (efType.endsWith('Bonus')) {
    return `+${efVal}`;
  }
  return efType.replace(/([A-Z])/g, ' $1').trim();
};

export function ResearchSidebar({ layer }: ResearchSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    researchedNodes, 
    unlockNode, 
    science, 
    cargo, 
    lunarComponents, 
    earthResources,
    getEffectMultiplier
  } = useGameStore()

  // Filter research nodes for this layer
  const layerNodes = researchTree.filter(n => n.assignedLayer === layer);

  const isUnlocked = useCallback((id: string) => researchedNodes.includes(id), [researchedNodes]);
  
  const canUnlock = useCallback((node: ResearchNode) => {
    if (isUnlocked(node.id)) return false;
    if (science < node.scienceCost) return false;
    if (node.cargoCost && cargo < node.cargoCost) return false;
    if (node.lunarComponentCost && lunarComponents < node.lunarComponentCost) return false;
    if (node.helium3Cost && earthResources.helium3 < node.helium3Cost) return false;
    return node.prerequisites.every((pId: string) => isUnlocked(pId));
  }, [science, cargo, lunarComponents, earthResources.helium3, isUnlocked]);

  const getBaseId = (nodeId: string): string | null => {
    const parts = nodeId.split('-');
    if (parts.length === 2 && /^\d+$/.test(parts[1])) {
      return parts[0];
    }
    return null;
  };

  const getMultiLevelGroup = (baseId: string): ResearchNode[] => {
    return layerNodes.filter(n => n.levelSuffix && n.id.startsWith(baseId + '-'))
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

  // Separate single-level and multi-level nodes
  const singleLevelNodes = layerNodes.filter(n => !n.levelSuffix);
  const multiLevelBaseIds = Array.from(new Set(
    layerNodes.filter(n => n.levelSuffix)
      .map(n => getBaseId(n.id))
      .filter((id): id is string => id !== null)
  ));

  // Check if any research is affordable (for toggle button highlight)
  const hasAffordableResearch = singleLevelNodes.some(n => canUnlock(n)) ||
    multiLevelBaseIds.some(baseId => {
      const nextNode = getNextAvailableNode(baseId);
      return nextNode && canUnlock(nextNode);
    });

  // Count available research
  const availableCount = singleLevelNodes.filter(n => canUnlock(n)).length +
    multiLevelBaseIds.filter(baseId => {
      const nextNode = getNextAvailableNode(baseId);
      return nextNode && canUnlock(nextNode);
    }).length;

  // Count total incomplete research (not fully researched)
  const incompleteCount = singleLevelNodes.filter(n => !isUnlocked(n.id)).length +
    multiLevelBaseIds.filter(baseId => getCurrentLevel(baseId) < getTotalLevels(baseId)).length;

  if (incompleteCount === 0) return null; // No research to show

  const layerTitle = layer === 'orbit' ? 'Orbital' : 
                     layer === 'contracts' ? 'Commercial' : 
                     layer === 'moon' ? 'Lunar' : 'Surface';

  return (
    <>
      {/* Toggle Button - Left side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 px-2 py-4 rounded-r-lg border border-l-0 transition-all ${
          hasAffordableResearch 
            ? 'bg-blue-600 border-blue-400 animate-research-flash' 
            : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
        }`}
        title={`${layerTitle} Research (${availableCount} available)`}
      >
        <div className="flex flex-col items-center gap-1">
          <FaFlask className={hasAffordableResearch ? 'text-blue-200' : 'text-gray-400'} />
          {availableCount > 0 && (
            <span className="text-xs font-mono text-white bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
              {availableCount}
            </span>
          )}
          {isOpen ? <FaChevronLeft className="text-gray-400 text-xs" /> : <FaChevronRight className="text-gray-400 text-xs" />}
        </div>
      </button>

      {/* Sidebar Panel - Left side */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-gray-900/95 border-r border-gray-700 z-30 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{layerTitle} Research</h2>
            <div className="flex items-center gap-2 text-gray-300 bg-black/30 px-2 py-1 rounded border border-blue-500/30">
              <FaFlask className="text-blue-400 text-sm" />
              <span className="font-mono text-sm font-bold text-blue-400">{Math.floor(science)}</span>
            </div>
          </div>

          {/* Research List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {/* Single-Level Nodes (Available first) */}
            {singleLevelNodes
              .filter(n => !isUnlocked(n.id))
              .sort((a, b) => (canUnlock(b) ? 1 : 0) - (canUnlock(a) ? 1 : 0))
              .map(node => {
                const available = canUnlock(node);
                const canAfford = science >= node.scienceCost;

                return (
                  <div
                    key={node.id}
                    onClick={() => available && unlockNode(node.id)}
                    className={`rounded-lg p-2 border transition-all ${
                      available
                        ? 'border-blue-500/60 bg-blue-900/30 hover:bg-blue-800/40 cursor-pointer'
                        : 'border-gray-700/50 bg-gray-800/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <BranchIcon branch={node.branch} />
                        <h3 className="font-semibold text-xs text-white truncate">{node.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-mono ${canAfford ? 'text-blue-400' : 'text-red-400'}`}>
                          {node.scienceCost}
                        </span>
                        {!available && <FaLock className="text-gray-500 text-[10px]" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-tight">
                      {node.description}
                    </p>
                    {/* Show additional costs */}
                    {(node.cargoCost || node.lunarComponentCost || node.helium3Cost) && (
                      <div className="flex gap-2 mt-1">
                        {node.cargoCost && (
                          <span className={`text-[10px] ${cargo >= node.cargoCost ? 'text-yellow-400' : 'text-red-400'}`}>
                            {node.cargoCost} cargo
                          </span>
                        )}
                        {node.lunarComponentCost && (
                          <span className={`text-[10px] ${lunarComponents >= node.lunarComponentCost ? 'text-purple-400' : 'text-red-400'}`}>
                            {node.lunarComponentCost} lunar
                          </span>
                        )}
                        {node.helium3Cost && (
                          <span className={`text-[10px] ${earthResources.helium3 >= node.helium3Cost ? 'text-cyan-400' : 'text-red-400'}`}>
                            {node.helium3Cost} He-3
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Multi-Level Groups */}
            {multiLevelBaseIds.map(baseId => {
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
                  className={`rounded-lg p-2 border transition-all ${
                    canUnlockNext
                      ? 'border-blue-500/60 bg-blue-900/30 hover:bg-blue-800/40 cursor-pointer'
                      : currentLevel > 0
                      ? 'border-purple-500/40 bg-purple-900/20'
                      : 'border-gray-700/50 bg-gray-800/20 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <BranchIcon branch={firstNode.branch} />
                      <h3 className="font-semibold text-xs text-white truncate">{cleanName}</h3>
                      {currentLevel > 0 && (
                        <span className="text-[10px] bg-purple-500/30 text-purple-300 px-1 rounded font-mono">
                          {currentLevel}/{totalLevels}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {nextNode && (
                        <span className={`text-xs font-mono ${canAffordNext ? 'text-blue-400' : 'text-red-400'}`}>
                          {nextNode.scienceCost}
                        </span>
                      )}
                      {!canUnlockNext && currentLevel === 0 && (
                        <FaLock className="text-gray-500 text-[10px]" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-1">
                    <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all"
                        style={{ width: `${(currentLevel / totalLevels) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-tight">
                    {nextNode ? nextNode.description : firstNode.description}
                  </p>
                </div>
              );
            })}

            {/* Completed Research (collapsed) */}
            <div className="mt-4 pt-2 border-t border-gray-700">
              <h3 className="text-xs text-gray-500 mb-2">Completed</h3>
              {singleLevelNodes
                .filter(n => isUnlocked(n.id))
                .map(node => (
                  <div key={node.id} className="rounded p-1 flex items-center gap-1 opacity-50">
                    <FaCheckCircle className="text-green-500 text-[10px]" />
                    <span className="text-[10px] text-green-400">{node.name}</span>
                  </div>
                ))}
              
              {multiLevelBaseIds
                .filter(baseId => getCurrentLevel(baseId) === getTotalLevels(baseId))
                .map(baseId => {
                  const firstNode = getMultiLevelGroup(baseId)[0];
                  const cleanName = getCleanName(firstNode.name);
                  const totalLevels = getTotalLevels(baseId);

                  return (
                    <div key={baseId} className="rounded p-1 flex items-center gap-1 opacity-50">
                      <FaCheckCircle className="text-green-500 text-[10px]" />
                      <span className="text-[10px] text-green-400">{cleanName}</span>
                      <span className="text-[10px] text-green-600 font-mono">({totalLevels})</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
