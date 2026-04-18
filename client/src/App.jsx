import { useState, useEffect, useCallback, useRef } from 'react'
import PhysicsCanvas from './components/Canvas/PhysicsCanvas'
import Toolbar from './components/Canvas/Toolbar'
import PropertiesPanel from './components/Canvas/PropertiesPanel'
import SimulationControls from './components/Canvas/SimulationControls'
import Header from './components/Layout/Header'
import ExperimentLibrary from './components/Library/ExperimentLibrary'
import RoomLobby from './components/Multiplayer/RoomLobby'
import AnalyticsOverlay from './components/Analytics/AnalyticsOverlay'
import useMultiplayer from './hooks/useMultiplayer'

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

  return (
    <div className="bg-background text-on-background h-screen w-screen overflow-hidden font-inter">
      {/* THE KINETIC VOID Background */}
      <div className="kinetic-void-bg"></div>
      
      {/* Overlays */}
      {showLibrary && (
        <ExperimentLibrary onClose={() => setShowLibrary(false)} />
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
        <main className="flex-1 relative overflow-hidden ml-20 mr-64 z-10">
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
