import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { GamePlayersRealtime } from '@/components/admin/GamePlayersRealtime'
import { GameActions } from '@/components/admin/GameActions'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminGameDetailPage({ params }: PageProps) {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    redirect('/admin')
  }

  const { id } = await params
  const supabase = await createServiceClient()

  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      rsvps (
        id,
        status,
        player_id,
        guest_name,
        guest_phone,
        guest_position,
        has_paid,
        paid_at,
        profiles (
          id,
          full_name,
          preferred_position,
          email
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !game) {
    notFound()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameData = game as any

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="border-b"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/games"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Games
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/admin/games"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200"
          style={{ color: 'var(--accent)' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Games
        </Link>

        {/* Game Info Card */}
        <div
          className="mb-8 rounded-2xl p-6"
          style={{ background: 'var(--foreground)', color: 'var(--background)' }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {format(new Date(gameData.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                </h1>
                {gameData.status === 'cancelled' && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#FCA5A5' }}
                  >
                    Cancelled
                  </span>
                )}
                {gameData.status === 'completed' && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#6EE7B7' }}
                  >
                    Completed
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                {gameData.time} at {gameData.location}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <GameActions
                gameId={gameData.id}
                initialData={{
                  date: gameData.date,
                  time: gameData.time,
                  location: gameData.location,
                  max_players: gameData.max_players,
                  notes: gameData.notes,
                  status: gameData.status,
                }}
              />
              <Link
                href={`/admin/games/${gameData.id}/teams`}
                className="rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Build Teams
              </Link>
            </div>
          </div>
        </div>

        {/* Real-time Players Component */}
        <GamePlayersRealtime
          gameId={gameData.id}
          initialRSVPs={gameData.rsvps || []}
          maxPlayers={gameData.max_players}
        />
      </main>
    </div>
  )
}
