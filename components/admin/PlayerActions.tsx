'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface PlayerActionsProps {
  gameId: string
  rsvpId: string
  playerId: string | null
  currentStatus: string
  hasPaid: boolean
  isGuest?: boolean
}

export function PlayerActions({
  gameId,
  rsvpId,
  playerId,
  currentStatus,
  hasPaid,
  isGuest = false,
}: PlayerActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleAction = async (action: 'confirm' | 'remove' | 'toggle_paid') => {
    setIsLoading(action)
    try {
      // Use rsvpId for the URL path (works for both guests and registered users)
      const urlId = playerId || rsvpId
      const url = `/api/admin/games/${gameId}/players/${urlId}`

      if (action === 'remove') {
        await fetch(url, { method: 'DELETE' })
      } else if (action === 'confirm') {
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'confirmed',
            rsvp_id: isGuest ? rsvpId : undefined,
          }),
        })
      } else if (action === 'toggle_paid') {
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            has_paid: !hasPaid,
            rsvp_id: isGuest ? rsvpId : undefined,
          }),
        })
      }

      router.refresh()
    } catch (error) {
      console.error('Action error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Confirm Payment button - prominent for unpaid players */}
      {currentStatus === 'confirmed' && !hasPaid && (
        <button
          onClick={() => handleAction('toggle_paid')}
          disabled={isLoading !== null}
          className="px-3 py-1.5 text-xs font-medium rounded transition-colors disabled:opacity-50"
          style={{
            background: '#10B981',
            color: 'white',
          }}
        >
          {isLoading === 'toggle_paid' ? '...' : 'Confirm Payment'}
        </button>
      )}

      {/* Undo payment for confirmed paid players */}
      {currentStatus === 'confirmed' && hasPaid && (
        <button
          onClick={() => handleAction('toggle_paid')}
          disabled={isLoading !== null}
          className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-50"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#059669',
            border: '1px solid #10B981',
          }}
        >
          {isLoading === 'toggle_paid' ? '...' : '✓ Paid'}
        </button>
      )}

      {/* RSVP Confirm button for pending RSVP status */}
      {currentStatus === 'pending' && (
        <button
          onClick={() => handleAction('confirm')}
          disabled={isLoading !== null}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading === 'confirm' ? '...' : 'Accept RSVP'}
        </button>
      )}

      <button
        onClick={() => handleAction('remove')}
        disabled={isLoading !== null}
        className="px-2 py-1 text-xs rounded transition-colors disabled:opacity-50"
        style={{
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#DC2626',
        }}
      >
        {isLoading === 'remove' ? '...' : 'Remove'}
      </button>
    </div>
  )
}
