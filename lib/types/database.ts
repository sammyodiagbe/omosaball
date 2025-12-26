export type Position = 'defender' | 'midfielder' | 'attacker'
export type TeamColor = 'red' | 'white' | 'blue' | 'black'
export type GameStatus = 'scheduled' | 'cancelled' | 'completed'
export type RSVPStatus = 'pending' | 'confirmed' | 'declined' | 'waitlist'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          preferred_position: Position
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          preferred_position: Position
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          preferred_position?: Position
          phone?: string | null
          updated_at?: string
        }
      }
      games: {
        Row: {
          id: string
          date: string
          time: string
          location: string
          status: GameStatus
          max_players: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          time?: string
          location?: string
          status?: GameStatus
          max_players?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          date?: string
          time?: string
          location?: string
          status?: GameStatus
          max_players?: number
          notes?: string | null
          updated_at?: string
        }
      }
      rsvps: {
        Row: {
          id: string
          game_id: string
          player_id: string | null
          guest_name: string | null
          guest_phone: string | null
          guest_position: Position | null
          status: RSVPStatus
          has_paid: boolean
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guest_position?: Position | null
          status?: RSVPStatus
          has_paid?: boolean
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: RSVPStatus
          has_paid?: boolean
          paid_at?: string | null
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          game_id: string
          color: TeamColor
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          color: TeamColor
          created_at?: string
        }
        Update: {
          color?: TeamColor
        }
      }
      team_assignments: {
        Row: {
          id: string
          team_id: string
          player_id: string
          position_slot: Position | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          player_id: string
          position_slot?: Position | null
          created_at?: string
        }
        Update: {
          position_slot?: Position | null
        }
      }
      admin_settings: {
        Row: {
          id: number
          password_hash: string
          updated_at: string
        }
        Insert: {
          id?: number
          password_hash: string
          updated_at?: string
        }
        Update: {
          password_hash?: string
          updated_at?: string
        }
      }
      recurring_schedule: {
        Row: {
          id: string
          day_of_week: number
          time: string
          location: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          day_of_week: number
          time?: string
          location?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          day_of_week?: number
          time?: string
          location?: string
          is_active?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Game = Database['public']['Tables']['games']['Row']
export type RSVP = Database['public']['Tables']['rsvps']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type TeamAssignment = Database['public']['Tables']['team_assignments']['Row']

// Extended types with relations
export type RSVPWithPlayer = RSVP & {
  profiles: Profile | null
}

export type TeamWithAssignments = Team & {
  team_assignments: (TeamAssignment & {
    profiles: Profile
  })[]
}

export type GameWithDetails = Game & {
  rsvps: RSVPWithPlayer[]
  teams: TeamWithAssignments[]
}
