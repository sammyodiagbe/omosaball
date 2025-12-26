'use client'

import { useRealtimeRSVPs } from '@/lib/hooks/useRealtimeRSVPs'
import { useRealtimeTeams } from '@/lib/hooks/useRealtimeTeams'
import { RSVPButtons } from '@/components/games/RSVPButtons'
import { format } from 'date-fns'

interface RSVP {
  id: string
  game_id: string
  player_id: string | null
  guest_name: string | null
  guest_phone: string | null
  guest_position: string | null
  status: string
  has_paid: boolean
  paid_at: string | null
  profiles?: {
    id: string
    full_name: string
    preferred_position: string
  } | null
}

interface TeamAssignment {
  id: string
  player_id: string
  position_slot: string
  profiles: {
    id: string
    full_name: string
    preferred_position: string
  }
}

interface Team {
  id: string
  color: string
  team_assignments: TeamAssignment[]
}

interface Game {
  id: string
  date: string
  time: string
  location: string
  max_players: number
  notes?: string
}

interface NextGameSectionProps {
  game: Game
  initialRSVPs: RSVP[]
  teams: Team[]
  userId: string | null
  userRsvpStatus: string | null
  isAdmin?: boolean
}

const teamColors: Record<string, { bg: string; border: string; text: string }> = {
  red: { bg: '#FEE2E2', border: '#EF4444', text: '#DC2626' },
  white: { bg: '#F9FAFB', border: '#D1D5DB', text: '#374151' },
  blue: { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
  black: { bg: '#1F2937', border: '#111827', text: '#F9FAFB' },
}

const positionColors: Record<string, { bg: string; text: string }> = {
  defender: { bg: '#DBEAFE', text: '#1D4ED8' },
  midfielder: { bg: '#D1FAE5', text: '#047857' },
  attacker: { bg: '#FEE2E2', text: '#DC2626' },
}

export function NextGameSection({
  game,
  initialRSVPs,
  teams: initialTeams,
  userId,
  userRsvpStatus,
  isAdmin = false,
}: NextGameSectionProps) {
  const rsvps = useRealtimeRSVPs(game.id, initialRSVPs)
  const teams = useRealtimeTeams(game.id, initialTeams)

  // For public: show all confirmed players (paid or not) as "confirmed"
  // For admin: show breakdown of paid vs awaiting payment
  const allConfirmed = rsvps.filter((r) => r.status === 'confirmed')
  const confirmedPaid = rsvps.filter((r) => r.status === 'confirmed' && r.has_paid)
  const confirmedUnpaid = rsvps.filter((r) => r.status === 'confirmed' && !r.has_paid)
  const hasTeams = teams && teams.length > 0 && teams.some((t) => t.team_assignments?.length > 0)

  // Check current user status
  const currentUserRsvp = userId ? rsvps.find((r) => r.player_id === userId) : null
  const currentStatus = currentUserRsvp?.status || userRsvpStatus

  return (
    <section className="mx-auto max-w-4xl py-16">
      {/* Section Header */}
      <div className="mb-8 text-center">
        <p
          className="mb-3 text-sm font-medium uppercase tracking-widest"
          style={{ color: 'var(--accent)' }}
        >
          Next Game
        </p>
        <h2
          className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight md:text-4xl"
          style={{ color: 'var(--foreground)' }}
        >
          {format(new Date(game.date), 'EEEE, MMMM d')}
        </h2>
        <p className="mt-2 text-lg" style={{ color: 'var(--foreground-muted)' }}>
          {game.time} at {game.location}
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 flex justify-center items-center gap-4 text-sm flex-wrap">
        {isAdmin ? (
          <>
            <span
              className="rounded-full px-3 py-1 font-medium"
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
            >
              {confirmedPaid.length} confirmed
            </span>
            {confirmedUnpaid.length > 0 && (
              <span
                className="rounded-full px-3 py-1 font-medium"
                style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#D97706' }}
              >
                {confirmedUnpaid.length} awaiting payment
              </span>
            )}
          </>
        ) : (
          <span
            className="rounded-full px-3 py-1 font-medium"
            style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
          >
            {allConfirmed.length} playing
          </span>
        )}
        <span style={{ color: 'var(--foreground-muted)' }}>/ 32 spots</span>
      </div>

      {/* RSVP Section */}
      <div
        className="mb-10 rounded-2xl p-6 text-center"
        style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
      >
        <h3
          className="font-[family-name:var(--font-display)] text-lg font-semibold mb-4"
          style={{ color: 'var(--foreground)' }}
        >
          Join This Game
        </h3>
        <div className="max-w-sm mx-auto">
          <RSVPButtons gameId={game.id} currentStatus={currentStatus} isGuest={!userId} />
        </div>
      </div>

      {/* Teams Grid */}
      {hasTeams && (
        <div>
          <h3
            className="font-[family-name:var(--font-display)] text-xl font-semibold mb-6 text-center"
            style={{ color: 'var(--foreground)' }}
          >
            Team Lineups
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => {
              const colors = teamColors[team.color] || teamColors.white
              return (
                <div
                  key={team.id}
                  className="rounded-xl p-4"
                  style={{
                    background: colors.bg,
                    border: `2px solid ${colors.border}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4
                      className="font-[family-name:var(--font-display)] font-semibold capitalize"
                      style={{ color: colors.text }}
                    >
                      {team.color}
                    </h4>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: team.color === 'black' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                        color: colors.text,
                      }}
                    >
                      {team.team_assignments?.length || 0}
                    </span>
                  </div>
                  {team.team_assignments?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {team.team_assignments.map((assignment) => (
                        <li
                          key={assignment.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span style={{ color: colors.text }}>{assignment.profiles.full_name}</span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              background: positionColors[assignment.position_slot]?.bg || '#F3F4F6',
                              color: positionColors[assignment.position_slot]?.text || '#6B7280',
                            }}
                          >
                            {assignment.position_slot?.slice(0, 3).toUpperCase()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p
                      className="text-sm"
                      style={{ color: colors.text, opacity: 0.6 }}
                    >
                      No players yet
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No teams yet message */}
      {!hasTeams && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
        >
          <p style={{ color: 'var(--foreground-muted)' }}>
            Teams will be posted closer to game day
          </p>
        </div>
      )}
    </section>
  )
}
