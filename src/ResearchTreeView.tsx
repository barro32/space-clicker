import { useGameStore } from "./useGameStore.js"
import { researchTree, ResearchBranch, ResearchNode } from "./researchTree.js"
import { FaFlask, FaLock, FaCheckCircle, FaRocket, FaCogs, FaHandHoldingUsd, FaSatellite, FaBomb, FaBolt, FaChevronRight } from "react-icons/fa"
import { useState } from "react"

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

interface ExtendedResearchNode extends ResearchNode {
  isUnlocked: boolean;
  canUnlock: boolean;
  missingPrereqs?: string[];
  insufficientScience?: boolean;
}

export function ResearchTreeView() {
   const { researchedNodes, unlockNode, science, rocketExplosionChance, getEffectMultiplier } = useGameStore()
   const [expandedNode, setExpandedNode] = useState<string | null>(null)

   const branches: ResearchBranch[] = Array.from(new Set(researchTree.map(n => n.branch)));
   const preferredOrder = ['propulsion','infrastructure','commercial','orbital','control'] as ResearchBranch[];
   branches.sort((a,b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b));

   const isUnlocked = (id: string) => researchedNodes.includes(id);
   const canUnlock = (node: any) => {
     if (isUnlocked(node.id)) return false;
     if (science < node.scienceCost) return false;
     return node.prerequisites.every((pId: string) => isUnlocked(pId));
   };

   const getMissingPrereqs = (node: any) => {
     return node.prerequisites.filter((pId: string) => !isUnlocked(pId));
   };

   // ===== HELPER FUNCTIONS FOR MULTI-LEVEL RESEARCH =====
   
   const getBaseId = (nodeId: string): string | null => {
     // Extract base ID from "p2-1" -> "p2", or return null for single-level
     const parts = nodeId.split('-');
     if (parts.length === 2 && /^\d+$/.test(parts[1])) {
       return parts[0];
     }
     return null;
   };

   const getMultiLevelGroup = (baseId: string): ResearchNode[] => {
     // Get all nodes in a multi-level group (e.g., all p2-1 through p2-10)
     return researchTree.filter(n => n.levelSuffix && n.id.startsWith(baseId + '-'))
       .sort((a, b) => {
         const aLevel = parseInt(a.id.split('-')[1]);
         const bLevel = parseInt(b.id.split('-')[1]);
         return aLevel - bLevel;
       });
   };

   const getCurrentLevel = (baseId: string): number => {
     // Returns the highest unlocked level (0 if none unlocked)
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
     // Get the next node to unlock in the multi-level group
     const group = getMultiLevelGroup(baseId);
     const currentLevel = getCurrentLevel(baseId);
     // Find first node with level > currentLevel
     return group.find(n => parseInt(n.id.split('-')[1]) === currentLevel + 1) || null;
   };

   const getTotalLevels = (baseId: string): number => {
     // Total number of levels in this multi-level group
     return getMultiLevelGroup(baseId).length;
   };

   const getMultiLevelProgress = (baseId: string) => {
     // For multi-level research like "p2", find how many levels (p2-1, p2-2, etc) are unlocked
     const matchingNodes = researchTree.filter(n => n.levelSuffix && n.id.startsWith(baseId + '-'));
     const unlockedCount = matchingNodes.filter(n => isUnlocked(n.id)).length;
     return unlockedCount > 0 ? unlockedCount : null;
   };

  const renderEffectLabel = (effect: any) => {
    const efType = effect.type;
    const efVal = effect.value;
    
    if (efType === 'buildRocketMultiplier') {
      return `Build Speed ×${efVal}`;
    } else if (efType === 'buildRocketBatchBonus') {
      return `Batch Size +${efVal}`;
    } else if (efType === 'clearExplosionMultiplier') {
      return `Clear Speed ×${efVal}`;
    } else if (efType === 'clearExplosionCountBonus') {
      return `Clear Amount +${efVal}`;
    } else if (efType === 'autoBuildEnabled') {
      return `Auto-Build Toggle`;
    } else if (efType === 'uiTelemetryFlag') {
      return `Telemetry UI`;
    } else if (efType === 'fuelCostMultiplier') {
      return `Fuel Cost ×${efVal}`;
    } else if (efType === 'explosionChanceMultiplier') {
      return `Explosion Risk ×${efVal}`;
    } else if (efType === 'cargoGenerationMultiplier') {
      return `Cargo Yield ×${efVal}`;
    } else if (efType === 'spaceportCapacityBonus') {
      return `Spaceport Capacity +${efVal}`;
    } else if (efType === 'refineryOutputMultiplier') {
      return `Refinery Output ×${efVal}`;
    } else if (efType === 'constructionCostMultiplier') {
      return `Build Cost ×${efVal}`;
    } else if (efType === 'profitMultiplier') {
      return `Profit Per Rocket ×${efVal}`;
    } else if (efType === 'contractMoneyMultiplier') {
      return `Contract Rewards ×${efVal}`;
    } else if (efType === 'unlockHighValueContracts') {
      return `Unlock High-Value Contracts`;
    } else if (efType === 'stationLogisticsMultiplier') {
      return `Station Output ×${efVal}`;
    } else if (efType === 'stationScienceMultiplier') {
      return `Station Science ×${efVal}`;
    } else if (efType === 'unlockMoonMissions') {
      return `Unlock Moon Missions`;
    }
    return `${efType}`;
  };

  return (
    <div className="w-full h-screen overflow-y-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Research Tree</h1>
          <div className="flex items-center gap-4 text-sm text-gray-300">
             <div className="flex items-center gap-2">
               <FaFlask className="text-blue-400" />
               <span className="font-mono text-lg font-bold text-white">{Math.floor(science)}</span>
               <span>Science available</span>
             </div>
          </div>
        </div>

        {/* Branches Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {branches.map(branch => (
            <div key={branch} className="flex flex-col gap-4">
              {/* Branch Header */}
              <div className={`bg-gradient-to-r ${BranchColor({ branch })} rounded-lg p-4 border border-gray-700`}>
                <div className="flex items-center gap-3 mb-1">
                  <div className="text-2xl text-white">
                    <BranchIcon branch={branch} />
                  </div>
                  <h2 className="text-xl font-bold text-white capitalize">
                    {branch}
                  </h2>
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  {researchTree.filter(n => n.branch === branch).length} techs
                </p>
              </div>

                {/* Nodes */}
                <div className="flex flex-col gap-3">
                  {/* First, collect all single-level nodes for this branch that are NOT researched */}
                  {researchTree
                    .filter(node => node.branch === branch && !node.levelSuffix && !isUnlocked(node.id))
                    .sort((a, b) => {
                      const aAvailable = canUnlock(a);
                      const bAvailable = canUnlock(b);
                      // Available nodes go to top (false = 0, true = 1, so available sorts higher)
                      return (bAvailable ? 1 : 0) - (aAvailable ? 1 : 0);
                    })
                    .map(node => {
                     const available = canUnlock(node);
                     const missingPrereqs = getMissingPrereqs(node);
                     const insufficientScience = science < node.scienceCost && !isUnlocked(node.id);

                     const baseClasses = "relative rounded-lg p-3 cursor-pointer transition-all duration-200 border";
                     
                     let stateClasses = '';
                     if (available) {
                       stateClasses = 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30 hover:border-blue-400/70 animate-pulse-slow';
                     } else {
                       stateClasses = 'border-gray-700/50 bg-gray-800/30 opacity-60';
                     }

                     return (
                       <div
                         key={node.id}
                         onClick={() => {
                           if (available) {
                             unlockNode(node.id);
                           } else {
                             setExpandedNode(expandedNode === node.id ? null : node.id);
                           }
                         }}
                         data-testid={`node-${node.id}`}
                         className={`${baseClasses} ${stateClasses}`}
                       >
                          {/* Node Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-white leading-tight">
                                  {node.name}
                                </h3>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {available ? (
                                <div className="text-blue-400 text-lg animate-bounce">
                                  <FaChevronRight />
                                </div>
                              ) : (
                                <FaLock className="text-gray-500 text-sm" />
                              )}
                            </div>
                          </div>

                         {/* Effect & Cost Row */}
                         <div className="flex items-center justify-between gap-2 mb-2 py-2 border-t border-gray-700/50 border-b border-gray-700/50">
                           <div className="flex-1 min-w-0">
                             <p className="text-xs font-semibold text-gray-200 truncate">
                               {renderEffectLabel(node.effect)}
                             </p>
                           </div>
                           <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono whitespace-nowrap ${
                             insufficientScience ? 'bg-red-900/30 text-red-300' : 'bg-blue-900/30 text-blue-300'
                           }`}>
                             <FaFlask className="text-xs" />
                             {node.scienceCost}
                           </div>
                         </div>

                         {/* Expandable Details */}
                         {expandedNode === node.id && (
                           <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-300 space-y-1">
                             <p className="leading-relaxed">{node.description}</p>
                             
                             {missingPrereqs.length > 0 && (
                               <div className="text-red-400/80 text-[11px]">
                                 Requires: {missingPrereqs.join(', ')}
                               </div>
                             )}
                             
                             {insufficientScience && (
                               <div className="text-red-400/80 text-[11px]">
                                 Need {node.scienceCost - science} more science
                               </div>
                             )}

                             {available && (
                               <div className="text-green-400/80 text-[11px] font-semibold">
                                 Click to unlock!
                               </div>
                             )}
                           </div>
                         )}

                         {/* Quick Info Indicator */}
                         {missingPrereqs.length > 0 && expandedNode !== node.id && (
                           <div className="mt-2 text-[10px] text-gray-500">
                             ⚠️ Requires {missingPrereqs.length} tech
                           </div>
                         )}
                       </div>
                     );
                   })}

                  {/* Now render multi-level research groups (only if NOT fully unlocked) */}
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
                    
                    // Skip if fully unlocked
                    if (isFullyUnlocked) return null;
                    
                    const canUnlockNext = nextNode && canUnlock(nextNode);
                    const hasAnyUnlocked = currentLevel > 0;

                    const baseClasses = "relative rounded-lg p-3 cursor-pointer transition-all duration-200 border";
                    
                    let stateClasses = '';
                    if (canUnlockNext) {
                      stateClasses = 'border-blue-500/50 bg-blue-900/20 hover:bg-blue-900/30 hover:border-blue-400/70 animate-pulse-slow';
                    } else if (hasAnyUnlocked) {
                      stateClasses = 'border-purple-500/50 bg-purple-900/20 hover:bg-purple-900/30 hover:border-purple-400/70';
                    } else {
                      stateClasses = 'border-gray-700/50 bg-gray-800/30 opacity-60';
                    }

                    return (
                      <div
                        key={baseId}
                        onClick={() => {
                          if (canUnlockNext && nextNode) {
                            unlockNode(nextNode.id);
                          } else {
                            setExpandedNode(expandedNode === baseId ? null : baseId);
                          }
                        }}
                        data-testid={`node-${baseId}`}
                        className={`${baseClasses} ${stateClasses}`}
                      >
                        {/* Multi-Level Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-white leading-tight">
                                {firstNode.name}
                              </h3>
                              {currentLevel > 0 && (
                                <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                                  Lvl {currentLevel} / {totalLevels}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-300 mt-1">
                              {firstNode.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            {canUnlockNext ? (
                              <div className="text-blue-400 text-lg animate-bounce">
                                <FaChevronRight />
                              </div>
                            ) : hasAnyUnlocked ? (
                              <div className="text-purple-400 text-sm">
                                {currentLevel} / {totalLevels}
                              </div>
                            ) : (
                              <FaLock className="text-gray-500 text-sm" />
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {currentLevel > 0 || nextNode && (
                          <div className="mb-2 py-2 border-t border-gray-700/50 border-b border-gray-700/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-300">Progress</span>
                              <span className="text-xs font-mono text-gray-400">{currentLevel}/{totalLevels}</span>
                            </div>
                            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                                style={{ width: `${(currentLevel / totalLevels) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                         {/* Current & Next Level Info */}
                         {currentLevel > 0 && (
                           <div className="mb-2 py-2 text-xs text-gray-300 bg-gray-800/30 rounded px-2">
                             <p className="font-semibold text-purple-300">Current Effect (×{(firstNode.effect.value ** currentLevel).toFixed(3)}):</p>
                             <p>{renderEffectLabel(firstNode.effect)}</p>
                           </div>
                         )}

                         {/* Explosion Likelihood for Safety Protocols */}
                         {baseId === 'p2' && (
                           <div className="mb-2 py-2 text-xs text-gray-300 bg-gray-800/30 rounded px-2">
                             <p className="font-semibold text-orange-300">Explosion per Launch:</p>
                             <p className="font-mono">{(rocketExplosionChance * getEffectMultiplier('explosionChanceMultiplier') * 100).toFixed(1)}%</p>
                           </div>
                         )}

                        {/* Next Level Cost */}
                        {nextNode && !isFullyUnlocked && (
                          <div className="flex items-center justify-between gap-2 py-2 border-t border-gray-700/50 border-b border-gray-700/50">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-200">
                                Next: Level {currentLevel + 1}
                              </p>
                            </div>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono whitespace-nowrap ${
                              science >= nextNode.scienceCost ? 'bg-blue-900/30 text-blue-300' : 'bg-red-900/30 text-red-300'
                            }`}>
                              <FaFlask className="text-xs" />
                              {nextNode.scienceCost}
                            </div>
                          </div>
                        )}

                        {/* Expandable Details */}
                        {expandedNode === baseId && (
                          <div className="mt-2 pt-2 border-t border-gray-700/50 text-xs text-gray-300 space-y-1">
                            <p className="leading-relaxed">{firstNode.description}</p>
                            
                            <div className="text-gray-400 text-[11px]">
                              <p>Unlocked: {currentLevel} / {totalLevels} levels</p>
                              {nextNode && getMissingPrereqs(nextNode).length > 0 && (
                                <p className="text-red-400/80">
                                  Requires: {getMissingPrereqs(nextNode).join(', ')}
                                </p>
                              )}
                            </div>

                            {canUnlockNext && (
                              <div className="text-green-400/80 text-[11px] font-semibold">
                                Click to unlock Level {currentLevel + 1}!
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Info Indicator */}
                        {nextNode && getMissingPrereqs(nextNode).length > 0 && expandedNode !== baseId && (
                          <div className="mt-2 text-[10px] text-gray-500">
                            ⚠️ Requires {getMissingPrereqs(nextNode).length} tech
                          </div>
                        )}
                      </div>
                    );
                  })}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
