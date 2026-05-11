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
          <a className={`font-space-grotesk uppercase tracking-widest text-xs transition-colors cursor-pointer flex items-center gap-1 ${isConnected ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-zinc-300'}`} onClick={onOpenLobby}>
            {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1"></span>}
            {isConnected ? 'Collab Active' : 'Multiplayer'}
          </a>
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
