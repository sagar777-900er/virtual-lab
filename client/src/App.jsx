import { useState, useEffect, useCallback, useRef } from 'react'
import PhysicsCanvas from './components/Canvas/PhysicsCanvas'
import Toolbar from './components/Canvas/Toolbar'
import PropertiesPanel from './components/Canvas/PropertiesPanel'
import SimulationControls from './components/Canvas/SimulationControls'
import RoomCursors from './components/Multiplayer/RoomCursors'
import Header from './components/Layout/Header'
import ExperimentLibrary from './components/Library/ExperimentLibrary'
import RoomLobby from './components/Multiplayer/RoomLobby'
import AnalyticsOverlay from './components/Analytics/AnalyticsOverlay'
import useMultiplayer from './hooks/useMultiplayer'
import { Toaster, toast } from 'react-hot-toast'

function App() {
  const [selectedTool, setSelectedTool] = useState('select')
  const [selectedBody, setSelectedBody] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [engine, setEngine] = useState(null)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showLobby, setShowLobby] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  const canvasRef = useRef(null)

  const multiplayer = useMultiplayer()

  const handleToolSelect = useCallback((tool) => {
    if (tool === 'analyze') {
      setShowAnalytics(prev => !prev)
      return
    }
    setSelectedTool(tool)
  }, [])

  const handleExport = useCallback(() => {
    const snap = canvasRef.current?.getSnapshot()
    if (!snap) return
    const json = JSON.stringify(snap, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiment-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Workspace exported successfully', {
      style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(168,85,247,0.3)' }
    })
  }, [])

  const handleSaveExperiment = useCallback(async (title = 'New Experiment') => {
    const snap = canvasRef.current?.getSnapshot()
    if (!snap) return
    
    // Create random icon/color for UI coolness
    const colors = ['purple', 'pink', 'emerald', 'blue', 'fuchsia', 'indigo']
    const icons = ['cyclone', 'grain', 'auto_awesome', 'waves', 'blur_on', 'bubble_chart']
    
    try {
      const res = await fetch('http://localhost:3001/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author: 'GUEST_USER',
          stateData: snap,
          thumbnail: `https://images.unsplash.com/photo-1544256718-3bcf237f3974?w=800&auto=format&fit=crop` // generic fallback
        })
      })
      if (!res.ok) throw new Error('Save failed')
      toast.success(`Experiment '${title}' saved to central network`, {
        style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(168,85,247,0.3)' },
        icon: '🔗'
      })
    } catch (err) {
      toast.error(`Database error: ${err.message}`, {
        style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(239,68,68,0.3)' }
      })
    }
  }, [])

  const handleLoadExperiment = useCallback((stateData) => {
    canvasRef.current?.loadSnapshot(stateData)
    setShowLibrary(false)
    toast.success('Experiment parameters loaded into workspace', {
      style: { background: '#0a0a0a', color: '#fff', border: '1px solid rgba(168,85,247,0.3)' },
      icon: '⚡'
    })
  }, [])

  return (
    <div className="bg-background text-on-background h-screen w-screen overflow-hidden font-inter">
      {/* THE KINETIC VOID Background */}
      <div className="kinetic-void-bg"></div>
      
      <Toaster position="bottom-right" />
      
      {/* Overlays */}
      {showLibrary && (
        <ExperimentLibrary 
          onClose={() => setShowLibrary(false)} 
          onExport={handleExport}
          onSave={handleSaveExperiment}
          onLoad={handleLoadExperiment}
        />
      )}
      {showLobby && (
        <RoomLobby
          roomCode={multiplayer.roomCode}
          participants={multiplayer.participants}
          isHost={multiplayer.isHost}
          isConnected={multiplayer.isConnected}
          onCreateRoom={(name) => multiplayer.createRoom(name)}
          onJoinRoom={(code, name) => multiplayer.joinRoom(code, name)}
          onLeaveRoom={() => {
            multiplayer.leaveRoom()
          }}
          onClose={() => setShowLobby(false)}
        />
      )}

      {/* Top Header */}
      <Header
        onOpenLibrary={() => setShowLibrary(true)}
        onOpenLobby={() => setShowLobby(true)}
        roomCode={multiplayer.roomCode}
        participantCount={multiplayer.participants.length}
        isConnected={multiplayer.isConnected}
      />

      {/* Main Layout Content */}
      <div className="flex h-screen w-screen pt-14">
        
        {/* Left Toolbar */}
        <Toolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          showAnalytics={showAnalytics}
          onUndo={() => canvasRef.current?.undo()}
          onRedo={() => canvasRef.current?.redo()}
          onClearAll={() => canvasRef.current?.clearAll()}
        />

        {/* Physics Canvas (center) */}
        <main 
          className="flex-1 relative overflow-hidden ml-20 mr-64 z-10"
          onMouseMove={(e) => {
            if (multiplayer.isConnected && multiplayer.roomCode) {
              const rect = e.currentTarget.getBoundingClientRect()
              multiplayer.sendCursorMove({ x: e.clientX - rect.left, y: e.clientY - rect.top })
            }
          }}
        >
          {multiplayer.isConnected && multiplayer.roomCode && (
            <RoomCursors cursors={multiplayer.cursors} participants={multiplayer.participants} />
          )}
          
          <PhysicsCanvas
            ref={canvasRef}
            selectedTool={selectedTool}
            onBodySelect={setSelectedBody}
            isPlaying={isPlaying}
            onEngineReady={setEngine}
            multiplayer={multiplayer}
          />

          {/* Analytics Overlay */}
          <AnalyticsOverlay engine={engine} isVisible={showAnalytics} />

          {/* Bottom simulation controls */}
          <SimulationControls
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            engine={engine}
          />
        </main>

        {/* Right Properties Panel */}
        <PropertiesPanel
          selectedBody={selectedBody}
          engine={engine}
        />
      </div>
    </div>
  )
}

export default App
