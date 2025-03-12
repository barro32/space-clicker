import { useEffect } from 'react';
import { useGameStore } from "./useGameStore";
import { FaRocket, FaBuilding, FaMoneyBillAlt } from 'react-icons/fa';

export function App() {
  const { money, rockets, rocketCost, spaceports, spaceportCapacity, buildRocket, buySpaceport, tick } = useGameStore();

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div className="text-center">
      <p className="flex justify-center items-center text-2xl mb-4">
        <FaMoneyBillAlt className="mr-2"/> {money}
      </p>
      <p className="flex justify-center items-center text-2xl mb-4">
        <FaRocket className="mr-2"/> {rockets}/{spaceports * spaceportCapacity}
      </p>
      <div>
        <button
          className="bg-green-500 text-white py-2 px-4 rounded mr-2 text-lg hover:bg-green-600 transition-colors"
          onClick={buildRocket}
        >
          <FaRocket className="mr-2"/> (${rocketCost})
        </button>
        <button
          className="bg-green-500 text-white py-2 px-4 rounded text-lg hover:bg-green-600 transition-colors"
          onClick={buySpaceport}
        >
          <FaBuilding className="mr-2"/> ($100)
        </button>
      </div>
    </div>
  );
}
