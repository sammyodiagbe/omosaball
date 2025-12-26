import Link from 'next/link'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export default async function AdminDashboardPage() {
  const isAdmin = await isAdminAuthenticated()
  if (!isAdmin) {
    redirect('/admin')
  }

  const supabase = await createServiceClient()

  // Get upcoming games count
  const { count: upcomingGamesCount } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled')
    .gte('date', new Date().toISOString().split('T')[0])

  // Get total players count
  const { count: playersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // Get next game
  const { data: nextGame } = await supabase
    .from('games')
    .select(`
      *,
      rsvps (
        id,
        status
      )
    `)
    .eq('status', 'scheduled')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameData = nextGame as any
  const confirmedForNextGame = gameData?.rsvps?.filter((r: { status: string }) => r.status === 'confirmed').length || 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header
        className="border-b"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--border)'
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
              style={{ color: 'var(--foreground)' }}
            >
              OmosaBall
            </Link>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent)'
              }}
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
        {/* Page Title */}
        <div className="mb-10">
          <h1
            className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Overview of your pickup games
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--background-subtle)',
              border: '1px solid var(--border)'
            }}
          >
            <p
              className="font-[family-name:var(--font-display)] text-4xl font-semibold"
              style={{ color: 'var(--accent)' }}
            >
              {upcomingGamesCount || 0}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Upcoming Games
            </p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--background-subtle)',
              border: '1px solid var(--border)'
            }}
          >
            <p
              className="font-[family-name:var(--font-display)] text-4xl font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              {playersCount || 0}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Registered Players
            </p>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--background-subtle)',
              border: '1px solid var(--border)'
            }}
          >
            <p
              className="font-[family-name:var(--font-display)] text-4xl font-semibold"
              style={{ color: '#F59E0B' }}
            >
              {confirmedForNextGame}
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
              Confirmed for Next Game
            </p>
          </div>
        </div>

        {/* Next Game Card */}
        {gameData && (
          <div
            className="mb-10 rounded-2xl p-6"
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)'
            }}
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p
                  className="mb-1 text-xs font-medium uppercase tracking-widest"
                  style={{ color: 'var(--foreground-subtle)' }}
                >
                  Next Game
                </p>
                <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                  {format(new Date(gameData.date), 'EEEE, MMMM d')}
                </p>
                <p className="mt-2 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                  {gameData.time} at {gameData.location}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                  {confirmedForNextGame} / {gameData.max_players} players confirmed
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/games/${gameData.id}`}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-80"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--background)'
                  }}
                >
                  Manage Players
                </Link>
                <Link
                  href={`/admin/games/${gameData.id}/teams`}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
                  style={{
                    background: 'var(--accent)',
                    color: 'white'
                  }}
                >
                  Build Teams
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6">
          <h2
            className="mb-4 text-sm font-medium uppercase tracking-widest"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Quick Actions
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/games/new"
            className="group rounded-2xl p-6 transition-all duration-200 hover:shadow-md"
            style={{
              background: 'var(--background-subtle)',
              border: '1px solid var(--border)'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ background: 'var(--accent-light)' }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--accent)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h3
                  className="font-[family-name:var(--font-display)] font-semibold"
                  style={{ color: 'var(--foreground)' }}
                >
                  Create New Game
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  Schedule a new pickup game for the crew
                </p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/games"
            className="group rounded-2xl p-6 transition-all duration-200 hover:shadow-md"
            style={{
              background: 'var(--background-subtle)',
              border: '1px solid var(--border)'
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                style={{ background: 'var(--accent-light)' }}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{ color: 'var(--accent)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div>
                <h3
                  className="font-[family-name:var(--font-display)] font-semibold"
                  style={{ color: 'var(--foreground)' }}
                >
                  Manage Games
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
                  View, edit, or cancel scheduled games
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
