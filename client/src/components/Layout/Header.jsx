const Header = ({ onOpenLibrary, onOpenLobby, roomCode, participantCount, isConnected }) => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-14 bg-[#050505]/80 backdrop-blur-md shadow-[inset_0px_1px_0px_rgba(255,255,255,0.05)] text-white">
      <div className="flex items-center gap-8">
        <div className="text-xl font-black tracking-tighter text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)] font-space-grotesk">
          VIRTUAL_LAB
        </div>
        <nav className="hidden md:flex gap-6">
          <a className="font-space-grotesk uppercase tracking-widest text-xs text-purple-400 border-b-2 border-purple-500 pb-1 cursor-pointer">Simulation</a>
          <a className="font-space-grotesk uppercase tracking-widest text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" onClick={onOpenLibrary}>Library</a>
          <a className="font-space-grotesk uppercase tracking-widest text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer">Environment</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Room Status Badge */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-sm cursor-pointer hover:bg-purple-500/20 transition-colors" onClick={onOpenLobby}>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse"></div>
            <span className="font-space-grotesk text-[10px] text-purple-400 font-bold tracking-widest">{roomCode}</span>
            <span className="text-[9px] text-zinc-500">• {participantCount}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onOpenLobby}
            className={`flex items-center justify-center gap-2 px-4 h-9 rounded-sm transition-all shadow-lg ${
              isConnected
                ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-emerald-500/10'
                : 'text-white bg-purple-600 hover:bg-purple-500 border border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
            }`}
            title="Multiplayer Rooms"
          >
            <span className="material-symbols-outlined text-sm">groups</span>
            <span className="font-space-grotesk text-[10px] uppercase font-bold tracking-widest hidden md:inline">
              {isConnected ? 'Collab Active' : 'Multiplayer'}
            </span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-purple-500/10 hover:text-purple-300 transition-all rounded-sm" title="Settings">
            <span className="material-symbols-outlined text-sm">settings</span>
          </button>
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full border border-purple-500/30 bg-purple-900/50 flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-sm text-purple-300">account_circle</span>
        </div>
      </div>
    </header>
  )
}

export default Header
