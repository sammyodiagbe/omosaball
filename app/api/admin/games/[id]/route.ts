import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServiceClient()

    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { date, time, location, max_players, notes, status } = body

    const supabase = await createServiceClient()

    // Build update object with only provided fields
    const updates: Record<string, string | number | null> = { updated_at: new Date().toISOString() }
    if (date !== undefined) updates.date = date
    if (time !== undefined) updates.time = time
    if (location !== undefined) updates.location = location
    if (max_players !== undefined) updates.max_players = max_players
    if (notes !== undefined) updates.notes = notes
    if (status !== undefined) updates.status = status

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: game, error } = await (supabase as any)
      .from('games')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating game:', error)
      return NextResponse.json({ error: 'Failed to update game' }, { status: 500 })
    }

    return NextResponse.json(game)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createServiceClient()

    // Delete the game (cascades to rsvps, teams, team_assignments due to FK constraints)
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting game:', error)
      return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
