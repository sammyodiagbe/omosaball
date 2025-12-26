'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { TeamColumn } from './TeamColumn'
import { UnassignedPool } from './UnassignedPool'
import { PlayerCard } from './PlayerCard'
import { Button } from '@/components/ui'
import type { Position, TeamColor } from '@/lib/types/database'

export interface Player {
  id: string
  full_name: string
  preferred_position: Position
  isGuest?: boolean
}

export interface TeamAssignment {
  team_color: TeamColor
  position_slot: Position
  player_id: string
}

interface TeamBuilderProps {
  gameId: string
  players: Player[]
  initialAssignments: TeamAssignment[]
}

const TEAM_COLORS: TeamColor[] = ['red', 'white', 'blue', 'black']

export function TeamBuilder({ gameId, players, initialAssignments }: TeamBuilderProps) {
  const router = useRouter()
  const [assignments, setAssignments] = useState<TeamAssignment[]>(initialAssignments)
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get unassigned players
  const assignedPlayerIds = new Set(assignments.map((a) => a.player_id))
  const unassignedPlayers = players.filter((p) => !assignedPlayerIds.has(p.id))

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const player = players.find((p) => p.id === event.active.id)
      setActivePlayer(player || null)
    },
    [players]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActivePlayer(null)

      if (!over) return

      const playerId = active.id as string
      const dropZoneId = over.id as string

      // Handle dropping back to unassigned pool
      if (dropZoneId === 'unassigned-pool') {
        setAssignments((prev) => prev.filter((a) => a.player_id !== playerId))
        return
      }

      // Parse drop zone: "red-defender" -> team, position
      const [teamColor, position] = dropZoneId.split('-') as [TeamColor, Position]

      if (!TEAM_COLORS.includes(teamColor)) return

      // Remove player from any existing assignment
      const newAssignments = assignments.filter((a) => a.player_id !== playerId)

      // Add new assignment
      newAssignments.push({
        team_color: teamColor,
        position_slot: position,
        player_id: playerId,
      })

      setAssignments(newAssignments)
    },
    [assignments]
  )

  const handleAutoGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/admin/games/${gameId}/teams/auto`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Auto-generate error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/games/${gameId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearAll = () => {
    setAssignments([])
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={handleAutoGenerate} isLoading={isGenerating}>
              Auto-Generate Teams
            </Button>
            <Button variant="secondary" onClick={handleClearAll}>
              Clear All
            </Button>
          </div>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Teams
          </Button>
        </div>

        {/* Unassigned players pool */}
        <UnassignedPool players={unassignedPlayers} />

        {/* Team columns */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TEAM_COLORS.map((color) => (
            <TeamColumn
              key={color}
              color={color}
              assignments={assignments.filter((a) => a.team_color === color)}
              players={players}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activePlayer && <PlayerCard player={activePlayer} isDragging />}
      </DragOverlay>
    </DndContext>
  )
}
