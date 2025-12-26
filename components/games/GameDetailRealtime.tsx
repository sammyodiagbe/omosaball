'use client'

import { useRealtimeRSVPs } from '@/lib/hooks/useRealtimeRSVPs'
import { RSVPButtons } from './RSVPButtons'
import { Card, CardContent, CardHeader, Badge, PositionBadge } from '@/components/ui'

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

interface Team {
  id: string
  color: string
  team_assignments: Array<{
    id: string
    position_slot: string
    profiles: {
      id: string
      full_name: string
      preferred_position: string
    }
  }>
}

interface GameDetailRealtimeProps {
  gameId: string
  initialRSVPs: RSVP[]
  teams: Team[]
  maxPlayers: number
  userId: string | null
  userRsvpStatus: string | null
}

export function GameDetailRealtime({
  gameId,
  initialRSVPs,
  teams,
  maxPlayers,
  userId,
  userRsvpStatus,
}: GameDetailRealtimeProps) {
  const rsvps = useRealtimeRSVPs(gameId, initialRSVPs)

  const confirmedPlayers = rsvps.filter((r) => r.status === 'confirmed')
  const pendingPlayers = rsvps.filter((r) => r.status === 'pending')
  const hasTeams = teams && teams.length > 0

  // Check if user already has an RSVP (might have changed via realtime)
  const currentUserRsvp = userId ? rsvps.find((r) => r.player_id === userId) : null
  const currentStatus = currentUserRsvp?.status || userRsvpStatus

  const getPlayerName = (rsvp: RSVP) => {
    if (rsvp.player_id && rsvp.profiles) {
      return rsvp.profiles.full_name
    }
    return rsvp.guest_name || 'Unknown'
  }

  const getPlayerPosition = (rsvp: RSVP): 'defender' | 'midfielder' | 'attacker' | null => {
    if (rsvp.player_id && rsvp.profiles) {
      return rsvp.profiles.preferred_position as 'defender' | 'midfielder' | 'attacker'
    }
    return rsvp.guest_position as 'defender' | 'midfielder' | 'attacker' | null
  }

  return (
    <>
      {/* RSVP Section */}
      <div className="mb-6 flex items-center gap-4 text-sm">
        <span className="text-green-600 font-medium">{confirmedPlayers.length} confirmed</span>
        {pendingPlayers.length > 0 && (
          <span className="text-yellow-600">{pendingPlayers.length} pending</span>
        )}
        <span className="text-gray-400">/ {maxPlayers} max</span>
      </div>

      {/* RSVP Buttons - always show for guests, or for logged in users */}
      <div className="mb-6">
        <RSVPButtons gameId={gameId} currentStatus={currentStatus} isGuest={!userId} />
      </div>

      {/* Teams Section */}
      {hasTeams && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Teams</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={team.color as 'red' | 'white' | 'blue' | 'black'}>
                      {team.color.charAt(0).toUpperCase() + team.color.slice(1)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {team.team_assignments?.length || 0} players
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="py-2">
                  {team.team_assignments?.length > 0 ? (
                    <ul className="space-y-1">
                      {team.team_assignments.map((assignment) => (
                        <li key={assignment.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{assignment.profiles.full_name}</span>
                          <PositionBadge
                            position={assignment.position_slot as 'defender' | 'midfielder' | 'attacker'}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-400">No players assigned</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Player Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Confirmed ({confirmedPlayers.length})</h2>
          </CardHeader>
          <CardContent>
            {confirmedPlayers.length === 0 ? (
              <p className="text-gray-500">No confirmed players yet</p>
            ) : (
              <ul className="space-y-2">
                {confirmedPlayers.map((rsvp) => {
                  const position = getPlayerPosition(rsvp)
                  return (
                    <li key={rsvp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{getPlayerName(rsvp)}</span>
                        {!rsvp.player_id && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Guest
                          </span>
                        )}
                      </div>
                      {position && <PositionBadge position={position} />}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Pending ({pendingPlayers.length})</h2>
          </CardHeader>
          <CardContent>
            {pendingPlayers.length === 0 ? (
              <p className="text-gray-500">No pending players</p>
            ) : (
              <ul className="space-y-2">
                {pendingPlayers.map((rsvp) => {
                  const position = getPlayerPosition(rsvp)
                  return (
                    <li key={rsvp.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">{getPlayerName(rsvp)}</span>
                        {!rsvp.player_id && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            Guest
                          </span>
                        )}
                      </div>
                      {position && <PositionBadge position={position} />}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
