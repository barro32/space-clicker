import { useEffect } from 'react';
import { useGameStore, Contract } from "./useGameStore.js"
import { FaBuilding, FaBoxOpen, FaFlask, FaMoneyBillAlt, FaClock, FaBomb, FaCheckCircle, FaTimesCircle, FaBan } from "react-icons/fa"

export function ContractsView() {
  const { 
    companies, 
    availableContracts, 
    activeContract, 
    generateContracts, 
    acceptContract, 
    forfeitContract,
  } = useGameStore()

  useEffect(() => {
    generateContracts();
  }, [generateContracts]);

  const renderProgressBar = (delivered: number, required: number, color: string) => {
    const progress = required === 0 ? 100 : Math.min(100, (delivered / required) * 100);
    return (
      <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
    );
  };

  // Determine contract type based on dominant requirement
  const getContractType = (contract: Contract) => {
    const total = contract.requiredMoney + contract.requiredScience + contract.requiredCargo;
    if (total === 0) return { type: 'Balanced', color: 'bg-purple-600', icon: <FaBuilding /> };
    const moneyRatio = contract.requiredMoney / total;
    const scienceRatio = contract.requiredScience / total;
    const cargoRatio = contract.requiredCargo / total;
    
    if (cargoRatio > 0.5) return { type: 'Logistics', color: 'bg-yellow-600', icon: <FaBoxOpen /> };
    if (scienceRatio > 0.5) return { type: 'Research', color: 'bg-blue-600', icon: <FaFlask /> };
    if (moneyRatio > 0.5) return { type: 'Commercial', color: 'bg-green-600', icon: <FaMoneyBillAlt /> };
    return { type: 'Balanced', color: 'bg-purple-600', icon: <FaBuilding /> };
  };

  const renderContract = (contract: Contract, isAvailable: boolean) => {
    const isActive = contract.status === 'active';
    const contractType = getContractType(contract);
    
    return (
      <div key={contract.id} className={`border-2 p-4 rounded-lg flex flex-col gap-3 transition-colors ${contract.status === 'failed' ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{contract.title}</h3>
            <p className="text-xs text-gray-400">{contract.description}</p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className={`${contractType.color} text-[10px] px-2 py-1 rounded uppercase font-bold flex items-center gap-1`}>
              {contractType.icon} {contractType.type}
            </span>
            {contract.status === 'active' && <span className="bg-cyan-600 text-[10px] px-2 py-1 rounded uppercase font-bold">Active</span>}
            {contract.status === 'failed' && <span className="bg-red-600 text-[10px] px-2 py-1 rounded uppercase font-bold">Failed</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {/* Money requirement */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaMoneyBillAlt className="text-green-400" />
                <span>{isActive ? `${Math.floor(contract.deliveredMoney)}/${contract.requiredMoney}` : contract.requiredMoney} Money</span>
              </div>
            </div>
            {isActive && renderProgressBar(contract.deliveredMoney, contract.requiredMoney, 'bg-green-500')}
          </div>
          
          {/* Science requirement */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaFlask className="text-blue-400" />
                <span>{isActive ? `${Math.floor(contract.deliveredScience)}/${contract.requiredScience}` : contract.requiredScience} Science</span>
              </div>
            </div>
            {isActive && renderProgressBar(contract.deliveredScience, contract.requiredScience, 'bg-blue-500')}
          </div>
          
          {/* Cargo requirement */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaBoxOpen className="text-yellow-400" />
                <span>{isActive ? `${Math.floor(contract.deliveredCargo)}/${contract.requiredCargo}` : contract.requiredCargo} Cargo</span>
              </div>
            </div>
            {isActive && renderProgressBar(contract.deliveredCargo, contract.requiredCargo, 'bg-yellow-500')}
          </div>

          <div className="flex gap-4 text-xs text-gray-400 mt-1">
            {contract.timeLimitSeconds > 0 && (
              <div className={`flex items-center gap-1 ${contract.status === 'active' && contract.elapsedSeconds > contract.timeLimitSeconds * 0.8 ? 'text-red-400' : ''}`}>
                <FaClock /> {contract.status === 'active' ? `${contract.timeLimitSeconds - contract.elapsedSeconds}s left` : `${contract.timeLimitSeconds}s limit`}
              </div>
            )}
            {contract.maxExplosions !== -1 && (
              <div className={`flex items-center gap-1 ${contract.status === 'active' && contract.currentExplosions >= contract.maxExplosions ? 'text-red-400' : ''}`}>
                <FaBomb /> {contract.status === 'active' ? `${contract.currentExplosions}/${contract.maxExplosions} explosions` : `Max ${contract.maxExplosions} explosions`}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-2 flex justify-between items-center text-xs">
          <div className="flex gap-3">
            <span className="text-green-400">+${contract.rewardMoney}</span>
            <span className="text-blue-400">+{contract.rewardScience} Sci</span>
            <span className="text-yellow-400">+{contract.rewardExperience} XP</span>
          </div>
          
          {isAvailable && (
            <button 
              onClick={() => acceptContract(contract.id)}
              disabled={activeContract !== null}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded font-bold"
            >
              Accept
            </button>
          )}

          {contract.status === 'active' && (
            <button 
              onClick={forfeitContract}
              className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded font-bold flex items-center gap-1"
            >
              <FaBan /> Forfeit (-{Math.floor(contract.rewardExperience * 0.5)} XP)
            </button>
          )}

          {contract.status === 'failed' && (
             <button 
             onClick={() => useGameStore.setState({ activeContract: null })}
             className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded font-bold"
           >
             Dismiss
           </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 p-8 w-full max-w-4xl overflow-y-auto max-h-[80vh]">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {companies.map(company => (
          <div key={company.id} className="bg-gray-800 p-2 rounded border border-gray-700 flex flex-col items-center gap-1 text-center">
            <FaBuilding className="text-gray-500" />
            <div className="text-[10px] font-bold truncate w-full">{company.name}</div>
            <div className="text-[10px] text-blue-400">Lvl {company.level}</div>
            <div className="w-full bg-gray-900 h-1 rounded-full mt-1">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all" 
                style={{ width: `${(company.experience / (company.level * 100)) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
            <FaCheckCircle /> Active Contract
          </h2>
          {activeContract ? renderContract(activeContract, false) : (
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-500 italic">
              No active contract. Accept one from the available list.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-yellow-400">
            <FaTimesCircle className="rotate-45" /> Available Offers
          </h2>
          <div className="flex flex-col gap-4">
            {availableContracts.map(c => renderContract(c, true))}
          </div>
        </div>
      </div>
    </div>
  );
}
