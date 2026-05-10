import { useState, useEffect, useRef } from 'react'
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

  return <canvas ref={canvasRef} className="rounded-sm w-full" />
}

const PropertiesPanel = ({ selectedBody, engine, onUpdateBody }) => {
  const [liveData, setLiveData] = useState({
    velocityX: 0,
    velocityY: 0,
    speed: 0,
    angularVel: 0,
    angle: 0,
    x: 0,
    y: 0,
    mass: 0,
    momentum: 0,
    ke: 0,
    pe: 0
  })
  
  const [speedHistory, setSpeedHistory] = useState([])
  const [energyHistory, setEnergyHistory] = useState([])

  const [activeTab, setActiveTab] = useState('physics')
  const [localProps, setLocalProps] = useState({})

  useEffect(() => {
    if (!engine) return

    const updateData = () => {
      if (selectedBody) {
        const speed = selectedBody.speed
        const mass = selectedBody.mass
        const ke = 0.5 * mass * speed * speed
        // Basic PE calculation assuming canvas height is around 1000 for relative ground
        const h = Math.max(0, 1000 - selectedBody.position.y)
        const pe = mass * engine.world.gravity.y * 9.8 * h * 0.001

        setLiveData({
          velocityX: selectedBody.velocity.x,
          velocityY: selectedBody.velocity.y,
          speed,
          angularVel: selectedBody.angularVelocity,
          angle: selectedBody.angle,
          x: selectedBody.position.x,
          y: selectedBody.position.y,
          mass,
          momentum: mass * speed,
          ke,
          pe
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

  useEffect(() => {
    setSpeedHistory([])
    setEnergyHistory([])
    if (selectedBody) {
      setLocalProps({
        mass: selectedBody.mass,
        density: selectedBody.density,
        friction: selectedBody.friction,
        frictionAir: selectedBody.frictionAir,
        restitution: selectedBody.restitution,
        isStatic: selectedBody.isStatic,
        color: selectedBody.render.fillStyle,
        opacity: selectedBody.render.opacity ?? 1,
        hasGlow: selectedBody.customParams?.hasGlow || false,
        radius: selectedBody.customParams?.radius || 10,
        width: selectedBody.customParams?.width || 10,
        height: selectedBody.customParams?.height || 10,
        sides: selectedBody.customParams?.sides || 3,
      })
    }
  }, [selectedBody])

  const handlePropChange = (property, value, isNumeric = true) => {
    if (selectedBody && onUpdateBody) {
      let finalValue = value;
      if (isNumeric) {
        finalValue = parseFloat(value);
        if (isNaN(finalValue)) return;
      }
      setLocalProps(prev => ({ ...prev, [property]: finalValue }));
      onUpdateBody(selectedBody.id, { [property]: finalValue });
    }
  }

  if (!selectedBody) {
    return (
      <aside className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col z-40 bg-[#050505]/60 backdrop-blur-xl w-72 border-l border-white/5 shadow-2xl bg-zinc-900/60 p-6">
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
          <span className="material-symbols-outlined text-4xl text-zinc-500">category</span>
          <p className="text-xs font-space-grotesk tracking-widest text-zinc-400">NO OBJECT SELECTED</p>
          <div className="data-pulse-pink opacity-20"></div>
        </div>
      </aside>
    )
  }

  const cp = selectedBody.customParams || {};

  return (
    <aside className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col z-40 bg-[#050505]/60 backdrop-blur-xl w-72 border-l border-white/5 shadow-2xl bg-zinc-900/60 overflow-y-auto no-scrollbar font-space-grotesk">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-yellow-400 font-black text-xs tracking-widest">PROPERTIES</h3>
            <p className="text-[10px] text-zinc-500 font-mono">ID: 0x{(selectedBody.id).toString(16).toUpperCase()}</p>
          </div>
          <div className="data-pulse-pink"></div>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/40 p-1 rounded-sm border border-white/5 mb-4">
          {['physics', 'geometry', 'visual'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-[9px] font-bold tracking-widest uppercase py-1.5 rounded-sm transition-colors ${
                activeTab === tab ? 'bg-purple-500/20 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          
          {/* PHYSICS TAB */}
          {activeTab === 'physics' && (
            <div className="glass-panel p-4 rounded-sm border-l-2 border-l-purple-500 space-y-4 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(168,85,247,0.05)]">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-purple-500">science</span>
                <span className="text-[10px] uppercase text-zinc-400 tracking-wider font-bold">Physics Core</span>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-[10px] text-zinc-400">Is Static (Fixed)</span>
                  <input type="checkbox" checked={localProps.isStatic || false} onChange={(e) => handlePropChange('isStatic', e.target.checked, false)} className="accent-purple-500" />
                </label>
                
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Mass</span>
                    <span className="text-purple-400 font-bold">{(localProps.mass || 1).toFixed(1)} kg</span>
                  </div>
                  <input type="range" min="0.1" max="100" step="0.1" value={localProps.mass || 1} onChange={(e) => handlePropChange('mass', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full" />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Density</span>
                    <span className="text-purple-400 font-bold">{(localProps.density || 0.001).toFixed(3)}</span>
                  </div>
                  <input type="range" min="0.001" max="0.1" step="0.001" value={localProps.density || 0.001} onChange={(e) => handlePropChange('density', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full" />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Friction (Surface)</span>
                    <span className="text-purple-400 font-bold">{(localProps.friction || 0).toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={localProps.friction || 0} onChange={(e) => handlePropChange('friction', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full" />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Air Friction (Drag)</span>
                    <span className="text-purple-400 font-bold">{(localProps.frictionAir || 0).toFixed(3)}</span>
                  </div>
                  <input type="range" min="0" max="0.1" step="0.001" value={localProps.frictionAir || 0} onChange={(e) => handlePropChange('frictionAir', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full" />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Restitution (Bounce)</span>
                    <span className="text-purple-400 font-bold">{(localProps.restitution || 0).toFixed(2)}</span>
                  </div>
                  <input type="range" min="0" max="1.5" step="0.01" value={localProps.restitution || 0} onChange={(e) => handlePropChange('restitution', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full" />
                </div>
              </div>
            </div>
          )}

          {/* GEOMETRY TAB */}
          {activeTab === 'geometry' && cp.shape && (
            <div className="glass-panel p-4 rounded-sm border-l-2 border-l-emerald-500 space-y-4 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(16,185,129,0.05)]">
               <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-emerald-500">architecture</span>
                <span className="text-[10px] uppercase text-zinc-400 tracking-wider font-bold">Shape Geometry</span>
              </div>
              
              <div className="space-y-3">
                {cp.shape === 'circle' && (
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Radius</span>
                      <span className="text-emerald-400 font-bold">{(localProps.radius || 10).toFixed(0)}</span>
                    </div>
                    <input type="range" min="10" max="200" step="1" value={localProps.radius || 10} onChange={(e) => handlePropChange('radius', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full" />
                  </div>
                )}
                {cp.shape === 'rectangle' && (
                  <>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Width</span>
                        <span className="text-emerald-400 font-bold">{(localProps.width || 10).toFixed(0)}</span>
                      </div>
                      <input type="range" min="10" max="500" step="1" value={localProps.width || 10} onChange={(e) => handlePropChange('width', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Height</span>
                        <span className="text-emerald-400 font-bold">{(localProps.height || 10).toFixed(0)}</span>
                      </div>
                      <input type="range" min="10" max="500" step="1" value={localProps.height || 10} onChange={(e) => handlePropChange('height', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full" />
                    </div>
                  </>
                )}
                {cp.shape === 'polygon' && (
                  <>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Radius</span>
                        <span className="text-emerald-400 font-bold">{(localProps.radius || 10).toFixed(0)}</span>
                      </div>
                      <input type="range" min="10" max="200" step="1" value={localProps.radius || 10} onChange={(e) => handlePropChange('radius', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Sides</span>
                        <span className="text-emerald-400 font-bold">{localProps.sides || 3}</span>
                      </div>
                      <input type="range" min="3" max="12" step="1" value={localProps.sides || 3} onChange={(e) => handlePropChange('sides', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full" />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* VISUAL TAB */}
          {activeTab === 'visual' && (
            <div className="glass-panel p-4 rounded-sm border-l-2 border-l-pink-500 space-y-4 shadow-[inset_0px_1px_2px_rgba(255,255,255,0.05),_0_0_20px_rgba(236,72,153,0.05)]">
               <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-sm text-pink-500">palette</span>
                <span className="text-[10px] uppercase text-zinc-400 tracking-wider font-bold">Visual Styles</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Color Fill</span>
                  </div>
                  <input type="color" value={localProps.color || '#ffffff'} onChange={(e) => handlePropChange('color', e.target.value, false)} className="w-full h-8 bg-transparent cursor-pointer rounded-sm" />
                </div>
                
                <div>
                  <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Opacity</span>
                    <span className="text-pink-400 font-bold">{(localProps.opacity ?? 1).toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.1" max="1" step="0.05" value={localProps.opacity ?? 1} onChange={(e) => handlePropChange('opacity', e.target.value)} className="w-full h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full" />
                </div>

                <label className="flex items-center justify-between cursor-pointer pt-2">
                  <span className="text-[10px] text-zinc-400">Enable Neon Glow</span>
                  <input type="checkbox" checked={localProps.hasGlow || false} onChange={(e) => handlePropChange('hasGlow', e.target.checked, false)} className="accent-pink-500" />
                </label>
              </div>
            </div>
          )}

          {/* ANALYTICS (Always visible at bottom) */}
          <div className="border-t border-white/10 pt-4 mt-6">
            <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-3 flex items-center gap-1">
               <span className="material-symbols-outlined text-[10px]">query_stats</span> LIVE TELEMETRY
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-zinc-400">Velocity (X/Y)</span>
                <span className="text-xs text-white font-mono">{liveData.velocityX.toFixed(1)} / {liveData.velocityY.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-zinc-400">Speed (Mag)</span>
                <span className="text-xs text-white font-mono">{liveData.speed.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-zinc-400">Momentum (p)</span>
                <span className="text-xs text-white font-mono">{liveData.momentum.toFixed(1)} kg⋅m/s</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-cyan-400">Kinetic Energy</span>
                <span className="text-xs text-cyan-400 font-mono font-bold">{liveData.ke.toFixed(1)} J</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/5 pb-1.5">
                <span className="text-[10px] text-emerald-400">Potential Energy</span>
                <span className="text-xs text-emerald-400 font-mono font-bold">{liveData.pe.toFixed(1)} J</span>
              </div>
            </div>

            <div className="mt-4 opacity-50">
               <Sparkline data={energyHistory.length > 1 ? energyHistory : [0, 0]} color="#06b6d4" width={240} height={30} />
            </div>
          </div>

        </div>
      </div>
    </aside>
  )
}

export default PropertiesPanel
