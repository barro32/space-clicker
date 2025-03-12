import { useEffect } from 'react';
import { useGameStore } from "./useGameStore";

export function App() {
  const { money, rockets, rocketCost, spaceports, spaceportCapacity, buildRocket, buySpaceport, tick } = useGameStore();

  useEffect(() => {
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <div>
      <p>Money: {money}</p>
      <p>Rockets: {rockets}/{spaceports * spaceportCapacity}</p>
      <button onClick={buildRocket}>Rocket (${rocketCost})</button>
      <button onClick={buySpaceport}>Spaceport ($100)</button>
    </div>
  );
}
