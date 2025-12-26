'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GameActionsProps {
  gameId: string
  initialData: {
    date: string
    time: string
    location: string
    max_players: number
    notes?: string
    status: string
  }
}

export function GameActions({ gameId, initialData }: GameActionsProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    date: initialData.date,
    time: initialData.time,
    location: initialData.location,
    max_players: initialData.max_players,
    notes: initialData.notes || '',
    status: initialData.status,
  })

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update game')
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete game')
      }

      router.push('/admin/games')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          Edit
        </button>
        <button
          onClick={() => setIsDeleting(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 hover:opacity-80"
          style={{ background: 'rgba(239, 68, 68, 0.8)', color: 'white' }}
        >
          Delete
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--background)' }}
          >
            <h2
              className="font-[family-name:var(--font-display)] text-xl font-semibold mb-6"
              style={{ color: 'var(--foreground)' }}
            >
              Edit Game
            </h2>

            {error && (
              <div
                className="mb-4 rounded-lg p-3 text-sm"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label
                  htmlFor="date"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Time
                </label>
                <input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="max_players"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Max Players
                </label>
                <input
                  id="max_players"
                  type="number"
                  value={formData.max_players}
                  onChange={(e) => setFormData({ ...formData, max_players: parseInt(e.target.value) })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  min={1}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: 'var(--foreground)' }}
                >
                  Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setError(null)
                    setFormData({
                      date: initialData.date,
                      time: initialData.time,
                      location: initialData.location,
                      max_players: initialData.max_players,
                      notes: initialData.notes || '',
                      status: initialData.status,
                    })
                  }}
                  className="rounded-lg px-4 py-2.5 text-sm font-medium"
                  style={{
                    background: 'var(--background-subtle)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'var(--background)' }}
          >
            <h2
              className="font-[family-name:var(--font-display)] text-xl font-semibold mb-2"
              style={{ color: 'var(--foreground)' }}
            >
              Delete Game?
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--foreground-muted)' }}>
              This will permanently delete this game and all associated RSVPs and team assignments.
              This action cannot be undone.
            </p>

            {error && (
              <div
                className="mb-4 rounded-lg p-3 text-sm"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                style={{ background: '#DC2626', color: 'white' }}
              >
                {isLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => {
                  setIsDeleting(false)
                  setError(null)
                }}
                className="flex-1 rounded-lg py-2.5 text-sm font-medium"
                style={{
                  background: 'var(--background-subtle)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
