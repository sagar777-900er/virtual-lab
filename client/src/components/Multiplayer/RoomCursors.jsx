import React from 'react'

export default function RoomCursors({ cursors, participants }) {
  if (!cursors || !participants) return null

  return (
    <>
      {Object.entries(cursors).map(([socketId, pos]) => {
        const user = participants.find(p => p.id === socketId)
        if (!user || !pos) return null
        return (
          <div 
            key={socketId}
            className="absolute pointer-events-none z-[100] flex flex-col items-start gap-1 transition-all duration-75 ease-linear"
            style={{ 
              transform: `translate(${pos.x}px, ${pos.y}px)`, 
              left: 0, 
              top: 0 
            }}
          >
            <span className="material-symbols-outlined text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] -ml-[8px] -mt-[8px]" style={{ textShadow: '0 0 2px #000' }}>
              navigation
            </span>
            <span className="bg-purple-600/90 backdrop-blur border border-purple-400/50 text-white text-[9px] uppercase font-black tracking-[0.2em] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(168,85,247,0.5)] whitespace-nowrap">
              {user.username}
            </span>
          </div>
        )
      })}
    </>
  )
}
