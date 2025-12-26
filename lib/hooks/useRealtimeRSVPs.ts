'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function useRealtimeRSVPs(gameId: string, initialRSVPs: RSVP[]) {
  const [rsvps, setRSVPs] = useState<RSVP[]>(initialRSVPs)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`rsvps:${gameId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `game_id=eq.${gameId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full RSVP with profile data
            const { data } = await supabase
              .from('rsvps')
              .select('*, profiles(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) setRSVPs(prev => [...prev, data as RSVP])
          } else if (payload.eventType === 'UPDATE') {
            setRSVPs(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r))
          } else if (payload.eventType === 'DELETE') {
            setRSVPs(prev => prev.filter(r => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId])

  return rsvps
}
