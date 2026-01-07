import { useEffect } from 'react';
import { useGameStore, Contract, Company } from "./useGameStore.js"
import { FaBuilding, FaBoxOpen, FaFlask, FaMoneyBillAlt, FaClock, FaBomb, FaCheckCircle, FaTimesCircle } from "react-icons/fa"

export function ContractsView() {
  const { 
    companies, 
    availableContracts, 
    activeContract, 
    generateContracts, 
    acceptContract, 
    deliverContractResources,
    cargo,
    science
  } = useGameStore()

  useEffect(() => {
    generateContracts();
  }, [generateContracts]);

  const renderContract = (contract: Contract, isAvailable: boolean) => {
    const canAfford = cargo >= contract.requiredCargo && science >= contract.requiredScience;
    
    return (
      <div key={contract.id} className={`border-2 p-4 rounded-lg flex flex-col gap-3 transition-colors ${contract.status === 'failed' ? 'border-red-500 bg-red-900/20' : 'border-gray-700 bg-gray-800'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg">{contract.title}</h3>
            <p className="text-xs text-gray-400">{contract.description}</p>
          </div>
          {contract.status === 'active' && <span className="bg-blue-600 text-[10px] px-2 py-1 rounded uppercase font-bold">Active</span>}
          {contract.status === 'failed' && <span className="bg-red-600 text-[10px] px-2 py-1 rounded uppercase font-bold">Failed</span>}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <FaBoxOpen className="text-blue-400" /> {contract.requiredCargo} Cargo
          </div>
          <div className="flex items-center gap-2">
            <FaFlask className="text-blue-400" /> {contract.requiredScience} Science
          </div>
          {contract.timeLimitSeconds > 0 && (
            <div className={`flex items-center gap-2 ${contract.status === 'active' && contract.elapsedSeconds > contract.timeLimitSeconds * 0.8 ? 'text-red-400' : ''}`}>
              <FaClock /> {contract.status === 'active' ? `${contract.timeLimitSeconds - contract.elapsedSeconds}s left` : `${contract.timeLimitSeconds}s limit`}
            </div>
          )}
          {contract.maxExplosions !== -1 && (
            <div className={`flex items-center gap-2 ${contract.status === 'active' && contract.currentExplosions >= contract.maxExplosions ? 'text-red-400' : ''}`}>
              <FaBomb /> {contract.status === 'active' ? `${contract.currentExplosions}/${contract.maxExplosions} explosions` : `Max ${contract.maxExplosions} explosions`}
            </div>
          )}
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
              onClick={deliverContractResources}
              disabled={!canAfford}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded font-bold"
            >
              Deliver & Complete
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
