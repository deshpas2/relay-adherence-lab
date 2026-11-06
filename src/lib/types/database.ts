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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      achievement_unlocks: {
        Row: {
          achievement_id: string
          id: string
          teen_id: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          id?: string
          teen_id: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          id?: string
          teen_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_unlocks_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_unlocks_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "achievement_unlocks_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      achievements: {
        Row: {
          description: string
          i18n: Json
          icon: string | null
          id: string
          key: string
          title: string
        }
        Insert: {
          description: string
          i18n?: Json
          icon?: string | null
          id?: string
          key: string
          title: string
        }
        Update: {
          description?: string
          i18n?: Json
          icon?: string | null
          id?: string
          key?: string
          title?: string
        }
        Relationships: []
      }
      barriers: {
        Row: {
          created_at: string
          i18n: Json
          id: string
          key: string
          label: string
        }
        Insert: {
          created_at?: string
          i18n?: Json
          id?: string
          key: string
          label: string
        }
        Update: {
          created_at?: string
          i18n?: Json
          id?: string
          key?: string
          label?: string
        }
        Relationships: []
      }
      care_links: {
        Row: {
          clinician_id: string
          enrolled_at: string
          id: string
          status: Database["public"]["Enums"]["link_status"]
          teen_id: string
        }
        Insert: {
          clinician_id: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["link_status"]
          teen_id: string
        }
        Update: {
          clinician_id?: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["link_status"]
          teen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_links_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_links_clinician_id_fkey"
            columns: ["clinician_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
          {
            foreignKeyName: "care_links_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_links_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      dose_logs: {
        Row: {
          experiment_id: string | null
          id: string
          logged_at: string
          patient_medication_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["dose_status"]
          teen_id: string
          verified: boolean
        }
        Insert: {
          experiment_id?: string | null
          id?: string
          logged_at?: string
          patient_medication_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["dose_status"]
          teen_id: string
          verified?: boolean
        }
        Update: {
          experiment_id?: string | null
          id?: string
          logged_at?: string
          patient_medication_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["dose_status"]
          teen_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dose_logs_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_logs_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "v_experiment_results"
            referencedColumns: ["experiment_id"]
          },
          {
            foreignKeyName: "dose_logs_patient_medication_id_fkey"
            columns: ["patient_medication_id"]
            isOneToOne: false
            referencedRelation: "patient_medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_logs_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_logs_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      experiment_days: {
        Row: {
          arm: string
          day_index: number
          ease: number | null
          experiment_id: string
          id: string
          logged_at: string | null
          status: Database["public"]["Enums"]["dose_status"] | null
        }
        Insert: {
          arm: string
          day_index: number
          ease?: number | null
          experiment_id: string
          id?: string
          logged_at?: string | null
          status?: Database["public"]["Enums"]["dose_status"] | null
        }
        Update: {
          arm?: string
          day_index?: number
          ease?: number | null
          experiment_id?: string
          id?: string
          logged_at?: string | null
          status?: Database["public"]["Enums"]["dose_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "experiment_days_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_days_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "v_experiment_results"
            referencedColumns: ["experiment_id"]
          },
        ]
      }
      experiments: {
        Row: {
          arm_a: string
          arm_b: string
          barrier_id: string | null
          days: number
          decision: Database["public"]["Enums"]["exp_decision"] | null
          factor: string
          hypothesis: string
          id: string
          started_at: string
          status: Database["public"]["Enums"]["exp_status"]
          teen_id: string
        }
        Insert: {
          arm_a: string
          arm_b: string
          barrier_id?: string | null
          days?: number
          decision?: Database["public"]["Enums"]["exp_decision"] | null
          factor: string
          hypothesis: string
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["exp_status"]
          teen_id: string
        }
        Update: {
          arm_a?: string
          arm_b?: string
          barrier_id?: string | null
          days?: number
          decision?: Database["public"]["Enums"]["exp_decision"] | null
          factor?: string
          hypothesis?: string
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["exp_status"]
          teen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiments_barrier_id_fkey"
            columns: ["barrier_id"]
            isOneToOne: false
            referencedRelation: "barriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      game_state: {
        Row: {
          level: number
          teen_id: string
          updated_at: string
          xp: number
        }
        Insert: {
          level?: number
          teen_id: string
          updated_at?: string
          xp?: number
        }
        Update: {
          level?: number
          teen_id?: string
          updated_at?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_state_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_state_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: true
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      guardian_links: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          parent_id: string | null
          share_level: string
          status: Database["public"]["Enums"]["link_status"]
          teen_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          parent_id?: string | null
          share_level?: string
          status?: Database["public"]["Enums"]["link_status"]
          teen_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          parent_id?: string | null
          share_level?: string
          status?: Database["public"]["Enums"]["link_status"]
          teen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
          {
            foreignKeyName: "guardian_links_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_links_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      medication_content: {
        Row: {
          flow: Json
          id: string
          ingredients: Json
          locale: string
          medication_id: string
          reviewed: boolean
          what_it_is: string
          why_it_matters: string
        }
        Insert: {
          flow: Json
          id?: string
          ingredients: Json
          locale?: string
          medication_id: string
          reviewed?: boolean
          what_it_is: string
          why_it_matters: string
        }
        Update: {
          flow?: Json
          id?: string
          ingredients?: Json
          locale?: string
          medication_id?: string
          reviewed?: boolean
          what_it_is?: string
          why_it_matters?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_content_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          color: string | null
          display_name: string
          form: Database["public"]["Enums"]["med_form"]
          i18n: Json
          id: string
          is_sample: boolean
          slug: string
        }
        Insert: {
          color?: string | null
          display_name: string
          form: Database["public"]["Enums"]["med_form"]
          i18n?: Json
          id?: string
          is_sample?: boolean
          slug: string
        }
        Update: {
          color?: string | null
          display_name?: string
          form?: Database["public"]["Enums"]["med_form"]
          i18n?: Json
          id?: string
          is_sample?: boolean
          slug?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json
          id?: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      parent_confirmations: {
        Row: {
          confirmed: boolean
          confirmed_at: string
          dose_log_id: string
          id: string
          parent_id: string
        }
        Insert: {
          confirmed: boolean
          confirmed_at?: string
          dose_log_id: string
          id?: string
          parent_id: string
        }
        Update: {
          confirmed?: boolean
          confirmed_at?: string
          dose_log_id?: string
          id?: string
          parent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_confirmations_dose_log_id_fkey"
            columns: ["dose_log_id"]
            isOneToOne: false
            referencedRelation: "dose_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_confirmations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_confirmations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      patient_medications: {
        Row: {
          created_at: string
          id: string
          is_controller: boolean
          medication_id: string
          schedule: Json
          teen_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_controller?: boolean
          medication_id: string
          schedule: Json
          teen_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_controller?: boolean
          medication_id?: string
          schedule?: Json
          teen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medications_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      profiles: {
        Row: {
          a11y: Json
          age_band: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          a11y?: Json
          age_band?: string | null
          created_at?: string
          display_name: string
          id: string
          locale?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          a11y?: Json
          age_band?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      quest_progress: {
        Row: {
          completed_at: string | null
          id: string
          progress: number
          quest_id: string
          status: Database["public"]["Enums"]["quest_status"]
          teen_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id: string
          status?: Database["public"]["Enums"]["quest_status"]
          teen_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          progress?: number
          quest_id?: string
          status?: Database["public"]["Enums"]["quest_status"]
          teen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_progress_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_progress_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      quests: {
        Row: {
          description: string
          i18n: Json
          id: string
          key: string
          kind: string
          title: string
          xp_reward: number
        }
        Insert: {
          description: string
          i18n?: Json
          id?: string
          key: string
          kind: string
          title: string
          xp_reward: number
        }
        Update: {
          description?: string
          i18n?: Json
          id?: string
          key?: string
          kind?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      teen_barriers: {
        Row: {
          barrier_id: string | null
          created_at: string
          free_text: string | null
          id: string
          is_primary: boolean
          teen_id: string
        }
        Insert: {
          barrier_id?: string | null
          created_at?: string
          free_text?: string | null
          id?: string
          is_primary?: boolean
          teen_id: string
        }
        Update: {
          barrier_id?: string | null
          created_at?: string
          free_text?: string | null
          id?: string
          is_primary?: boolean
          teen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teen_barriers_barrier_id_fkey"
            columns: ["barrier_id"]
            isOneToOne: false
            referencedRelation: "barriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teen_barriers_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teen_barriers_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
    }
    Views: {
      v_attention_list: {
        Row: {
          display_name: string | null
          last_log: string | null
          needs_attention: boolean | null
          on_time_7d: number | null
          on_time_prev_7d: number | null
          reasons: string[] | null
          since_last_log: string | null
          teen_id: string | null
        }
        Relationships: []
      }
      v_clinic_overview: {
        Row: {
          experiments_finished: number | null
          experiments_started: number | null
          on_time_after: number | null
          on_time_before: number | null
          self_managing: number | null
          teens: number | null
        }
        Relationships: []
      }
      v_daily_adherence: {
        Row: {
          day: string | null
          doses_logged: number | null
          on_time: number | null
          self_reported_taken: number | null
          teen_id: string | null
          verified_taken: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dose_logs_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dose_logs_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      v_experiment_results: {
        Row: {
          a_days: number | null
          a_ease: number | null
          a_on_time: number | null
          b_days: number | null
          b_ease: number | null
          b_on_time: number | null
          days: number | null
          decision: Database["public"]["Enums"]["exp_decision"] | null
          experiment_id: string | null
          factor: string | null
          lift: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["exp_status"] | null
          teen_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiments_teen_id_fkey"
            columns: ["teen_id"]
            isOneToOne: false
            referencedRelation: "v_attention_list"
            referencedColumns: ["teen_id"]
          },
        ]
      }
      v_strategy_leaderboard: {
        Row: {
          avg_improvement_pts: number | null
          pct_adopted: number | null
          strategy: string | null
          teens_tried: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_guardian_invite: { Args: { p_code: string }; Returns: string }
      create_guardian_invite: {
        Args: { p_share_level?: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "teen" | "parent" | "clinician"
      dose_status: "taken" | "late" | "missed" | "skipped"
      exp_decision: "adopted" | "rerun" | "dropped"
      exp_status: "active" | "done" | "abandoned"
      link_status: "pending" | "active" | "revoked"
      med_form: "pill" | "capsule" | "syrup" | "tablet" | "inhaler"
      quest_status: "available" | "active" | "complete"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["teen", "parent", "clinician"],
      dose_status: ["taken", "late", "missed", "skipped"],
      exp_decision: ["adopted", "rerun", "dropped"],
      exp_status: ["active", "done", "abandoned"],
      link_status: ["pending", "active", "revoked"],
      med_form: ["pill", "capsule", "syrup", "tablet", "inhaler"],
      quest_status: ["available", "active", "complete"],
    },
  },
} as const
