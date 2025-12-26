import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServiceClient()

    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        rsvps (
          id,
          status,
          player_id,
          profiles (
            id,
            full_name,
            preferred_position
          )
        )
      `)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    return NextResponse.json(games)
  } catch (error) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { date, time, location, maxPlayers, notes } = body

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: game, error } = await (supabase as any)
      .from('games')
      .insert({
        date,
        time: time || '22:45',
        location: location || 'Default Field',
        max_players: maxPlayers || 40,
        notes: notes || null,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating game:', error)
      return NextResponse.json({ error: 'Failed to create game' }, { status: 500 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
