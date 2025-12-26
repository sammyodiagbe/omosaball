'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format, nextTuesday, nextThursday } from 'date-fns'

export default function NewGamePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  const nextTue = nextTuesday(today)
  const nextThu = nextThursday(today)
  const defaultDate = nextTue < nextThu ? nextTue : nextThu

  const [formData, setFormData] = useState({
    date: format(defaultDate, 'yyyy-MM-dd'),
    time: '22:45',
    location: 'Default Field',
    maxPlayers: 32,
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create game')
        return
      }

      router.push('/admin/games')
      router.refresh()
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const setQuickDate = (type: 'nextTue' | 'nextThu') => {
    const date = type === 'nextTue' ? nextTuesday(today) : nextThursday(today)
    setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') })
  }

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
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-10">
        <Link
          href="/admin/games"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200"
          style={{ color: 'var(--accent)' }}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Games
        </Link>

        <div className="mb-8">
          <h1
            className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Create New Game
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Schedule a new pickup game for the crew
          </p>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--background-subtle)', border: '1px solid var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="rounded-lg p-3 text-sm"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                {error}
              </div>
            )}

            {/* Quick Select */}
            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Quick Select
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDate('nextTue')}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  Next Tuesday
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('nextThu')}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
                  style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                >
                  Next Thursday
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label
                htmlFor="date"
                className="mb-2 block text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Date
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Time */}
            <div>
              <label
                htmlFor="time"
                className="mb-2 block text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Time (arrival)
              </label>
              <input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                Default: 10:45 PM (22:45)
              </p>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Field name or address"
                className="w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Max Players */}
            <div>
              <label
                htmlFor="maxPlayers"
                className="mb-2 block text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Max Players
              </label>
              <input
                id="maxPlayers"
                type="number"
                min="1"
                max="100"
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) })}
                className="w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
              <p className="mt-1 text-xs" style={{ color: 'var(--foreground-subtle)' }}>
                4 teams x 8 players = 32
              </p>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium"
                style={{ color: 'var(--foreground)' }}
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Any special instructions or notes..."
                className="w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-lg py-3 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {isLoading ? 'Creating...' : 'Create Game'}
              </button>
              <Link
                href="/admin/games"
                className="rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200"
                style={{ background: 'var(--background)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
