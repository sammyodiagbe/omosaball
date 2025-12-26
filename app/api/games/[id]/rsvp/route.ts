import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface GuestRSVPData {
  guest_name: string
  guest_phone: string
  guest_position: 'defender' | 'midfielder' | 'attacker'
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: gameId } = await params
    const body = await request.json()

    // Check if this is a guest RSVP
    if (body.guest_name && body.guest_phone && body.guest_position) {
      return handleGuestRSVP(gameId, body as GuestRSVPData)
    }

    // Otherwise, handle authenticated user RSVP
    const { status } = body

    if (!['confirmed', 'declined', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if RSVP already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rsvpTable = supabase.from('rsvps') as any

    const { data: existingRsvp } = await rsvpTable
      .select('id')
      .eq('game_id', gameId)
      .eq('player_id', user.id)
      .single()

    if (existingRsvp) {
      // Update existing RSVP
      const { error } = await rsvpTable
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', existingRsvp.id)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update RSVP' },
          { status: 500 }
        )
      }
    } else {
      // Create new RSVP
      const { error } = await rsvpTable
        .insert({
          game_id: gameId,
          player_id: user.id,
          status,
        })

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create RSVP' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('RSVP error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

async function handleGuestRSVP(gameId: string, data: GuestRSVPData) {
  const { guest_name, guest_phone, guest_position } = data

  // Validate position
  if (!['defender', 'midfielder', 'attacker'].includes(guest_position)) {
    return NextResponse.json(
      { error: 'Invalid position' },
      { status: 400 }
    )
  }

  // Use service client to bypass RLS for guest inserts
  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rsvpTable = supabase.from('rsvps') as any

  // Check for existing guest RSVP with same phone for this game
  const { data: existingRsvp } = await rsvpTable
    .select('id')
    .eq('game_id', gameId)
    .eq('guest_phone', guest_phone)
    .is('player_id', null)
    .single()

  if (existingRsvp) {
    return NextResponse.json(
      { error: 'This phone number has already RSVPed for this game' },
      { status: 400 }
    )
  }

  // Create guest RSVP with pending status
  const { error } = await rsvpTable
    .insert({
      game_id: gameId,
      player_id: null,
      guest_name,
      guest_phone,
      guest_position,
      status: 'pending',
    })

  if (error) {
    console.error('Guest RSVP error:', error)
    return NextResponse.json(
      { error: 'Failed to create RSVP' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: gameId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('rsvps') as any)
      .delete()
      .eq('game_id', gameId)
      .eq('player_id', user.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete RSVP' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete RSVP error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
