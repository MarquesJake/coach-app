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
          last_active_on: string | null
          notes: string | null
          relationship_strength: number | null
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
          last_active_on?: string | null
          notes?: string | null
          relationship_strength?: number | null
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
          last_active_on?: string | null
          notes?: string | null
          relationship_strength?: number | null
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
          club_id: string | null
          coach_id: string | null
          confidence: number | null
          created_at: string
          detail: string | null
          direction: string | null
          follow_up_date: string | null
          id: string
          influence_score: number | null
          interaction_type: string | null
          occurred_at: string
          reliability_score: number | null
          sentiment: string | null
          summary: string
          topic: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          channel?: string | null
          club_id?: string | null
          coach_id?: string | null
          confidence?: number | null
          created_at?: string
          detail?: string | null
          direction?: string | null
          follow_up_date?: string | null
          id?: string
          influence_score?: number | null
          interaction_type?: string | null
          occurred_at?: string
          reliability_score?: number | null
          sentiment?: string | null
          summary: string
          topic?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          channel?: string | null
          club_id?: string | null
          coach_id?: string | null
          confidence?: number | null
          created_at?: string
          detail?: string | null
          direction?: string | null
          follow_up_date?: string | null
          id?: string
          influence_score?: number | null
          interaction_type?: string | null
          occurred_at?: string
          reliability_score?: number | null
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
          {
            foreignKeyName: "agent_interactions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_interactions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
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
          risk_flag: boolean
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
          risk_flag?: boolean
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
          risk_flag?: boolean
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
      appointment_outcomes: {
        Row: {
          appointed_coach_id: string | null
          appointment_date: string | null
          created_at: string
          created_by: string
          decision_confidence: number | null
          decision_verdict: string | null
          id: string
          mandate_id: string
          next_review_at: string | null
          org_id: string
          outcome_snapshot: Json
          recommended_coach_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointed_coach_id?: string | null
          appointment_date?: string | null
          created_at?: string
          created_by: string
          decision_confidence?: number | null
          decision_verdict?: string | null
          id?: string
          mandate_id: string
          next_review_at?: string | null
          org_id: string
          outcome_snapshot?: Json
          recommended_coach_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointed_coach_id?: string | null
          appointment_date?: string | null
          created_at?: string
          created_by?: string
          decision_confidence?: number | null
          decision_verdict?: string | null
          id?: string
          mandate_id?: string
          next_review_at?: string | null
          org_id?: string
          outcome_snapshot?: Json
          recommended_coach_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_outcomes_appointed_coach_id_fkey"
            columns: ["appointed_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_outcomes_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_outcomes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_outcomes_recommended_coach_id_fkey"
            columns: ["recommended_coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_evidence: {
        Row: {
          coach_id: string
          confidence: number | null
          created_at: string
          criterion: string
          detail: string | null
          id: string
          mandate_id: string
          method: string
          origin_intelligence_session_id: string | null
          origin_profile_claim_id: string | null
          promoted_at: string | null
          promoted_by: string | null
          provenance_snapshot: Json | null
          source: string | null
          title: string
          used_in_recommendation: boolean
          user_id: string
          verification_status: string
        }
        Insert: {
          coach_id: string
          confidence?: number | null
          created_at?: string
          criterion: string
          detail?: string | null
          id?: string
          mandate_id: string
          method: string
          origin_intelligence_session_id?: string | null
          origin_profile_claim_id?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          provenance_snapshot?: Json | null
          source?: string | null
          title: string
          used_in_recommendation?: boolean
          user_id: string
          verification_status?: string
        }
        Update: {
          coach_id?: string
          confidence?: number | null
          created_at?: string
          criterion?: string
          detail?: string | null
          id?: string
          mandate_id?: string
          method?: string
          origin_intelligence_session_id?: string | null
          origin_profile_claim_id?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          provenance_snapshot?: Json | null
          source?: string | null
          title?: string
          used_in_recommendation?: boolean
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_evidence_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_evidence_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_evidence_origin_intelligence_session_id_fkey"
            columns: ["origin_intelligence_session_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_evidence_origin_profile_claim_id_fkey"
            columns: ["origin_profile_claim_id"]
            isOneToOne: false
            referencedRelation: "profile_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_assessments: {
        Row: {
          coach_id: string
          created_at: string
          criterion: string
          id: string
          mandate_id: string
          score: number | null
          status: string
          summary: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          criterion: string
          id?: string
          mandate_id: string
          score?: number | null
          status?: string
          summary?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          criterion?: string
          id?: string
          mandate_id?: string
          score?: number | null
          status?: string
          summary?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_assessments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_assessments_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_interview_answers: {
        Row: {
          answer: string
          coach_id: string
          confidence: number | null
          created_at: string
          criterion: string
          evidence_id: string | null
          id: string
          interview_focus: string
          interviewer: string | null
          mandate_id: string
          question: string
          question_key: string
          updated_at: string
          used_in_recommendation: boolean
          user_id: string
          verification_status: string
        }
        Insert: {
          answer: string
          coach_id: string
          confidence?: number | null
          created_at?: string
          criterion: string
          evidence_id?: string | null
          id?: string
          interview_focus?: string
          interviewer?: string | null
          mandate_id: string
          question: string
          question_key: string
          updated_at?: string
          used_in_recommendation?: boolean
          user_id: string
          verification_status?: string
        }
        Update: {
          answer?: string
          coach_id?: string
          confidence?: number | null
          created_at?: string
          criterion?: string
          evidence_id?: string | null
          id?: string
          interview_focus?: string
          interviewer?: string | null
          mandate_id?: string
          question?: string
          question_key?: string
          updated_at?: string
          used_in_recommendation?: boolean
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_interview_answers_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_interview_answers_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "assessment_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_interview_answers_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_recommendations: {
        Row: {
          coach_id: string
          confidence: number | null
          created_at: string
          id: string
          key_risks: string | null
          key_strengths: string | null
          mandate_id: string
          mitigation: string | null
          summary: string | null
          updated_at: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          coach_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          key_risks?: string | null
          key_strengths?: string | null
          mandate_id: string
          mitigation?: string | null
          summary?: string | null
          updated_at?: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          coach_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          key_risks?: string | null
          key_strengths?: string | null
          mandate_id?: string
          mitigation?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidate_recommendations_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_recommendations_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_reference_answers: {
        Row: {
          answer: string
          coach_id: string
          confidence: number | null
          created_at: string
          criterion: string
          evidence_id: string | null
          id: string
          mandate_id: string
          question: string
          question_key: string
          reference_name: string | null
          reference_role: string | null
          risk_flag: boolean
          stakeholder_group: string
          updated_at: string
          used_in_recommendation: boolean
          user_id: string
          verification_status: string
          would_hire_again: string
        }
        Insert: {
          answer: string
          coach_id: string
          confidence?: number | null
          created_at?: string
          criterion: string
          evidence_id?: string | null
          id?: string
          mandate_id: string
          question: string
          question_key: string
          reference_name?: string | null
          reference_role?: string | null
          risk_flag?: boolean
          stakeholder_group: string
          updated_at?: string
          used_in_recommendation?: boolean
          user_id: string
          verification_status?: string
          would_hire_again?: string
        }
        Update: {
          answer?: string
          coach_id?: string
          confidence?: number | null
          created_at?: string
          criterion?: string
          evidence_id?: string | null
          id?: string
          mandate_id?: string
          question?: string
          question_key?: string
          reference_name?: string | null
          reference_role?: string | null
          risk_flag?: boolean
          stakeholder_group?: string
          updated_at?: string
          used_in_recommendation?: boolean
          user_id?: string
          verification_status?: string
          would_hire_again?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_reference_answers_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_reference_answers_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "assessment_evidence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_reference_answers_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_relationships: {
        Row: {
          created_at: string
          created_by: string
          id: string
          org_id: string
          rationale: string
          relationship_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_claim_id: string
          target_claim_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          rationale: string
          relationship_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_claim_id: string
          target_claim_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          rationale?: string
          relationship_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_claim_id?: string
          target_claim_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_relationships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_relationships_source_claim_id_fkey"
            columns: ["source_claim_id"]
            isOneToOne: false
            referencedRelation: "profile_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_relationships_target_claim_id_fkey"
            columns: ["target_claim_id"]
            isOneToOne: false
            referencedRelation: "profile_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      club_briefs: {
        Row: {
          appointment_context: string | null
          availability_timeline: string | null
          budget_parameters: string | null
          buyer_organization_id: string
          club_id: string | null
          confidentiality_notes: string | null
          created_at: string
          created_by: string
          football_identity: string | null
          id: string
          in_possession_requirements: string | null
          leadership_and_culture: string | null
          linked_mandate_id: string | null
          location_requirements: string | null
          out_of_possession_requirements: string | null
          player_development_priorities: string | null
          process_requirements: string | null
          role_title: string
          service_organization_id: string
          set_piece_requirements: string | null
          squad_context: string | null
          status: string
          submitted_at: string | null
          title: string
          transition_requirements: string | null
          updated_at: string
          work_permit_position: string | null
        }
        Insert: {
          appointment_context?: string | null
          availability_timeline?: string | null
          budget_parameters?: string | null
          buyer_organization_id: string
          club_id?: string | null
          confidentiality_notes?: string | null
          created_at?: string
          created_by: string
          football_identity?: string | null
          id?: string
          in_possession_requirements?: string | null
          leadership_and_culture?: string | null
          linked_mandate_id?: string | null
          location_requirements?: string | null
          out_of_possession_requirements?: string | null
          player_development_priorities?: string | null
          process_requirements?: string | null
          role_title?: string
          service_organization_id: string
          set_piece_requirements?: string | null
          squad_context?: string | null
          status?: string
          submitted_at?: string | null
          title: string
          transition_requirements?: string | null
          updated_at?: string
          work_permit_position?: string | null
        }
        Update: {
          appointment_context?: string | null
          availability_timeline?: string | null
          budget_parameters?: string | null
          buyer_organization_id?: string
          club_id?: string | null
          confidentiality_notes?: string | null
          created_at?: string
          created_by?: string
          football_identity?: string | null
          id?: string
          in_possession_requirements?: string | null
          leadership_and_culture?: string | null
          linked_mandate_id?: string | null
          location_requirements?: string | null
          out_of_possession_requirements?: string | null
          player_development_priorities?: string | null
          process_requirements?: string | null
          role_title?: string
          service_organization_id?: string
          set_piece_requirements?: string | null
          squad_context?: string | null
          status?: string
          submitted_at?: string | null
          title?: string
          transition_requirements?: string | null
          updated_at?: string
          work_permit_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_briefs_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_briefs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_briefs_linked_mandate_id_fkey"
            columns: ["linked_mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_briefs_service_organization_id_fkey"
            columns: ["service_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      club_invitations: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          revoked_at: string | null
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          revoked_at?: string | null
          role: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          revoked_at?: string | null
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_pathway_data: {
        Row: {
          academy_debuts: number | null
          club_id: string
          created_at: string
          id: string
          internal_promotions: number | null
          notes: string | null
          season: string
          u21_minutes_percentage: number | null
          user_id: string
        }
        Insert: {
          academy_debuts?: number | null
          club_id: string
          created_at?: string
          id?: string
          internal_promotions?: number | null
          notes?: string | null
          season: string
          u21_minutes_percentage?: number | null
          user_id: string
        }
        Update: {
          academy_debuts?: number | null
          club_id?: string
          created_at?: string
          id?: string
          internal_promotions?: number | null
          notes?: string | null
          season?: string
          u21_minutes_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_pathway_data_club_id_fkey"
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
          age_at_transfer: number | null
          club_id: string
          created_at: string
          direction: string
          fee_amount: number | null
          fee_band: string | null
          fee_currency: string | null
          id: string
          nationality: string | null
          other_club: string | null
          player_id: number | null
          player_name: string
          position: string | null
          season: string | null
          synced_at: string
          transfer_date: string | null
          transfer_type: string | null
          user_id: string
        }
        Insert: {
          age_at_transfer?: number | null
          club_id: string
          created_at?: string
          direction: string
          fee_amount?: number | null
          fee_band?: string | null
          fee_currency?: string | null
          id?: string
          nationality?: string | null
          other_club?: string | null
          player_id?: number | null
          player_name: string
          position?: string | null
          season?: string | null
          synced_at?: string
          transfer_date?: string | null
          transfer_type?: string | null
          user_id: string
        }
        Update: {
          age_at_transfer?: number | null
          club_id?: string
          created_at?: string
          direction?: string
          fee_amount?: number | null
          fee_band?: string | null
          fee_currency?: string | null
          id?: string
          nationality?: string | null
          other_club?: string | null
          player_id?: number | null
          player_name?: string
          position?: string | null
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
      coach_data_profiles: {
        Row: {
          avg_squad_age: number | null
          avg_starting_xi_age: number | null
          coach_id: string
          confidence_score: number | null
          created_at: string
          id: string
          media_accountability_score: number | null
          media_confrontation_score: number | null
          media_pressure_score: number | null
          minutes_21_24: number | null
          minutes_25_28: number | null
          minutes_29_plus: number | null
          minutes_u21: number | null
          narrative_risk_summary: string | null
          recruitment_avg_age: number | null
          recruitment_repeat_agent_count: number | null
          recruitment_repeat_player_count: number | null
          social_presence_level: string | null
        }
        Insert: {
          avg_squad_age?: number | null
          avg_starting_xi_age?: number | null
          coach_id: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          media_accountability_score?: number | null
          media_confrontation_score?: number | null
          media_pressure_score?: number | null
          minutes_21_24?: number | null
          minutes_25_28?: number | null
          minutes_29_plus?: number | null
          minutes_u21?: number | null
          narrative_risk_summary?: string | null
          recruitment_avg_age?: number | null
          recruitment_repeat_agent_count?: number | null
          recruitment_repeat_player_count?: number | null
          social_presence_level?: string | null
        }
        Update: {
          avg_squad_age?: number | null
          avg_starting_xi_age?: number | null
          coach_id?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          media_accountability_score?: number | null
          media_confrontation_score?: number | null
          media_pressure_score?: number | null
          minutes_21_24?: number | null
          minutes_25_28?: number | null
          minutes_29_plus?: number | null
          minutes_u21?: number | null
          narrative_risk_summary?: string | null
          recruitment_avg_age?: number | null
          recruitment_repeat_agent_count?: number | null
          recruitment_repeat_player_count?: number | null
          social_presence_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_data_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_derived_metrics: {
        Row: {
          avg_signing_age: number | null
          avg_squad_age: number | null
          coach_id: string
          computed_at: string | null
          loan_reliance_score: number | null
          network_density_score: number | null
          pct_minutes_30plus: number | null
          pct_minutes_u23: number | null
          raw: Json | null
          repeat_agents_count: number | null
          repeat_signings_count: number | null
          rotation_index: number | null
        }
        Insert: {
          avg_signing_age?: number | null
          avg_squad_age?: number | null
          coach_id: string
          computed_at?: string | null
          loan_reliance_score?: number | null
          network_density_score?: number | null
          pct_minutes_30plus?: number | null
          pct_minutes_u23?: number | null
          raw?: Json | null
          repeat_agents_count?: number | null
          repeat_signings_count?: number | null
          rotation_index?: number | null
        }
        Update: {
          avg_signing_age?: number | null
          avg_squad_age?: number | null
          coach_id?: string
          computed_at?: string | null
          loan_reliance_score?: number | null
          network_density_score?: number | null
          pct_minutes_30plus?: number | null
          pct_minutes_u23?: number | null
          raw?: Json | null
          repeat_agents_count?: number | null
          repeat_signings_count?: number | null
          rotation_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_derived_metrics_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_development_signals: {
        Row: {
          club_id: string | null
          club_name: string | null
          coach_id: string
          coach_stint_id: string | null
          confidence: number
          evidence_summary: string
          generated_at: string
          id: string
          normalized_score: number
          raw_value: number | null
          recency_weight: number
          season: string | null
          signal_label: string
          signal_type: string
          source_id: string | null
          source_name: string
          source_payload: Json
          source_table: string | null
          user_id: string
        }
        Insert: {
          club_id?: string | null
          club_name?: string | null
          coach_id: string
          coach_stint_id?: string | null
          confidence?: number
          evidence_summary: string
          generated_at?: string
          id?: string
          normalized_score: number
          raw_value?: number | null
          recency_weight?: number
          season?: string | null
          signal_label: string
          signal_type: string
          source_id?: string | null
          source_name?: string
          source_payload?: Json
          source_table?: string | null
          user_id: string
        }
        Update: {
          club_id?: string | null
          club_name?: string | null
          coach_id?: string
          coach_stint_id?: string | null
          confidence?: number
          evidence_summary?: string
          generated_at?: string
          id?: string
          normalized_score?: number
          raw_value?: number | null
          recency_weight?: number
          season?: string | null
          signal_label?: string
          signal_type?: string
          source_id?: string | null
          source_name?: string
          source_payload?: Json
          source_table?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_development_signals_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_development_signals_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_development_signals_coach_stint_id_fkey"
            columns: ["coach_stint_id"]
            isOneToOne: false
            referencedRelation: "coach_stints"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_due_diligence_items: {
        Row: {
          coach_id: string
          confidence: number | null
          created_at: string
          detail: string | null
          id: string
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_type: string | null
          title: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          coach_id: string
          confidence?: number | null
          created_at?: string
          detail?: string | null
          id?: string
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          title: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          coach_id?: string
          confidence?: number | null
          created_at?: string
          detail?: string | null
          id?: string
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          title?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_due_diligence_items_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_external_profiles: {
        Row: {
          api_coach_id: string | null
          api_team_id: string | null
          birth_country: string | null
          birth_date: string | null
          birth_place: string | null
          coach_id: string
          confidence: number | null
          current_team_id: string | null
          current_team_name: string | null
          first_name: string | null
          full_name: string | null
          height: string | null
          id: string
          last_name: string | null
          match_confidence: number | null
          match_strategy: string | null
          nationality: string | null
          photo_url: string | null
          profile_payload: Json | null
          source_link: string | null
          source_name: string
          synced_at: string
          updated_at: string
          weight: string | null
        }
        Insert: {
          api_coach_id?: string | null
          api_team_id?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          coach_id: string
          confidence?: number | null
          current_team_id?: string | null
          current_team_name?: string | null
          first_name?: string | null
          full_name?: string | null
          height?: string | null
          id?: string
          last_name?: string | null
          match_confidence?: number | null
          match_strategy?: string | null
          nationality?: string | null
          photo_url?: string | null
          profile_payload?: Json | null
          source_link?: string | null
          source_name?: string
          synced_at?: string
          updated_at?: string
          weight?: string | null
        }
        Update: {
          api_coach_id?: string | null
          api_team_id?: string | null
          birth_country?: string | null
          birth_date?: string | null
          birth_place?: string | null
          coach_id?: string
          confidence?: number | null
          current_team_id?: string | null
          current_team_name?: string | null
          first_name?: string | null
          full_name?: string | null
          height?: string | null
          id?: string
          last_name?: string | null
          match_confidence?: number | null
          match_strategy?: string | null
          nationality?: string | null
          photo_url?: string | null
          profile_payload?: Json | null
          source_link?: string | null
          source_name?: string
          synced_at?: string
          updated_at?: string
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_external_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_media_events: {
        Row: {
          category: string | null
          coach_id: string
          confidence: number | null
          created_at: string
          headline: string | null
          id: string
          occurred_at: string | null
          severity_score: number | null
          source: string | null
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_type: string | null
          summary: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          coach_id: string
          confidence?: number | null
          created_at?: string
          headline?: string | null
          id?: string
          occurred_at?: string | null
          severity_score?: number | null
          source?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          summary?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          coach_id?: string
          confidence?: number | null
          created_at?: string
          headline?: string | null
          id?: string
          occurred_at?: string | null
          severity_score?: number | null
          source?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          summary?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_media_events_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_portal_profiles: {
        Row: {
          academy_integration: string | null
          appointment_conditions: string | null
          base_location: string | null
          availability_timeline: string | null
          coach_email: string | null
          coach_id: string
          coach_phone: string | null
          circumstances_visibility: string
          contract_expiry: string | null
          created_at: string
          current_salary: string | null
          family_situation: string | null
          feasibility_review_status: string
          feasibility_reviewed_at: string | null
          feasibility_reviewed_by: string | null
          football_identity: string | null
          id: string
          in_possession_model: string | null
          key_staff_likely_to_follow: string | null
          media_and_communication: string | null
          out_of_possession_model: string | null
          personal_statement: string | null
          player_development_proof: string | null
          portal_status: string
          preferred_contact_method: string | null
          presentation_summary: string | null
          recruitment_preferences: string | null
          reference_permissions: string | null
          release_compensation: string | null
          release_notes: string | null
          relocation_requirements: string | null
          representative_email: string | null
          representative_name: string | null
          reviewed_at: string | null
          salary_expectation: string | null
          sensitive_notes: string | null
          session_design_principles: string | null
          set_piece_model: string | null
          short_bio: string | null
          staff_cost_expectation: string | null
          staff_network: string | null
          submitted_at: string | null
          training_week: string | null
          transition_model: string | null
          updated_at: string
          user_id: string
          video_summary: string | null
          visibility_status: string
        }
        Insert: {
          academy_integration?: string | null
          appointment_conditions?: string | null
          base_location?: string | null
          availability_timeline?: string | null
          coach_email?: string | null
          coach_id: string
          coach_phone?: string | null
          circumstances_visibility?: string
          contract_expiry?: string | null
          created_at?: string
          current_salary?: string | null
          family_situation?: string | null
          feasibility_review_status?: string
          feasibility_reviewed_at?: string | null
          feasibility_reviewed_by?: string | null
          football_identity?: string | null
          id?: string
          in_possession_model?: string | null
          key_staff_likely_to_follow?: string | null
          media_and_communication?: string | null
          out_of_possession_model?: string | null
          personal_statement?: string | null
          player_development_proof?: string | null
          portal_status?: string
          preferred_contact_method?: string | null
          presentation_summary?: string | null
          recruitment_preferences?: string | null
          reference_permissions?: string | null
          release_compensation?: string | null
          release_notes?: string | null
          relocation_requirements?: string | null
          representative_email?: string | null
          representative_name?: string | null
          reviewed_at?: string | null
          salary_expectation?: string | null
          sensitive_notes?: string | null
          session_design_principles?: string | null
          set_piece_model?: string | null
          short_bio?: string | null
          staff_cost_expectation?: string | null
          staff_network?: string | null
          submitted_at?: string | null
          training_week?: string | null
          transition_model?: string | null
          updated_at?: string
          user_id: string
          video_summary?: string | null
          visibility_status?: string
        }
        Update: {
          academy_integration?: string | null
          appointment_conditions?: string | null
          base_location?: string | null
          availability_timeline?: string | null
          coach_email?: string | null
          coach_id?: string
          coach_phone?: string | null
          circumstances_visibility?: string
          contract_expiry?: string | null
          created_at?: string
          current_salary?: string | null
          family_situation?: string | null
          feasibility_review_status?: string
          feasibility_reviewed_at?: string | null
          feasibility_reviewed_by?: string | null
          football_identity?: string | null
          id?: string
          in_possession_model?: string | null
          key_staff_likely_to_follow?: string | null
          media_and_communication?: string | null
          out_of_possession_model?: string | null
          personal_statement?: string | null
          player_development_proof?: string | null
          portal_status?: string
          preferred_contact_method?: string | null
          presentation_summary?: string | null
          recruitment_preferences?: string | null
          reference_permissions?: string | null
          release_compensation?: string | null
          release_notes?: string | null
          relocation_requirements?: string | null
          representative_email?: string | null
          representative_name?: string | null
          reviewed_at?: string | null
          salary_expectation?: string | null
          sensitive_notes?: string | null
          session_design_principles?: string | null
          set_piece_model?: string | null
          short_bio?: string | null
          staff_cost_expectation?: string | null
          staff_network?: string | null
          submitted_at?: string | null
          training_week?: string | null
          transition_model?: string | null
          updated_at?: string
          user_id?: string
          video_summary?: string | null
          visibility_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_portal_profiles_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: true
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_portal_staff_members: {
        Row: {
          availability: string | null
          coach_id: string
          compensation_terms: string | null
          confidentiality_status: string
          created_at: string
          current_club: string | null
          current_salary: string | null
          essentiality: string
          expected_salary: string | null
          full_name: string
          id: string
          likely_to_follow: string
          relationship_context: string | null
          relocation_notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          role_title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          coach_id: string
          compensation_terms?: string | null
          confidentiality_status?: string
          created_at?: string
          current_club?: string | null
          current_salary?: string | null
          essentiality?: string
          expected_salary?: string | null
          full_name: string
          id?: string
          likely_to_follow?: string
          relationship_context?: string | null
          relocation_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          coach_id?: string
          compensation_terms?: string | null
          confidentiality_status?: string
          created_at?: string
          current_club?: string | null
          current_salary?: string | null
          essentiality?: string
          expected_salary?: string | null
          full_name?: string
          id?: string
          likely_to_follow?: string
          relationship_context?: string | null
          relocation_notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role_title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_portal_staff_members_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_private_materials: {
        Row: {
          coach_id: string
          confidentiality_status: string
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          material_type: string
          source_label: string | null
          storage_path: string | null
          title: string
          updated_at: string
          uploaded_by: string
          user_id: string
          verification_status: string
        }
        Insert: {
          coach_id: string
          confidentiality_status?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          material_type?: string
          source_label?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          coach_id?: string
          confidentiality_status?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          material_type?: string
          source_label?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_private_materials_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_recruitment_history: {
        Row: {
          agent_name: string | null
          club_id: string | null
          club_name: string | null
          coach_id: string
          confidence: number | null
          created_at: string
          id: string
          impact_summary: string | null
          player_age_at_signing: number | null
          player_id: string | null
          player_name: string | null
          repeated_signing: boolean | null
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_type: string | null
          transfer_fee_band: string | null
          transfer_window: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          agent_name?: string | null
          club_id?: string | null
          club_name?: string | null
          coach_id: string
          confidence?: number | null
          created_at?: string
          id?: string
          impact_summary?: string | null
          player_age_at_signing?: number | null
          player_id?: string | null
          player_name?: string | null
          repeated_signing?: boolean | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          transfer_fee_band?: string | null
          transfer_window?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          agent_name?: string | null
          club_id?: string | null
          club_name?: string | null
          coach_id?: string
          confidence?: number | null
          created_at?: string
          id?: string
          impact_summary?: string | null
          player_age_at_signing?: number | null
          player_id?: string | null
          player_name?: string | null
          repeated_signing?: boolean | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          transfer_fee_band?: string | null
          transfer_window?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_recruitment_history_coach_id_fkey"
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
      coach_scores: {
        Row: {
          coach_id: string
          computed_at: string
          confidence_score: number | null
          explanation: Json | null
          id: string
          inputs_snapshot: Json | null
          leadership_score: number | null
          media_score: number | null
          overall_score: number | null
          recruitment_score: number | null
          risk_score: number | null
          scoring_model_id: string
          tactical_score: number | null
        }
        Insert: {
          coach_id: string
          computed_at?: string
          confidence_score?: number | null
          explanation?: Json | null
          id?: string
          inputs_snapshot?: Json | null
          leadership_score?: number | null
          media_score?: number | null
          overall_score?: number | null
          recruitment_score?: number | null
          risk_score?: number | null
          scoring_model_id: string
          tactical_score?: number | null
        }
        Update: {
          coach_id?: string
          computed_at?: string
          confidence_score?: number | null
          explanation?: Json | null
          id?: string
          inputs_snapshot?: Json | null
          leadership_score?: number | null
          media_score?: number | null
          overall_score?: number | null
          recruitment_score?: number | null
          risk_score?: number | null
          scoring_model_id?: string
          tactical_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_scores_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_scores_scoring_model_id_fkey"
            columns: ["scoring_model_id"]
            isOneToOne: false
            referencedRelation: "scoring_models"
            referencedColumns: ["id"]
          },
        ]
      }
      coach_similarity: {
        Row: {
          breakdown: Json | null
          coach_a_id: string
          coach_b_id: string
          computed_at: string
          similarity_score: number
        }
        Insert: {
          breakdown?: Json | null
          coach_a_id: string
          coach_b_id: string
          computed_at?: string
          similarity_score: number
        }
        Update: {
          breakdown?: Json | null
          coach_a_id?: string
          coach_b_id?: string
          computed_at?: string
          similarity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "coach_similarity_coach_a_id_fkey"
            columns: ["coach_a_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_similarity_coach_b_id_fkey"
            columns: ["coach_b_id"]
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
          confidence: number | null
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
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_type: string | null
          started_on: string | null
          style_summary: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          win_rate: number | null
        }
        Insert: {
          appointment_context?: string | null
          club_id?: string | null
          club_name: string
          coach_id: string
          confidence?: number | null
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
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          started_on?: string | null
          style_summary?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          win_rate?: number | null
        }
        Update: {
          appointment_context?: string | null
          club_id?: string | null
          club_name?: string
          coach_id?: string
          confidence?: number | null
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
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_type?: string | null
          started_on?: string | null
          style_summary?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
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
          appointment_conditions: string | null
          availability_timeline: string | null
          availability_status: string | null
          available_status: string
          base_location: string | null
          board_compatibility: number | null
          board_compatibility_score: number | null
          build_preference: string
          club_current: string | null
          coaching_licence: string | null
          comms_profile: string | null
          compensation_expectation: string | null
          compliance_notes: string | null
          conflict_history: string | null
          contract_expiry: string | null
          contract_notes: string | null
          created_at: string
          current_salary: string | null
          cultural_alignment_score: number | null
          cultural_risk: number | null
          date_of_birth: string | null
          development_score: number | null
          dressing_room_risk_score: number | null
          due_diligence_summary: string | null
          family_context: string | null
          feasibility_reviewed_at: string | null
          feasibility_reviewed_by: string | null
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
          release_clause: string | null
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
          appointment_conditions?: string | null
          availability_timeline?: string | null
          availability_status?: string | null
          available_status?: string
          base_location?: string | null
          board_compatibility?: number | null
          board_compatibility_score?: number | null
          build_preference: string
          club_current?: string | null
          coaching_licence?: string | null
          comms_profile?: string | null
          compensation_expectation?: string | null
          compliance_notes?: string | null
          conflict_history?: string | null
          contract_expiry?: string | null
          contract_notes?: string | null
          created_at?: string
          current_salary?: string | null
          cultural_alignment_score?: number | null
          cultural_risk?: number | null
          date_of_birth?: string | null
          development_score?: number | null
          dressing_room_risk_score?: number | null
          due_diligence_summary?: string | null
          family_context?: string | null
          feasibility_reviewed_at?: string | null
          feasibility_reviewed_by?: string | null
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
          release_clause?: string | null
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
          appointment_conditions?: string | null
          availability_timeline?: string | null
          availability_status?: string | null
          available_status?: string
          base_location?: string | null
          board_compatibility?: number | null
          board_compatibility_score?: number | null
          build_preference?: string
          club_current?: string | null
          coaching_licence?: string | null
          comms_profile?: string | null
          compensation_expectation?: string | null
          compliance_notes?: string | null
          conflict_history?: string | null
          contract_expiry?: string | null
          contract_notes?: string | null
          created_at?: string
          current_salary?: string | null
          cultural_alignment_score?: number | null
          cultural_risk?: number | null
          date_of_birth?: string | null
          development_score?: number | null
          dressing_room_risk_score?: number | null
          due_diligence_summary?: string | null
          family_context?: string | null
          feasibility_reviewed_at?: string | null
          feasibility_reviewed_by?: string | null
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
          release_clause?: string | null
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
      confidential_access_grant_materials: {
        Row: {
          grant_id: string
          material_id: string
          released_at: string
          released_by: string
        }
        Insert: {
          grant_id: string
          material_id: string
          released_at?: string
          released_by: string
        }
        Update: {
          grant_id?: string
          material_id?: string
          released_at?: string
          released_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "confidential_access_grant_materials_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "confidential_access_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confidential_access_grant_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "coach_private_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      confidential_access_grants: {
        Row: {
          access_request_id: string
          allow_download: boolean
          buyer_organization_id: string
          coach_id: string
          created_at: string
          expires_at: string
          granted_at: string
          granted_by: string
          id: string
          order_id: string
          release_notes: string | null
          revoked_at: string | null
          status: string
          updated_at: string
          watermark_label: string | null
        }
        Insert: {
          access_request_id: string
          allow_download?: boolean
          buyer_organization_id: string
          coach_id: string
          created_at?: string
          expires_at: string
          granted_at?: string
          granted_by: string
          id?: string
          order_id: string
          release_notes?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          watermark_label?: string | null
        }
        Update: {
          access_request_id?: string
          allow_download?: boolean
          buyer_organization_id?: string
          coach_id?: string
          created_at?: string
          expires_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          order_id?: string
          release_notes?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          watermark_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confidential_access_grants_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: true
            referencedRelation: "confidential_access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confidential_access_grants_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confidential_access_grants_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confidential_access_grants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "dossier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      confidential_access_requests: {
        Row: {
          club_context: string | null
          coach_id: string
          created_at: string
          decided_at: string | null
          id: string
          internal_notes: string | null
          mandate_id: string
          request_reason: string
          requested_at: string
          requested_by: string | null
          requester_role: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          club_context?: string | null
          coach_id: string
          created_at?: string
          decided_at?: string | null
          id?: string
          internal_notes?: string | null
          mandate_id: string
          request_reason: string
          requested_at?: string
          requested_by?: string | null
          requester_role?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          club_context?: string | null
          coach_id?: string
          created_at?: string
          decided_at?: string | null
          id?: string
          internal_notes?: string | null
          mandate_id?: string
          request_reason?: string
          requested_at?: string
          requested_by?: string | null
          requester_role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "confidential_access_requests_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confidential_access_requests_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
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
      contact_coach_relationships: {
        Row: {
          club_context: string | null
          club_id: string | null
          coach_id: string
          confidence: number | null
          conflict_notes: string | null
          contact_id: string
          created_at: string
          created_by: string
          ended_on: string | null
          first_hand: boolean
          id: string
          independence_confirmed: boolean
          notes: string | null
          org_id: string
          proximity: string
          relationship_type: string
          role_at_time: string | null
          stakeholder_group: string
          started_on: string | null
          topic_credibility: string[]
          updated_at: string
        }
        Insert: {
          club_context?: string | null
          club_id?: string | null
          coach_id: string
          confidence?: number | null
          conflict_notes?: string | null
          contact_id: string
          created_at?: string
          created_by: string
          ended_on?: string | null
          first_hand?: boolean
          id?: string
          independence_confirmed?: boolean
          notes?: string | null
          org_id: string
          proximity?: string
          relationship_type: string
          role_at_time?: string | null
          stakeholder_group?: string
          started_on?: string | null
          topic_credibility?: string[]
          updated_at?: string
        }
        Update: {
          club_context?: string | null
          club_id?: string | null
          coach_id?: string
          confidence?: number | null
          conflict_notes?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string
          ended_on?: string | null
          first_hand?: boolean
          id?: string
          independence_confirmed?: boolean
          notes?: string | null
          org_id?: string
          proximity?: string
          relationship_type?: string
          role_at_time?: string | null
          stakeholder_group?: string
          started_on?: string | null
          topic_credibility?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_coach_relationships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_coach_relationships_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_coach_relationships_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "football_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_coach_relationships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      dossier_access_events: {
        Row: {
          actor_user_id: string | null
          event_type: string
          grant_id: string | null
          id: string
          material_id: string | null
          metadata: Json
          occurred_at: string
          order_id: string
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          grant_id?: string | null
          id?: string
          material_id?: string | null
          metadata?: Json
          occurred_at?: string
          order_id: string
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          grant_id?: string | null
          id?: string
          material_id?: string | null
          metadata?: Json
          occurred_at?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_access_events_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "confidential_access_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_access_events_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "coach_private_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_access_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "dossier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_offer_commercials: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          offer_id: string
          price_amount: number
          seller_organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          offer_id: string
          price_amount?: number
          seller_organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          offer_id?: string
          price_amount?: number
          seller_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_offer_commercials_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "dossier_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_offer_commercials_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_offers: {
        Row: {
          available_until: string | null
          buyer_organization_id: string
          club_brief_id: string | null
          coach_current_role: string | null
          coach_id: string
          coach_name: string
          coach_nationality: string | null
          confidence: number | null
          created_at: string
          created_by: string
          fit_summary: string | null
          headline: string
          id: string
          included_sections: Json
          key_risks: string | null
          key_strengths: string | null
          mandate_id: string
          preview_summary: string
          private_material_count: number
          published_at: string | null
          seller_organization_id: string
          status: string
          updated_at: string
          verdict: string | null
        }
        Insert: {
          available_until?: string | null
          buyer_organization_id: string
          club_brief_id?: string | null
          coach_current_role?: string | null
          coach_id: string
          coach_name: string
          coach_nationality?: string | null
          confidence?: number | null
          created_at?: string
          created_by: string
          fit_summary?: string | null
          headline: string
          id?: string
          included_sections?: Json
          key_risks?: string | null
          key_strengths?: string | null
          mandate_id: string
          preview_summary: string
          private_material_count?: number
          published_at?: string | null
          seller_organization_id: string
          status?: string
          updated_at?: string
          verdict?: string | null
        }
        Update: {
          available_until?: string | null
          buyer_organization_id?: string
          club_brief_id?: string | null
          coach_current_role?: string | null
          coach_id?: string
          coach_name?: string
          coach_nationality?: string | null
          confidence?: number | null
          created_at?: string
          created_by?: string
          fit_summary?: string | null
          headline?: string
          id?: string
          included_sections?: Json
          key_risks?: string | null
          key_strengths?: string | null
          mandate_id?: string
          preview_summary?: string
          private_material_count?: number
          published_at?: string | null
          seller_organization_id?: string
          status?: string
          updated_at?: string
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossier_offers_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_offers_club_brief_id_fkey"
            columns: ["club_brief_id"]
            isOneToOne: false
            referencedRelation: "club_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_offers_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_offers_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_offers_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_order_commercials: {
        Row: {
          created_at: string
          currency: string
          internal_notes: string | null
          order_id: string
          payment_status: string
          price_amount: number
          seller_organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          internal_notes?: string | null
          order_id: string
          payment_status?: string
          price_amount: number
          seller_organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          internal_notes?: string | null
          order_id?: string
          payment_status?: string
          price_amount?: number
          seller_organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_order_commercials_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "dossier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_order_commercials_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dossier_orders: {
        Row: {
          access_request_id: string
          activated_at: string | null
          approved_at: string | null
          buyer_organization_id: string
          buyer_reference: string | null
          club_brief_id: string | null
          coach_id: string
          expires_at: string | null
          id: string
          intended_use: string
          mandate_id: string
          offer_id: string
          ordered_at: string
          ordered_by: string
          seller_organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          access_request_id: string
          activated_at?: string | null
          approved_at?: string | null
          buyer_organization_id: string
          buyer_reference?: string | null
          club_brief_id?: string | null
          coach_id: string
          expires_at?: string | null
          id?: string
          intended_use: string
          mandate_id: string
          offer_id: string
          ordered_at?: string
          ordered_by: string
          seller_organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          access_request_id?: string
          activated_at?: string | null
          approved_at?: string | null
          buyer_organization_id?: string
          buyer_reference?: string | null
          club_brief_id?: string | null
          coach_id?: string
          expires_at?: string | null
          id?: string
          intended_use?: string
          mandate_id?: string
          offer_id?: string
          ordered_at?: string
          ordered_by?: string
          seller_organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dossier_orders_access_request_id_fkey"
            columns: ["access_request_id"]
            isOneToOne: true
            referencedRelation: "confidential_access_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_orders_buyer_organization_id_fkey"
            columns: ["buyer_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_orders_club_brief_id_fkey"
            columns: ["club_brief_id"]
            isOneToOne: false
            referencedRelation: "club_briefs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_orders_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_orders_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: true
            referencedRelation: "dossier_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dossier_orders_seller_organization_id_fkey"
            columns: ["seller_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_items: {
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
          source_type: string | null
          title: string
          user_id: string
          verified: boolean
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
          source_type?: string | null
          title: string
          user_id: string
          verified?: boolean
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
          source_type?: string | null
          title?: string
          user_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      football_contacts: {
        Row: {
          conflicts: string | null
          contact_status: string
          correction_status: string
          created_at: string
          created_by: string
          current_organization: string | null
          current_role_title: string | null
          default_attribution_permission: string
          email: string | null
          expertise: string[]
          follow_up_note: string | null
          full_name: string
          id: string
          last_contacted_at: string | null
          next_follow_up_at: string | null
          org_id: string
          phone: string | null
          preferred_channel: string | null
          relationship_owner_id: string | null
          reliability_score: number | null
          retention_review_at: string | null
          stakeholder_group: string
          updated_at: string
        }
        Insert: {
          conflicts?: string | null
          contact_status?: string
          correction_status?: string
          created_at?: string
          created_by: string
          current_organization?: string | null
          current_role_title?: string | null
          default_attribution_permission?: string
          email?: string | null
          expertise?: string[]
          follow_up_note?: string | null
          full_name: string
          id?: string
          last_contacted_at?: string | null
          next_follow_up_at?: string | null
          org_id: string
          phone?: string | null
          preferred_channel?: string | null
          relationship_owner_id?: string | null
          reliability_score?: number | null
          retention_review_at?: string | null
          stakeholder_group?: string
          updated_at?: string
        }
        Update: {
          conflicts?: string | null
          contact_status?: string
          correction_status?: string
          created_at?: string
          created_by?: string
          current_organization?: string | null
          current_role_title?: string | null
          default_attribution_permission?: string
          email?: string | null
          expertise?: string[]
          follow_up_note?: string | null
          full_name?: string
          id?: string
          last_contacted_at?: string | null
          next_follow_up_at?: string | null
          org_id?: string
          phone?: string | null
          preferred_channel?: string | null
          relationship_owner_id?: string | null
          reliability_score?: number | null
          retention_review_at?: string | null
          stakeholder_group?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "football_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_state: {
        Row: {
          completed_at: string | null
          cursor: number
          error: string | null
          id: string
          result: Json | null
          started_at: string | null
          status: string
          sync_key: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cursor?: number
          error?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          sync_key: string
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cursor?: number
          error?: string | null
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          sync_key?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      intelligence_audit_tombstones: {
        Row: {
          audit_context: Json
          deleted_at: string
          deleted_by: string | null
          deletion_reason: string
          id: string
          org_id: string
          record_id: string
          record_table: string
        }
        Insert: {
          audit_context?: Json
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string
          id?: string
          org_id: string
          record_id: string
          record_table: string
        }
        Update: {
          audit_context?: Json
          deleted_at?: string
          deleted_by?: string | null
          deletion_reason?: string
          id?: string
          org_id?: string
          record_id?: string
          record_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_audit_tombstones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_inbox_items: {
        Row: {
          agent_id: string | null
          analyst_notes: string | null
          board_visibility: string
          channel: string | null
          club_id: string | null
          coach_id: string | null
          commercial_surface: string
          confidence: number | null
          contradiction_status: string
          created_at: string
          destination_record_id: string | null
          destination_record_type: string | null
          direction: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          evidence_methods: string[]
          extracted_signal: string | null
          headline: string
          id: string
          intake_type: string
          mandate_id: string | null
          methodology_criteria: string[]
          next_action: string | null
          org_id: string | null
          promoted_at: string | null
          promoted_by: string | null
          raw_detail: string | null
          review_status: string
          sensitivity: string
          source_expires_at: string | null
          source_link: string | null
          source_name: string | null
          source_proximity: string | null
          source_recorded_at: string | null
          source_tier: string | null
          source_type: string
          suggested_destination: string
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          agent_id?: string | null
          analyst_notes?: string | null
          board_visibility?: string
          channel?: string | null
          club_id?: string | null
          coach_id?: string | null
          commercial_surface?: string
          confidence?: number | null
          contradiction_status?: string
          created_at?: string
          destination_record_id?: string | null
          destination_record_type?: string | null
          direction?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          evidence_methods?: string[]
          extracted_signal?: string | null
          headline: string
          id?: string
          intake_type?: string
          mandate_id?: string | null
          methodology_criteria?: string[]
          next_action?: string | null
          org_id?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          raw_detail?: string | null
          review_status?: string
          sensitivity?: string
          source_expires_at?: string | null
          source_link?: string | null
          source_name?: string | null
          source_proximity?: string | null
          source_recorded_at?: string | null
          source_tier?: string | null
          source_type?: string
          suggested_destination?: string
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          agent_id?: string | null
          analyst_notes?: string | null
          board_visibility?: string
          channel?: string | null
          club_id?: string | null
          coach_id?: string | null
          commercial_surface?: string
          confidence?: number | null
          contradiction_status?: string
          created_at?: string
          destination_record_id?: string | null
          destination_record_type?: string | null
          direction?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          evidence_methods?: string[]
          extracted_signal?: string | null
          headline?: string
          id?: string
          intake_type?: string
          mandate_id?: string | null
          methodology_criteria?: string[]
          next_action?: string | null
          org_id?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          raw_detail?: string | null
          review_status?: string
          sensitivity?: string
          source_expires_at?: string | null
          source_link?: string | null
          source_name?: string | null
          source_proximity?: string | null
          source_recorded_at?: string | null
          source_tier?: string | null
          source_type?: string
          suggested_destination?: string
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_inbox_items_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_inbox_items_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_inbox_items_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_inbox_items_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_items: {
        Row: {
          archive_reason: string | null
          archive_recorded_at: string | null
          archived_at: string | null
          archived_by: string | null
          board_visibility: string
          category: string | null
          confidence: number | null
          contradiction_status: string
          created_at: string
          detail: string | null
          direction: string | null
          entity_id: string
          entity_type: string
          id: string
          is_deleted: boolean
          mandate_id: string | null
          occurred_at: string | null
          sensitivity: string
          source_expires_at: string | null
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_proximity: string | null
          source_tier: string | null
          source_type: string | null
          title: string
          user_id: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          archive_reason?: string | null
          archive_recorded_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          board_visibility?: string
          category?: string | null
          confidence?: number | null
          contradiction_status?: string
          created_at?: string
          detail?: string | null
          direction?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_deleted?: boolean
          mandate_id?: string | null
          occurred_at?: string | null
          sensitivity?: string
          source_expires_at?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_proximity?: string | null
          source_tier?: string | null
          source_type?: string | null
          title: string
          user_id: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          archive_reason?: string | null
          archive_recorded_at?: string | null
          archived_at?: string | null
          archived_by?: string | null
          board_visibility?: string
          category?: string | null
          confidence?: number | null
          contradiction_status?: string
          created_at?: string
          detail?: string | null
          direction?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_deleted?: boolean
          mandate_id?: string | null
          occurred_at?: string | null
          sensitivity?: string
          source_expires_at?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_proximity?: string | null
          source_tier?: string | null
          source_type?: string | null
          title?: string
          user_id?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_items_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_sessions: {
        Row: {
          analyst_notes: string | null
          career_context: string | null
          channel: string | null
          coach_id: string | null
          consent_status: string
          contact_id: string | null
          correction_status: string
          created_at: string
          created_by: string
          failure_reason: string | null
          id: string
          intake_method: string
          occurred_at: string
          org_id: string
          processing_status: string
          recording_delete_after: string | null
          recording_storage_path: string | null
          retention_review_at: string | null
          reviewed_at: string | null
          sensitivity: string
          title: string
          transcript_segments: Json
          transcript_storage_path: string | null
          transcript_text: string | null
          updated_at: string
        }
        Insert: {
          analyst_notes?: string | null
          career_context?: string | null
          channel?: string | null
          coach_id?: string | null
          consent_status?: string
          contact_id?: string | null
          correction_status?: string
          created_at?: string
          created_by: string
          failure_reason?: string | null
          id?: string
          intake_method: string
          occurred_at?: string
          org_id: string
          processing_status?: string
          recording_delete_after?: string | null
          recording_storage_path?: string | null
          retention_review_at?: string | null
          reviewed_at?: string | null
          sensitivity?: string
          title: string
          transcript_segments?: Json
          transcript_storage_path?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Update: {
          analyst_notes?: string | null
          career_context?: string | null
          channel?: string | null
          coach_id?: string | null
          consent_status?: string
          contact_id?: string | null
          correction_status?: string
          created_at?: string
          created_by?: string
          failure_reason?: string | null
          id?: string
          intake_method?: string
          occurred_at?: string
          org_id?: string
          processing_status?: string
          recording_delete_after?: string | null
          recording_storage_path?: string | null
          retention_review_at?: string | null
          reviewed_at?: string | null
          sensitivity?: string
          title?: string
          transcript_segments?: Json
          transcript_storage_path?: string | null
          transcript_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intelligence_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "football_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intelligence_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      mandate_candidate_suggestions: {
        Row: {
          added_at: string | null
          coach_id: string
          confidence: number
          dismissed_at: string | null
          evidence_snippets: Json
          generated_at: string
          id: string
          mandate_id: string
          reason_tags: string[]
          risk_notes: string[]
          score: number
          scoring_version: string
          source_coverage: number
          status: string
          suggestion_type: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          coach_id: string
          confidence?: number
          dismissed_at?: string | null
          evidence_snippets?: Json
          generated_at?: string
          id?: string
          mandate_id: string
          reason_tags?: string[]
          risk_notes?: string[]
          score: number
          scoring_version?: string
          source_coverage?: number
          status?: string
          suggestion_type?: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          coach_id?: string
          confidence?: number
          dismissed_at?: string | null
          evidence_snippets?: Json
          generated_at?: string
          id?: string
          mandate_id?: string
          reason_tags?: string[]
          risk_notes?: string[]
          score?: number
          scoring_version?: string
          source_coverage?: number
          status?: string
          suggestion_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mandate_candidate_suggestions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mandate_candidate_suggestions_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
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
          scored_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          fit_explanation?: string | null
          id?: string
          mandate_id: string
          ranking_score?: number | null
          scored_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          fit_explanation?: string | null
          id?: string
          mandate_id?: string
          ranking_score?: number | null
          scored_at?: string | null
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
      organization_access_events: {
        Row: {
          actor_user_id: string | null
          event_type: string
          id: string
          invitation_id: string | null
          metadata: Json
          occurred_at: string
          organization_id: string
          target_user_id: string | null
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          id?: string
          invitation_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id: string
          target_user_id?: string | null
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          id?: string
          invitation_id?: string | null
          metadata?: Json
          occurred_at?: string
          organization_id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_access_events_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "club_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_access_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_by: string | null
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          club_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          organization_type: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_type: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_type?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_claims: {
        Row: {
          agent_id: string | null
          applied_at: string | null
          claim_type: string
          claimed_value: string
          coach_id: string | null
          confidence: number | null
          contact_id: string | null
          context_club: string | null
          context_period: string | null
          context_role: string | null
          created_at: string
          created_by: string | null
          current_value: string | null
          deleted_at: string | null
          deletion_reason: string | null
          entity_id: string
          entity_type: string
          evidence_strength: string
          evidence_summary: string
          external_visibility: string
          fact_check_status: string
          id: string
          interaction_id: string | null
          methodology_criteria: string[]
          occurred_at: string | null
          org_id: string | null
          profile_field: string | null
          reference_campaign_id: string | null
          restriction_status: string
          review_due_at: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          sensitivity: string
          session_id: string | null
          source_link: string | null
          source_name: string | null
          source_notes: string | null
          source_tier: string | null
          source_type: string
          statement_type: string
          transcript_end_seconds: number | null
          transcript_excerpt: string | null
          transcript_start_seconds: number | null
          updated_at: string
          used_in_recommendation: boolean
          user_id: string
          verification_status: string
        }
        Insert: {
          agent_id?: string | null
          applied_at?: string | null
          claim_type: string
          claimed_value: string
          coach_id?: string | null
          confidence?: number | null
          contact_id?: string | null
          context_club?: string | null
          context_period?: string | null
          context_role?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          entity_id: string
          entity_type?: string
          evidence_strength?: string
          evidence_summary: string
          external_visibility?: string
          fact_check_status?: string
          id?: string
          interaction_id?: string | null
          methodology_criteria?: string[]
          occurred_at?: string | null
          org_id?: string | null
          profile_field?: string | null
          reference_campaign_id?: string | null
          restriction_status?: string
          review_due_at?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitivity?: string
          session_id?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_tier?: string | null
          source_type?: string
          statement_type?: string
          transcript_end_seconds?: number | null
          transcript_excerpt?: string | null
          transcript_start_seconds?: number | null
          updated_at?: string
          used_in_recommendation?: boolean
          user_id: string
          verification_status?: string
        }
        Update: {
          agent_id?: string | null
          applied_at?: string | null
          claim_type?: string
          claimed_value?: string
          coach_id?: string | null
          confidence?: number | null
          contact_id?: string | null
          context_club?: string | null
          context_period?: string | null
          context_role?: string | null
          created_at?: string
          created_by?: string | null
          current_value?: string | null
          deleted_at?: string | null
          deletion_reason?: string | null
          entity_id?: string
          entity_type?: string
          evidence_strength?: string
          evidence_summary?: string
          external_visibility?: string
          fact_check_status?: string
          id?: string
          interaction_id?: string | null
          methodology_criteria?: string[]
          occurred_at?: string | null
          org_id?: string | null
          profile_field?: string | null
          reference_campaign_id?: string | null
          restriction_status?: string
          review_due_at?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sensitivity?: string
          session_id?: string | null
          source_link?: string | null
          source_name?: string | null
          source_notes?: string | null
          source_tier?: string | null
          source_type?: string
          statement_type?: string
          transcript_end_seconds?: number | null
          transcript_excerpt?: string | null
          transcript_start_seconds?: number | null
          updated_at?: string
          used_in_recommendation?: boolean
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_claims_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_claims_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_claims_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "football_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_claims_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "agent_interactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_claims_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_claims_reference_campaign_fk"
            columns: ["reference_campaign_id"]
            isOneToOne: false
            referencedRelation: "reference_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_campaign_contacts: {
        Row: {
          campaign_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          evidence_gap: string | null
          id: string
          next_action: string | null
          org_id: string
          prospect_name: string | null
          prospect_role: string | null
          scheduled_at: string | null
          selected_question_keys: string[]
          session_id: string | null
          stakeholder_group: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          evidence_gap?: string | null
          id?: string
          next_action?: string | null
          org_id: string
          prospect_name?: string | null
          prospect_role?: string | null
          scheduled_at?: string | null
          selected_question_keys?: string[]
          session_id?: string | null
          stakeholder_group?: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          evidence_gap?: string | null
          id?: string
          next_action?: string | null
          org_id?: string
          prospect_name?: string | null
          prospect_role?: string | null
          scheduled_at?: string | null
          selected_question_keys?: string[]
          session_id?: string | null
          stakeholder_group?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "reference_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_campaign_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "football_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_campaign_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_campaign_contacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "intelligence_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      reference_campaigns: {
        Row: {
          coach_id: string
          completed_at: string | null
          created_at: string
          created_by: string
          evidence_gap: string | null
          id: string
          mandate_id: string | null
          next_action: string | null
          next_review_at: string | null
          org_id: string
          owner_id: string
          selected_question_keys: string[]
          status: string
          target_stakeholder_groups: string[]
          title: string
          updated_at: string
        }
        Insert: {
          coach_id: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          evidence_gap?: string | null
          id?: string
          mandate_id?: string | null
          next_action?: string | null
          next_review_at?: string | null
          org_id: string
          owner_id: string
          selected_question_keys?: string[]
          status?: string
          target_stakeholder_groups?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          coach_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          evidence_gap?: string | null
          id?: string
          mandate_id?: string | null
          next_action?: string | null
          next_review_at?: string | null
          org_id?: string
          owner_id?: string
          selected_question_keys?: string[]
          status?: string
          target_stakeholder_groups?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_campaigns_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_campaigns_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reference_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_models: {
        Row: {
          created_at: string
          id: string
          name: string
          version: string
          weights: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          version: string
          weights?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          version?: string
          weights?: Json
        }
        Relationships: []
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
      succession_plans: {
        Row: {
          board_signal: string | null
          club_id: string
          created_at: string
          desired_archetype: string | null
          id: string
          last_signal_at: string | null
          linked_mandate_id: string | null
          manager_security: string | null
          next_review_date: string | null
          notes: string | null
          org_id: string | null
          owner_name: string | null
          priority: string
          risk_triggers: string[]
          status: string
          succession_timeline: string | null
          target_profile: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          board_signal?: string | null
          club_id: string
          created_at?: string
          desired_archetype?: string | null
          id?: string
          last_signal_at?: string | null
          linked_mandate_id?: string | null
          manager_security?: string | null
          next_review_date?: string | null
          notes?: string | null
          org_id?: string | null
          owner_name?: string | null
          priority?: string
          risk_triggers?: string[]
          status?: string
          succession_timeline?: string | null
          target_profile?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          board_signal?: string | null
          club_id?: string
          created_at?: string
          desired_archetype?: string | null
          id?: string
          last_signal_at?: string | null
          linked_mandate_id?: string | null
          manager_security?: string | null
          next_review_date?: string | null
          notes?: string | null
          org_id?: string | null
          owner_name?: string | null
          priority?: string
          risk_triggers?: string[]
          status?: string
          succession_timeline?: string | null
          target_profile?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "succession_plans_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "succession_plans_linked_mandate_id_fkey"
            columns: ["linked_mandate_id"]
            isOneToOne: false
            referencedRelation: "mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_bench_entries: {
        Row: {
          availability_reviewed_at: string | null
          coach_id: string
          contract_reviewed_at: string | null
          created_at: string
          created_by: string
          id: string
          last_reviewed_at: string | null
          next_review_at: string | null
          nomination_source_contact_id: string | null
          org_id: string
          rationale: string | null
          staff_reviewed_at: string | null
          stage: string
          stage_confirmed_at: string
          stage_confirmed_by: string
          updated_at: string
          work_permit_reviewed_at: string | null
        }
        Insert: {
          availability_reviewed_at?: string | null
          coach_id: string
          contract_reviewed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          nomination_source_contact_id?: string | null
          org_id: string
          rationale?: string | null
          staff_reviewed_at?: string | null
          stage?: string
          stage_confirmed_at?: string
          stage_confirmed_by: string
          updated_at?: string
          work_permit_reviewed_at?: string | null
        }
        Update: {
          availability_reviewed_at?: string | null
          coach_id?: string
          contract_reviewed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          nomination_source_contact_id?: string | null
          org_id?: string
          rationale?: string | null
          staff_reviewed_at?: string | null
          stage?: string
          stage_confirmed_at?: string
          stage_confirmed_by?: string
          updated_at?: string
          work_permit_reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trusted_bench_entries_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_bench_entries_nomination_source_contact_id_fkey"
            columns: ["nomination_source_contact_id"]
            isOneToOne: false
            referencedRelation: "football_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trusted_bench_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      watchlist_coaches: {
        Row: {
          added_at: string
          coach_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          coach_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          coach_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_coaches_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_dossier_order: {
        Args: {
          access_days?: number
          material_ids: string[]
          permit_download?: boolean
          release_note?: string
          target_order_id: string
        }
        Returns: string
      }
      claim_club_invitation: {
        Args: { invitation_token_hash: string }
        Returns: string
      }
      claim_unowned_rows: { Args: never; Returns: Json }
      club_invitation_email_matches: {
        Args: { candidate_email: string; invitation_token_hash: string }
        Returns: boolean
      }
      get_unowned_counts: { Args: never; Returns: Json }
      is_internal_operator: {
        Args: { allowed_roles?: string[] }
        Returns: boolean
      }
      is_organization_member: {
        Args: { allowed_roles?: string[]; target_organization_id: string }
        Returns: boolean
      }
      issue_club_invitation: {
        Args: {
          intended_email: string
          invitation_expires_at: string
          invitation_token_hash: string
          invited_role: string
          target_organization_id: string
        }
        Returns: string
      }
      preview_club_invitation: {
        Args: { invitation_token_hash: string }
        Returns: {
          email_hint: string
          expires_at: string
          invitation_status: string
          invited_role: string
          organization_name: string
        }[]
      }
      record_club_first_login: { Args: never; Returns: boolean }
      revoke_club_invitation: {
        Args: { target_invitation_id: string }
        Returns: undefined
      }
      revoke_club_membership: {
        Args: { target_membership_id: string }
        Returns: undefined
      }
      revoke_dossier_access: {
        Args: { target_order_id: string }
        Returns: undefined
      }
      submit_dossier_order: {
        Args: {
          buyer_reference_text?: string
          intended_use_text: string
          target_offer_id: string
        }
        Returns: string
      }
      verify_coach_career_circumstances: {
        Args: { p_coach_id: string }
        Returns: boolean
      }
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
