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
          currency: string
          fit_summary: string | null
          headline: string
          id: string
          included_sections: Json
          key_risks: string | null
          key_strengths: string | null
          mandate_id: string
          preview_summary: string
          price_amount: number
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
          currency?: string
          fit_summary?: string | null
          headline: string
          id?: string
          included_sections?: Json
          key_risks?: string | null
          key_strengths?: string | null
          mandate_id: string
          preview_summary: string
          price_amount?: number
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
          currency?: string
          fit_summary?: string | null
          headline?: string
          id?: string
          included_sections?: Json
          key_risks?: string | null
          key_strengths?: string | null
          mandate_id?: string
          preview_summary?: string
          price_amount?: number
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
      dossier_orders: {
        Row: {
          access_request_id: string
          activated_at: string | null
          approved_at: string | null
          buyer_organization_id: string
          buyer_reference: string | null
          club_brief_id: string | null
          coach_id: string
          currency: string
          expires_at: string | null
          id: string
          intended_use: string
          internal_notes: string | null
          mandate_id: string
          offer_id: string
          ordered_at: string
          ordered_by: string
          payment_status: string
          price_amount: number
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
          currency: string
          expires_at?: string | null
          id?: string
          intended_use: string
          internal_notes?: string | null
          mandate_id: string
          offer_id: string
          ordered_at?: string
          ordered_by: string
          payment_status?: string
          price_amount: number
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
          currency?: string
          expires_at?: string | null
          id?: string
          intended_use?: string
          internal_notes?: string | null
          mandate_id?: string
          offer_id?: string
          ordered_at?: string
          ordered_by?: string
          payment_status?: string
          price_amount?: number
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
      coach_private_materials: {
        Row: {
          id: string
          user_id: string
          coach_id: string
          title: string
          material_type: string
          description: string | null
          external_url: string | null
          storage_path: string | null
          source_label: string | null
          uploaded_by: string
          confidentiality_status: string
          verification_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coach_id: string
          title: string
          material_type?: string
          description?: string | null
          external_url?: string | null
          storage_path?: string | null
          source_label?: string | null
          uploaded_by?: string
          confidentiality_status?: string
          verification_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coach_id?: string
          title?: string
          material_type?: string
          description?: string | null
          external_url?: string | null
          storage_path?: string | null
          source_label?: string | null
          uploaded_by?: string
          confidentiality_status?: string
          verification_status?: string
          created_at?: string
          updated_at?: string
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
      confidential_access_requests: {
        Row: {
          id: string
          user_id: string
          mandate_id: string
          coach_id: string
          requested_by: string | null
          requester_role: string | null
          club_context: string | null
          request_reason: string
          status: string
          internal_notes: string | null
          requested_at: string
          decided_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mandate_id: string
          coach_id: string
          requested_by?: string | null
          requester_role?: string | null
          club_context?: string | null
          request_reason: string
          status?: string
          internal_notes?: string | null
          requested_at?: string
          decided_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mandate_id?: string
          coach_id?: string
          requested_by?: string | null
          requester_role?: string | null
          club_context?: string | null
          request_reason?: string
          status?: string
          internal_notes?: string | null
          requested_at?: string
          decided_at?: string | null
          created_at?: string
          updated_at?: string
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
      coach_portal_profiles: {
        Row: {
          id: string
          user_id: string
          coach_id: string
          portal_status: string
          visibility_status: string
          coach_email: string | null
          coach_phone: string | null
          representative_name: string | null
          representative_email: string | null
          base_location: string | null
          preferred_contact_method: string | null
          short_bio: string | null
          personal_statement: string | null
          football_identity: string | null
          in_possession_model: string | null
          out_of_possession_model: string | null
          transition_model: string | null
          set_piece_model: string | null
          training_week: string | null
          session_design_principles: string | null
          player_development_proof: string | null
          academy_integration: string | null
          recruitment_preferences: string | null
          staff_network: string | null
          key_staff_likely_to_follow: string | null
          presentation_summary: string | null
          video_summary: string | null
          media_and_communication: string | null
          reference_permissions: string | null
          sensitive_notes: string | null
          release_notes: string | null
          submitted_at: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coach_id: string
          portal_status?: string
          visibility_status?: string
          coach_email?: string | null
          coach_phone?: string | null
          representative_name?: string | null
          representative_email?: string | null
          base_location?: string | null
          preferred_contact_method?: string | null
          short_bio?: string | null
          personal_statement?: string | null
          football_identity?: string | null
          in_possession_model?: string | null
          out_of_possession_model?: string | null
          transition_model?: string | null
          set_piece_model?: string | null
          training_week?: string | null
          session_design_principles?: string | null
          player_development_proof?: string | null
          academy_integration?: string | null
          recruitment_preferences?: string | null
          staff_network?: string | null
          key_staff_likely_to_follow?: string | null
          presentation_summary?: string | null
          video_summary?: string | null
          media_and_communication?: string | null
          reference_permissions?: string | null
          sensitive_notes?: string | null
          release_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coach_id?: string
          portal_status?: string
          visibility_status?: string
          coach_email?: string | null
          coach_phone?: string | null
          representative_name?: string | null
          representative_email?: string | null
          base_location?: string | null
          preferred_contact_method?: string | null
          short_bio?: string | null
          personal_statement?: string | null
          football_identity?: string | null
          in_possession_model?: string | null
          out_of_possession_model?: string | null
          transition_model?: string | null
          set_piece_model?: string | null
          training_week?: string | null
          session_design_principles?: string | null
          player_development_proof?: string | null
          academy_integration?: string | null
          recruitment_preferences?: string | null
          staff_network?: string | null
          key_staff_likely_to_follow?: string | null
          presentation_summary?: string | null
          video_summary?: string | null
          media_and_communication?: string | null
          reference_permissions?: string | null
          sensitive_notes?: string | null
          release_notes?: string | null
          submitted_at?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
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
      clubs: {
        Row: {
          country: string
          created_at: string
          updated_at: string
          squad_synced_at: string | null
          coaches_synced_at: string | null
          transfers_synced_at: string | null
          id: string
          league: string
          name: string
          notes: string | null
          ownership_model: string
          tier: string | null
          user_id: string
          tactical_model: string | null
          pressing_model: string | null
          build_model: string | null
          board_risk_tolerance: string | null
          ownership_style: string | null
          sporting_structure: string | null
          strategic_priority: string | null
          budget_ceiling: string | null
          governance_complexity: string | null
          instability_risk: string | null
          external_id: string | null
          external_source: string | null
          badge_url: string | null
          description: string | null
          stadium: string | null
          founded_year: string | null
          id_league: string | null
          current_manager: string | null
          website: string | null
          stadium_location: string | null
          stadium_capacity: string | null
          last_synced_at: string | null
          wikidata_id: string | null
          wikidata_synced_at: string | null
          market_reputation: string | null
          media_pressure: string | null
          environment_assessment: string | null
          development_vs_win_now: string | null
        }
        Insert: {
          country: string
          created_at?: string
          updated_at?: string
          squad_synced_at?: string | null
          coaches_synced_at?: string | null
          transfers_synced_at?: string | null
          id?: string
          league: string
          name: string
          notes?: string | null
          ownership_model?: string
          tier?: string | null
          user_id: string
          tactical_model?: string | null
          pressing_model?: string | null
          build_model?: string | null
          board_risk_tolerance?: string | null
          ownership_style?: string | null
          sporting_structure?: string | null
          strategic_priority?: string | null
          budget_ceiling?: string | null
          governance_complexity?: string | null
          instability_risk?: string | null
          external_id?: string | null
          external_source?: string | null
          badge_url?: string | null
          description?: string | null
          stadium?: string | null
          founded_year?: string | null
          id_league?: string | null
          current_manager?: string | null
          website?: string | null
          stadium_location?: string | null
          stadium_capacity?: string | null
          last_synced_at?: string | null
          wikidata_id?: string | null
          wikidata_synced_at?: string | null
          market_reputation?: string | null
          media_pressure?: string | null
          environment_assessment?: string | null
          development_vs_win_now?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          updated_at?: string
          squad_synced_at?: string | null
          coaches_synced_at?: string | null
          transfers_synced_at?: string | null
          id?: string
          league?: string
          name?: string
          notes?: string | null
          ownership_model?: string
          tier?: string | null
          user_id?: string
          tactical_model?: string | null
          pressing_model?: string | null
          build_model?: string | null
          board_risk_tolerance?: string | null
          ownership_style?: string | null
          sporting_structure?: string | null
          strategic_priority?: string | null
          budget_ceiling?: string | null
          governance_complexity?: string | null
          instability_risk?: string | null
          external_id?: string | null
          external_source?: string | null
          badge_url?: string | null
          description?: string | null
          stadium?: string | null
          founded_year?: string | null
          id_league?: string | null
          current_manager?: string | null
          website?: string | null
          stadium_location?: string | null
          stadium_capacity?: string | null
          last_synced_at?: string | null
          wikidata_id?: string | null
          wikidata_synced_at?: string | null
          market_reputation?: string | null
          media_pressure?: string | null
          environment_assessment?: string | null
          development_vs_win_now?: string | null
        }
        Relationships: []
      }
      club_coaching_history: {
        Row: {
          id: string
          user_id: string
          club_id: string
          coach_name: string
          start_date: string | null
          end_date: string | null
          reason_for_exit: string | null
          style_tags: string[]
          created_at: string
          data_source: string
          wikidata_id: string | null
          start_date_approx: boolean
          end_date_approx: boolean
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          coach_name: string
          start_date?: string | null
          end_date?: string | null
          reason_for_exit?: string | null
          style_tags?: string[]
          created_at?: string
          data_source?: string
          wikidata_id?: string | null
          start_date_approx?: boolean
          end_date_approx?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          coach_name?: string
          start_date?: string | null
          end_date?: string | null
          reason_for_exit?: string | null
          style_tags?: string[]
          created_at?: string
          data_source?: string
          wikidata_id?: string | null
          start_date_approx?: boolean
          end_date_approx?: boolean
        }
        Relationships: [{ foreignKeyName: "club_coaching_history_club_id_fkey"; columns: ["club_id"]; referencedRelation: "clubs"; referencedColumns: ["id"] }]
      }
      club_pathway_data: {
        Row: {
          id: string
          user_id: string
          club_id: string
          season: string
          academy_debuts: number | null
          u21_minutes_percentage: number | null
          internal_promotions: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          season: string
          academy_debuts?: number | null
          u21_minutes_percentage?: number | null
          internal_promotions?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          season?: string
          academy_debuts?: number | null
          u21_minutes_percentage?: number | null
          internal_promotions?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "club_pathway_data_club_id_fkey"; columns: ["club_id"]; referencedRelation: "clubs"; referencedColumns: ["id"] }]
      }
      club_squad: {
        Row: {
          id: string
          user_id: string
          club_id: string
          player_id: number
          name: string
          age: number | null
          position: string | null
          number: number | null
          photo_url: string | null
          season: string
          synced_at: string
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          player_id: number
          name: string
          age?: number | null
          position?: string | null
          number?: number | null
          photo_url?: string | null
          season?: string
          synced_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          player_id?: number
          name?: string
          age?: number | null
          position?: string | null
          number?: number | null
          photo_url?: string | null
          season?: string
          synced_at?: string
        }
        Relationships: [{ foreignKeyName: "club_squad_club_id_fkey"; columns: ["club_id"]; referencedRelation: "clubs"; referencedColumns: ["id"] }]
      }
      club_transfers: {
        Row: {
          id: string
          user_id: string
          club_id: string
          player_name: string
          direction: string
          fee_band: string | null
          fee_amount: number | null
          fee_currency: string | null
          age_at_transfer: number | null
          nationality: string | null
          position: string | null
          other_club: string | null
          transfer_type: string | null
          transfer_date: string | null
          season: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          player_name: string
          direction: string
          fee_band?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          age_at_transfer?: number | null
          nationality?: string | null
          position?: string | null
          other_club?: string | null
          transfer_type?: string | null
          transfer_date?: string | null
          season?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          player_name?: string
          direction?: string
          fee_band?: string | null
          fee_amount?: number | null
          fee_currency?: string | null
          age_at_transfer?: number | null
          nationality?: string | null
          position?: string | null
          other_club?: string | null
          transfer_type?: string | null
          transfer_date?: string | null
          season?: string | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: "club_transfers_club_id_fkey"; columns: ["club_id"]; referencedRelation: "clubs"; referencedColumns: ["id"] }]
      }
      club_data_sync_log: {
        Row: {
          id: string
          club_id: string
          user_id: string
          sync_type: string
          sync_at: string
          result: Json | null
          error: string | null
        }
        Insert: {
          id?: string
          club_id: string
          user_id: string
          sync_type: string
          sync_at?: string
          result?: Json | null
          error?: string | null
        }
        Update: {
          id?: string
          club_id?: string
          user_id?: string
          sync_type?: string
          sync_at?: string
          result?: Json | null
          error?: string | null
        }
        Relationships: [
          { foreignKeyName: "club_data_sync_log_club_id_fkey"; columns: ["club_id"]; referencedRelation: "clubs"; referencedColumns: ["id"] },
          { foreignKeyName: "club_data_sync_log_user_id_fkey"; columns: ["user_id"]; referencedRelation: "users"; referencedColumns: ["id"] }
        ]
      }
      club_season_results: {
        Row: {
          id: string
          user_id: string
          club_id: string
          season: string
          league_label: string | null
          league_position: number | null
          points: number | null
          goals_for: number | null
          goals_against: number | null
          created_at: string
          data_source: string
        }
        Insert: {
          id?: string
          user_id: string
          club_id: string
          season: string
          league_label?: string | null
          league_position?: number | null
          points?: number | null
          goals_for?: number | null
          goals_against?: number | null
          created_at?: string
          data_source?: string
        }
        Update: {
          id?: string
          user_id?: string
          club_id?: string
          season?: string
          league_label?: string | null
          league_position?: number | null
          points?: number | null
          goals_for?: number | null
          goals_against?: number | null
          created_at?: string
          data_source?: string
        }
        Relationships: [{ foreignKeyName: "club_season_results_club_id_fkey"; columns: ["club_id"]; referencedRelation: "clubs"; referencedColumns: ["id"] }]
      }
      config_pipeline_stages: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_reputation_tiers: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_availability_statuses: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_preferred_styles: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_pressing_intensity: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_build_preferences: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_mandate_preference_categories: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_formation_presets: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; formation: string | null; notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; formation?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; formation?: string | null; notes?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      config_scoring_weights: {
        Row: { id: string; user_id: string; name: string; sort_order: number; is_active: boolean; key: string; weight: number; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; name: string; sort_order?: number; is_active?: boolean; key: string; weight: number; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; name?: string; sort_order?: number; is_active?: boolean; key?: string; weight?: number; created_at?: string; updated_at?: string }
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
          coaching_licence: string | null
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
          preferred_name: string | null
          date_of_birth: string | null
          languages: string[]
          base_location: string | null
          relocation_flexibility: string | null
          family_context: string | null
          agent_name: string | null
          agent_contact: string | null
          compensation_expectation: string | null
          contract_expiry: string | null
          contract_notes: string | null
          availability_status: string | null
          market_status: string | null
          release_clause: string | null
          tactical_identity: string | null
          preferred_systems: string[]
          transition_model: string | null
          rest_defence_model: string | null
          set_piece_approach: string | null
          training_methodology: string | null
          recruitment_collaboration: string | null
          staff_management_style: string | null
          player_development_model: string | null
          academy_integration: string | null
          comms_profile: string | null
          media_style: string | null
          conflict_history: string | null
          due_diligence_summary: string | null
          legal_risk_flag: boolean
          integrity_risk_flag: boolean
          safeguarding_risk_flag: boolean
          compliance_notes: string | null
          tactical_fit_score: number | null
          leadership_score: number | null
          development_score: number | null
          recruitment_fit_score: number | null
          media_risk_score: number | null
          cultural_alignment_score: number | null
          adaptability_score: number | null
          overall_manual_score: number | null
          intelligence_confidence: number | null
        }
        Insert: {
          age?: number | null
          agent_relationship?: number | null
          available_status?: string
          board_compatibility?: number | null
          build_preference: string
          club_current?: string | null
          coaching_licence?: string | null
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
          preferred_name?: string | null
          date_of_birth?: string | null
          languages?: string[]
          base_location?: string | null
          relocation_flexibility?: string | null
          family_context?: string | null
          agent_name?: string | null
          agent_contact?: string | null
          compensation_expectation?: string | null
          contract_expiry?: string | null
          contract_notes?: string | null
          availability_status?: string | null
          market_status?: string | null
          release_clause?: string | null
          tactical_identity?: string | null
          preferred_systems?: string[]
          transition_model?: string | null
          rest_defence_model?: string | null
          set_piece_approach?: string | null
          training_methodology?: string | null
          recruitment_collaboration?: string | null
          staff_management_style?: string | null
          player_development_model?: string | null
          academy_integration?: string | null
          comms_profile?: string | null
          media_style?: string | null
          conflict_history?: string | null
          due_diligence_summary?: string | null
          legal_risk_flag?: boolean
          integrity_risk_flag?: boolean
          safeguarding_risk_flag?: boolean
          compliance_notes?: string | null
          tactical_fit_score?: number | null
          leadership_score?: number | null
          development_score?: number | null
          recruitment_fit_score?: number | null
          media_risk_score?: number | null
          cultural_alignment_score?: number | null
          adaptability_score?: number | null
          overall_manual_score?: number | null
          intelligence_confidence?: number | null
        }
        Update: {
          age?: number | null
          agent_relationship?: number | null
          available_status?: string
          board_compatibility?: number | null
          build_preference?: string
          club_current?: string | null
          coaching_licence?: string | null
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
          preferred_name?: string | null
          date_of_birth?: string | null
          languages?: string[]
          base_location?: string | null
          relocation_flexibility?: string | null
          family_context?: string | null
          agent_name?: string | null
          agent_contact?: string | null
          compensation_expectation?: string | null
          contract_expiry?: string | null
          contract_notes?: string | null
          availability_status?: string | null
          market_status?: string | null
          release_clause?: string | null
          tactical_identity?: string | null
          preferred_systems?: string[]
          transition_model?: string | null
          rest_defence_model?: string | null
          set_piece_approach?: string | null
          training_methodology?: string | null
          recruitment_collaboration?: string | null
          staff_management_style?: string | null
          player_development_model?: string | null
          academy_integration?: string | null
          comms_profile?: string | null
          media_style?: string | null
          conflict_history?: string | null
          due_diligence_summary?: string | null
          legal_risk_flag?: boolean
          integrity_risk_flag?: boolean
          safeguarding_risk_flag?: boolean
          compliance_notes?: string | null
          tactical_fit_score?: number | null
          leadership_score?: number | null
          development_score?: number | null
          recruitment_fit_score?: number | null
          media_risk_score?: number | null
          cultural_alignment_score?: number | null
          adaptability_score?: number | null
          overall_manual_score?: number | null
          intelligence_confidence?: number | null
        }
        Relationships: []
      }
      coach_derived_metrics: {
        Row: {
          coach_id: string
          avg_squad_age: number | null
          pct_minutes_u23: number | null
          pct_minutes_30plus: number | null
          rotation_index: number | null
          avg_signing_age: number | null
          repeat_signings_count: number | null
          repeat_agents_count: number | null
          loan_reliance_score: number | null
          network_density_score: number | null
          computed_at: string | null
          raw: unknown
        }
        Insert: {
          coach_id: string
          avg_squad_age?: number | null
          pct_minutes_u23?: number | null
          pct_minutes_30plus?: number | null
          rotation_index?: number | null
          avg_signing_age?: number | null
          repeat_signings_count?: number | null
          repeat_agents_count?: number | null
          loan_reliance_score?: number | null
          network_density_score?: number | null
          computed_at?: string | null
          raw?: unknown
        }
        Update: {
          coach_id?: string
          avg_squad_age?: number | null
          pct_minutes_u23?: number | null
          pct_minutes_30plus?: number | null
          rotation_index?: number | null
          avg_signing_age?: number | null
          repeat_signings_count?: number | null
          repeat_agents_count?: number | null
          loan_reliance_score?: number | null
          network_density_score?: number | null
          computed_at?: string | null
          raw?: unknown
        }
        Relationships: [{ foreignKeyName: 'coach_derived_metrics_coach_id_fkey'; columns: ['coach_id']; isOneToOne: true; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      coach_stints: {
        Row: {
          id: string
          coach_id: string
          club_name: string
          club_id: string | null
          country: string | null
          league: string | null
          role_title: string
          started_on: string | null
          ended_on: string | null
          appointment_context: string | null
          exit_context: string | null
          points_per_game: number | null
          win_rate: number | null
          performance_summary: string | null
          style_summary: string | null
          notable_outcomes: string | null
          created_at: string
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          confidence: number | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          coach_id: string
          club_name: string
          club_id?: string | null
          country?: string | null
          league?: string | null
          role_title: string
          started_on?: string | null
          ended_on?: string | null
          appointment_context?: string | null
          exit_context?: string | null
          points_per_game?: number | null
          win_rate?: number | null
          performance_summary?: string | null
          style_summary?: string | null
          notable_outcomes?: string | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          coach_id?: string
          club_name?: string
          club_id?: string | null
          country?: string | null
          league?: string | null
          role_title?: string
          started_on?: string | null
          ended_on?: string | null
          appointment_context?: string | null
          exit_context?: string | null
          points_per_game?: number | null
          win_rate?: number | null
          performance_summary?: string | null
          style_summary?: string | null
          notable_outcomes?: string | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          { foreignKeyName: 'coach_stints_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
          { foreignKeyName: 'coach_stints_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
        ]
      }
      staff: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          primary_role: string | null
          specialties: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          primary_role?: string | null
          specialties?: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          primary_role?: string | null
          specialties?: string[]
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      coach_staff_history: {
        Row: {
          id: string
          coach_id: string
          staff_id: string
          club_name: string
          club_id: string | null
          role_title: string
          started_on: string | null
          ended_on: string | null
          followed_from_previous: boolean
          times_worked_together: number
          relationship_strength: number | null
          impact_summary: string | null
          before_after_observation: string | null
          created_at: string
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          confidence: number | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          coach_id: string
          staff_id: string
          club_name: string
          club_id?: string | null
          role_title: string
          started_on?: string | null
          ended_on?: string | null
          followed_from_previous?: boolean
          times_worked_together?: number
          relationship_strength?: number | null
          impact_summary?: string | null
          before_after_observation?: string | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          coach_id?: string
          staff_id?: string
          club_name?: string
          club_id?: string | null
          role_title?: string
          started_on?: string | null
          ended_on?: string | null
          followed_from_previous?: boolean
          times_worked_together?: number
          relationship_strength?: number | null
          impact_summary?: string | null
          before_after_observation?: string | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          { foreignKeyName: 'coach_staff_history_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
          { foreignKeyName: 'coach_staff_history_staff_id_fkey'; columns: ['staff_id']; isOneToOne: false; referencedRelation: 'staff'; referencedColumns: ['id'] },
          { foreignKeyName: 'coach_staff_history_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
        ]
      }
      coach_staff_groups: {
        Row: {
          id: string
          coach_id: string
          group_name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          group_name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          group_name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: 'coach_staff_groups_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      coach_staff_group_members: {
        Row: {
          id: string
          group_id: string
          staff_id: string
          role_in_group: string | null
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          staff_id: string
          role_in_group?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          staff_id?: string
          role_in_group?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'coach_staff_group_members_group_id_fkey'; columns: ['group_id']; isOneToOne: false; referencedRelation: 'coach_staff_groups'; referencedColumns: ['id'] },
          { foreignKeyName: 'coach_staff_group_members_staff_id_fkey'; columns: ['staff_id']; isOneToOne: false; referencedRelation: 'staff'; referencedColumns: ['id'] },
        ]
      }
      coach_data_profiles: {
        Row: {
          id: string
          coach_id: string
          avg_squad_age: number | null
          avg_starting_xi_age: number | null
          minutes_u21: number | null
          minutes_21_24: number | null
          minutes_25_28: number | null
          minutes_29_plus: number | null
          recruitment_avg_age: number | null
          recruitment_repeat_player_count: number | null
          recruitment_repeat_agent_count: number | null
          media_pressure_score: number | null
          media_accountability_score: number | null
          media_confrontation_score: number | null
          social_presence_level: string | null
          narrative_risk_summary: string | null
          confidence_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          avg_squad_age?: number | null
          avg_starting_xi_age?: number | null
          minutes_u21?: number | null
          minutes_21_24?: number | null
          minutes_25_28?: number | null
          minutes_29_plus?: number | null
          recruitment_avg_age?: number | null
          recruitment_repeat_player_count?: number | null
          recruitment_repeat_agent_count?: number | null
          media_pressure_score?: number | null
          media_accountability_score?: number | null
          media_confrontation_score?: number | null
          social_presence_level?: string | null
          narrative_risk_summary?: string | null
          confidence_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          avg_squad_age?: number | null
          avg_starting_xi_age?: number | null
          minutes_u21?: number | null
          minutes_21_24?: number | null
          minutes_25_28?: number | null
          minutes_29_plus?: number | null
          recruitment_avg_age?: number | null
          recruitment_repeat_player_count?: number | null
          recruitment_repeat_agent_count?: number | null
          media_pressure_score?: number | null
          media_accountability_score?: number | null
          media_confrontation_score?: number | null
          social_presence_level?: string | null
          narrative_risk_summary?: string | null
          confidence_score?: number | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: 'coach_data_profiles_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      coach_external_profiles: {
        Row: {
          id: string
          coach_id: string
          api_coach_id: string | null
          full_name: string | null
          first_name: string | null
          last_name: string | null
          nationality: string | null
          birth_date: string | null
          birth_place: string | null
          birth_country: string | null
          height: string | null
          weight: string | null
          photo_url: string | null
          current_team_name: string | null
          api_team_id: string | null
          current_team_id: string | null
          match_strategy: string | null
          match_confidence: number | null
          profile_payload: Json | null
          source_name: string
          source_link: string | null
          confidence: number | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          api_coach_id?: string | null
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          nationality?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_country?: string | null
          height?: string | null
          weight?: string | null
          photo_url?: string | null
          current_team_name?: string | null
          api_team_id?: string | null
          current_team_id?: string | null
          match_strategy?: string | null
          match_confidence?: number | null
          profile_payload?: Json | null
          source_name?: string
          source_link?: string | null
          confidence?: number | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          api_coach_id?: string | null
          full_name?: string | null
          first_name?: string | null
          last_name?: string | null
          nationality?: string | null
          birth_date?: string | null
          birth_place?: string | null
          birth_country?: string | null
          height?: string | null
          weight?: string | null
          photo_url?: string | null
          current_team_name?: string | null
          api_team_id?: string | null
          current_team_id?: string | null
          match_strategy?: string | null
          match_confidence?: number | null
          profile_payload?: Json | null
          source_name?: string
          source_link?: string | null
          confidence?: number | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: [{ foreignKeyName: 'coach_external_profiles_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      coach_recruitment_history: {
        Row: {
          id: string
          coach_id: string
          player_name: string | null
          player_id: string | null
          club_name: string | null
          club_id: string | null
          transfer_window: string | null
          transfer_fee_band: string | null
          player_age_at_signing: number | null
          repeated_signing: boolean
          agent_name: string | null
          impact_summary: string | null
          created_at: string
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          confidence: number | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          coach_id: string
          player_name?: string | null
          player_id?: string | null
          club_name?: string | null
          club_id?: string | null
          transfer_window?: string | null
          transfer_fee_band?: string | null
          player_age_at_signing?: number | null
          repeated_signing?: boolean
          agent_name?: string | null
          impact_summary?: string | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          coach_id?: string
          player_name?: string | null
          player_id?: string | null
          club_name?: string | null
          club_id?: string | null
          transfer_window?: string | null
          transfer_fee_band?: string | null
          player_age_at_signing?: number | null
          repeated_signing?: boolean
          agent_name?: string | null
          impact_summary?: string | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [{ foreignKeyName: 'coach_recruitment_history_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      coach_media_events: {
        Row: {
          id: string
          coach_id: string
          category: string | null
          headline: string | null
          summary: string | null
          severity_score: number | null
          occurred_at: string | null
          source: string | null
          confidence: number | null
          created_at: string
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          id?: string
          coach_id: string
          category?: string | null
          headline?: string | null
          summary?: string | null
          severity_score?: number | null
          occurred_at?: string | null
          source?: string | null
          confidence?: number | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          id?: string
          coach_id?: string
          category?: string | null
          headline?: string | null
          summary?: string | null
          severity_score?: number | null
          occurred_at?: string | null
          source?: string | null
          confidence?: number | null
          created_at?: string
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [{ foreignKeyName: 'coach_media_events_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      intelligence_items: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          category: string | null
          title: string
          detail: string | null
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_tier: string | null
          source_notes: string | null
          source_expires_at: string | null
          source_proximity: string | null
          board_visibility: string
          contradiction_status: string
          confidence: number | null
          occurred_at: string | null
          created_at: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          direction: string | null
          sensitivity: string
          mandate_id: string | null
          is_deleted: boolean
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          category?: string | null
          title: string
          detail?: string | null
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_tier?: string | null
          source_notes?: string | null
          source_expires_at?: string | null
          source_proximity?: string | null
          board_visibility?: string
          contradiction_status?: string
          confidence?: number | null
          occurred_at?: string | null
          created_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          direction?: string | null
          sensitivity?: string
          mandate_id?: string | null
          is_deleted?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          category?: string | null
          title?: string
          detail?: string | null
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_tier?: string | null
          source_notes?: string | null
          source_expires_at?: string | null
          source_proximity?: string | null
          board_visibility?: string
          contradiction_status?: string
          confidence?: number | null
          occurred_at?: string | null
          created_at?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          direction?: string | null
          sensitivity?: string
          mandate_id?: string | null
          is_deleted?: boolean
        }
        Relationships: []
      }
      intelligence_inbox_items: {
        Row: {
          id: string
          user_id: string
          org_id: string | null
          intake_type: string
          headline: string
          raw_detail: string | null
          extracted_signal: string | null
          source_type: string
          source_name: string | null
          source_tier: string | null
          source_link: string | null
          source_recorded_at: string | null
          source_expires_at: string | null
          source_proximity: string | null
          board_visibility: string
          contradiction_status: string
          channel: string | null
          sensitivity: string
          verification_status: string
          review_status: string
          confidence: number | null
          direction: string | null
          methodology_criteria: string[]
          evidence_methods: string[]
          entity_type: string | null
          entity_id: string | null
          coach_id: string | null
          club_id: string | null
          mandate_id: string | null
          agent_id: string | null
          suggested_destination: string
          destination_record_type: string | null
          destination_record_id: string | null
          commercial_surface: string
          analyst_notes: string | null
          next_action: string | null
          due_date: string | null
          promoted_at: string | null
          promoted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id?: string | null
          intake_type?: string
          headline: string
          raw_detail?: string | null
          extracted_signal?: string | null
          source_type?: string
          source_name?: string | null
          source_tier?: string | null
          source_link?: string | null
          source_recorded_at?: string | null
          source_expires_at?: string | null
          source_proximity?: string | null
          board_visibility?: string
          contradiction_status?: string
          channel?: string | null
          sensitivity?: string
          verification_status?: string
          review_status?: string
          confidence?: number | null
          direction?: string | null
          methodology_criteria?: string[]
          evidence_methods?: string[]
          entity_type?: string | null
          entity_id?: string | null
          coach_id?: string | null
          club_id?: string | null
          mandate_id?: string | null
          agent_id?: string | null
          suggested_destination?: string
          destination_record_type?: string | null
          destination_record_id?: string | null
          commercial_surface?: string
          analyst_notes?: string | null
          next_action?: string | null
          due_date?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string | null
          intake_type?: string
          headline?: string
          raw_detail?: string | null
          extracted_signal?: string | null
          source_type?: string
          source_name?: string | null
          source_tier?: string | null
          source_link?: string | null
          source_recorded_at?: string | null
          source_expires_at?: string | null
          source_proximity?: string | null
          board_visibility?: string
          contradiction_status?: string
          channel?: string | null
          sensitivity?: string
          verification_status?: string
          review_status?: string
          confidence?: number | null
          direction?: string | null
          methodology_criteria?: string[]
          evidence_methods?: string[]
          entity_type?: string | null
          entity_id?: string | null
          coach_id?: string | null
          club_id?: string | null
          mandate_id?: string | null
          agent_id?: string | null
          suggested_destination?: string
          destination_record_type?: string | null
          destination_record_id?: string | null
          commercial_surface?: string
          analyst_notes?: string | null
          next_action?: string | null
          due_date?: string | null
          promoted_at?: string | null
          promoted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'intelligence_inbox_items_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
          { foreignKeyName: 'intelligence_inbox_items_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'intelligence_inbox_items_mandate_id_fkey'; columns: ['mandate_id']; isOneToOne: false; referencedRelation: 'mandates'; referencedColumns: ['id'] },
          { foreignKeyName: 'intelligence_inbox_items_agent_id_fkey'; columns: ['agent_id']; isOneToOne: false; referencedRelation: 'agents'; referencedColumns: ['id'] }
        ]
      }
      coach_due_diligence_items: {
        Row: {
          id: string
          coach_id: string
          title: string
          detail: string | null
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          confidence: number | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          coach_id: string
          title: string
          detail?: string | null
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          coach_id?: string
          title?: string
          detail?: string | null
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
        Relationships: [{ foreignKeyName: 'coach_due_diligence_items_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] }]
      }
      evidence_items: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          category: string | null
          title: string
          detail: string | null
          occurred_at: string | null
          source_type: string | null
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          confidence: number | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          category?: string | null
          title: string
          detail?: string | null
          occurred_at?: string | null
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          category?: string | null
          title?: string
          detail?: string | null
          occurred_at?: string | null
          source_type?: string | null
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          confidence?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profile_claims: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          coach_id: string | null
          agent_id: string | null
          interaction_id: string | null
          claim_type: string
          profile_field: string | null
          current_value: string | null
          claimed_value: string
          evidence_summary: string
          source_type: string
          source_name: string | null
          source_link: string | null
          source_notes: string | null
          source_tier: string | null
          confidence: number | null
          sensitivity: string
          verification_status: string
          review_status: string
          used_in_recommendation: boolean
          occurred_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          applied_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type?: string
          entity_id: string
          coach_id?: string | null
          agent_id?: string | null
          interaction_id?: string | null
          claim_type: string
          profile_field?: string | null
          current_value?: string | null
          claimed_value: string
          evidence_summary: string
          source_type?: string
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          source_tier?: string | null
          confidence?: number | null
          sensitivity?: string
          verification_status?: string
          review_status?: string
          used_in_recommendation?: boolean
          occurred_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          applied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          coach_id?: string | null
          agent_id?: string | null
          interaction_id?: string | null
          claim_type?: string
          profile_field?: string | null
          current_value?: string | null
          claimed_value?: string
          evidence_summary?: string
          source_type?: string
          source_name?: string | null
          source_link?: string | null
          source_notes?: string | null
          source_tier?: string | null
          confidence?: number | null
          sensitivity?: string
          verification_status?: string
          review_status?: string
          used_in_recommendation?: boolean
          occurred_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          applied_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'profile_claims_agent_id_fkey'; columns: ['agent_id']; isOneToOne: false; referencedRelation: 'agents'; referencedColumns: ['id'] },
          { foreignKeyName: 'profile_claims_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
          { foreignKeyName: 'profile_claims_interaction_id_fkey'; columns: ['interaction_id']; isOneToOne: false; referencedRelation: 'agent_interactions'; referencedColumns: ['id'] },
        ]
      }
      coach_development_signals: {
        Row: {
          id: string
          user_id: string
          coach_id: string
          coach_stint_id: string | null
          signal_type: string
          signal_label: string
          evidence_summary: string
          club_id: string | null
          club_name: string | null
          season: string | null
          raw_value: number | null
          normalized_score: number
          recency_weight: number
          confidence: number
          source_table: string | null
          source_id: string | null
          source_name: string
          source_payload: Json
          generated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          coach_id: string
          coach_stint_id?: string | null
          signal_type: string
          signal_label: string
          evidence_summary: string
          club_id?: string | null
          club_name?: string | null
          season?: string | null
          raw_value?: number | null
          normalized_score: number
          recency_weight?: number
          confidence?: number
          source_table?: string | null
          source_id?: string | null
          source_name?: string
          source_payload?: Json
          generated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          coach_id?: string
          coach_stint_id?: string | null
          signal_type?: string
          signal_label?: string
          evidence_summary?: string
          club_id?: string | null
          club_name?: string | null
          season?: string | null
          raw_value?: number | null
          normalized_score?: number
          recency_weight?: number
          confidence?: number
          source_table?: string | null
          source_id?: string | null
          source_name?: string
          source_payload?: Json
          generated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'coach_development_signals_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
          { foreignKeyName: 'coach_development_signals_coach_stint_id_fkey'; columns: ['coach_stint_id']; isOneToOne: false; referencedRelation: 'coach_stints'; referencedColumns: ['id'] },
          { foreignKeyName: 'coach_development_signals_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
        ]
      }
      mandate_candidate_suggestions: {
        Row: {
          id: string
          user_id: string
          mandate_id: string
          coach_id: string
          suggestion_type: string
          status: string
          score: number
          confidence: number
          source_coverage: number
          reason_tags: string[]
          evidence_snippets: Json
          risk_notes: string[]
          scoring_version: string
          generated_at: string
          dismissed_at: string | null
          added_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          mandate_id: string
          coach_id: string
          suggestion_type?: string
          status?: string
          score: number
          confidence?: number
          source_coverage?: number
          reason_tags?: string[]
          evidence_snippets?: Json
          risk_notes?: string[]
          scoring_version?: string
          generated_at?: string
          dismissed_at?: string | null
          added_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          mandate_id?: string
          coach_id?: string
          suggestion_type?: string
          status?: string
          score?: number
          confidence?: number
          source_coverage?: number
          reason_tags?: string[]
          evidence_snippets?: Json
          risk_notes?: string[]
          scoring_version?: string
          generated_at?: string
          dismissed_at?: string | null
          added_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'mandate_candidate_suggestions_mandate_id_fkey'; columns: ['mandate_id']; isOneToOne: false; referencedRelation: 'mandates'; referencedColumns: ['id'] },
          { foreignKeyName: 'mandate_candidate_suggestions_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
        ]
      }
      mandate_longlist: {
        Row: {
          id: string
          mandate_id: string
          coach_id: string
          ranking_score: number | null
          fit_explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          mandate_id: string
          coach_id: string
          ranking_score?: number | null
          fit_explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          mandate_id?: string
          coach_id?: string
          ranking_score?: number | null
          fit_explanation?: string | null
          created_at?: string
        }
        Relationships: [
          { foreignKeyName: 'mandate_longlist_mandate_id_fkey'; columns: ['mandate_id']; isOneToOne: false; referencedRelation: 'mandates'; referencedColumns: ['id'] },
          { foreignKeyName: 'mandate_longlist_coach_id_fkey'; columns: ['coach_id']; isOneToOne: false; referencedRelation: 'coaches'; referencedColumns: ['id'] },
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
          notes: string | null
          placement_probability: number
          risk_rating: string
          status: string
          candidate_stage: string
          network_source: string | null
          network_recommender: string | null
          network_relationship: string | null
          fit_tactical: string | null
          fit_cultural: string | null
          fit_level: string | null
          fit_communication: string | null
          fit_network: string | null
          fit_notes: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          mandate_id: string
          notes?: string | null
          placement_probability: number
          risk_rating: string
          status: string
          candidate_stage?: string
          network_source?: string | null
          network_recommender?: string | null
          network_relationship?: string | null
          fit_tactical?: string | null
          fit_cultural?: string | null
          fit_level?: string | null
          fit_communication?: string | null
          fit_network?: string | null
          fit_notes?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          mandate_id?: string
          notes?: string | null
          placement_probability?: number
          risk_rating?: string
          status?: string
          candidate_stage?: string
          network_source?: string | null
          network_recommender?: string | null
          network_relationship?: string | null
          fit_tactical?: string | null
          fit_cultural?: string | null
          fit_level?: string | null
          fit_communication?: string | null
          fit_network?: string | null
          fit_notes?: string | null
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
      succession_plans: {
        Row: {
          id: string
          user_id: string
          org_id: string | null
          club_id: string
          linked_mandate_id: string | null
          status: string
          priority: string
          owner_name: string | null
          next_review_date: string | null
          manager_security: string | null
          succession_timeline: string | null
          desired_archetype: string | null
          board_signal: string | null
          risk_triggers: string[]
          target_profile: Json
          notes: string | null
          last_signal_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id?: string | null
          club_id: string
          linked_mandate_id?: string | null
          status?: string
          priority?: string
          owner_name?: string | null
          next_review_date?: string | null
          manager_security?: string | null
          succession_timeline?: string | null
          desired_archetype?: string | null
          board_signal?: string | null
          risk_triggers?: string[]
          target_profile?: Json
          notes?: string | null
          last_signal_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string | null
          club_id?: string
          linked_mandate_id?: string | null
          status?: string
          priority?: string
          owner_name?: string | null
          next_review_date?: string | null
          manager_security?: string | null
          succession_timeline?: string | null
          desired_archetype?: string | null
          board_signal?: string | null
          risk_triggers?: string[]
          target_profile?: Json
          notes?: string | null
          last_signal_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: 'succession_plans_club_id_fkey'; columns: ['club_id']; isOneToOne: false; referencedRelation: 'clubs'; referencedColumns: ['id'] },
          { foreignKeyName: 'succession_plans_linked_mandate_id_fkey'; columns: ['linked_mandate_id']; isOneToOne: false; referencedRelation: 'mandates'; referencedColumns: ['id'] },
        ]
      }
      mandates: {
        Row: {
          board_risk_appetite: string
          budget_band: string
          club_id: string | null
          custom_club_name: string | null
          confidentiality_level: string
          created_at: string
          engagement_date: string
          id: string
          key_stakeholders: string[]
          ownership_structure: string
          pipeline_stage: string
          priority: string
          status: string
          strategic_objective: string
          succession_timeline: string
          target_completion_date: string
          user_id: string
          tactical_model_required: string | null
          pressing_intensity_required: string | null
          build_preference_required: string | null
          leadership_profile_required: string | null
          risk_tolerance: string | null
          language_requirements: string[]
          relocation_required: boolean
        }
        Insert: {
          board_risk_appetite: string
          budget_band: string
          club_id?: string | null
          custom_club_name?: string | null
          confidentiality_level?: string
          created_at?: string
          engagement_date: string
          id?: string
          key_stakeholders?: string[]
          ownership_structure: string
          pipeline_stage?: string
          priority: string
          status: string
          strategic_objective: string
          succession_timeline: string
          target_completion_date: string
          user_id: string
          tactical_model_required?: string | null
          pressing_intensity_required?: string | null
          build_preference_required?: string | null
          leadership_profile_required?: string | null
          risk_tolerance?: string | null
          language_requirements?: string[]
          relocation_required?: boolean
        }
        Update: {
          board_risk_appetite?: string
          budget_band?: string
          club_id?: string | null
          custom_club_name?: string | null
          confidentiality_level?: string
          created_at?: string
          engagement_date?: string
          id?: string
          key_stakeholders?: string[]
          ownership_structure?: string
          pipeline_stage?: string
          priority?: string
          status?: string
          strategic_objective?: string
          succession_timeline?: string
          target_completion_date?: string
          user_id?: string
          tactical_model_required?: string | null
          pressing_intensity_required?: string | null
          build_preference_required?: string | null
          leadership_profile_required?: string | null
          risk_tolerance?: string | null
          language_requirements?: string[]
          relocation_required?: boolean
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
          coach_id: string
          confidence_score: number | null
          created_at: string | null
          cultural_fit_score: number | null
          financial_fit_score: number | null
          id: string
          overall_score: number | null
          risk_score: number | null
          tactical_fit_score: number | null
          vacancy_id: string
        }
        Insert: {
          availability_score?: number | null
          board_compatibility_score?: number | null
          coach_id: string
          confidence_score?: number | null
          created_at?: string | null
          cultural_fit_score?: number | null
          financial_fit_score?: number | null
          id?: string
          overall_score?: number | null
          risk_score?: number | null
          tactical_fit_score?: number | null
          vacancy_id: string
        }
        Update: {
          availability_score?: number | null
          board_compatibility_score?: number | null
          coach_id?: string
          confidence_score?: number | null
          created_at?: string | null
          cultural_fit_score?: number | null
          financial_fit_score?: number | null
          id?: string
          overall_score?: number | null
          risk_score?: number | null
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
        Row: { coach_id: string; user_id: string; added_at: string }
        Insert: { coach_id: string; user_id: string; added_at?: string }
        Update: { coach_id?: string; user_id?: string; added_at?: string }
        Relationships: []
      }
      alerts: {
        Row: { id: string; user_id: string; entity_type: string; entity_id: string; alert_type: string; title: string; detail: string | null; created_at: string; is_seen: boolean }
        Insert: { id?: string; user_id: string; entity_type: string; entity_id: string; alert_type: string; title?: string; detail?: string | null; created_at?: string; is_seen?: boolean }
        Update: { id?: string; user_id?: string; entity_type?: string; entity_id?: string; alert_type?: string; title?: string; detail?: string | null; created_at?: string; is_seen?: boolean }
        Relationships: []
      }
      agents: {
        Row: { id: string; user_id: string; full_name: string; agency_name: string | null; base_location: string | null; markets: string[]; languages: string[]; phone: string | null; email: string | null; whatsapp: string | null; preferred_contact_channel: string | null; notes: string | null; reliability_score: number | null; influence_score: number | null; responsiveness_score: number | null; risk_flag: boolean; risk_notes: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; user_id: string; full_name: string; agency_name?: string | null; base_location?: string | null; markets?: string[]; languages?: string[]; phone?: string | null; email?: string | null; whatsapp?: string | null; preferred_contact_channel?: string | null; notes?: string | null; reliability_score?: number | null; influence_score?: number | null; responsiveness_score?: number | null; risk_flag?: boolean; risk_notes?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; user_id?: string; full_name?: string; agency_name?: string | null; base_location?: string | null; markets?: string[]; languages?: string[]; phone?: string | null; email?: string | null; whatsapp?: string | null; preferred_contact_channel?: string | null; notes?: string | null; reliability_score?: number | null; influence_score?: number | null; responsiveness_score?: number | null; risk_flag?: boolean; risk_notes?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      coach_agents: {
        Row: { id: string; user_id: string; coach_id: string; agent_id: string; relationship_type: string; started_on: string | null; ended_on: string | null; relationship_strength: number | null; confidence: number | null; notes: string | null; created_at: string }
        Insert: { id?: string; user_id: string; coach_id: string; agent_id: string; relationship_type?: string; started_on?: string | null; ended_on?: string | null; relationship_strength?: number | null; confidence?: number | null; notes?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; coach_id?: string; agent_id?: string; relationship_type?: string; started_on?: string | null; ended_on?: string | null; relationship_strength?: number | null; confidence?: number | null; notes?: string | null; created_at?: string }
        Relationships: []
      }
      agent_club_relationships: {
        Row: { id: string; user_id: string; agent_id: string; club_id: string; relationship_type: string; relationship_strength: number | null; last_active_on: string | null; notes: string | null; created_at: string }
        Insert: { id?: string; user_id: string; agent_id: string; club_id: string; relationship_type?: string; relationship_strength?: number | null; last_active_on?: string | null; notes?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; agent_id?: string; club_id?: string; relationship_type?: string; relationship_strength?: number | null; last_active_on?: string | null; notes?: string | null; created_at?: string }
        Relationships: []
      }
      agent_interactions: {
        Row: { id: string; user_id: string; agent_id: string; occurred_at: string; channel: string | null; direction: string | null; topic: string | null; summary: string; detail: string | null; sentiment: string | null; confidence: number | null; created_at: string; interaction_type: string | null; reliability_score: number | null; influence_score: number | null; follow_up_date: string | null; coach_id: string | null; club_id: string | null }
        Insert: { id?: string; user_id: string; agent_id: string; occurred_at?: string; channel?: string | null; direction?: string | null; topic?: string | null; summary: string; detail?: string | null; sentiment?: string | null; confidence?: number | null; created_at?: string; interaction_type?: string | null; reliability_score?: number | null; influence_score?: number | null; follow_up_date?: string | null; coach_id?: string | null; club_id?: string | null }
        Update: { id?: string; user_id?: string; agent_id?: string; occurred_at?: string; channel?: string | null; direction?: string | null; topic?: string | null; summary?: string; detail?: string | null; sentiment?: string | null; confidence?: number | null; created_at?: string; interaction_type?: string | null; reliability_score?: number | null; influence_score?: number | null; follow_up_date?: string | null; coach_id?: string | null; club_id?: string | null }
        Relationships: []
      }
      agent_deals: {
        Row: { id: string; user_id: string; agent_id: string; coach_id: string | null; club_id: string | null; deal_type: string; season: string | null; value_band: string | null; notes: string | null; occurred_on: string | null; created_at: string }
        Insert: { id?: string; user_id: string; agent_id: string; coach_id?: string | null; club_id?: string | null; deal_type: string; season?: string | null; value_band?: string | null; notes?: string | null; occurred_on?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; agent_id?: string; coach_id?: string | null; club_id?: string | null; deal_type?: string; season?: string | null; value_band?: string | null; notes?: string | null; occurred_on?: string | null; created_at?: string }
        Relationships: []
      }
      coach_similarity: {
        Row: { coach_a_id: string; coach_b_id: string; similarity_score: number; breakdown: unknown; computed_at: string }
        Insert: { coach_a_id: string; coach_b_id: string; similarity_score: number; breakdown?: unknown; computed_at?: string }
        Update: { coach_a_id?: string; coach_b_id?: string; similarity_score?: number; breakdown?: unknown; computed_at?: string }
        Relationships: []
      }
      scoring_models: {
        Row: { id: string; name: string; version: string; weights: unknown; created_at: string }
        Insert: { id?: string; name: string; version: string; weights?: unknown; created_at?: string }
        Update: { id?: string; name?: string; version?: string; weights?: unknown; created_at?: string }
        Relationships: []
      }
      coach_scores: {
        Row: { id: string; coach_id: string; scoring_model_id: string; overall_score: number | null; tactical_score: number | null; leadership_score: number | null; recruitment_score: number | null; risk_score: number | null; media_score: number | null; confidence_score: number | null; inputs_snapshot: unknown; explanation: unknown; computed_at: string }
        Insert: { id?: string; coach_id: string; scoring_model_id: string; overall_score?: number | null; tactical_score?: number | null; leadership_score?: number | null; recruitment_score?: number | null; risk_score?: number | null; media_score?: number | null; confidence_score?: number | null; inputs_snapshot?: unknown; explanation?: unknown; computed_at?: string }
        Update: { id?: string; coach_id?: string; scoring_model_id?: string; overall_score?: number | null; tactical_score?: number | null; leadership_score?: number | null; recruitment_score?: number | null; risk_score?: number | null; media_score?: number | null; confidence_score?: number | null; inputs_snapshot?: unknown; explanation?: unknown; computed_at?: string }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          action_type: string
          description: string
          metadata: Json | null
          created_at: string
          before_data: Json | null
          after_data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          action_type: string
          description: string
          metadata?: Json | null
          created_at?: string
          before_data?: Json | null
          after_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          action_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string
          before_data?: Json | null
          after_data?: Json | null
        }
        Relationships: []
      }
      demo_seeds: {
        Row: { id: string; user_id: string; created_at: string; updated_at: string; version: number }
        Insert: { id?: string; user_id: string; created_at?: string; updated_at?: string; version?: number }
        Update: { id?: string; user_id?: string; created_at?: string; updated_at?: string; version?: number }
        Relationships: []
      }
      integration_sync_state: {
        Row: {
          id: string
          user_id: string
          sync_key: string
          status: string
          cursor: number
          total: number
          result: Json | null
          error: string | null
          started_at: string | null
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          sync_key: string
          status?: string
          cursor?: number
          total?: number
          result?: Json | null
          error?: string | null
          started_at?: string | null
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          sync_key?: string
          status?: string
          cursor?: number
          total?: number
          result?: Json | null
          error?: string | null
          started_at?: string | null
          updated_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_organization_member: {
        Args: { allowed_roles?: string[]; target_organization_id: string }
        Returns: boolean
      }
      submit_dossier_order: {
        Args: {
          buyer_reference_text?: string
          intended_use_text: string
          target_offer_id: string
        }
        Returns: string
      }
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
      revoke_dossier_access: {
        Args: { target_order_id: string }
        Returns: undefined
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
