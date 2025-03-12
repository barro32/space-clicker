import { useEffect } from 'react'
import { useGameStore } from "./useGameStore"
import { FaMoneyBillAlt, FaFlask } from 'react-icons/fa'
import { RocketBackground } from "./RocketBackground"

export function App() {
  const { money, science, tick } = useGameStore()

  useEffect(() => {
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [tick])

  return (
    <div className="relative min-h-screen flex flex-col gap-4 items-center justify-center bg-gray-900 text-white overflow-hidden">
      <RocketBackground />
      <div className="z-10">
        <p className="flex justify-center items-center text-2xl">
          <FaMoneyBillAlt className="mr-2"/> {money}
        </p>
        <p className="flex justify-center items-center text-2xl">
          <FaFlask className="mr-2"/> {science}
        </p>
      </div>
    </div>
  )
}
