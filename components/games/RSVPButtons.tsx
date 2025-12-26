'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'

interface RSVPButtonsProps {
  gameId: string
  currentStatus: string | null
  isGuest?: boolean
}

type Position = 'defender' | 'midfielder' | 'attacker'

export function RSVPButtons({ gameId, currentStatus, isGuest = false }: RSVPButtonsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const [guestData, setGuestData] = useState({
    name: '',
    phone: '',
    position: '' as Position | '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRSVP = async (status: 'confirmed' | 'declined') => {
    setIsLoading(status)
    try {
      const response = await fetch(`/api/games/${gameId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('RSVP error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!guestData.name || !guestData.phone || !guestData.position) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading('guest')
    try {
      const response = await fetch(`/api/games/${gameId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: guestData.name,
          guest_phone: guestData.phone,
          guest_position: guestData.position,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setShowGuestForm(false)
        router.refresh()
      } else {
        setError(data.error || 'Failed to submit RSVP')
      }
    } catch (error) {
      console.error('RSVP error:', error)
      setError('An error occurred')
    } finally {
      setIsLoading(null)
    }
  }

  const handleCancel = async () => {
    setIsLoading('cancel')
    try {
      const response = await fetch(`/api/games/${gameId}/rsvp`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Cancel RSVP error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  // Show success message for guests
  if (success) {
    return (
      <div
        className="rounded-lg p-4 text-center"
        style={{ background: 'var(--accent-light)', border: '1px solid var(--accent)' }}
      >
        <p className="font-medium" style={{ color: 'var(--accent)' }}>
          RSVP submitted!
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
          Waiting for admin confirmation.
        </p>
      </div>
    )
  }

  // For authenticated users with existing RSVP
  if (currentStatus === 'confirmed') {
    return (
      <div className="space-y-2">
        <p className="text-green-600 font-medium">You&apos;re confirmed!</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCancel}
          isLoading={isLoading === 'cancel'}
        >
          Cancel RSVP
        </Button>
      </div>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <div className="space-y-2">
        <p className="text-yellow-600 font-medium">Awaiting confirmation</p>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCancel}
          isLoading={isLoading === 'cancel'}
        >
          Cancel RSVP
        </Button>
      </div>
    )
  }

  if (currentStatus === 'declined') {
    return (
      <div className="space-y-2">
        <p className="text-gray-500">You declined this game</p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => handleRSVP('confirmed')}
          isLoading={isLoading === 'confirmed'}
        >
          Change to Confirmed
        </Button>
      </div>
    )
  }

  // Guest form
  if (isGuest || showGuestForm) {
    return (
      <div
        className="rounded-xl p-5"
        style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
      >
        <h3
          className="font-[family-name:var(--font-display)] text-lg font-semibold mb-4"
          style={{ color: 'var(--foreground)' }}
        >
          RSVP as Guest
        </h3>
        <form onSubmit={handleGuestSubmit} className="space-y-4">
          {error && (
            <div
              className="rounded-lg p-3 text-sm"
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="guest-name"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              Name
            </label>
            <input
              id="guest-name"
              type="text"
              value={guestData.name}
              onChange={(e) => setGuestData({ ...guestData, name: e.target.value })}
              placeholder="Your name"
              className="w-full rounded-lg px-4 py-2.5 text-sm"
              style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              required
            />
          </div>

          <div>
            <label
              htmlFor="guest-phone"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              Phone
            </label>
            <input
              id="guest-phone"
              type="tel"
              value={guestData.phone}
              onChange={(e) => setGuestData({ ...guestData, phone: e.target.value })}
              placeholder="Your phone number"
              className="w-full rounded-lg px-4 py-2.5 text-sm"
              style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              required
            />
          </div>

          <div>
            <label
              htmlFor="guest-position"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: 'var(--foreground)' }}
            >
              Preferred Position
            </label>
            <select
              id="guest-position"
              value={guestData.position}
              onChange={(e) => setGuestData({ ...guestData, position: e.target.value as Position })}
              className="w-full rounded-lg px-4 py-2.5 text-sm"
              style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              required
            >
              <option value="">Select position...</option>
              <option value="defender">Defender</option>
              <option value="midfielder">Midfielder</option>
              <option value="attacker">Attacker</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading === 'guest'}
              className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              {isLoading === 'guest' ? 'Submitting...' : 'Submit RSVP'}
            </button>
            {!isGuest && (
              <button
                type="button"
                onClick={() => setShowGuestForm(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    )
  }

  // Default state - show options
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="primary"
        onClick={() => handleRSVP('confirmed')}
        isLoading={isLoading === 'confirmed'}
      >
        I&apos;m In!
      </Button>
      <Button
        variant="secondary"
        onClick={() => handleRSVP('declined')}
        isLoading={isLoading === 'declined'}
      >
        Can&apos;t Make It
      </Button>
      <button
        onClick={() => setShowGuestForm(true)}
        className="mt-2 text-sm underline"
        style={{ color: 'var(--foreground-muted)' }}
      >
        RSVP as guest (no account)
      </button>
    </div>
  )
}
