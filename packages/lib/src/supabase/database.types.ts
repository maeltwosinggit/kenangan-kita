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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
