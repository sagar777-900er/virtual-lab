import { useState, useEffect, useRef, useCallback } from 'react'
import Matter from 'matter-js'

// Mini sparkline component using canvas
const Sparkline = ({ data, color = '#a855f7', width = 180, height = 40 }) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const max = Math.max(...data, 1)
    const step = width / (data.length - 1)

    // Fill gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + '40')
    gradient.addColorStop(1, 'transparent')

    ctx.beginPath()
    ctx.moveTo(0, height)
    data.forEach((val, i) => {
      ctx.lineTo(i * step, height - (val / max) * (height - 4))
    })
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Line
    ctx.beginPath()
    data.forEach((val, i) => {
      const px = i * step
      const py = height - (val / max) * (height - 4)
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Current value dot
    const lastX = (data.length - 1) * step
    const lastY = height - (data[data.length - 1] / max) * (height - 4)
    ctx.beginPath()
    ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.stroke()
  }, [data, color, width, height])

  return <canvas ref={canvasRef} className="rounded-sm" />
}

const PropertiesPanel = ({ selectedBody, engine }) => {
  const [liveData, setLiveData] = useState({
    velocityX: 0,
    velocityY: 0,
    speed: 0,
    angularVel: 0,
    angle: 0,
    x: 0,
    y: 0,
  })
  const [speedHistory, setSpeedHistory] = useState([])
  const [energyHistory, setEnergyHistory] = useState([])

  useEffect(() => {
    if (!engine) return

    const updateData = () => {
      if (selectedBody) {
        const speed = selectedBody.speed
        const ke = 0.5 * selectedBody.mass * speed * speed

        setLiveData({
          velocityX: selectedBody.velocity.x,
          velocityY: selectedBody.velocity.y,
          speed,
          angularVel: selectedBody.angularVelocity,
          angle: selectedBody.angle,
          x: selectedBody.position.x,
          y: selectedBody.position.y,
        })

        setSpeedHistory(prev => {
          const next = [...prev, speed]
          return next.length > 60 ? next.slice(-60) : next
        })

        setEnergyHistory(prev => {
          const next = [...prev, ke]
          return next.length > 60 ? next.slice(-60) : next
        })
      }
    }

    Matter.Events.on(engine, 'afterUpdate', updateData)

    return () => {
      Matter.Events.off(engine, 'afterUpdate', updateData)
    }
  }, [engine, selectedBody])

  // Reset history when body changes
  useEffect(() => {
    setSpeedHistory([])
    setEnergyHistory([])
  }, [selectedBody])

  const handlePropertyChange = (property, value) => {
    if (selectedBody) {
      Matter.Body.set(selectedBody, property, parseFloat(value))
    }
  }

  if (!selectedBody) {
    return (
      <aside className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col z-40 bg-[#050505]/60 backdrop-blur-xl w-64 border-l border-white/5 shadow-2xl bg-zinc-900/60 p-6">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
          <span className="material-symbols-outlined text-4xl text-zinc-500">category</span>
          <p className="text-xs font-space-grotesk tracking-widest text-zinc-400">NO OBJECT SELECTED</p>
          <div className="data-pulse-pink opacity-20"></div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col z-40 bg-[#050505]/60 backdrop-blur-xl w-64 border-l border-white/5 shadow-2xl bg-zinc-900/60 overflow-y-auto no-scrollbar">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-yellow-400 font-black font-space-grotesk text-xs tracking-widest">OBJECT_DATA</h3>
            <p className="text-[10px] text-zinc-500 font-space-grotesk">ID: 0x{(selectedBody.id).toString(16).toUpperCase()}</p>
          </div>
          <div className="data-pulse-pink"></div>
        </div>

        <div className="space-y-6">
          
          {/* Velocity Sparkline */}
          <div className="glass-panel p-4 rounded-sm border-l-2 border-l-pink-500 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(168,85,247,0.05)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm text-pink-500">monitoring</span>
              <span className="font-space-grotesk text-[10px] uppercase text-zinc-400 tracking-wider">Velocity Graph</span>
            </div>
            <Sparkline data={speedHistory.length > 1 ? speedHistory : [0, 0]} color="#ec4899" width={180} height={40} />
          </div>

          {/* Energy Sparkline */}
          <div className="glass-panel p-4 rounded-sm border-l-2 border-l-cyan-500 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(168,85,247,0.05)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-sm text-cyan-500">bolt</span>
              <span className="font-space-grotesk text-[10px] uppercase text-zinc-400 tracking-wider">Kinetic Energy</span>
            </div>
            <Sparkline data={energyHistory.length > 1 ? energyHistory : [0, 0]} color="#06b6d4" width={180} height={40} />
          </div>

          {/* Properties Panel */}
          <div className="glass-panel p-4 rounded-sm border-l-2 border-l-purple-500 space-y-4 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(168,85,247,0.05)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-purple-500">tune</span>
              <span className="font-space-grotesk text-[10px] uppercase text-zinc-400 tracking-wider">Physics Material</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] font-space-grotesk text-zinc-400 mb-1">
                  <span>Mass</span>
                  <span className="text-purple-400 font-bold">{selectedBody.mass.toFixed(1)} kg</span>
                </div>
                <input type="range" min="0.1" max="100" step="0.1"
                  value={selectedBody.mass}
                  onChange={(e) => handlePropertyChange('mass', e.target.value)}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-space-grotesk text-zinc-400 mb-1">
                  <span>Friction</span>
                  <span className="text-purple-400 font-bold">{selectedBody.friction.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01"
                  value={selectedBody.friction}
                  onChange={(e) => handlePropertyChange('friction', e.target.value)}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-space-grotesk text-zinc-400 mb-1">
                  <span>Bounciness</span>
                  <span className="text-purple-400 font-bold">{selectedBody.restitution.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1.5" step="0.01"
                  value={selectedBody.restitution}
                  onChange={(e) => handlePropertyChange('restitution', e.target.value)}
                  className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>
          </div>

          {/* STATS LIST (Live Telemetry) */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-[10px] font-space-grotesk text-zinc-500 uppercase">Velocity</span>
              <span className="text-sm font-space-grotesk text-white font-bold">{liveData.speed.toFixed(2)} m/s</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-[10px] font-space-grotesk text-zinc-500 uppercase">Angular Vel</span>
              <span className="text-sm font-space-grotesk text-white font-bold">{liveData.angularVel.toFixed(3)} r/s</span>
            </div>
            <div className="flex justify-between items-end border-b border-white/5 pb-2">
              <span className="text-[10px] font-space-grotesk text-zinc-500 uppercase">Kinetic Eng.</span>
              <span className="text-sm font-space-grotesk text-pink-500 font-bold">
                {(0.5 * selectedBody.mass * liveData.speed * liveData.speed).toFixed(1)} J
              </span>
            </div>
          </div>

          {/* TRANSFORM CONTROLS */}
          <div className="glass-panel p-3 rounded-sm space-y-2 bg-[rgba(14,14,14,0.6)] backdrop-blur-[12px] border border-white/10 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(168,85,247,0.05)]">
            <div className="flex justify-between items-center text-[10px] font-space-grotesk text-yellow-400 font-bold">
              <span>COORDINATES</span>
              <span className="material-symbols-outlined text-xs">open_in_full</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-zinc-900/80 p-2 text-center text-[10px] font-mono text-zinc-400 rounded-sm">X: {liveData.x.toFixed(0)}</div>
              <div className="bg-zinc-900/80 p-2 text-center text-[10px] font-mono text-zinc-400 rounded-sm">Y: {liveData.y.toFixed(0)}</div>
            </div>
          </div>

        </div>
      </div>

      <div className="mt-auto p-4 border-t border-white/5 mt-6 mb-4">
        <button className="w-full h-10 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center gap-2 rounded-sm text-[10px] font-space-grotesk font-black tracking-[0.2em] hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all uppercase text-white">
          <span className="material-symbols-outlined text-sm">delete_forever</span>
          Delete Object
        </button>
      </div>
    </aside>
  )
}

export default PropertiesPanel
