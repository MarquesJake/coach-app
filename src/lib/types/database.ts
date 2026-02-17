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
          placement_score: number | null
          board_compatibility: number | null
          ownership_fit: number | null
          cultural_risk: number | null
          agent_relationship: number | null
          media_risk: number | null
          overall_fit: number | null
          tactical_fit: number | null
          financial_feasibility: number | null
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
          placement_score?: number | null
          board_compatibility?: number | null
          ownership_fit?: number | null
          cultural_risk?: number | null
          agent_relationship?: number | null
          media_risk?: number | null
          overall_fit?: number | null
          tactical_fit?: number | null
          financial_feasibility?: number | null
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
          placement_score?: number | null
          board_compatibility?: number | null
          ownership_fit?: number | null
          cultural_risk?: number | null
          agent_relationship?: number | null
          media_risk?: number | null
          overall_fit?: number | null
          tactical_fit?: number | null
          financial_feasibility?: number | null
        }
        Relationships: []
      }
      coach_updates: {
        Row: {
          id: string
          coach_id: string
          update_note: string
          update_type: string
          occurred_at: string | null
          confidence: string | null
          source_tier: string | null
          source_note: string | null
        }
        Insert: {
          id?: string
          coach_id: string
          update_note: string
          update_type?: string
          occurred_at?: string | null
          confidence?: string | null
          source_tier?: string | null
          source_note?: string | null
        }
        Update: {
          id?: string
          coach_id?: string
          update_note?: string
          update_type?: string
          occurred_at?: string | null
          confidence?: string | null
          source_tier?: string | null
          source_note?: string | null
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
      mandates: {
        Row: {
          id: string
          user_id: string
          club_id: string
          status: string
          engagement_date: string
          target_completion_date: string
          priority: string
          ownership_structure: string
          budget_band: string
          strategic_objective: string
          board_risk_appetite: string
          succession_timeline: string
          key_stakeholders: string[]
          confidentiality_level: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          status: string
          engagement_date: string
          target_completion_date: string
          priority: string
          ownership_structure: string
          budget_band: string
          strategic_objective: string
          board_risk_appetite: string
          succession_timeline: string
          key_stakeholders?: string[]
          confidentiality_level?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          status?: string
          engagement_date?: string
          target_completion_date?: string
          priority?: string
          ownership_structure?: string
          budget_band?: string
          strategic_objective?: string
          board_risk_appetite?: string
          succession_timeline?: string
          key_stakeholders?: string[]
          confidentiality_level?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandates_club_id_fkey"
            columns: ["club_id"]
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          }
        ]
      }
      mandate_shortlist: {
        Row: {
          id: string
          mandate_id: string
          coach_id: string
          placement_probability: number
          risk_rating: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          mandate_id: string
          coach_id: string
          placement_probability: number
          risk_rating: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          mandate_id?: string
          coach_id?: string
          placement_probability?: number
          risk_rating?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandate_shortlist_coach_id_fkey"
            columns: ["coach_id"]
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_shortlist_mandate_id_fkey"
            columns: ["mandate_id"]
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          }
        ]
      }
      mandate_deliverables: {
        Row: {
          id: string
          mandate_id: string
          item: string
          due_date: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          mandate_id: string
          item: string
          due_date: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          mandate_id?: string
          item?: string
          due_date?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandate_deliverables_mandate_id_fkey"
            columns: ["mandate_id"]
            referencedRelation: "mandates"
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
export type Mandate = Database['public']['Tables']['mandates']['Row']
export type MandateShortlist = Database['public']['Tables']['mandate_shortlist']['Row']
export type MandateDeliverable = Database['public']['Tables']['mandate_deliverables']['Row']
export type Match = Database['public']['Tables']['matches']['Row']

export type MatchWithCoach = Match & {
  coaches: Coach
}

export type VacancyWithClub = Vacancy & {
  clubs: Club
}
