import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui'
import { GameDetailRealtime } from '@/components/games/GameDetailRealtime'
import { format } from 'date-fns'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GameDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get game with RSVPs and player details
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
          preferred_position
        )
      ),
      teams (
        id,
        color,
        team_assignments (
          id,
          player_id,
          rsvp_id,
          position_slot,
          profiles (
            id,
            full_name,
            preferred_position
          ),
          rsvps (
            id,
            guest_name,
            guest_position
          )
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
  const userRsvp = user ? gameData.rsvps?.find((r: { player_id: string }) => r.player_id === user.id) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-green-600">
            OmosaBall
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/games" className="text-gray-600 hover:text-gray-900">
              All Games
            </Link>
            {user ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/games" className="text-green-600 hover:text-green-700 mb-4 inline-block">
          &larr; Back to Games
        </Link>

        <Card className="mb-6">
          <CardContent className="py-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {format(new Date(gameData.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              {gameData.time} at {gameData.location}
            </p>
            {gameData.notes && <p className="text-gray-500">{gameData.notes}</p>}
          </CardContent>
        </Card>

        <GameDetailRealtime
          gameId={gameData.id}
          initialRSVPs={gameData.rsvps || []}
          teams={gameData.teams || []}
          maxPlayers={gameData.max_players}
          userId={user?.id || null}
          userRsvpStatus={userRsvp?.status || null}
        />
      </main>
    </div>
  )
}
