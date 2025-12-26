import type { Position, TeamColor } from '@/lib/types/database'

export interface Player {
  id: string
  full_name: string
  preferred_position: Position
}

export interface TeamAssignment {
  team_color: TeamColor
  position_slot: Position
  player_id: string
}

const TEAM_COLORS: TeamColor[] = ['red', 'white', 'blue', 'black']
const POSITION_SLOTS: Record<Position, number> = {
  defender: 4,
  midfielder: 3,
  attacker: 3,
}

function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateTeams(players: Player[]): TeamAssignment[] {
  const assignments: TeamAssignment[] = []

  // Track slots filled per team
  const teamSlots: Record<TeamColor, Record<Position, number>> = {
    red: { defender: 0, midfielder: 0, attacker: 0 },
    white: { defender: 0, midfielder: 0, attacker: 0 },
    blue: { defender: 0, midfielder: 0, attacker: 0 },
    black: { defender: 0, midfielder: 0, attacker: 0 },
  }

  // Helper: Find team with fewest players in a position
  const getTeamWithFewestInPosition = (position: Position): TeamColor => {
    return TEAM_COLORS.reduce((best, color) => {
      if (teamSlots[color][position] < teamSlots[best][position]) {
        return color
      }
      return best
    }, TEAM_COLORS[0])
  }

  // Helper: Assign player to team
  const assignPlayer = (player: Player, team: TeamColor, position: Position): boolean => {
    if (teamSlots[team][position] >= POSITION_SLOTS[position]) {
      return false // Slot full
    }
    assignments.push({
      team_color: team,
      position_slot: position,
      player_id: player.id,
    })
    teamSlots[team][position]++
    return true
  }

  // Group players by preferred position and shuffle
  const defenders = shuffle(players.filter((p) => p.preferred_position === 'defender'))
  const midfielders = shuffle(players.filter((p) => p.preferred_position === 'midfielder'))
  const attackers = shuffle(players.filter((p) => p.preferred_position === 'attacker'))

  // Phase 1: Assign players to their preferred positions (round-robin)
  const remainingDefenders: Player[] = []
  for (const player of defenders) {
    const team = getTeamWithFewestInPosition('defender')
    if (!assignPlayer(player, team, 'defender')) {
      remainingDefenders.push(player)
    }
  }

  const remainingMidfielders: Player[] = []
  for (const player of midfielders) {
    const team = getTeamWithFewestInPosition('midfielder')
    if (!assignPlayer(player, team, 'midfielder')) {
      remainingMidfielders.push(player)
    }
  }

  const remainingAttackers: Player[] = []
  for (const player of attackers) {
    const team = getTeamWithFewestInPosition('attacker')
    if (!assignPlayer(player, team, 'attacker')) {
      remainingAttackers.push(player)
    }
  }

  // Phase 2: Handle overflow - place in any available position
  const overflow = [...remainingDefenders, ...remainingMidfielders, ...remainingAttackers]
  const positions: Position[] = ['defender', 'midfielder', 'attacker']

  for (const player of overflow) {
    let assigned = false
    for (const team of TEAM_COLORS) {
      for (const position of positions) {
        if (assignPlayer(player, team, position)) {
          assigned = true
          break
        }
      }
      if (assigned) break
    }
    // If still not assigned, teams are full (40 players max)
  }

  return assignments
}

export function getPositionCounts(
  assignments: TeamAssignment[],
  teamColor: TeamColor
): Record<Position, number> {
  const counts: Record<Position, number> = {
    defender: 0,
    midfielder: 0,
    attacker: 0,
  }

  for (const assignment of assignments) {
    if (assignment.team_color === teamColor) {
      counts[assignment.position_slot]++
    }
  }

  return counts
}
