import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { TeamBuilder } from '@/components/teams'
import { format } from 'date-fns'
import type { Position, TeamColor } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TeamBuilderPage({ params }: PageProps) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    redirect('/admin')
  }

  const { id: gameId } = await params
  const supabase = await createServiceClient()

  // Get game details
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single()

  if (gameError || !game) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameData = game as any

  // Get confirmed players for this game (both registered and guests)
  const { data: rsvps } = await supabase
    .from('rsvps')
    .select(`
      id,
      player_id,
      guest_name,
      guest_position,
      profiles (
        id,
        full_name,
        preferred_position
      )
    `)
    .eq('game_id', gameId)
    .eq('status', 'confirmed')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const players = (rsvps as any[])?.map((r) => {
    // Registered player with profile
    if (r.profiles) {
      return {
        id: r.profiles.id,
        full_name: r.profiles.full_name,
        preferred_position: r.profiles.preferred_position as Position,
        isGuest: false,
      }
    }
    // Guest player (use rsvp id as identifier)
    return {
      id: `guest_${r.id}`,
      full_name: r.guest_name || 'Guest',
      preferred_position: (r.guest_position as Position) || 'midfielder',
      isGuest: true,
    }
  }) || []

  // Get existing team assignments
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      color,
      team_assignments (
        player_id,
        rsvp_id,
        position_slot
      )
    `)
    .eq('game_id', gameId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialAssignments = (teams as any[])?.flatMap((team) =>
    team.team_assignments.map((ta: { position_slot: string; player_id: string | null; rsvp_id: string | null }) => ({
      team_color: team.color as TeamColor,
      position_slot: ta.position_slot as Position,
      // Use player_id for registered players, guest_${rsvp_id} for guests
      player_id: ta.player_id || `guest_${ta.rsvp_id}`,
    }))
  ) || []

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="border-b"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              OmosaBall
            </Link>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}
            >
              Team Builder
            </span>
          </div>
          <Link
            href={`/admin/games/${gameId}`}
            className="inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200"
            style={{ color: 'var(--foreground-muted)' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Game
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1
            className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Build Teams — {format(new Date(gameData.date + 'T00:00:00'), 'EEEE, MMMM d')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {players.length} confirmed players • Drag and drop to assign teams
          </p>
        </div>

        {players.length === 0 ? (
          <div
            className="rounded-2xl py-16 text-center"
            style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
          >
            <p className="text-lg" style={{ color: 'var(--foreground-muted)' }}>
              No confirmed players for this game yet
            </p>
            <Link
              href={`/admin/games/${gameId}`}
              className="mt-2 inline-block text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Go back and confirm some players
            </Link>
          </div>
        ) : (
          <TeamBuilder
            gameId={gameId}
            players={players}
            initialAssignments={initialAssignments}
          />
        )}
      </main>
    </div>
  )
}
