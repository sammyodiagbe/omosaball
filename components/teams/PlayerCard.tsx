'use client'

import { useDraggable } from '@dnd-kit/core'
import { PositionBadge } from '@/components/ui'
import type { Position } from '@/lib/types/database'

interface Player {
  id: string
  full_name: string
  preferred_position: Position
  isGuest?: boolean
}

interface PlayerCardProps {
  player: Player
  isDragging?: boolean
}

export function PlayerCard({ player, isDragging }: PlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center justify-between gap-2 px-3 py-2
        bg-white border border-gray-200 rounded-lg shadow-sm
        cursor-grab active:cursor-grabbing
        transition-shadow hover:shadow-md
        ${isDragging ? 'shadow-lg opacity-90 scale-105' : ''}
      `}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate">
          {player.full_name}
        </span>
        {player.isGuest && (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
            Guest
          </span>
        )}
      </div>
      <PositionBadge position={player.preferred_position} />
    </div>
  )
}

export function StaticPlayerCard({ player }: { player: Player }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate">
          {player.full_name}
        </span>
        {player.isGuest && (
          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
            Guest
          </span>
        )}
      </div>
      <PositionBadge position={player.preferred_position} />
    </div>
  )
}
