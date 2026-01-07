import { useGameStore } from "./useGameStore.js"
import { researchTree, ResearchBranch } from "./researchTree.js"
import { FaFlask, FaLock, FaCheckCircle, FaRocket, FaCogs, FaHandHoldingUsd, FaSatellite } from "react-icons/fa"

const BranchIcon = ({ branch }: { branch: ResearchBranch }) => {
  switch (branch) {
    case 'propulsion': return <FaRocket />;
    case 'infrastructure': return <FaCogs />;
    case 'commercial': return <FaHandHoldingUsd />;
    case 'orbital': return <FaSatellite />;
  }
};

export function ResearchTreeView() {
  const { researchedNodes, unlockNode, science } = useGameStore()

  const branches: ResearchBranch[] = ['propulsion', 'infrastructure', 'commercial', 'orbital'];

  const isUnlocked = (id: string) => researchedNodes.includes(id);
  const canUnlock = (node: any) => {
    if (isUnlocked(node.id)) return false;
    if (science < node.scienceCost) return false;
    return node.prerequisites.every((pId: string) => isUnlocked(pId));
  };

  return (
    <div className="flex flex-col gap-8 p-8 w-full max-w-6xl overflow-y-auto max-h-[80vh]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {branches.map(branch => (
          <div key={branch} className="flex flex-col gap-4">
            <h2 className="text-xl font-bold flex items-center gap-2 capitalize text-blue-400 border-b border-gray-700 pb-2">
              <BranchIcon branch={branch} /> {branch}
            </h2>
            <div className="flex flex-col gap-4">
              {researchTree
                .filter(node => node.branch === branch)
                .map(node => {
                  const unlocked = isUnlocked(node.id);
                  const available = canUnlock(node);
                  
                  return (
                    <div 
                      key={node.id} 
                      onClick={() => available && unlockNode(node.id)}
                      data-testid={`node-${node.id}`}
                      className={`
                        relative border-2 p-4 rounded-lg flex flex-col gap-2 transition-all
                        ${unlocked ? 'border-green-500 bg-green-900/20' : 
                          available ? 'border-blue-500 bg-blue-900/20 cursor-pointer hover:bg-blue-900/40 animate-pulse-slow' : 
                          'border-gray-700 bg-gray-800 opacity-60'}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-sm">{node.name}</h3>
                        {unlocked ? <FaCheckCircle className="text-green-500" /> : !available ? <FaLock className="text-gray-500 text-xs" /> : null}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight">{node.description}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-1 text-[10px] text-blue-300">
                          <FaFlask /> {node.scienceCost}
                        </div>
                        {node.prerequisites.length > 0 && (
                          <div className="text-[8px] text-gray-500">
                            Requires: {node.prerequisites.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
