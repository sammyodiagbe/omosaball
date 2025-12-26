'use client'

import { useDroppable } from '@dnd-kit/core'
import { PlayerCard } from './PlayerCard'
import { Badge } from '@/components/ui'
import type { Position, TeamColor } from '@/lib/types/database'

interface Player {
  id: string
  full_name: string
  preferred_position: Position
}

interface TeamAssignment {
  team_color: TeamColor
  position_slot: Position
  player_id: string
}

interface TeamColumnProps {
  color: TeamColor
  assignments: TeamAssignment[]
  players: Player[]
}

const POSITIONS: { position: Position; label: string; slots: number }[] = [
  { position: 'defender', label: 'Defenders', slots: 4 },
  { position: 'midfielder', label: 'Midfielders', slots: 3 },
  { position: 'attacker', label: 'Attackers', slots: 3 },
]

const colorStyles: Record<TeamColor, { header: string; bg: string }> = {
  red: { header: 'bg-red-500', bg: 'bg-red-50' },
  white: { header: 'bg-gray-100 text-gray-900', bg: 'bg-gray-50' },
  blue: { header: 'bg-blue-500', bg: 'bg-blue-50' },
  black: { header: 'bg-gray-900', bg: 'bg-gray-100' },
}

export function TeamColumn({ color, assignments, players }: TeamColumnProps) {
  const styles = colorStyles[color]
  const totalPlayers = assignments.length

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden ${styles.bg}`}>
      <div className={`px-4 py-3 ${styles.header} ${color !== 'white' ? 'text-white' : ''}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold uppercase">{color} Team</h3>
          <span className="text-sm opacity-80">{totalPlayers}/10</span>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {POSITIONS.map(({ position, label, slots }) => (
          <PositionDropZone
            key={position}
            teamColor={color}
            position={position}
            label={label}
            slots={slots}
            assignments={assignments.filter((a) => a.position_slot === position)}
            players={players}
          />
        ))}
      </div>
    </div>
  )
}

interface PositionDropZoneProps {
  teamColor: TeamColor
  position: Position
  label: string
  slots: number
  assignments: TeamAssignment[]
  players: Player[]
}

function PositionDropZone({
  teamColor,
  position,
  label,
  slots,
  assignments,
  players,
}: PositionDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${teamColor}-${position}`,
  })

  const assignedPlayers = assignments
    .map((a) => players.find((p) => p.id === a.player_id))
    .filter(Boolean) as Player[]

  const isFull = assignedPlayers.length >= slots

  return (
    <div
      ref={setNodeRef}
      className={`
        p-2 rounded-lg border-2 border-dashed transition-colors min-h-[80px]
        ${isOver && !isFull ? 'border-green-400 bg-green-100/50' : 'border-gray-200'}
        ${isFull ? 'bg-gray-100/50' : ''}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600 uppercase">{label}</span>
        <Badge variant={assignedPlayers.length >= slots ? 'success' : 'default'}>
          {assignedPlayers.length}/{slots}
        </Badge>
      </div>

      <div className="space-y-1">
        {assignedPlayers.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
        {assignedPlayers.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">Drop players here</p>
        )}
      </div>
    </div>
  )
}
