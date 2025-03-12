import { game } from "./game";

export function App() {

  return (
    <div>
      <p>Money: {game.money}</p>
      <p>Spaceport: {game.rockets}/{game.maxRockets}</p>
      <button onClick={game.buildRocket}>
        Build Rocket (${game.rocketCost})
      </button>
      <button onClick={game.buySpaceport}>
        Buy Spaceport ($100)
      </button>
    </div>
  );
}
