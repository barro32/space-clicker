import { useEffect, useState } from 'react';
import { shallow } from 'zustand/shallow';
import { useGameStore, Contract } from "./useGameStore.js"
import { COMPANY_DEFINITIONS } from './gameConstants.js'
import { FaBuilding, FaBoxOpen, FaFlask, FaMoneyBillAlt, FaCheckCircle, FaBan, FaHandshake, FaClock } from "react-icons/fa"

export function ContractsView() {
  const [
    companies,
    availableContracts,
    activeContracts,
    contractRefreshTimer,
    maxActiveContracts,
    generateContracts,
    acceptContract,
    forfeitContract,
  ] = useGameStore((state) => [
    state.companies,
    state.availableContracts,
    state.activeContracts,
    state.contractRefreshTimer,
    state.getMaxActiveContracts(),
    state.generateContracts,
    state.acceptContract,
    state.forfeitContract,
  ], shallow);

  const [hoveredPerk, setHoveredPerk] = useState<{ companyId: string; perkIndex: number } | null>(null);

  useEffect(() => {
    generateContracts();
  }, [generateContracts]);

  const formatRefreshTimer = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    }
    return `${seconds}s`;
  };

  const getCompanyColor = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string }> = {
      green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' },
      blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
      purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
      orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-400' },
      red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-400' },
      cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-400' },
    };
    return colorMap[color] || { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-400' };
  };

  const renderContract = (contract: Contract, isAvailable: boolean) => {
    const isActive = contract.status === 'active';
    const companyDef = COMPANY_DEFINITIONS.find(c => c.id === contract.companyId);
    const colors = companyDef ? getCompanyColor(companyDef.color) : { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-gray-400' };
    
    return (
      <div key={contract.id} className={`rounded-lg transition-colors overflow-hidden border flex ${contract.status === 'failed' ? 'border-red-500/50 bg-red-900/20' : 'border-gray-700 bg-gray-800/60'}`}>
        {/* Full-height company color pill */}
        <div className={`w-1.5 ${colors.bg} flex-shrink-0 rounded-l-lg`} />
        
        {/* Content */}
        <div className="flex-1 px-2.5 py-1.5 flex flex-col gap-1">
          {/* Row 1: Title */}
          <h3 className={`font-bold text-xs ${colors.text} truncate`}>{contract.title}</h3>
          
          {/* Row 2: Requirements */}
          <div className="flex items-center gap-3 text-[11px]">
            {/* Money */}
            <div className="flex items-center gap-1 text-green-400 flex-1">
              <FaMoneyBillAlt className="text-[9px]" />
              <span className="font-medium">{isActive ? `${Math.floor(contract.deliveredMoney).toLocaleString()}/${contract.requiredMoney.toLocaleString()}` : contract.requiredMoney.toLocaleString()}</span>
              {isActive && (
                <div className="flex-1 bg-gray-700 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(100, (contract.deliveredMoney / contract.requiredMoney) * 100)}%` }} />
                </div>
              )}
            </div>
            
            {/* Science */}
            <div className="flex items-center gap-1 text-blue-400 flex-1">
              <FaFlask className="text-[9px]" />
              <span className="font-medium">{isActive ? `${Math.floor(contract.deliveredScience).toLocaleString()}/${contract.requiredScience.toLocaleString()}` : contract.requiredScience.toLocaleString()}</span>
              {isActive && (
                <div className="flex-1 bg-gray-700 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (contract.deliveredScience / contract.requiredScience) * 100)}%` }} />
                </div>
              )}
            </div>
            
            {/* Cargo */}
            <div className="flex items-center gap-1 text-yellow-400 flex-1">
              <FaBoxOpen className="text-[9px]" />
              <span className="font-medium">{isActive ? `${Math.floor(contract.deliveredCargo).toLocaleString()}/${contract.requiredCargo.toLocaleString()}` : contract.requiredCargo.toLocaleString()}</span>
              {isActive && (
                <div className="flex-1 bg-gray-700 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all" style={{ width: `${Math.min(100, (contract.deliveredCargo / contract.requiredCargo) * 100)}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Action button - vertically centered */}
        <div className="flex items-center pr-2.5 flex-shrink-0">
          {contract.status === 'failed' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">FAILED</span>
          )}
          {isAvailable && (
            <button 
              onClick={() => acceptContract(contract.id)}
              disabled={activeContracts.length >= maxActiveContracts}
              className={`${colors.bg} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed px-2.5 py-0.5 rounded text-[10px] font-bold transition-opacity`}
            >
              Accept
            </button>
          )}
          {contract.status === 'active' && (
            <button 
              onClick={() => forfeitContract(contract.id)}
              className="bg-red-600/80 hover:bg-red-500 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 transition-colors"
            >
              <FaBan className="text-[8px]" /> Forfeit
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-transparent p-6">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Header - Contract Hub Style */}
        <div className="mb-6 flex items-center justify-between border-b border-amber-500/30 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h1 className="text-2xl font-bold text-amber-300 font-mono tracking-wider">CONTRACT NEGOTIATION HUB</h1>
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 font-mono">ACTIVE:</span>
            <span className="text-cyan-400 font-bold font-mono">{activeContracts.length}/{maxActiveContracts}</span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
          
          {/* LEFT COLUMN: Company Reputation */}
          <div className="flex flex-col gap-4 overflow-y-auto pr-2">
            <div className="flex items-center gap-3 pb-2 border-b border-purple-500/30 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
              <FaHandshake className="text-purple-400" />
              <h2 className="text-lg font-bold text-purple-300 font-mono">COMPANY REPUTATION</h2>
            </div>
            
            {/* Company Cards - Stacked vertically */}
            <div className="flex flex-col gap-2">
              {companies.map(company => {
                const definition = COMPANY_DEFINITIONS.find(d => d.id === company.id);
                if (!definition) return null;
                const colors = getCompanyColor(definition.color);
                const contractsToLevel = company.level + 1;
                const nextPerk = definition.perks.find(p => company.level < p.level);
                
                return (
                  <div 
                    key={company.id} 
                    className={`bg-gray-800/80 px-3 py-2 rounded-lg border ${colors.border}/50 flex flex-col gap-1.5`}
                  >
                    {/* Company Header + Progress in one row */}
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                        <FaBuilding className="text-white text-xs" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold truncate text-gray-100">{company.name}</span>
                          <span className={`text-sm ${colors.text} font-bold`}>Lvl {company.level}</span>
                        </div>
                      </div>
                      {/* Progress to next level */}
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 bg-gray-900 h-1.5 rounded-full">
                          <div 
                            className={`${colors.bg} h-full rounded-full transition-all`}
                            style={{ width: `${(company.contractsCompleted / contractsToLevel) * 100}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-400 whitespace-nowrap font-mono">
                          {company.contractsCompleted}/{contractsToLevel}
                        </div>
                      </div>
                    </div>
                    
                    {/* Perks Row */}
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-500 font-semibold uppercase">Perks</div>
                      <div className="flex gap-0.5 flex-1">
                        {definition.perks.map((perk, index) => {
                          const isUnlocked = company.level >= perk.level;
                          const isHovered = hoveredPerk?.companyId === company.id && hoveredPerk?.perkIndex === index;
                          
                          return (
                            <div 
                              key={index}
                              className="relative flex-1"
                              onMouseEnter={() => setHoveredPerk({ companyId: company.id, perkIndex: index })}
                              onMouseLeave={() => setHoveredPerk(null)}
                            >
                              <div 
                                className={`h-2 rounded cursor-pointer transition-all
                                  ${isUnlocked 
                                    ? `${colors.bg}` 
                                    : 'bg-gray-700'
                                  }
                                  ${isHovered ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800 scale-110' : ''}
                                `}
                              />
                              
                              {/* Tooltip */}
                              {isHovered && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl pointer-events-none">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className={`font-bold text-sm ${isUnlocked ? colors.text : 'text-gray-400'}`}>
                                      {perk.name}
                                    </div>
                                    <div className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">Lvl {perk.level}</div>
                                  </div>
                                  <div className="text-xs text-gray-300 leading-relaxed">
                                    {perk.description}
                                  </div>
                                  <div className={`text-xs mt-2 font-semibold ${isUnlocked ? 'text-green-400' : 'text-gray-500'}`}>
                                    {isUnlocked ? '✓ Active' : `Unlocks at level ${perk.level}`}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {/* Next perk preview */}
                      {nextPerk && (
                        <div className="text-[10px] text-gray-500">
                          Next: <span className={`${colors.text}`}>{nextPerk.name}</span>
                        </div>
                      )}
                      {!nextPerk && company.level >= 10 && (
                        <div className="text-[10px] text-green-400">All unlocked</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Contracts */}
          <div className="flex flex-col gap-3 overflow-y-auto pr-2">
            
            {/* Active Contracts Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 pb-1.5 border-b border-cyan-500/30 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
                <FaCheckCircle className="text-cyan-400 text-sm" />
                <h2 className="text-sm font-bold text-cyan-300 font-mono">ACTIVE CONTRACTS</h2>
                <span className="text-[10px] text-gray-500 font-mono ml-auto">{activeContracts.length}/{maxActiveContracts}</span>
              </div>
              {activeContracts.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {activeContracts.map(contract => renderContract(contract, false))}
                </div>
              ) : (
                <div className="border border-dashed border-gray-700 rounded-lg p-2 text-center">
                  <div className="text-gray-500 text-xs">No active contracts</div>
                </div>
              )}
            </div>

            {/* Available Contracts Section */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-yellow-500/30 sticky top-0 bg-gray-900/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <FaHandshake className="text-yellow-400 text-sm" />
                  <h2 className="text-sm font-bold text-yellow-300 font-mono">AVAILABLE OFFERS</h2>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] bg-gray-800/60 px-1.5 py-0.5 rounded">
                  <FaClock className="text-yellow-400" />
                  <span className="text-yellow-400 font-mono font-bold">{formatRefreshTimer(contractRefreshTimer)}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                {availableContracts.length > 0 ? (
                  availableContracts.map(c => renderContract(c, true))
                ) : (
                  <div className="border border-dashed border-gray-700 rounded-lg p-2 text-center">
                    <div className="text-gray-500 text-xs">No contracts available</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
