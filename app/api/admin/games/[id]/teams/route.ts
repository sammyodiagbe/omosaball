import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import type { TeamColor, Position } from '@/lib/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface TeamAssignment {
  team_color: TeamColor
  position_slot: Position
  player_id: string
}

const TEAM_COLORS: TeamColor[] = ['red', 'white', 'blue', 'black']

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameId } = await params
    const { assignments } = (await request.json()) as { assignments: TeamAssignment[] }

    const supabase = await createServiceClient()

    // Delete existing teams and assignments for this game
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('teams').delete().eq('game_id', gameId)

    // Create teams
    const teamInserts = TEAM_COLORS.map((color) => ({
      game_id: gameId,
      color,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: teams, error: teamError } = await (supabase as any)
      .from('teams')
      .insert(teamInserts)
      .select('id, color')

    if (teamError || !teams) {
      return NextResponse.json({ error: 'Failed to create teams' }, { status: 500 })
    }

    // Create team map
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamMap = Object.fromEntries((teams as any[]).map((t) => [t.color, t.id]))

    // Insert team assignments
    const assignmentInserts = assignments.map((a) => ({
      team_id: teamMap[a.team_color],
      player_id: a.player_id,
      position_slot: a.position_slot,
    }))

    if (assignmentInserts.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: assignmentError } = await (supabase as any)
        .from('team_assignments')
        .insert(assignmentInserts)

      if (assignmentError) {
        return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save teams error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
