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
      activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_club_relationships: {
        Row: {
          agent_id: string
          club_id: string
          created_at: string | null
          ended_on: string | null
          id: string
          influence_level: number | null
          notes: string | null
          relationship_type: string | null
          started_on: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          club_id: string
          created_at?: string | null
          ended_on?: string | null
          id?: string
          influence_level?: number | null
          notes?: string | null
          relationship_type?: string | null
          started_on?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          club_id?: string
          created_at?: string | null
          ended_on?: string | null
          id?: string
          influence_level?: number | null
          notes?: string | null
          relationship_type?: string | null
          started_on?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_club_relationships_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_club_relationships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_deals: {
        Row: {
          agent_id: string
          club_id: string | null
          coach_id: string | null
          created_at: string
          deal_type: string
          id: string
          notes: string | null
          occurred_on: string | null
          season: string | null
          user_id: string
          value_band: string | null
        }
        Insert: {
          agent_id: string
          club_id?: string | null
          coach_id?: string | null
          created_at?: string
          deal_type: string
          id?: string
          notes?: string | null
          occurred_on?: string | null
          season?: string | null
          user_id: string
          value_band?: string | null
        }
        Update: {
          agent_id?: string
          club_id?: string | null
          coach_id?: string | null
          created_at?: string
          deal_type?: string
          id?: string
          notes?: string | null
          occurred_on?: string | null
          season?: string | null
          user_id?: string
          value_band?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_deals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_deals_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_deals_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_interactions: {
        Row: {
          agent_id: string
          channel: string | null
          confidence: number | null
          created_at: string
          detail: string | null
          direction: string | null
          id: string
          occurred_at: string
          sentiment: string | null
          summary: string
          topic: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          channel?: string | null
          confidence?: number | null
          created_at?: string
          detail?: string | null
          direction?: string | null
          id?: string
          occurred_at?: string
          sentiment?: string | null
          summary: string
          topic?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          channel?: string | null
          confidence?: number | null
          created_at?: string
          detail?: string | null
          direction?: string | null
          id?: string
          occurred_at?: string
          sentiment?: string | null
          summary?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_interactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agency_name: string | null
          base_location: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          influence_score: number | null
          languages: string[] | null
          markets: string[] | null
          notes: string | null
          phone: string | null
          preferred_contact_channel: string | null
          reliability_score: number | null
          responsiveness_score: number | null
          risk_flag: boolean | null
          risk_notes: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          agency_name?: string | null
          base_location?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          influence_score?: number | null
          languages?: string[] | null
          markets?: string[] | null
          notes?: string | null
          phone?: string | null
          preferred_contact_channel?: string | null
          reliability_score?: number | null
          responsiveness_score?: number | null
          risk_flag?: boolean | null
          risk_notes?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          agency_name?: string | null
          base_location?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          influence_score?: number | null
          languages?: string[] | null
          markets?: string[] | null
          notes?: string | null
          phone?: string | null
          preferred_contact_channel?: string | null
          reliability_score?: number | null
          responsiveness_score?: number | null
          risk_flag?: boolean | null
          risk_notes?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          detail: string | null
          entity_id: string
          entity_type: string
          id: string
          is_seen: boolean
          org_id: string | null
          seen_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          detail?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_seen?: boolean
          org_id?: string | null
          seen_at?: string | null
          title?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          detail?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_seen?: boolean
          org_id?: string | null
          seen_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      club_coaching_history: {
        Row: {
          club_id: string
          coach_name: string
          created_at: string
          data_source: string
          end_date: string | null
          end_date_approx: boolean
          id: string
          reason_for_exit: string | null
          start_date: string | null
          start_date_approx: boolean
          style_tags: string[]
          user_id: string
          wikidata_id: string | null
        }
        Insert: {
          club_id: string
          coach_name: string
          created_at?: string
          data_source?: string
          end_date?: string | null
          end_date_approx?: boolean
          id?: string
          reason_for_exit?: string | null
          start_date?: string | null
          start_date_approx?: boolean
          style_tags?: string[]
          user_id: string
          wikidata_id?: string | null
        }
        Update: {
          club_id?: string
          coach_name?: string
          created_at?: string
          data_source?: string
          end_date?: string | null
          end_date_approx?: boolean
          id?: string
          reason_for_exit?: string | null
          start_date?: string | null
          start_date_approx?: boolean
          style_tags?: string[]
          user_id?: string
          wikidata_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_coaching_history_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_data_sync_log: {
        Row: {
          club_id: string
          error: string | null
          id: string
          result: Json | null
          sync_at: string
          sync_type: string
          user_id: string
        }
        Insert: {
          club_id: string
          error?: string | null
          id?: string
          result?: Json | null
          sync_at?: string
          sync_type: string
          user_id: string
        }
        Update: {
          club_id?: string
          error?: string | null
          id?: string
          result?: Json | null
          sync_at?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_data_sync_log_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_season_results: {
        Row: {
          club_id: string
          created_at: string
          data_source: string
          goals_against: number | null
          goals_for: number | null
          id: string
          league_label: string | null
          league_position: number | null
          points: number | null
          season: string
          user_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          data_source?: string
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_label?: string | null
          league_position?: number | null
          points?: number | null
          season: string
          user_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          data_source?: string
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_label?: string | null
          league_position?: number | null
          points?: number | null
          season?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_season_results_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_squad: {
        Row: {
          age: number | null
          club_id: string
          id: string
          name: string
          number: number | null
          photo_url: string | null
          player_id: number
          position: string | null
          season: string
          synced_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          club_id: string
          id?: string
          name: string
          number?: number | null
          photo_url?: string | null
          player_id: number
          position?: string | null
          season?: string
          synced_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          club_id?: string
          id?: string
          name?: string
          number?: number | null
          photo_url?: string | null
          player_id?: number
          position?: string | null
          season?: string
          synced_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_squad_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_transfers: {
        Row: {
          club_id: string
          direction: string
          fee_amount: number | null
          fee_currency: string | null
          id: string
          other_club: string | null
          player_id: number | null
          player_name: string
          season: string | null
          synced_at: string
          transfer_date: string | null
          transfer_type: string | null
          user_id: string
        }
        Insert: {
          club_id: string
          direction: string
          fee_amount?: number | null
          fee_currency?: string | null
          id?: string
          other_club?: string | null
          player_id?: number | null
          player_name: string
          season?: string | null
          synced_at?: string
          transfer_date?: string | null
          transfer_type?: string | null
          user_id: string
        }
        Update: {
          club_id?: string
          direction?: string
          fee_amount?: number | null
          fee_currency?: string | null
          id?: string
          other_club?: string | null
          player_id?: number | null
          player_name?: string
          season?: string | null
          synced_at?: string
          transfer_date?: string | null
          transfer_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_transfers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          badge_url: string | null
          board_risk_tolerance: string | null
          budget_ceiling: string | null
          build_model: string | null
          coaches_synced_at: string | null
          country: string
          created_at: string
          current_manager: string | null
          description: string | null
          development_vs_win_now: string | null
          environment_assessment: string | null
          external_id: string | null
          external_source: string | null
          founded_year: string | null
          governance_complexity: string | null
          id: string
          id_league: string | null
          instability_risk: string | null
          last_synced_at: string | null
          league: string
          market_reputation: string | null
          media_pressure: string | null
          name: string
          notes: string | null
          ownership_model: string
          ownership_style: string | null
          pressing_model: string | null
          sporting_structure: string | null
          squad_synced_at: string | null
          stadium: string | null
          stadium_capacity: string | null
          stadium_location: string | null
          strategic_priority: string | null
          tactical_model: string | null
          tier: string | null
          transfers_synced_at: string | null
          updated_at: string
          user_id: string
          website: string | null
          wikidata_id: string | null
          wikidata_synced_at: string | null
        }
        Insert: {
          badge_url?: string | null
          board_risk_tolerance?: string | null
          budget_ceiling?: string | null
          build_model?: string | null
          coaches_synced_at?: string | null
          country: string
          created_at?: string
          current_manager?: string | null
          description?: string | null
          development_vs_win_now?: string | null
          environment_assessment?: string | null
          external_id?: string | null
          external_source?: string | null
          founded_year?: string | null
          governance_complexity?: string | null
          id?: string
          id_league?: string | null
          instability_risk?: string | null
          last_synced_at?: string | null
          league: string
          market_reputation?: string | null
          media_pressure?: string | null
          name: string
          notes?: string | null
          ownership_model?: string
          ownership_style?: string | null
          pressing_model?: string | null
          sporting_structure?: string | null
          squad_synced_at?: string | null
          stadium?: string | null
          stadium_capacity?: string | null
          stadium_location?: string | null
          strategic_priority?: string | null
          tactical_model?: string | null
          tier?: string | null
          transfers_synced_at?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          wikidata_id?: string | null
          wikidata_synced_at?: string | null
        }
        Update: {
          badge_url?: string | null
          board_risk_tolerance?: string | null
          budget_ceiling?: string | null
          build_model?: string | null
          coaches_synced_at?: string | null
          country?: string
          created_at?: string
          current_manager?: string | null
          description?: string | null
          development_vs_win_now?: string | null
          environment_assessment?: string | null
          external_id?: string | null
          external_source?: string | null
          founded_year?: string | null
          governance_complexity?: string | null
          id?: string
          id_league?: string | null
          instability_risk?: string | null
          last_synced_at?: string | null
          league?: string
          market_reputation?: string | null
          media_pressure?: string | null
          name?: string
          notes?: string | null
          ownership_model?: string
          ownership_style?: string | null
          pressing_model?: string | null
          sporting_structure?: string | null
          squad_synced_at?: string | null
          stadium?: string | null
          stadium_capacity?: string | null
          stadium_location?: string | null
          strategic_priority?: string | null
          tactical_model?: string | null
          tier?: string | null
          transfers_synced_at?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          wikidata_id?: string | null
          wikidata_synced_at?: string | null
        }
        Relationships: []
      }
      coach_agents: {
        Row: {
          agent_id: string
          coach_id: string
          created_at: string | null
          ended_on: string | null
          id: string
          notes: string | null
          relationship_strength: number | null
          relationship_type: string | null
          started_on: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          coach_id: string
          created_at?: string | null
          ended_on?: string | null
          id?: string
          notes?: string | null
          relationship_strength?: number | null
          relationship_type?: string | null
          started_on?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          coach_id?: string
          created_at?: string | null
          ended_on?: string | null
          id?: string
          notes?: string | null
          relationship_strength?: number | null
          relationship_type?: string | null
          started_on?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_agents_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
      coach_staff_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role_in_group: string | null
          staff_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role_in_group?: string | null
          staff_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role_in_group?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_staff_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "coach_staff_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_staff_group_members_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_staff_groups: {
        Row: {
          coach_id: string
          created_at: string
          description: string | null
          group_name: string
          id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          description?: string | null
          group_name: string
          id?: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_staff_groups_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_staff_history: {
        Row: {
          before_after_observation: string | null
          club_id: string | null
          club_name: string
          coach_id: string
          confidence: number | null
          created_at: string
          ended_on: string | null
          followed_from_previous: boolean | null
          id: string
          impact_summary: string | null
          relationship_strength: number | null
          role_title: string
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_type: string | null
          staff_id: string
          started_on: string | null
          times_worked_together: number | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          before_after_observation?: string | null
          club_id?: string | null
          club_name: string
          coach_id: string
          confidence?: number | null
          created_at?: string
          ended_on?: string | null
          followed_from_previous?: boolean | null
          id?: string
          impact_summary?: string | null
          relationship_strength?: number | null
          role_title: string
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          staff_id: string
          started_on?: string | null
          times_worked_together?: number | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          before_after_observation?: string | null
          club_id?: string | null
          club_name?: string
          coach_id?: string
          confidence?: number | null
          created_at?: string
          ended_on?: string | null
          followed_from_previous?: boolean | null
          id?: string
          impact_summary?: string | null
          relationship_strength?: number | null
          role_title?: string
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          staff_id?: string
          started_on?: string | null
          times_worked_together?: number | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_staff_history_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_staff_history_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_staff_history_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_stints: {
        Row: {
          appointment_context: string | null
          club_id: string | null
          club_name: string
          coach_id: string
          country: string | null
          created_at: string
          ended_on: string | null
          exit_context: string | null
          id: string
          league: string | null
          notable_outcomes: string | null
          performance_summary: string | null
          points_per_game: number | null
          role_title: string
          started_on: string | null
          style_summary: string | null
          win_rate: number | null
        }
        Insert: {
          appointment_context?: string | null
          club_id?: string | null
          club_name: string
          coach_id: string
          country?: string | null
          created_at?: string
          ended_on?: string | null
          exit_context?: string | null
          id?: string
          league?: string | null
          notable_outcomes?: string | null
          performance_summary?: string | null
          points_per_game?: number | null
          role_title: string
          started_on?: string | null
          style_summary?: string | null
          win_rate?: number | null
        }
        Update: {
          appointment_context?: string | null
          club_id?: string | null
          club_name?: string
          coach_id?: string
          country?: string | null
          created_at?: string
          ended_on?: string | null
          exit_context?: string | null
          id?: string
          league?: string | null
          notable_outcomes?: string | null
          performance_summary?: string | null
          points_per_game?: number | null
          role_title?: string
          started_on?: string | null
          style_summary?: string | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_stints_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_stints_coach_id_fkey"
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          created_at: string
          id: string
          occurred_at: string | null
          source_note: string | null
          source_tier: string | null
          update_note: string
          update_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coach_id?: string | null
          confidence?: string | null
          created_at?: string
          id?: string
          occurred_at?: string | null
          source_note?: string | null
          source_tier?: string | null
          update_note: string
          update_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coach_id?: string | null
          confidence?: string | null
          created_at?: string
          id?: string
          occurred_at?: string | null
          source_note?: string | null
          source_tier?: string | null
          update_note?: string
          update_type?: string | null
          updated_at?: string
          user_id?: string | null
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
          academy_integration: string | null
          adaptability_score: number | null
          age: number | null
          agent_contact: string | null
          agent_name: string | null
          agent_relationship: number | null
          availability_status: string | null
          available_status: string
          base_location: string | null
          board_compatibility: number | null
          board_compatibility_score: number | null
          build_preference: string
          club_current: string | null
          comms_profile: string | null
          compensation_expectation: string | null
          compliance_notes: string | null
          conflict_history: string | null
          created_at: string
          cultural_alignment_score: number | null
          cultural_risk: number | null
          date_of_birth: string | null
          development_score: number | null
          dressing_room_risk_score: number | null
          due_diligence_summary: string | null
          family_context: string | null
          financial_feasibility: number | null
          financial_risk_score: number | null
          id: string
          integrity_risk_flag: boolean | null
          intelligence_confidence: number | null
          languages: string[] | null
          last_updated: string
          leadership_score: number | null
          leadership_style: string
          league_experience: string[] | null
          legal_risk_flag: boolean | null
          market_status: string | null
          media_risk: number | null
          media_risk_score: number | null
          media_style: string | null
          name: string
          nationality: string | null
          overall_fit: number | null
          overall_manual_score: number | null
          ownership_fit: number | null
          placement_score: number | null
          player_development_model: string | null
          preferred_name: string | null
          preferred_style: string
          preferred_systems: string[] | null
          pressing_intensity: string
          recruitment_collaboration: string | null
          recruitment_fit_score: number | null
          relocation_flexibility: string | null
          reputation_tier: string
          rest_defence_model: string | null
          role_current: string
          safeguarding_risk_flag: boolean | null
          set_piece_approach: string | null
          staff_cost_estimate: string
          staff_management_style: string | null
          tactical_fit: number | null
          tactical_fit_score: number | null
          tactical_identity: string | null
          training_methodology: string | null
          transition_model: string | null
          updated_at: string
          user_id: string
          wage_expectation: string
        }
        Insert: {
          academy_integration?: string | null
          adaptability_score?: number | null
          age?: number | null
          agent_contact?: string | null
          agent_name?: string | null
          agent_relationship?: number | null
          availability_status?: string | null
          available_status?: string
          base_location?: string | null
          board_compatibility?: number | null
          board_compatibility_score?: number | null
          build_preference: string
          club_current?: string | null
          comms_profile?: string | null
          compensation_expectation?: string | null
          compliance_notes?: string | null
          conflict_history?: string | null
          created_at?: string
          cultural_alignment_score?: number | null
          cultural_risk?: number | null
          date_of_birth?: string | null
          development_score?: number | null
          dressing_room_risk_score?: number | null
          due_diligence_summary?: string | null
          family_context?: string | null
          financial_feasibility?: number | null
          financial_risk_score?: number | null
          id?: string
          integrity_risk_flag?: boolean | null
          intelligence_confidence?: number | null
          languages?: string[] | null
          last_updated?: string
          leadership_score?: number | null
          leadership_style: string
          league_experience?: string[] | null
          legal_risk_flag?: boolean | null
          market_status?: string | null
          media_risk?: number | null
          media_risk_score?: number | null
          media_style?: string | null
          name: string
          nationality?: string | null
          overall_fit?: number | null
          overall_manual_score?: number | null
          ownership_fit?: number | null
          placement_score?: number | null
          player_development_model?: string | null
          preferred_name?: string | null
          preferred_style: string
          preferred_systems?: string[] | null
          pressing_intensity: string
          recruitment_collaboration?: string | null
          recruitment_fit_score?: number | null
          relocation_flexibility?: string | null
          reputation_tier?: string
          rest_defence_model?: string | null
          role_current?: string
          safeguarding_risk_flag?: boolean | null
          set_piece_approach?: string | null
          staff_cost_estimate: string
          staff_management_style?: string | null
          tactical_fit?: number | null
          tactical_fit_score?: number | null
          tactical_identity?: string | null
          training_methodology?: string | null
          transition_model?: string | null
          updated_at?: string
          user_id?: string
          wage_expectation: string
        }
        Update: {
          academy_integration?: string | null
          adaptability_score?: number | null
          age?: number | null
          agent_contact?: string | null
          agent_name?: string | null
          agent_relationship?: number | null
          availability_status?: string | null
          available_status?: string
          base_location?: string | null
          board_compatibility?: number | null
          board_compatibility_score?: number | null
          build_preference?: string
          club_current?: string | null
          comms_profile?: string | null
          compensation_expectation?: string | null
          compliance_notes?: string | null
          conflict_history?: string | null
          created_at?: string
          cultural_alignment_score?: number | null
          cultural_risk?: number | null
          date_of_birth?: string | null
          development_score?: number | null
          dressing_room_risk_score?: number | null
          due_diligence_summary?: string | null
          family_context?: string | null
          financial_feasibility?: number | null
          financial_risk_score?: number | null
          id?: string
          integrity_risk_flag?: boolean | null
          intelligence_confidence?: number | null
          languages?: string[] | null
          last_updated?: string
          leadership_score?: number | null
          leadership_style?: string
          league_experience?: string[] | null
          legal_risk_flag?: boolean | null
          market_status?: string | null
          media_risk?: number | null
          media_risk_score?: number | null
          media_style?: string | null
          name?: string
          nationality?: string | null
          overall_fit?: number | null
          overall_manual_score?: number | null
          ownership_fit?: number | null
          placement_score?: number | null
          player_development_model?: string | null
          preferred_name?: string | null
          preferred_style?: string
          preferred_systems?: string[] | null
          pressing_intensity?: string
          recruitment_collaboration?: string | null
          recruitment_fit_score?: number | null
          relocation_flexibility?: string | null
          reputation_tier?: string
          rest_defence_model?: string | null
          role_current?: string
          safeguarding_risk_flag?: boolean | null
          set_piece_approach?: string | null
          staff_cost_estimate?: string
          staff_management_style?: string | null
          tactical_fit?: number | null
          tactical_fit_score?: number | null
          tactical_identity?: string | null
          training_methodology?: string | null
          transition_model?: string | null
          updated_at?: string
          user_id?: string
          wage_expectation?: string
        }
        Relationships: []
      }
      config_availability_statuses: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_build_preferences: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_formation_presets: {
        Row: {
          created_at: string
          formation: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          formation?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          formation?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_lists: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          list_key: string
          notes: string | null
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          list_key: string
          notes?: string | null
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          list_key?: string
          notes?: string | null
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      config_mandate_preference_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_pipeline_stages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_preferred_styles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_pressing_intensity: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_reputation_tiers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      config_scoring_weights: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      demo_seeds: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      intelligence_items: {
        Row: {
          category: string | null
          confidence: number | null
          created_at: string
          detail: string | null
          entity_id: string
          entity_type: string
          id: string
          occurred_at: string | null
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_tier: string | null
          source_type: string | null
          title: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          detail?: string | null
          entity_id: string
          entity_type: string
          id?: string
          occurred_at?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_tier?: string | null
          source_type?: string | null
          title: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          confidence?: number | null
          created_at?: string
          detail?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          occurred_at?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_tier?: string | null
          source_type?: string | null
          title?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date: string
          id?: string
          item: string
          mandate_id: string
          status: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          id?: string
          item?: string
          mandate_id?: string
          status?: string
          updated_at?: string
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
      mandate_longlist: {
        Row: {
          coach_id: string
          created_at: string
          fit_explanation: string | null
          id: string
          mandate_id: string
          ranking_score: number | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          fit_explanation?: string | null
          id?: string
          mandate_id: string
          ranking_score?: number | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          fit_explanation?: string | null
          id?: string
          mandate_id?: string
          ranking_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mandate_longlist_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_longlist_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      mandate_shortlist: {
        Row: {
          candidate_stage: string
          coach_id: string
          created_at: string
          fit_communication: string | null
          fit_cultural: string | null
          fit_level: string | null
          fit_network: string | null
          fit_notes: string | null
          fit_tactical: string | null
          id: string
          mandate_id: string
          network_recommender: string | null
          network_relationship: string | null
          network_source: string | null
          notes: string | null
          placement_probability: number
          risk_rating: string
          status: string
          updated_at: string
        }
        Insert: {
          candidate_stage?: string
          coach_id: string
          created_at?: string
          fit_communication?: string | null
          fit_cultural?: string | null
          fit_level?: string | null
          fit_network?: string | null
          fit_notes?: string | null
          fit_tactical?: string | null
          id?: string
          mandate_id: string
          network_recommender?: string | null
          network_relationship?: string | null
          network_source?: string | null
          notes?: string | null
          placement_probability: number
          risk_rating: string
          status: string
          updated_at?: string
        }
        Update: {
          candidate_stage?: string
          coach_id?: string
          created_at?: string
          fit_communication?: string | null
          fit_cultural?: string | null
          fit_level?: string | null
          fit_network?: string | null
          fit_notes?: string | null
          fit_tactical?: string | null
          id?: string
          mandate_id?: string
          network_recommender?: string | null
          network_relationship?: string | null
          network_source?: string | null
          notes?: string | null
          placement_probability?: number
          risk_rating?: string
          status?: string
          updated_at?: string
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
          board_risk_appetite: string | null
          budget_band: string | null
          build_preference_required: string | null
          club_id: string | null
          club_text: string | null
          confidentiality_level: string | null
          created_at: string
          custom_club_name: string | null
          engagement_date: string
          id: string
          key_stakeholders: string[]
          language_requirements: string[] | null
          leadership_profile_required: string | null
          ownership_structure: string | null
          pipeline_stage: string | null
          pressing_intensity_required: string | null
          priority: string
          relocation_required: boolean | null
          risk_tolerance: string | null
          status: string
          strategic_objective: string | null
          succession_timeline: string | null
          tactical_model_required: string | null
          target_completion_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_risk_appetite?: string | null
          budget_band?: string | null
          build_preference_required?: string | null
          club_id?: string | null
          club_text?: string | null
          confidentiality_level?: string | null
          created_at?: string
          custom_club_name?: string | null
          engagement_date: string
          id?: string
          key_stakeholders?: string[]
          language_requirements?: string[] | null
          leadership_profile_required?: string | null
          ownership_structure?: string | null
          pipeline_stage?: string | null
          pressing_intensity_required?: string | null
          priority: string
          relocation_required?: boolean | null
          risk_tolerance?: string | null
          status: string
          strategic_objective?: string | null
          succession_timeline?: string | null
          tactical_model_required?: string | null
          target_completion_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_risk_appetite?: string | null
          budget_band?: string | null
          build_preference_required?: string | null
          club_id?: string | null
          club_text?: string | null
          confidentiality_level?: string | null
          created_at?: string
          custom_club_name?: string | null
          engagement_date?: string
          id?: string
          key_stakeholders?: string[]
          language_requirements?: string[] | null
          leadership_profile_required?: string | null
          ownership_structure?: string | null
          pipeline_stage?: string | null
          pressing_intensity_required?: string | null
          priority?: string
          relocation_required?: boolean | null
          risk_tolerance?: string | null
          status?: string
          strategic_objective?: string | null
          succession_timeline?: string | null
          tactical_model_required?: string | null
          target_completion_date?: string
          updated_at?: string
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
          board_compatibility_score: number | null
          club_id: string | null
          club_text: string | null
          coach_id: string
          confidence_score: number | null
          created_at: string | null
          cultural_fit_score: number | null
          financial_fit_score: number | null
          id: string
          mandate_id: string | null
          overall_score: number | null
          risk_score: number | null
          tactical_fit_score: number | null
          updated_at: string
          user_id: string | null
          vacancy_id: string
        }
        Insert: {
          availability_score?: number | null
          board_compatibility_score?: number | null
          club_id?: string | null
          club_text?: string | null
          coach_id: string
          confidence_score?: number | null
          created_at?: string | null
          cultural_fit_score?: number | null
          financial_fit_score?: number | null
          id?: string
          mandate_id?: string | null
          overall_score?: number | null
          risk_score?: number | null
          tactical_fit_score?: number | null
          updated_at?: string
          user_id?: string | null
          vacancy_id: string
        }
        Update: {
          availability_score?: number | null
          board_compatibility_score?: number | null
          club_id?: string | null
          club_text?: string | null
          coach_id?: string
          confidence_score?: number | null
          created_at?: string | null
          cultural_fit_score?: number | null
          financial_fit_score?: number | null
          id?: string
          mandate_id?: string | null
          overall_score?: number | null
          risk_score?: number | null
          tactical_fit_score?: number | null
          updated_at?: string
          user_id?: string | null
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
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
      scoring_weights: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          user_id: string
          weight_key: string
          weight_value: number
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          user_id: string
          weight_key: string
          weight_value?: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          user_id?: string
          weight_key?: string
          weight_value?: number
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          full_name: string
          id: string
          notes: string | null
          primary_role: string | null
          specialties: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          primary_role?: string | null
          specialties?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          primary_role?: string | null
          specialties?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          budget_range: string
          build_style: string
          club_id: string
          created_at: string
          executive_brief: string | null
          id: string
          league_experience_required: boolean | null
          objective: string
          pressing_level: string
          role_type: string
          staff_budget: string
          status: string
          style_of_play: string
          timeline: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget_range: string
          build_style: string
          club_id: string
          created_at?: string
          executive_brief?: string | null
          id?: string
          league_experience_required?: boolean | null
          objective: string
          pressing_level: string
          role_type?: string
          staff_budget: string
          status?: string
          style_of_play: string
          timeline: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget_range?: string
          build_style?: string
          club_id?: string
          created_at?: string
          executive_brief?: string | null
          id?: string
          league_experience_required?: boolean | null
          objective?: string
          pressing_level?: string
          role_type?: string
          staff_budget?: string
          status?: string
          style_of_play?: string
          timeline?: string
          updated_at?: string
          user_id?: string | null
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
      claim_unowned_rows: { Args: never; Returns: Json }
      get_unowned_counts: { Args: never; Returns: Json }
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
A new version of Supabase CLI is available: v2.78.1 (currently installed v2.75.0)
We recommend updating regularly for new features and bug fixes: https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli
