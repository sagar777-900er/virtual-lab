import { useState, useEffect, useRef } from 'react'

const TEMPLATE_PENDULUM = {
  bodies: [
    { id: 1, x: 400, y: 100, isStatic: true, label: "Platform", customParams: null },
    { id: 2, x: 600, y: 100, isStatic: false, angle: 0, customParams: { shape: 'circle', radius: 30, color: '#ec4899', restitution: 0.8, friction: 0.1, mass: 5, density: 0.05, frictionAir: 0 } }
  ],
  constraints: [
    { bodyA_id: 1, bodyB_id: 2, pointA: { x: 0, y: 0 }, length: 200, stiffness: 1, render: { strokeStyle: 'rgba(99, 102, 241, 0.6)', lineWidth: 2 } }
  ]
};

const TEMPLATE_SPRING = {
  bodies: [
    { id: 1, x: 400, y: 100, isStatic: true, label: "Platform", customParams: null },
    { id: 2, x: 400, y: 400, isStatic: false, angle: 0, customParams: { shape: 'rectangle', width: 60, height: 60, color: '#06b6d4', restitution: 0.2, friction: 0.5, mass: 10 } }
  ],
  constraints: [
    { bodyA_id: 1, bodyB_id: 2, length: 200, stiffness: 0.02, damping: 0.05, render: { type: 'spring', strokeStyle: 'rgba(6, 182, 212, 0.6)', lineWidth: 2 } }
  ]
};

const TEMPLATE_PROJECTILE = {
  bodies: [
    { id: 1, x: 400, y: 550, isStatic: true, label: "Platform", customParams: null },
    { id: 2, x: 50, y: 500, isStatic: false, angle: 0, velocity: { x: 15, y: -15 }, customParams: { shape: 'circle', radius: 20, color: '#f59e0b', restitution: 0.5, friction: 0.1, density: 0.01 } }
  ]
};

const TEMPLATE_COLLISION = {
  bodies: [
    { id: 1, x: 400, y: 550, isStatic: true, label: "Platform", customParams: null },
    { id: 2, x: 100, y: 500, isStatic: false, angle: 0, velocity: { x: 10, y: 0 }, customParams: { shape: 'rectangle', width: 50, height: 50, color: '#10b981', restitution: 0.9, friction: 0 } },
    { id: 3, x: 700, y: 500, isStatic: false, angle: 0, velocity: { x: -10, y: 0 }, customParams: { shape: 'circle', radius: 25, color: '#8b5cf6', restitution: 0.9, friction: 0 } }
  ]
};

const DUMMY_EXPERIMENTS = [
  {
    id: 1,
    title: 'Double-Pendulum Chaos',
    author: 'CORE_ARCHITECT',
    status: 'Live',
    tags: ['Dynamics', 'Complexity_V4'],
    icon: 'cyclone',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1470&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    color: 'purple',
    stateData: TEMPLATE_PENDULUM
  },
  {
    id: 2,
    title: 'Spring Oscillator',
    author: 'NEURAL_LINK',
    status: 'Live',
    tags: ['Oscillations', 'Harmonic'],
    icon: 'waves',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1364&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    color: 'cyan',
    stateData: TEMPLATE_SPRING
  },
  {
    id: 3,
    title: 'Projectile Motion',
    author: 'COSMO_SYS',
    status: 'Live',
    tags: ['Kinematics', 'Gravity'],
    icon: 'flight_takeoff',
    image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1511&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
    color: 'amber',
    stateData: TEMPLATE_PROJECTILE
  },
  {
    id: 4,
    title: 'Elastic Collisions',
    author: 'FLOW_MASTER',
    status: 'Live',
    tags: ['Momentum', 'Conservation'],
    icon: 'compare_arrows',
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1470&auto=format&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
    color: 'emerald',
    stateData: TEMPLATE_COLLISION
  }
]

const ExperimentLibrary = ({ onClose, onExport, onSave, onLoad }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [experiments, setExperiments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:3001/api/experiments')
      .then(res => res.json())
      .then(data => {
        const dbExps = data.experiments.map(e => ({
          id: e._id, title: e.title, author: e.author, status: 'Live',
          tags: ['DATABASE'], icon: 'cloud', image: e.thumbnail,
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
          color: 'blue', stateData: e.stateData, isDB: true
        }))
        setExperiments([...DUMMY_EXPERIMENTS, ...dbExps])
      })
      .catch(err => {
        console.warn('DB Fetch failed:', err)
        setExperiments(DUMMY_EXPERIMENTS)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        onLoad(data)
      } catch (err) {
        console.error('Failed to parse:', err)
      }
    }
    reader.readAsText(file)
  }

  const filtered = experiments.filter(ex => ex.title.toLowerCase().includes(searchTerm.toLowerCase()) || ex.author.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="fixed inset-0 z-[10000] bg-[#050505]/95 backdrop-blur-2xl overflow-y-auto text-white selection:bg-purple-500/30 font-space-grotesk animate-in fade-in duration-300">
      
      {/* TopNavBar matching Header.jsx */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 h-14 bg-[#050505]/80 backdrop-blur-md shadow-[inset_0px_1px_0px_rgba(255,255,255,0.05)] text-white">
        <div className="flex items-center gap-8">
          <div className="text-xl font-black tracking-tighter text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] font-space-grotesk uppercase">
            VIRTUAL_LAB
          </div>
          <div className="hidden md:flex gap-6">
            <a className="font-space-grotesk uppercase tracking-widest text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" onClick={onClose}>Simulation</a>
            <a className="font-space-grotesk uppercase tracking-widest text-xs text-purple-400 border-b-2 border-purple-500 pb-1 cursor-pointer">Library</a>
            <a className="font-space-grotesk uppercase tracking-widest text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Environment</a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onClose} className="w-8 h-8 rounded-sm bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 flex items-center justify-center transition-colors border border-purple-500/30">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </nav>

      {/* Header Section */}
      <header className="pt-16 pb-12 px-8 md:px-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></div>
              <span className="uppercase tracking-[0.2em] text-[10px] text-emerald-400 font-bold">DATABASE UPLINK ACTIVE</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase">
              Experiment <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">Library</span>
            </h1>
            <p className="max-w-xl text-zinc-400 text-sm font-medium tracking-widest leading-relaxed uppercase">
              Access the global repository of physics simulations. Load pre-configured environments or explore advanced theoretical mechanics.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            <button onClick={() => fileInputRef.current?.click()} className="bg-black/40 border border-white/10 px-6 py-3 rounded-sm flex items-center gap-2 hover:bg-white/5 transition-all text-xs font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-sm text-zinc-400">upload</span>
              <span>Import</span>
            </button>
            <button onClick={onExport} className="bg-black/40 border border-white/10 px-6 py-3 rounded-sm flex items-center gap-2 hover:bg-white/5 transition-all text-xs font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-sm text-zinc-400">download</span>
              <span>Export</span>
            </button>
            <button onClick={() => { onSave('My Custom Workspace'); setTimeout(() => onClose(), 500); }} className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-sm font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">save</span>
              SAVE TO DB
            </button>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <section className="px-8 md:px-12 mb-12 max-w-[1600px] mx-auto">
        <div className="bg-purple-900/10 border border-purple-500/10 p-2 rounded-sm flex flex-col md:flex-row gap-4 items-center backdrop-blur-md">
          <div className="relative w-full md:flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 text-lg">search</span>
            <input 
              className="w-full bg-transparent border-none pl-12 pr-4 py-3 text-xs font-bold tracking-[0.2em] uppercase focus:ring-0 text-white placeholder:text-zinc-600 outline-none" 
              placeholder="SEARCH BY ID, TAG, OR AUTHOR..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select className="bg-black/50 border border-white/5 rounded-sm px-6 py-3 text-xs font-bold tracking-widest uppercase text-purple-300 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 cursor-pointer w-full md:w-48 outline-none appearance-none transition-colors">
              <option>ALL CATEGORIES</option>
              <option>MECHANICS</option>
              <option>DYNAMICS</option>
              <option>FLUIDIC</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Content: Grid */}
      <section className="px-8 md:px-12 pb-24 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="w-full flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 tracking-tight">
          {filtered.map((exp) => (
            <div key={exp.id} className="group relative bg-[#0a0a0a] rounded-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_15px_30px_-10px_rgba(168,85,247,0.2)] border border-white/5 hover:border-purple-500/50 flex flex-col">
              
              <div className="aspect-video relative overflow-hidden bg-black shrink-0">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-purple-900/30 z-10"></div>
                <img 
                  className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                  src={exp.image} 
                  alt={exp.title}
                />
                
                {/* Simulated Icon center */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className={`w-16 h-16 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-900/40 group-hover:border-purple-500/50 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.8)]`}>
                    <span className={`material-symbols-outlined text-2xl text-${exp.color}-400 drop-shadow-[0_0_8px_currentColor]`}>{exp.icon}</span>
                  </div>
                </div>

                {/* Hover overlay actions */}
                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-4 p-6 z-20" onClick={() => exp.stateData && onLoad(exp.stateData)}>
                  <button onClick={(e) => { e.stopPropagation(); exp.stateData && onLoad(exp.stateData); }} className="w-full py-3 bg-purple-600 text-white text-xs font-black tracking-widest uppercase rounded-sm shadow-[0_0_15px_rgba(168,85,247,0.5)] hover:bg-purple-500 active:scale-95 transition-all cursor-pointer">LOAD STATE</button>
                  <button onClick={(e) => { e.stopPropagation(); exp.isDB && onExport(exp.stateData); }} className="w-full py-3 bg-white/5 border border-white/10 text-white text-xs font-bold tracking-widest uppercase rounded-sm hover:bg-white/10 hover:border-purple-500/30 active:scale-95 transition-all cursor-pointer">EXPORT AS JSON</button>
                </div>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col cursor-pointer" onClick={() => exp.stateData && onLoad(exp.stateData)}>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-purple-400 transition-colors line-clamp-2 uppercase">{exp.title}</h3>
                  {exp.status === 'Live' && (
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-sm uppercase font-black tracking-widest shrink-0 ml-2 shadow-[0_0_5px_rgba(52,211,153,0.2)]">Live</span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-900/50 border border-purple-500/30 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                    <img className="w-full h-full object-cover rounded-full" src={exp.avatar} alt={exp.author}/>
                  </div>
                  <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-bold truncate">Author: <span className="text-purple-300">{exp.author}</span></span>
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2 mt-auto">
                  {exp.tags.map(tag => (
                    <span key={tag} className="text-[8px] font-black text-pink-400 bg-pink-500/10 px-2 py-1 rounded-sm border border-pink-500/20 uppercase tracking-[0.2em]">{tag}</span>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </div>
        )}
      </section>
      
    </div>
  )
}

export default ExperimentLibrary
