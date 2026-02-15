export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string
          user_id: string
          name: string
          league: string
          country: string
          ownership_model: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          league: string
          country: string
          ownership_model?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          league?: string
          country?: string
          ownership_model?: string
          created_at?: string
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          id: string
          club_id: string
          role_type: string
          objective: string
          style_of_play: string
          pressing_level: string
          build_style: string
          budget_range: string
          staff_budget: string
          timeline: string
          league_experience_required: boolean
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          club_id: string
          role_type?: string
          objective: string
          style_of_play: string
          pressing_level: string
          build_style: string
          budget_range: string
          staff_budget: string
          timeline: string
          league_experience_required?: boolean
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          club_id?: string
          role_type?: string
          objective?: string
          style_of_play?: string
          pressing_level?: string
          build_style?: string
          budget_range?: string
          staff_budget?: string
          timeline?: string
          league_experience_required?: boolean
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          }
        ]
      }
      coaches: {
        Row: {
          id: string
          name: string
          age: number | null
          nationality: string | null
          current_role: string
          current_club: string | null
          preferred_style: string
          pressing_intensity: string
          build_preference: string
          leadership_style: string
          wage_expectation: string
          staff_cost_estimate: string
          available_status: string
          reputation_tier: string
          league_experience: string[]
          last_updated: string
        }
        Insert: {
          id?: string
          name: string
          age?: number | null
          nationality?: string | null
          current_role?: string
          current_club?: string | null
          preferred_style: string
          pressing_intensity: string
          build_preference: string
          leadership_style: string
          wage_expectation: string
          staff_cost_estimate: string
          available_status?: string
          reputation_tier?: string
          league_experience?: string[]
          last_updated?: string
        }
        Update: {
          id?: string
          name?: string
          age?: number | null
          nationality?: string | null
          current_role?: string
          current_club?: string | null
          preferred_style?: string
          pressing_intensity?: string
          build_preference?: string
          leadership_style?: string
          wage_expectation?: string
          staff_cost_estimate?: string
          available_status?: string
          reputation_tier?: string
          league_experience?: string[]
          last_updated?: string
        }
        Relationships: []
      }
      coach_updates: {
        Row: {
          id: string
          coach_id: string
          update_note: string
          update_type: string
          availability_change: string | null
          reputation_shift: string | null
          date_added: string
        }
        Insert: {
          id?: string
          coach_id: string
          update_note: string
          update_type?: string
          availability_change?: string | null
          reputation_shift?: string | null
          date_added?: string
        }
        Update: {
          id?: string
          coach_id?: string
          update_note?: string
          update_type?: string
          availability_change?: string | null
          reputation_shift?: string | null
          date_added?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_updates_coach_id_fkey"
            columns: ["coach_id"]
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          }
        ]
      }
      matches: {
        Row: {
          id: string
          vacancy_id: string
          coach_id: string
          tactical_fit_score: number
          squad_fit_score: number
          financial_fit_score: number
          cultural_fit_score: number
          availability_score: number
          overall_score: number
          created_at: string
        }
        Insert: {
          id?: string
          vacancy_id: string
          coach_id: string
          tactical_fit_score: number
          squad_fit_score: number
          financial_fit_score: number
          cultural_fit_score: number
          availability_score: number
          overall_score: number
          created_at?: string
        }
        Update: {
          id?: string
          vacancy_id?: string
          coach_id?: string
          tactical_fit_score?: number
          squad_fit_score?: number
          financial_fit_score?: number
          cultural_fit_score?: number
          availability_score?: number
          overall_score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_vacancy_id_fkey"
            columns: ["vacancy_id"]
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_coach_id_fkey"
            columns: ["coach_id"]
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Club = Database['public']['Tables']['clubs']['Row']
export type Vacancy = Database['public']['Tables']['vacancies']['Row']
export type Coach = Database['public']['Tables']['coaches']['Row']
export type CoachUpdate = Database['public']['Tables']['coach_updates']['Row']
export type Match = Database['public']['Tables']['matches']['Row']

export type MatchWithCoach = Match & {
  coaches: Coach
}

export type VacancyWithClub = Vacancy & {
  clubs: Club
}
