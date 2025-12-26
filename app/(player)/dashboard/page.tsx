import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui'
import { PositionBadge, Badge } from '@/components/ui'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get player profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileData = profile as any

  // Get upcoming games with player's RSVP status
  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      rsvps!left (
        id,
        status,
        player_id
      )
    `)
    .eq('status', 'scheduled')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(5)

  // Get player's RSVPs for these games
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gamesWithPlayerRsvp = (games as any[])?.map(game => {
    const playerRsvp = game.rsvps?.find((r: { player_id: string }) => r.player_id === user.id)
    const confirmedCount = game.rsvps?.filter((r: { status: string }) => r.status === 'confirmed').length || 0
    return {
      ...game,
      playerRsvpStatus: playerRsvp?.status || null,
      confirmedCount,
    }
  }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-bold text-green-600">
            OmosaBall
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-gray-600 hover:text-gray-900">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profileData?.full_name || 'Player'}!
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-gray-600">Position:</span>
            {profileData?.preferred_position && (
              <PositionBadge position={profileData.preferred_position} />
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Upcoming Games</h2>
            {gamesWithPlayerRsvp.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No upcoming games scheduled
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {gamesWithPlayerRsvp.map((game) => (
                  <Card key={game.id}>
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {format(new Date(game.date + 'T00:00:00'), 'EEEE, MMMM d')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {game.time} at {game.location}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {game.confirmedCount} / {game.max_players} confirmed
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {game.playerRsvpStatus === 'confirmed' && (
                          <Badge variant="success">Confirmed</Badge>
                        )}
                        {game.playerRsvpStatus === 'pending' && (
                          <Badge variant="warning">Pending</Badge>
                        )}
                        {game.playerRsvpStatus === 'declined' && (
                          <Badge variant="danger">Declined</Badge>
                        )}
                        <Link
                          href={`/games/${game.id}`}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                        >
                          {game.playerRsvpStatus ? 'View' : 'RSVP'}
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link
                href="/games"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                View all games →
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Stats</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {gamesWithPlayerRsvp.filter(g => g.playerRsvpStatus === 'confirmed').length}
                  </p>
                  <p className="text-gray-600">Games Confirmed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-gray-900">
                    {gamesWithPlayerRsvp.length}
                  </p>
                  <p className="text-gray-600">Upcoming Games</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
