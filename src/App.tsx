import { useEffect } from 'react'
import { useGameStore } from "./useGameStore"
import { FaRocket, FaBuilding, FaMoneyBillAlt } from 'react-icons/fa'
import { UIButton } from "./UIButton"

export function App() {
  const { money, rockets, rocketCost, spaceports, spaceportCapacity, buildRocket, buySpaceport, tick, spaceportCost } = useGameStore()

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <div className="text-center flex flex-col gap-4">
      <p className="flex justify-center items-center text-2xl">
        <FaMoneyBillAlt className="mr-2"/> {money}
      </p>
      <p className="flex justify-center items-center text-2xl">
        <FaRocket className="mr-2"/> {rockets}/{spaceports * spaceportCapacity}
      </p>
      <div className="flex justify-center gap-2">
        <UIButton onClick={buildRocket} disabled={money < rocketCost}>
          <FaRocket className="mr-2"/> (${rocketCost})
        </UIButton>
        <UIButton onClick={buySpaceport} disabled={money < spaceportCost}>
          <FaBuilding className="mr-2"/> ($100)
        </UIButton>
      </div>
    </div>
  )
}
