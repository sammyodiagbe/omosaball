'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

export function useRealtimeTeams(gameId: string, initialTeams: Team[]) {
  const [teams, setTeams] = useState<Team[]>(initialTeams)

  useEffect(() => {
    const supabase = createClient()

    // Function to refetch all teams with assignments
    const refetchTeams = async () => {
      const { data } = await supabase
        .from('teams')
        .select(`
          id,
          color,
          team_assignments (
            id,
            player_id,
            position_slot,
            profiles (
              id,
              full_name,
              preferred_position
            )
          )
        `)
        .eq('game_id', gameId)

      if (data) {
        setTeams(data as Team[])
      }
    }

    // Listen to team_assignments changes for this game's teams
    const teamIds = initialTeams.map(t => t.id)

    const channel = supabase
      .channel(`teams:${gameId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'team_assignments' },
        async (payload) => {
          // Check if this assignment belongs to one of our teams
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRecord = payload.new as any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oldRecord = payload.old as any
          const teamId = newRecord?.team_id || oldRecord?.team_id
          if (teamIds.includes(teamId) || !teamIds.length) {
            // Refetch all teams to get updated data with profiles
            await refetchTeams()
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'teams', filter: `game_id=eq.${gameId}` },
        async () => {
          // Refetch when teams are added/removed
          await refetchTeams()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId, initialTeams])

  return teams
}
