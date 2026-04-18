const Toolbar = ({ selectedTool, onToolSelect, showAnalytics, onUndo, onRedo, onClearAll }) => {
  const tools = [
    { id: 'select', icon: 'square', label: 'Select' },
    { id: 'circle', icon: 'radio_button_unchecked', label: 'Circle' },
    { id: 'rectangle', icon: 'check_box_outline_blank', label: 'Box' },
    { id: 'triangle', icon: 'change_history', label: 'Polygon' },
    { id: 'ground', icon: 'horizontal_rule', label: 'Ground' },
    { id: 'wall', icon: 'vertical_align_center', label: 'Wall' },
    { id: 'constraint', icon: 'link', label: 'Rope' },
    { id: 'spring', icon: 'waves', label: 'Spring' },
    { id: 'pin', icon: 'push_pin', label: 'Pin' },
    { id: 'motor', icon: 'settings', label: 'Motor' },
    { id: 'delete', icon: 'delete', label: 'Delete' },
    { id: 'analyze', icon: 'insights', label: 'Analyze' },
  ]

  return (
    <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] flex flex-col items-center py-4 z-40 bg-[#050505]/90 backdrop-blur-2xl w-20 border-r border-white/5 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Top Logo/Icon */}
        <div className="text-pink-500 font-bold mb-2 flex flex-col items-center">
          <div className="w-8 h-8 bg-pink-500/10 flex items-center justify-center rounded-sm border border-pink-500/20">
            <span className="material-symbols-outlined text-sm">science</span>
          </div>
        </div>

        {/* Tools Section */}
        <div className="flex flex-col gap-2 w-full px-2">
          {tools.map((tool) => {
            const isActive = tool.id === 'analyze' ? showAnalytics : selectedTool === tool.id
            return (
              <button
                key={tool.id}
                onClick={() => onToolSelect(tool.id)}
                className={`w-full flex flex-col items-center py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-purple-500/20 text-purple-400 border-r-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 grayscale hover:grayscale-0'
                }`}
                title={tool.label}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{tool.icon}</span>
                <span className="font-inter text-[9px] font-medium tracking-tight mt-1 uppercase">{tool.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Utilities Section */}
      <div className="flex flex-col gap-2 w-full px-2 mt-auto mb-4 border-t border-white/10 pt-4">
        <button
          onClick={onUndo}
          className="w-full h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group"
          title="Undo Action"
        >
          <span className="material-symbols-outlined text-sm group-active:-rotate-45 transition-transform duration-200">undo</span>
        </button>
        <button
          onClick={onRedo}
          className="w-full h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors group"
          title="Redo Action"
        >
          <span className="material-symbols-outlined text-sm group-active:rotate-45 transition-transform duration-200">redo</span>
        </button>
        <button
          onClick={onClearAll}
          className="w-full h-10 flex flex-col items-center justify-center mt-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-all"
          title="Clear Scene"
        >
          <span className="material-symbols-outlined text-sm mb-1">mop</span>
          <span className="font-inter text-[8px] font-bold tracking-tight uppercase">Clear</span>
        </button>
      </div>
    </aside>
  )
}

export default Toolbar
