import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import { generateTeams, type Player } from '@/lib/utils/team-generator'
import type { Position } from '@/lib/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameId } = await params
    const supabase = await createServiceClient()

    // Get confirmed RSVPs for this game
    const { data: rsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select(`
        player_id,
        profiles (
          id,
          full_name,
          preferred_position
        )
      `)
      .eq('game_id', gameId)
      .eq('status', 'confirmed')

    if (rsvpError) {
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const players: Player[] = (rsvps as any[])?.map((r) => ({
      id: r.profiles.id,
      full_name: r.profiles.full_name,
      preferred_position: r.profiles.preferred_position as Position,
    })) || []

    // Generate teams
    const assignments = generateTeams(players)

    return NextResponse.json({ success: true, assignments })
  } catch (error) {
    console.error('Auto-generate error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
