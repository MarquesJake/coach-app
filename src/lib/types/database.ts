export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clubs: {
        Row: {
          country: string
          created_at: string
          id: string
          league: string
          name: string
          ownership_model: string
          user_id: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          league: string
          name: string
          ownership_model?: string
          user_id: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          league?: string
          name?: string
          ownership_model?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_background_checks: {
        Row: {
          board_relationship_history: string | null
          coach_id: string
          created_at: string
          dressing_room_reputation: string | null
          fa_investigations: string | null
          id: string
          last_verified_at: string | null
          legal_issues: string | null
          media_reputation: string | null
          misconduct_notes: string | null
          overall_risk_rating: number | null
          verified_by: string | null
        }
        Insert: {
          board_relationship_history?: string | null
          coach_id: string
          created_at?: string
          dressing_room_reputation?: string | null
          fa_investigations?: string | null
          id?: string
          last_verified_at?: string | null
          legal_issues?: string | null
          media_reputation?: string | null
          misconduct_notes?: string | null
          overall_risk_rating?: number | null
          verified_by?: string | null
        }
        Update: {
          board_relationship_history?: string | null
          coach_id?: string
          created_at?: string
          dressing_room_reputation?: string | null
          fa_investigations?: string | null
          id?: string
          last_verified_at?: string | null
          legal_issues?: string | null
          media_reputation?: string | null
          misconduct_notes?: string | null
          overall_risk_rating?: number | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_background_checks_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_references: {
        Row: {
          coach_id: string
          contact_details: string | null
          created_at: string
          id: string
          rating: number | null
          reference_club: string | null
          reference_name: string
          reference_role: string | null
          summary: string | null
        }
        Insert: {
          coach_id: string
          contact_details?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          reference_club?: string | null
          reference_name: string
          reference_role?: string | null
          summary?: string | null
        }
        Update: {
          coach_id?: string
          contact_details?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          reference_club?: string | null
          reference_name?: string
          reference_role?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_references_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_tactical_reports: {
        Row: {
          build_up_pattern: string | null
          coach_id: string
          created_at: string
          defensive_structure: string | null
          formation_used: string | null
          id: string
          in_possession_shape: string | null
          match_observed: string | null
          notes: string | null
          out_of_possession_shape: string | null
          overall_tactical_score: number | null
          pressing_height: string | null
          transitions: string | null
        }
        Insert: {
          build_up_pattern?: string | null
          coach_id: string
          created_at?: string
          defensive_structure?: string | null
          formation_used?: string | null
          id?: string
          in_possession_shape?: string | null
          match_observed?: string | null
          notes?: string | null
          out_of_possession_shape?: string | null
          overall_tactical_score?: number | null
          pressing_height?: string | null
          transitions?: string | null
        }
        Update: {
          build_up_pattern?: string | null
          coach_id?: string
          created_at?: string
          defensive_structure?: string | null
          formation_used?: string | null
          id?: string
          in_possession_shape?: string | null
          match_observed?: string | null
          notes?: string | null
          out_of_possession_shape?: string | null
          overall_tactical_score?: number | null
          pressing_height?: string | null
          transitions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_tactical_reports_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_updates: {
        Row: {
          coach_id: string | null
          confidence: string | null
          id: string
          occurred_at: string | null
          source_note: string | null
          source_tier: string | null
          update_note: string
          update_type: string | null
        }
        Insert: {
          coach_id?: string | null
          confidence?: string | null
          id?: string
          occurred_at?: string | null
          source_note?: string | null
          source_tier?: string | null
          update_note: string
          update_type?: string | null
        }
        Update: {
          coach_id?: string | null
          confidence?: string | null
          id?: string
          occurred_at?: string | null
          source_note?: string | null
          source_tier?: string | null
          update_note?: string
          update_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_updates_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          age: number | null
          agent_relationship: number | null
          available_status: string
          board_compatibility: number | null
          build_preference: string
          club_current: string | null
          cultural_risk: number | null
          financial_feasibility: number | null
          id: string
          last_updated: string
          leadership_style: string
          league_experience: string[] | null
          media_risk: number | null
          name: string
          nationality: string | null
          overall_fit: number | null
          ownership_fit: number | null
          placement_score: number | null
          preferred_style: string
          pressing_intensity: string
          reputation_tier: string
          role_current: string
          staff_cost_estimate: string
          tactical_fit: number | null
          user_id: string
          wage_expectation: string
        }
        Insert: {
          age?: number | null
          agent_relationship?: number | null
          available_status?: string
          board_compatibility?: number | null
          build_preference: string
          club_current?: string | null
          cultural_risk?: number | null
          financial_feasibility?: number | null
          id?: string
          last_updated?: string
          leadership_style: string
          league_experience?: string[] | null
          media_risk?: number | null
          name: string
          nationality?: string | null
          overall_fit?: number | null
          ownership_fit?: number | null
          placement_score?: number | null
          preferred_style: string
          pressing_intensity: string
          reputation_tier?: string
          role_current?: string
          staff_cost_estimate: string
          tactical_fit?: number | null
          user_id?: string
          wage_expectation: string
        }
        Update: {
          age?: number | null
          agent_relationship?: number | null
          available_status?: string
          board_compatibility?: number | null
          build_preference?: string
          club_current?: string | null
          cultural_risk?: number | null
          financial_feasibility?: number | null
          id?: string
          last_updated?: string
          leadership_style?: string
          league_experience?: string[] | null
          media_risk?: number | null
          name?: string
          nationality?: string | null
          overall_fit?: number | null
          ownership_fit?: number | null
          placement_score?: number | null
          preferred_style?: string
          pressing_intensity?: string
          reputation_tier?: string
          role_current?: string
          staff_cost_estimate?: string
          tactical_fit?: number | null
          user_id?: string
          wage_expectation?: string
        }
        Relationships: []
      }
      mandate_deliverables: {
        Row: {
          created_at: string
          due_date: string
          id: string
          item: string
          mandate_id: string
          status: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          item: string
          mandate_id: string
          status: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          item?: string
          mandate_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandate_deliverables_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      mandate_shortlist: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          mandate_id: string
          placement_probability: number
          risk_rating: string
          status: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          mandate_id: string
          placement_probability: number
          risk_rating: string
          status: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          mandate_id?: string
          placement_probability?: number
          risk_rating?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandate_shortlist_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_shortlist_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      mandates: {
        Row: {
          board_risk_appetite: string
          budget_band: string
          club_id: string
          confidentiality_level: string
          created_at: string
          engagement_date: string
          id: string
          key_stakeholders: string[]
          ownership_structure: string
          priority: string
          status: string
          strategic_objective: string
          succession_timeline: string
          target_completion_date: string
          user_id: string
        }
        Insert: {
          board_risk_appetite: string
          budget_band: string
          club_id: string
          confidentiality_level?: string
          created_at?: string
          engagement_date: string
          id?: string
          key_stakeholders?: string[]
          ownership_structure: string
          priority: string
          status: string
          strategic_objective: string
          succession_timeline: string
          target_completion_date: string
          user_id: string
        }
        Update: {
          board_risk_appetite?: string
          budget_band?: string
          club_id?: string
          confidentiality_level?: string
          created_at?: string
          engagement_date?: string
          id?: string
          key_stakeholders?: string[]
          ownership_structure?: string
          priority?: string
          status?: string
          strategic_objective?: string
          succession_timeline?: string
          target_completion_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandates_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          availability_score: number | null
          coach_id: string
          created_at: string | null
          cultural_fit_score: number | null
          financial_fit_score: number | null
          id: string
          overall_score: number | null
          tactical_fit_score: number | null
          vacancy_id: string
        }
        Insert: {
          availability_score?: number | null
          coach_id: string
          created_at?: string | null
          cultural_fit_score?: number | null
          financial_fit_score?: number | null
          id?: string
          overall_score?: number | null
          tactical_fit_score?: number | null
          vacancy_id: string
        }
        Update: {
          availability_score?: number | null
          coach_id?: string
          created_at?: string | null
          cultural_fit_score?: number | null
          financial_fit_score?: number | null
          id?: string
          overall_score?: number | null
          tactical_fit_score?: number | null
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancies: {
        Row: {
          budget_range: string
          build_style: string
          club_id: string
          created_at: string
          id: string
          league_experience_required: boolean | null
          objective: string
          pressing_level: string
          role_type: string
          staff_budget: string
          status: string
          style_of_play: string
          timeline: string
        }
        Insert: {
          budget_range: string
          build_style: string
          club_id: string
          created_at?: string
          id?: string
          league_experience_required?: boolean | null
          objective: string
          pressing_level: string
          role_type?: string
          staff_budget: string
          status?: string
          style_of_play: string
          timeline: string
        }
        Update: {
          budget_range?: string
          build_style?: string
          club_id?: string
          created_at?: string
          id?: string
          league_experience_required?: boolean | null
          objective?: string
          pressing_level?: string
          role_type?: string
          staff_budget?: string
          status?: string
          style_of_play?: string
          timeline?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
