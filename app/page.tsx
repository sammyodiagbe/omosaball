import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdminAuthenticated } from '@/lib/utils/admin-auth'
import { NextGameSection } from '@/components/home'

// Disable caching to always show fresh game data
export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = await isAdminAuthenticated()

  // Fetch the next upcoming game with RSVPs and teams
  const today = new Date().toISOString().split('T')[0]
  const { data: nextGame } = await supabase
    .from('games')
    .select(`
      id,
      date,
      time,
      location,
      max_players,
      notes,
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
    .eq('status', 'scheduled')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gameData = nextGame as any
  const userRsvp = user && gameData?.rsvps?.find((r: { player_id: string }) => r.player_id === user.id)

  return (
    <div className="noise-texture min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12 lg:px-20">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
          style={{ color: 'var(--foreground)' }}
        >
          OmosaBall
        </Link>

        <div className="flex items-center gap-6">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'var(--foreground)',
                color: 'var(--background)'
              }}
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium transition-colors duration-200 hover:opacity-70"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'var(--foreground)',
                  color: 'var(--background)'
                }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="px-6 md:px-12 lg:px-20">
        <section className="mx-auto max-w-4xl pb-24 pt-20 md:pt-32">
          {/* Pill badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium animate-[fadeIn_0.6s_ease-out]"
            style={{
              background: 'var(--accent-light)',
              color: 'var(--accent)'
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
            Tuesday & Thursday games
          </div>

          {/* Main headline */}
          <h1
            className="font-[family-name:var(--font-display)] text-5xl font-semibold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl animate-[fadeIn_0.6s_ease-out_0.1s_both]"
            style={{ color: 'var(--foreground)' }}
          >
            Pickup soccer,
            <br />
            <span style={{ color: 'var(--foreground-muted)' }}>finally organized.</span>
          </h1>

          {/* Subtext */}
          <p
            className="mt-6 max-w-xl text-lg leading-relaxed md:text-xl animate-[fadeIn_0.6s_ease-out_0.2s_both]"
            style={{ color: 'var(--foreground-muted)' }}
          >
            No more WhatsApp chaos. RSVP to games, get assigned to balanced teams
            automatically, and just show up ready to play.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row animate-[fadeIn_0.6s_ease-out_0.3s_both]">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                background: 'var(--accent)',
                color: 'white'
              }}
            >
              Join as a player
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/games"
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-medium transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'var(--background-subtle)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)'
              }}
            >
              View upcoming games
            </Link>
          </div>
        </section>

        {/* Next Game Section */}
        {gameData && (
          <>
            <div
              className="mx-auto max-w-4xl border-t"
              style={{ borderColor: 'var(--border)' }}
            />
            <NextGameSection
              game={{
                id: gameData.id,
                date: gameData.date,
                time: gameData.time,
                location: gameData.location,
                max_players: gameData.max_players,
                notes: gameData.notes,
              }}
              initialRSVPs={gameData.rsvps || []}
              teams={gameData.teams || []}
              userId={user?.id || null}
              userRsvpStatus={userRsvp?.status || null}
              isAdmin={isAdmin}
            />
          </>
        )}

        {/* Divider */}
        <div
          className="mx-auto max-w-4xl border-t"
          style={{ borderColor: 'var(--border)' }}
        />

        {/* Features Section */}
        <section className="mx-auto max-w-4xl py-24">
          <div className="mb-16">
            <p
              className="mb-3 text-sm font-medium uppercase tracking-widest"
              style={{ color: 'var(--accent)' }}
            >
              How it works
            </p>
            <h2
              className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl"
              style={{ color: 'var(--foreground)' }}
            >
              Three steps to game day
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Feature 1 */}
            <div
              className="group rounded-2xl p-8 transition-all duration-300 hover:shadow-md"
              style={{
                background: 'var(--background-subtle)',
                border: '1px solid var(--border)'
              }}
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'var(--accent-light)' }}
              >
                <span role="img" aria-label="calendar">1</span>
              </div>
              <h3
                className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                RSVP in seconds
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Confirm your spot for Tuesday or Thursday games with a single tap. No more endless group chats.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="group rounded-2xl p-8 transition-all duration-300 hover:shadow-md"
              style={{
                background: 'var(--background-subtle)',
                border: '1px solid var(--border)'
              }}
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'var(--accent-light)' }}
              >
                <span role="img" aria-label="teams">2</span>
              </div>
              <h3
                className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Auto-balanced teams
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Four teams generated automatically based on player positions. Fair games, every time.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="group rounded-2xl p-8 transition-all duration-300 hover:shadow-md"
              style={{
                background: 'var(--background-subtle)',
                border: '1px solid var(--border)'
              }}
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110"
                style={{ background: 'var(--accent-light)' }}
              >
                <span role="img" aria-label="play">3</span>
              </div>
              <h3
                className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold"
                style={{ color: 'var(--foreground)' }}
              >
                Show up & play
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Check your team assignment before game day. Arrive at 10:45 PM, ready to go.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          className="mx-auto max-w-4xl rounded-3xl p-12 md:p-16"
          style={{
            background: 'var(--foreground)',
            color: 'var(--background)'
          }}
        >
          <div className="grid gap-12 text-center md:grid-cols-3 md:text-left">
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight">
                32
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                players per game
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight">
                4-2-2
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                def · mid · att per team
              </p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight">
                2x
              </p>
              <p className="mt-2 text-sm" style={{ color: 'var(--foreground-subtle)' }}>
                games per week
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-4xl py-24 text-center">
          <h2
            className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl"
            style={{ color: 'var(--foreground)' }}
          >
            Ready to play?
          </h2>
          <p
            className="mx-auto mt-4 max-w-md text-lg"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Join the crew and never miss a game again.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: 'var(--accent)',
              color: 'white'
            }}
          >
            Create your account
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t px-6 py-8 md:px-12 lg:px-20"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 md:flex-row">
          <p
            className="text-sm"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Made for the Tuesday/Thursday crew
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--foreground-subtle)' }}
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
