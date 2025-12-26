import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export default async function AdminGamesPage() {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    redirect('/admin')
  }

  const supabase = await createServiceClient()

  const { data: games } = await supabase
    .from('games')
    .select(`
      *,
      rsvps (
        id,
        status
      )
    `)
    .order('date', { ascending: false })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gamesWithCounts = (games as any[])?.map(game => ({
    ...game,
    confirmedCount: game.rsvps?.filter((r: { status: string }) => r.status === 'confirmed').length || 0,
    pendingCount: game.rsvps?.filter((r: { status: string }) => r.status === 'pending').length || 0,
  })) || []

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
              className="text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              Games
            </Link>
            <Link
              href="/admin/players"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Players
            </Link>
            <form action="/api/admin/logout" method="POST">
              <button
                type="submit"
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: 'var(--foreground-subtle)' }}
              >
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1
              className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              Games
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Manage all scheduled games
            </p>
          </div>
          <Link
            href="/admin/games/new"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Game
          </Link>
        </div>

        {gamesWithCounts.length === 0 ? (
          <div
            className="rounded-2xl py-16 text-center"
            style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
          >
            <p className="text-lg" style={{ color: 'var(--foreground-muted)' }}>
              No games yet
            </p>
            <Link
              href="/admin/games/new"
              className="mt-2 inline-block text-sm font-medium"
              style={{ color: 'var(--accent)' }}
            >
              Create your first game
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {gamesWithCounts.map((game) => {
              const isPast = new Date(game.date) < new Date()
              return (
                <div
                  key={game.id}
                  className="group rounded-xl p-5 transition-all duration-200 hover:shadow-md"
                  style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2
                          className="font-[family-name:var(--font-display)] text-lg font-semibold"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {format(new Date(game.date), 'EEEE, MMMM d, yyyy')}
                        </h2>
                        {game.status === 'cancelled' && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}
                          >
                            Cancelled
                          </span>
                        )}
                        {game.status === 'completed' && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: 'var(--background)', color: 'var(--foreground-muted)', border: '1px solid var(--border)' }}
                          >
                            Completed
                          </span>
                        )}
                        {isPast && game.status === 'scheduled' && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ background: '#FEF3C7', color: '#D97706' }}
                          >
                            Past
                          </span>
                        )}
                      </div>
                      <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                        {game.time} at {game.location}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm">
                        <span style={{ color: 'var(--accent)' }}>
                          {game.confirmedCount} confirmed
                        </span>
                        {game.pendingCount > 0 && (
                          <span style={{ color: '#D97706' }}>
                            {game.pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/games/${game.id}`}
                        className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                        style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
                      >
                        Manage
                      </Link>
                      <Link
                        href={`/admin/games/${game.id}/teams`}
                        className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:opacity-90"
                        style={{ background: 'var(--accent)', color: 'white' }}
                      >
                        Teams
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
