export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          name: string;
          event_date: string;
          event_code: string;
          reveal_mode: "instant" | "after_event";
          gallery_visible: boolean;
          created_by: string | null;
          cover_image_path: string | null;
          upload_limit_enabled: boolean;
          max_uploads_per_user: number | null;
          max_uploads_total: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          event_date: string;
          event_code: string;
          reveal_mode?: "instant" | "after_event";
          gallery_visible?: boolean;
          created_by?: string | null;
          cover_image_path?: string | null;
          upload_limit_enabled?: boolean;
          max_uploads_per_user?: number | null;
          max_uploads_total?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          event_date?: string;
          event_code?: string;
          reveal_mode?: "instant" | "after_event";
          gallery_visible?: boolean;
          created_by?: string | null;
          cover_image_path?: string | null;
          upload_limit_enabled?: boolean;
          max_uploads_per_user?: number | null;
          max_uploads_total?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_guests: {
        Row: {
          event_id: string;
          user_id: string;
          joined_at: string;
          upload_count: number;
        };
        Insert: {
          event_id: string;
          user_id: string;
          joined_at?: string;
          upload_count?: number;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          joined_at?: string;
          upload_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: "event_guests_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      photos: {
        Row: {
          id: string;
          event_id: string;
          storage_path: string;
          captured_at: string;
          nickname: string | null;
          uploader_id: string | null;
          mime_type: string;
          width: number | null;
          height: number | null;
          size_bytes: number | null;
          is_deleted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          storage_path: string;
          captured_at?: string;
          nickname?: string | null;
          uploader_id?: string | null;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          is_deleted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          storage_path?: string;
          captured_at?: string;
          nickname?: string | null;
          uploader_id?: string | null;
          mime_type?: string;
          width?: number | null;
          height?: number | null;
          size_bytes?: number | null;
          is_deleted?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          role: "admin" | "user";
          email: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          role?: "admin" | "user";
          email?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          role?: "admin" | "user";
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pricing_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_cents: number;
          currency: string;
          photo_limit: number | null;
          storage_days: number;
          features: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          photo_limit?: number | null;
          storage_days?: number;
          features?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          currency?: string;
          photo_limit?: number | null;
          storage_days?: number;
          features?: any;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: "percentage" | "fixed";
          value: number;
          max_uses: number | null;
          use_count: number;
          expires_at: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: "percentage" | "fixed";
          value: number;
          max_uses?: number | null;
          use_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: "percentage" | "fixed";
          value?: number;
          max_uses?: number | null;
          use_count?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string | null;
          event_id: string | null;
          plan_id: string | null;
          discount_code_id: string | null;
          amount_paid_cents: number;
          status: "pending" | "completed" | "failed" | "refunded";
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_id?: string | null;
          plan_id?: string | null;
          discount_code_id?: string | null;
          amount_paid_cents: number;
          status: "pending" | "completed" | "failed" | "refunded";
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_id?: string | null;
          plan_id?: string | null;
          discount_code_id?: string | null;
          amount_paid_cents?: number;
          status?: "pending" | "completed" | "failed" | "refunded";
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          metadata?: any;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_transactions_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "pricing_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payment_transactions_discount_code_id_fkey";
            columns: ["discount_code_id"];
            isOneToOne: false;
            referencedRelation: "discount_codes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_upload_count: {
        Args: {
          p_event_id: string;
          p_user_id: string;
        };
        Returns: number;
      };
      get_event_upload_stats: {
        Args: {
          p_event_id: string;
        };
        Returns: {
          total_uploads: number;
          max_uploads_per_user: number | null;
          max_uploads_total: number | null;
          limit_enabled: boolean;
        }[];
      };
      increment_discount_use_count: {
        Args: {
          p_code_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
};
