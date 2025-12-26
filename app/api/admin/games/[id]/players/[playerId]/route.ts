import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'

interface RouteParams {
  params: Promise<{ id: string; playerId: string }>
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameId, playerId } = await params
    const body = await request.json()
    const { status, has_paid, rsvp_id } = body

    const supabase = await createServiceClient()

    // Build update object
    const updateData: {
      updated_at: string
      status?: string
      has_paid?: boolean
      paid_at?: string | null
    } = { updated_at: new Date().toISOString() }

    if (status !== undefined) updateData.status = status
    if (has_paid !== undefined) {
      updateData.has_paid = has_paid
      updateData.paid_at = has_paid ? new Date().toISOString() : null
    }

    // If rsvp_id provided, use that (for guests)
    // Otherwise use player_id (for registered users)
    let error = null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rsvpTable = supabase.from('rsvps') as any

    if (rsvp_id) {
      const result = await rsvpTable
        .update(updateData)
        .eq('id', rsvp_id)
      error = result.error
    } else {
      const result = await rsvpTable
        .update(updateData)
        .eq('game_id', gameId)
        .eq('player_id', playerId)
      error = result.error
    }

    if (error) {
      console.error('Update player error:', error)
      return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update player error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: gameId, playerId } = await params
    const supabase = await createServiceClient()

    // Check if playerId is a UUID (rsvp_id for guests) or player_id
    // Try to delete by rsvp id first, then by player_id
    let error = null

    // First try as rsvp_id (for guests)
    const { error: rsvpError, count } = await supabase
      .from('rsvps')
      .delete({ count: 'exact' })
      .eq('id', playerId)

    if (count === 0 || rsvpError) {
      // Try as player_id
      const { error: playerError } = await supabase
        .from('rsvps')
        .delete()
        .eq('game_id', gameId)
        .eq('player_id', playerId)
      error = playerError
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove player error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
