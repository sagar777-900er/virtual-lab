import { useState } from 'react'

const RoomLobby = ({
  roomCode,
  participants,
  isHost,
  isConnected,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onClose,
}) => {
  const [joinCode, setJoinCode] = useState('')
  const [userName, setUserName] = useState('Node_' + Math.floor(Math.random() * 9999))

  const handleCreate = () => {
    onCreateRoom(userName)
    onClose()
  }

  const handleJoin = () => {
    if (joinCode.trim().length > 0) {
      onJoinRoom(joinCode.trim(), userName)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex overflow-hidden font-inter text-white animate-in fade-in duration-200">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Side Nav (decorative) */}
      <aside className="hidden md:flex flex-col w-64 bg-black/60 backdrop-blur-2xl border-r border-white/5 py-6 shrink-0 z-10 relative">
        <div className="px-6 mb-8">
          <div className="text-purple-500 font-black tracking-widest text-xl mb-1 font-space-grotesk">COLLAB_CMD</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">Protocol v4.2</div>
        </div>
        <nav className="flex-1 space-y-1">
          <div className="px-4 py-2 text-neutral-500 flex items-center space-x-3 cursor-pointer hover:bg-neutral-900/80 hover:text-yellow-400 transition-colors">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="font-space-grotesk text-xs uppercase tracking-widest font-semibold">Dashboard</span>
          </div>
          <div className="px-4 py-2 text-purple-400 border-r-2 border-purple-500 bg-purple-500/10 flex items-center space-x-3 cursor-pointer">
            <span className="material-symbols-outlined text-lg">meeting_room</span>
            <span className="font-space-grotesk text-xs uppercase tracking-widest font-semibold">Rooms</span>
          </div>
          <div className="px-4 py-2 text-neutral-500 flex items-center space-x-3 cursor-pointer hover:bg-neutral-900/80 hover:text-yellow-400 transition-colors">
            <span className="material-symbols-outlined text-lg">groups</span>
            <span className="font-space-grotesk text-xs uppercase tracking-widest font-semibold">Participants</span>
          </div>
          <div className="px-4 py-2 text-neutral-500 flex items-center space-x-3 cursor-pointer hover:bg-neutral-900/80 hover:text-yellow-400 transition-colors">
            <span className="material-symbols-outlined text-lg">security</span>
            <span className="font-space-grotesk text-xs uppercase tracking-widest font-semibold">Permissions</span>
          </div>
        </nav>
        <div className="mt-auto px-4 py-6 border-t border-white/5">
          <div className="px-4 py-2 text-neutral-500 flex items-center space-x-3 cursor-pointer hover:text-yellow-400 transition-colors">
            <span className="material-symbols-outlined text-lg">power_settings_new</span>
            <span className="font-space-grotesk text-xs uppercase tracking-widest font-semibold">Disconnect</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <header className="flex justify-between items-center px-6 py-3 bg-neutral-950/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(168,85,247,0.08)]">
          <div className="flex items-center space-x-8">
            <span className="text-xl font-bold tracking-tighter text-purple-500 uppercase font-space-grotesk">COLLAB_CMD</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-neutral-400 cursor-pointer hover:text-purple-400 transition-colors">notifications</span>
            <button onClick={onClose} className="material-symbols-outlined text-neutral-400 cursor-pointer hover:text-red-400 transition-colors">close</button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#050505] p-8">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`w-1 h-1 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400 shadow-[0_0_8px_#f87171]'}`}></div>
                  <span className="text-xs uppercase tracking-[0.3em] text-purple-500 font-space-grotesk font-bold">
                    {isConnected ? 'Node Session Active' : 'Not Connected'}
                  </span>
                </div>
                <h1 className="text-5xl font-black font-space-grotesk tracking-tighter text-white">
                  {roomCode ? 'Room Settings' : 'Multiplayer Lobby'}
                </h1>
              </div>
            </div>

            {/* Not in a room — Show Create/Join UI */}
            {!roomCode && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Room Card */}
                <div className="glass-card p-6 rounded-lg relative overflow-hidden bg-[rgba(38,38,38,0.2)] backdrop-blur-[12px] border border-purple-500/5 hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="material-symbols-outlined text-7xl text-purple-500">add_circle</span>
                  </div>
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-space-grotesk font-bold mb-2">Deploy New Room</h3>
                    
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-space-grotesk font-bold block mb-2">Your Display Name</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-black/40 px-4 py-3 border border-white/5 text-white font-space-grotesk tracking-widest text-sm outline-none focus:border-purple-500/50 transition-colors rounded-sm"
                        placeholder="Enter your name..."
                      />
                    </div>

                    <button
                      onClick={handleCreate}
                      className="w-full py-3 bg-gradient-to-br from-purple-600 to-purple-800 text-white font-space-grotesk text-[10px] uppercase tracking-widest font-bold rounded-sm shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      Deploy New Room
                    </button>
                  </div>
                </div>

                {/* Join Room Card */}
                <div className="glass-card p-6 rounded-lg relative overflow-hidden bg-[rgba(38,38,38,0.2)] backdrop-blur-[12px] border border-purple-500/5 hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.08)] transition-all">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="material-symbols-outlined text-7xl text-purple-500">key</span>
                  </div>
                  <div className="relative z-10 space-y-6">
                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-space-grotesk font-bold mb-2">Join Existing Room</h3>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-space-grotesk font-bold block mb-2">Your Display Name</label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className="w-full bg-black/40 px-4 py-3 border border-white/5 text-white font-space-grotesk tracking-widest text-sm outline-none focus:border-purple-500/50 transition-colors rounded-sm"
                        placeholder="Enter your name..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-space-grotesk font-bold block mb-2">Session Key</label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        maxLength={6}
                        className="w-full bg-black/40 px-4 py-3 border border-white/5 text-white font-space-grotesk tracking-[0.3em] text-2xl font-black text-center outline-none focus:border-purple-500/50 transition-colors rounded-sm"
                        placeholder="XXXXXX"
                      />
                    </div>

                    <button
                      onClick={handleJoin}
                      disabled={joinCode.trim().length === 0}
                      className="w-full py-3 bg-white/5 border border-white/10 text-neutral-300 font-space-grotesk text-[10px] uppercase tracking-widest font-bold rounded-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-sm">login</span>
                      Connect to Room
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* In a room — Show Room Details */}
            {roomCode && (
              <>
                {/* Session Key Card */}
                <div className="glass-card p-6 rounded-lg relative overflow-hidden bg-[rgba(38,38,38,0.2)] backdrop-blur-[12px] border border-purple-500/5">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <span className="material-symbols-outlined text-7xl text-purple-500">key</span>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-[10px] uppercase tracking-widest text-neutral-500 font-space-grotesk font-bold mb-4">Unique Session Key</h3>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-4 bg-black/40 px-6 py-4 rounded border border-white/5 w-full sm:w-auto">
                        <span className="text-3xl font-black font-space-grotesk tracking-widest text-purple-400">{roomCode}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(roomCode)}
                          className="p-2 text-neutral-400 hover:text-white transition-colors"
                          title="Copy to clipboard"
                        >
                          <span className="material-symbols-outlined">content_copy</span>
                        </button>
                      </div>
                      <div className="text-sm text-neutral-500 max-w-sm">
                        Share this session key with others to authorize them into your workspace.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="glass-card p-6 rounded-lg bg-[rgba(38,38,38,0.2)] backdrop-blur-[12px] border border-purple-500/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-space-grotesk text-lg font-bold tracking-tight text-white flex items-center">
                      <span className="material-symbols-outlined text-purple-500 mr-2">groups</span>
                      Participants
                    </h3>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded font-bold uppercase tracking-widest">
                      {participants.length} Nodes Online
                    </span>
                  </div>
                  <div className="space-y-3">
                    {participants.map((p, i) => (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-4 rounded-sm transition-colors ${
                          i === 0 ? 'bg-neutral-900/50 border-l-2 border-yellow-400' : 'bg-neutral-900/30 hover:bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-sm border border-white/5 bg-purple-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-purple-400 text-lg">person</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-space-grotesk text-sm font-bold text-white tracking-tight">{p.username || 'Unknown'}</span>
                              {i === 0 && (
                                <span className="text-[8px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded font-black uppercase">Host</span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-widest">ID: {p.id?.slice(0, 8)}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
                          <span className="text-[10px] text-neutral-400 font-bold uppercase">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave Workspace */}
                <div className="flex flex-col items-center pt-4">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-purple-500/30 to-transparent mb-8"></div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
                    <button
                      onClick={onClose}
                      className="px-12 py-4 bg-purple-600 text-white font-space-grotesk text-sm uppercase tracking-[0.2em] font-black rounded-sm hover:bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95 flex items-center"
                    >
                      <span className="material-symbols-outlined mr-3">arrow_back</span>
                      Return to Workspace
                    </button>
                    
                    <button
                      onClick={() => {
                        onLeaveRoom()
                        onClose()
                      }}
                      className="px-12 py-4 bg-neutral-900 border border-red-500/20 text-red-500 font-space-grotesk text-sm uppercase tracking-[0.2em] font-black rounded-sm hover:bg-red-500/10 hover:border-red-500/40 transition-all active:scale-95 flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined mr-3">logout</span>
                      Disconnect from Node
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-6 uppercase tracking-widest font-bold">Node Disconnection Protocol</p>
                </div>
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  )
}

export default RoomLobby
