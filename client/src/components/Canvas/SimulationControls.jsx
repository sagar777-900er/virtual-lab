import { useState } from 'react'
import Matter from 'matter-js'

const SimulationControls = ({ isPlaying, onTogglePlay, engine }) => {
  const [gravity, setGravity] = useState(1)
  const [timeScale, setTimeScale] = useState(1)

  const handleGravityChange = (value) => {
    setGravity(value)
    if (engine) engine.gravity.y = value
  }

  const handleTimeScaleChange = (value) => {
    setTimeScale(value)
    if (engine) engine.timing.timeScale = value
  }

  const handleStep = () => {
    if (engine && !isPlaying) {
      Matter.Engine.update(engine, 1000 / 60)
    }
  }

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[rgba(14,14,14,0.6)] backdrop-blur-[12px] border border-white/10 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(168,85,247,0.1)] p-2 flex gap-4 items-center rounded-sm z-[1000]">
      
      {/* Playback Controls */}
      <div className="flex gap-1 px-4 border-r border-white/10">
        <button 
          onClick={onTogglePlay}
          className={`px-3 py-1.5 rounded-sm flex items-center gap-1 transition-all ${
            isPlaying 
              ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]' 
              : 'text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
          }`}
        >
          <span className="material-symbols-outlined text-lg">{isPlaying ? 'pause' : 'play_arrow'}</span>
          <span className="font-space-grotesk text-[10px] font-bold tracking-widest">{isPlaying ? 'PAUSE' : 'RUN'}</span>
        </button>
        
        <button 
          onClick={handleStep}
          disabled={isPlaying}
          className="p-1.5 hover:bg-white/10 rounded-sm text-zinc-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          title="Step Forward"
        >
          <span className="material-symbols-outlined text-lg">skip_next</span>
        </button>
      </div>

      {/* Gravity Control */}
      <div className="px-4 border-r border-white/10 flex items-center gap-3">
        <span className="text-[10px] text-zinc-500 font-space-grotesk font-bold tracking-widest">GRAVITY</span>
        <input type="range" min="-3" max="3" step="0.1"
          value={gravity}
          onChange={(e) => handleGravityChange(parseFloat(e.target.value))}
          className="w-24 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
        />
        <span className="text-[10px] text-purple-400 font-mono w-6 text-right">{gravity.toFixed(1)}</span>
      </div>

      {/* Speed Control */}
      <div className="px-4 flex items-center gap-2">
        <span className="text-[10px] text-zinc-500 font-space-grotesk font-bold tracking-widest">SPEED</span>
        <div className="flex bg-zinc-900/50 rounded-sm overflow-hidden p-0.5 border border-white/5">
          {[0.5, 1, 2].map(speed => (
            <button 
              key={speed}
              onClick={() => handleTimeScaleChange(speed)}
              className={`px-2 py-0.5 text-[9px] font-mono rounded-sm transition-all ${
                timeScale === speed ? 'bg-purple-500 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SimulationControls
