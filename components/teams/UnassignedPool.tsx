'use client'

import { useDroppable } from '@dnd-kit/core'
import { PlayerCard } from './PlayerCard'
import type { Position } from '@/lib/types/database'

interface Player {
  id: string
  full_name: string
  preferred_position: Position
}

interface UnassignedPoolProps {
  players: Player[]
}

export function UnassignedPool({ players }: UnassignedPoolProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unassigned-pool',
  })

  return (
    <div
      ref={setNodeRef}
      className={`
        p-4 border-2 border-dashed rounded-xl transition-colors
        ${isOver ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Unassigned Players
        </h3>
        <span className="text-sm text-gray-500">{players.length} players</span>
      </div>

      {players.length === 0 ? (
        <p className="text-gray-400 text-center py-4">All players assigned to teams</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  )
}
