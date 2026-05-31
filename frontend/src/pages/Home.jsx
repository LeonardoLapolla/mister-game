import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'

export default function Home() {
  const navigate = useNavigate()
  const reset = useGameStore((s) => s.reset)

  const handleStart = () => {
    reset()
    navigate('/wheel')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      <div className="text-center max-w-lg">
        <div className="text-7xl mb-6">⚽</div>
        <h1 className="text-6xl font-black tracking-tight mb-4 text-white">
          MISTER
        </h1>
        <p className="text-gray-400 text-lg mb-2">
          Crea la tua squadra. Scegli il campionato. Diventa leggenda.
        </p>
        <p className="text-gray-600 text-sm mb-10">
          Un gioco di calcio manageriale — veloce, semplice, competitivo.
        </p>

        <button
          onClick={handleStart}
          className="bg-green-500 hover:bg-green-400 text-black font-black text-xl px-10 py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
        >
          INIZIA ORA
        </button>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-white">5</div>
            <div className="text-gray-500 text-sm">Campionati</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">38</div>
            <div className="text-gray-500 text-sm">Partite</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">∞</div>
            <div className="text-gray-500 text-sm">Sfide</div>
          </div>
        </div>
      </div>
    </div>
  )
}