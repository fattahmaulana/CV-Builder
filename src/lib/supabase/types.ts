export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      consents: {
        Row: {
          id: string;
          user_id: string;
          consent_type: string;
          consent_version: string;
          granted: boolean;
          ip_address: string | null;
          user_agent: string | null;
          consented_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          consent_type: string;
          consent_version: string;
          granted?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          consented_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          consent_type?: string;
          consent_version?: string;
          granted?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          consented_at?: string;
        };
        Relationships: [];
      };
      cvs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          language: "id" | "en";
          target_position: string | null;
          target_company: string | null;
          job_description: string | null;
          data: Json;
          match_score: number | null;
          match_analysis: Json | null;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          language?: "id" | "en";
          target_position?: string | null;
          target_company?: string | null;
          job_description?: string | null;
          data?: Json;
          match_score?: number | null;
          match_analysis?: Json | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          language?: "id" | "en";
          target_position?: string | null;
          target_company?: string | null;
          job_description?: string | null;
          data?: Json;
          match_score?: number | null;
          match_analysis?: Json | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cv_versions: {
        Row: {
          id: string;
          cv_id: string;
          user_id: string;
          version_number: number;
          data: Json;
          change_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cv_id: string;
          user_id: string;
          version_number: number;
          data: Json;
          change_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cv_id?: string;
          user_id?: string;
          version_number?: number;
          data?: Json;
          change_summary?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          cv_id: string;
          invoice_number: string;
          amount: number;
          currency: string;
          status: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
          doku_reference: string | null;
          payment_method: string | null;
          payment_url: string | null;
          revisions_used: number;
          max_revisions: number;
          revision_deadline: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cv_id: string;
          invoice_number: string;
          amount?: number;
          currency?: string;
          status?: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
          doku_reference?: string | null;
          payment_method?: string | null;
          payment_url?: string | null;
          revisions_used?: number;
          max_revisions?: number;
          revision_deadline?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cv_id?: string;
          invoice_number?: string;
          amount?: number;
          currency?: string;
          status?: "PENDING" | "PAID" | "EXPIRED" | "FAILED";
          doku_reference?: string | null;
          payment_method?: string | null;
          payment_url?: string | null;
          revisions_used?: number;
          max_revisions?: number;
          revision_deadline?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_events: {
        Row: {
          id: string;
          event_id: string;
          invoice_number: string;
          event_type: string;
          payload: Json;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          invoice_number: string;
          event_type: string;
          payload: Json;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          invoice_number?: string;
          event_type?: string;
          payload?: Json;
          processed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          cv_id: string | null;
          company: string;
          position: string;
          job_url: string | null;
          cv_version: string | null;
          status: "Belum dikirim" | "Terkirim" | "Wawancara" | "Tawaran" | "Ditolak";
          applied_date: string | null;
          notes: string | null;
          sheets_row_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cv_id?: string | null;
          company: string;
          position: string;
          job_url?: string | null;
          cv_version?: string | null;
          status?: "Belum dikirim" | "Terkirim" | "Wawancara" | "Tawaran" | "Ditolak";
          applied_date?: string | null;
          notes?: string | null;
          sheets_row_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cv_id?: string | null;
          company?: string;
          position?: string;
          job_url?: string | null;
          cv_version?: string | null;
          status?: "Belum dikirim" | "Terkirim" | "Wawancara" | "Tawaran" | "Ditolak";
          applied_date?: string | null;
          notes?: string | null;
          sheets_row_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      google_connections: {
        Row: {
          id: string;
          user_id: string;
          spreadsheet_id_encrypted: string | null;
          refresh_token_encrypted: string | null;
          google_email: string | null;
          needs_reconnect: boolean;
          scope: string | null;
          is_connected: boolean;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          spreadsheet_id_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          google_email?: string | null;
          needs_reconnect?: boolean;
          scope?: string | null;
          is_connected?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          spreadsheet_id_encrypted?: string | null;
          refresh_token_encrypted?: string | null;
          google_email?: string | null;
          needs_reconnect?: boolean;
          scope?: string | null;
          is_connected?: boolean;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_cache: {
        Row: {
          id: string;
          query_hash: string;
          results: Json;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          query_hash: string;
          results: Json;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          query_hash?: string;
          results?: Json;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ai_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          tokens_used: number;
          model_used: string;
          duration_ms: number;
          status: "SUCCESS" | "ERROR" | "FALLBACK";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          tokens_used?: number;
          model_used: string;
          duration_ms?: number;
          status: "SUCCESS" | "ERROR" | "FALLBACK";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: string;
          tokens_used?: number;
          model_used?: string;
          duration_ms?: number;
          status?: "SUCCESS" | "ERROR" | "FALLBACK";
          created_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          id: string;
          key: string;
          count: number;
          expires_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          count?: number;
          expires_at: string;
        };
        Update: {
          id?: string;
          key?: string;
          count?: number;
          expires_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          provider: "gemini" | "doku" | "job_api" | "turnstile" | "smtp" | "other";
          label: string;
          encrypted_key: string;
          last_four_chars: string;
          status: "aktif" | "cooldown" | "habis" | "tidak_valid" | "nonaktif";
          priority: number;
          weight: number;
          requests_today: number;
          errors_today: number;
          cooldown_until: string | null;
          last_used_at: string | null;
          last_error: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: "gemini" | "doku" | "job_api" | "turnstile" | "smtp" | "other";
          label: string;
          encrypted_key: string;
          last_four_chars: string;
          status?: "aktif" | "cooldown" | "habis" | "tidak_valid" | "nonaktif";
          priority?: number;
          weight?: number;
          requests_today?: number;
          errors_today?: number;
          cooldown_until?: string | null;
          last_used_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: "gemini" | "doku" | "job_api" | "turnstile" | "smtp" | "other";
          label?: string;
          encrypted_key?: string;
          last_four_chars?: string;
          status?: "aktif" | "cooldown" | "habis" | "tidak_valid" | "nonaktif";
          priority?: number;
          weight?: number;
          requests_today?: number;
          errors_today?: number;
          cooldown_until?: string | null;
          last_used_at?: string | null;
          last_error?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          target_type: string;
          target_id: string | null;
          ip_hash: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          target_type: string;
          target_id?: string | null;
          ip_hash?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          ip_hash?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string;
          enabled: boolean;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          enabled?: boolean;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          enabled?: boolean;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
