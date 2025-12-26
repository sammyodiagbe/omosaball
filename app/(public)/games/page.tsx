import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, Badge } from '@/components/ui'
import { format } from 'date-fns'

export default async function GamesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get upcoming games with RSVP counts
  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      rsvps (
        id,
        status,
        player_id
      )
    `)
    .eq('status', 'scheduled')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gamesWithCounts = (games as any[])?.map(game => {
    const confirmed = game.rsvps?.filter((r: { status: string }) => r.status === 'confirmed').length || 0
    const pending = game.rsvps?.filter((r: { status: string }) => r.status === 'pending').length || 0
    const userRsvp = user ? game.rsvps?.find((r: { player_id: string }) => r.player_id === user.id) : null
    return {
      ...game,
      confirmedCount: confirmed,
      pendingCount: pending,
      userRsvpStatus: userRsvp?.status || null,
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-green-600">
            OmosaBall
          </Link>
          <nav className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Upcoming Games</h1>

        {gamesWithCounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 text-lg">No upcoming games scheduled</p>
              <p className="text-gray-400 mt-2">Check back later for new games!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {gamesWithCounts.map((game) => (
              <Card key={game.id} className="hover:shadow-md transition">
                <CardContent className="py-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {format(new Date(game.date), 'EEEE, MMMM d')}
                        </h2>
                        {game.userRsvpStatus === 'confirmed' && (
                          <Badge variant="success">You&apos;re In</Badge>
                        )}
                        {game.userRsvpStatus === 'pending' && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </div>
                      <p className="text-gray-600">
                        {game.time} at {game.location}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-medium">
                          {game.confirmedCount} confirmed
                        </span>
                        {game.pendingCount > 0 && (
                          <span className="text-yellow-600">
                            {game.pendingCount} pending
                          </span>
                        )}
                        <span className="text-gray-400">
                          / {game.max_players} max
                        </span>
                      </div>
                      {game.notes && (
                        <p className="mt-2 text-sm text-gray-500">{game.notes}</p>
                      )}
                    </div>
                    <Link
                      href={`/games/${game.id}`}
                      className="rounded-lg bg-green-600 px-4 py-2 text-white font-medium hover:bg-green-700 transition"
                    >
                      {game.userRsvpStatus ? 'View Details' : 'RSVP'}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
