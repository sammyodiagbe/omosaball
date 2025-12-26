'use client'

import { useRealtimeRSVPs } from '@/lib/hooks/useRealtimeRSVPs'
import { PlayerActions } from './PlayerActions'

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
    email?: string
  } | null
}

interface GamePlayersRealtimeProps {
  gameId: string
  initialRSVPs: RSVP[]
  maxPlayers: number
}

const positionColors: Record<string, { bg: string; text: string }> = {
  defender: { bg: '#DBEAFE', text: '#1D4ED8' },
  midfielder: { bg: '#D1FAE5', text: '#047857' },
  attacker: { bg: '#FEE2E2', text: '#DC2626' },
}

export function GamePlayersRealtime({ gameId, initialRSVPs, maxPlayers }: GamePlayersRealtimeProps) {
  const rsvps = useRealtimeRSVPs(gameId, initialRSVPs)

  // Players who RSVPed yes and payment confirmed by admin
  const confirmedPlayers = rsvps.filter((r) => r.status === 'confirmed' && r.has_paid)
  // Players who RSVPed yes but payment not yet confirmed
  const pendingConfirmation = rsvps.filter((r) => r.status === 'confirmed' && !r.has_paid)
  // Players still deciding (RSVP pending)
  const pendingRSVP = rsvps.filter((r) => r.status === 'pending')
  const declinedPlayers = rsvps.filter((r) => r.status === 'declined')

  const getPlayerName = (rsvp: RSVP) => {
    if (rsvp.player_id && rsvp.profiles) {
      return rsvp.profiles.full_name
    }
    return rsvp.guest_name || 'Unknown'
  }

  const getPlayerPosition = (rsvp: RSVP) => {
    if (rsvp.player_id && rsvp.profiles) {
      return rsvp.profiles.preferred_position
    }
    return rsvp.guest_position || ''
  }

  const isGuest = (rsvp: RSVP) => !rsvp.player_id

  const renderPlayerRow = (rsvp: RSVP, showActions = true) => {
    const name = getPlayerName(rsvp)
    const position = getPlayerPosition(rsvp)
    const guest = isGuest(rsvp)

    return (
      <li key={rsvp.id} className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                {name}
              </span>
              {guest && (
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--border)', color: 'var(--foreground-muted)' }}
                >
                  Guest
                </span>
              )}
            </div>
            {guest && rsvp.guest_phone && (
              <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                {rsvp.guest_phone}
              </span>
            )}
          </div>
          {position && (
            <span
              className="rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap"
              style={{
                background: positionColors[position]?.bg,
                color: positionColors[position]?.text,
              }}
            >
              {position}
            </span>
          )}
        </div>
        {showActions && (
          <PlayerActions
            gameId={gameId}
            rsvpId={rsvp.id}
            playerId={rsvp.player_id}
            currentStatus={rsvp.status}
            hasPaid={rsvp.has_paid}
            isGuest={guest}
          />
        )}
      </li>
    )
  }

  return (
    <>
      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-3 text-sm flex-wrap">
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
        >
          {confirmedPlayers.length} confirmed
        </span>
        {pendingConfirmation.length > 0 && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#D97706' }}
          >
            {pendingConfirmation.length} awaiting payment
          </span>
        )}
        {pendingRSVP.length > 0 && (
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ background: 'rgba(156, 163, 175, 0.15)', color: '#6B7280' }}
          >
            {pendingRSVP.length} pending RSVP
          </span>
        )}
        <span style={{ color: 'var(--foreground-muted)' }}>/ {maxPlayers} max</span>
      </div>

      {/* Players Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Confirmation (awaiting payment) */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--background-subtle)', border: '2px solid #F59E0B' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#F59E0B' }}
            />
            <h2
              className="font-[family-name:var(--font-display)] text-lg font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Pending Confirmation ({pendingConfirmation.length})
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
            Players who RSVPed — confirm after receiving payment
          </p>
          {pendingConfirmation.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              No players awaiting confirmation
            </p>
          ) : (
            <ul className="space-y-1 divide-y" style={{ borderColor: 'var(--border)' }}>
              {pendingConfirmation.map((rsvp) => renderPlayerRow(rsvp))}
            </ul>
          )}
        </div>

        {/* Confirmed (paid) */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--background-subtle)', border: '2px solid #10B981' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: '#10B981' }}
            />
            <h2
              className="font-[family-name:var(--font-display)] text-lg font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Confirmed ({confirmedPlayers.length})
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
            Payment confirmed — ready to play
          </p>
          {confirmedPlayers.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
              No confirmed players yet
            </p>
          ) : (
            <ul className="space-y-1 divide-y" style={{ borderColor: 'var(--border)' }}>
              {confirmedPlayers.map((rsvp) => renderPlayerRow(rsvp))}
            </ul>
          )}
        </div>

        {/* Pending RSVP */}
        {pendingRSVP.length > 0 && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
          >
            <h2
              className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Pending RSVP ({pendingRSVP.length})
            </h2>
            <p className="text-xs mb-4" style={{ color: 'var(--foreground-muted)' }}>
              Haven&apos;t responded yet
            </p>
            <ul className="space-y-1 divide-y" style={{ borderColor: 'var(--border)' }}>
              {pendingRSVP.map((rsvp) => renderPlayerRow(rsvp))}
            </ul>
          </div>
        )}

        {/* Declined */}
        {declinedPlayers.length > 0 && (
          <div
            className="rounded-2xl p-6 lg:col-span-2"
            style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
          >
            <h2
              className="mb-4 font-[family-name:var(--font-display)] text-lg font-semibold"
              style={{ color: 'var(--foreground)' }}
            >
              Declined ({declinedPlayers.length})
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {declinedPlayers.map((rsvp) => {
                const name = getPlayerName(rsvp)
                const position = getPlayerPosition(rsvp)
                return (
                  <li key={rsvp.id} className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
                      {name}
                    </span>
                    {position && (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium opacity-60"
                        style={{
                          background: positionColors[position]?.bg,
                          color: positionColors[position]?.text,
                        }}
                      >
                        {position}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
