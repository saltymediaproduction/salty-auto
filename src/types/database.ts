export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auto_automation_logs: {
        Row: {
          contact_id: string | null
          created_at: string
          error_message: string | null
          id: string
          platform: string
          rule_id: string | null
          source_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform: string
          rule_id?: string | null
          source_id: string
          status: string
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          platform?: string
          rule_id?: string | null
          source_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_automation_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auto_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "auto_automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_automation_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "auto_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_automation_rules: {
        Row: {
          created_at: string
          dm_message: string
          id: string
          is_active: boolean
          keywords: string[]
          match_type: string
          name: string
          platform: string
          public_reply_variants: string[]
          social_account_id: string | null
          target_post_id: string
          trigger_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          dm_message: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          match_type?: string
          name: string
          platform?: string
          public_reply_variants?: string[]
          social_account_id?: string | null
          target_post_id?: string
          trigger_type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          dm_message?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          match_type?: string
          name?: string
          platform?: string
          public_reply_variants?: string[]
          social_account_id?: string | null
          target_post_id?: string
          trigger_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_automation_rules_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "auto_social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_automation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "auto_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_contacts: {
        Row: {
          created_at: string
          id: string
          instagram_scoped_id: string | null
          instagram_username: string | null
          last_contacted_at: string | null
          metadata: Json
          name: string | null
          stage: string
          tags: string[]
          updated_at: string
          whatsapp_phone: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instagram_scoped_id?: string | null
          instagram_username?: string | null
          last_contacted_at?: string | null
          metadata?: Json
          name?: string | null
          stage?: string
          tags?: string[]
          updated_at?: string
          whatsapp_phone?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instagram_scoped_id?: string | null
          instagram_username?: string | null
          last_contacted_at?: string | null
          metadata?: Json
          name?: string | null
          stage?: string
          tags?: string[]
          updated_at?: string
          whatsapp_phone?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "auto_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_messages: {
        Row: {
          id: string
          workspace_id: string
          contact_id: string
          platform: string
          direction: string
          message_id: string
          text: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          workspace_id: string
          contact_id: string
          platform: string
          direction: string
          message_id: string
          text?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          contact_id?: string
          platform?: string
          direction?: string
          message_id?: string
          text?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "auto_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "auto_workspaces"
            referencedColumns: ["id"]
          }
        ]
      }
      auto_social_accounts: {
        Row: {
          access_token: string
          account_id: string
          account_name: string | null
          created_at: string
          id: string
          platform: string
          status: string
          token_expires_at: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          account_name?: string | null
          created_at?: string
          id?: string
          platform: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          account_name?: string | null
          created_at?: string
          id?: string
          platform?: string
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_social_accounts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "auto_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          attendance_status: Database["public"]["Enums"]["attendance_status"]
          attendee_notes: string | null
          booking_number: string
          check_in_notes: string | null
          checked_in_at: string | null
          confirmed_at: string | null
          created_at: string | null
          currency: string
          customer_email: string
          customer_name: string
          customer_phone: string
          event_id: string
          id: string
          quantity: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: string
          tier_id: string
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          attendee_notes?: string | null
          booking_number: string
          check_in_notes?: string | null
          checked_in_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          event_id: string
          id?: string
          quantity?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          tier_id: string
          total_amount: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          attendance_status?: Database["public"]["Enums"]["attendance_status"]
          attendee_notes?: string | null
          booking_number?: string
          check_in_notes?: string | null
          checked_in_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          event_id?: string
          id?: string
          quantity?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: string
          tier_id?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          booking_id: string | null
          certificate_number: string
          created_at: string | null
          event_id: string
          id: string
          issue_date: string
          metadata: Json | null
          participant_email: string
          participant_name: string
          skills: Json | null
          status: string | null
          ticket_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          certificate_number: string
          created_at?: string | null
          event_id: string
          id?: string
          issue_date?: string
          metadata?: Json | null
          participant_email: string
          participant_name: string
          skills?: Json | null
          status?: string | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          certificate_number?: string
          created_at?: string | null
          event_id?: string
          id?: string
          issue_date?: string
          metadata?: Json | null
          participant_email?: string
          participant_name?: string
          skills?: Json | null
          status?: string | null
          ticket_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          consent: boolean
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          agenda: Json | null
          badge: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          end_time: string
          event_date: string
          event_type: string
          faqs: Json | null
          id: string
          instructor_bio: string | null
          instructor_name: string
          outcomes: Json | null
          regular_price: number | null
          slug: string
          start_time: string
          status: string | null
          title: string
          total_capacity: number | null
          updated_at: string | null
          venue_address: string
          venue_name: string
        }
        Insert: {
          agenda?: Json | null
          badge?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          end_time: string
          event_date: string
          event_type?: string
          faqs?: Json | null
          id?: string
          instructor_bio?: string | null
          instructor_name: string
          outcomes?: Json | null
          regular_price?: number | null
          slug: string
          start_time: string
          status?: string | null
          title: string
          total_capacity?: number | null
          updated_at?: string | null
          venue_address: string
          venue_name: string
        }
        Update: {
          agenda?: Json | null
          badge?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          end_time?: string
          event_date?: string
          event_type?: string
          faqs?: Json | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string
          outcomes?: Json | null
          regular_price?: number | null
          slug?: string
          start_time?: string
          status?: string | null
          title?: string
          total_capacity?: number | null
          updated_at?: string | null
          venue_address?: string
          venue_name?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      resume_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          position_applied_for: string
          resume_file_name: string | null
          resume_file_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          position_applied_for: string
          resume_file_name?: string | null
          resume_file_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          position_applied_for?: string
          resume_file_name?: string | null
          resume_file_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_tiers: {
        Row: {
          benefits: Json | null
          booked_count: number | null
          created_at: string | null
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean | null
          price: number
          sort_order: number | null
          tier_name: string
          total_capacity: number | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          benefits?: Json | null
          booked_count?: number | null
          created_at?: string | null
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean | null
          price: number
          sort_order?: number | null
          tier_name: string
          total_capacity?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          benefits?: Json | null
          booked_count?: number | null
          created_at?: string | null
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean | null
          price?: number
          sort_order?: number | null
          tier_name?: string
          total_capacity?: number | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          attendance_status: string
          attendee_email: string | null
          attendee_name: string
          attendee_phone: string | null
          booking_id: string | null
          checked_in_at: string | null
          created_at: string | null
          event_id: string | null
          id: string
          status: string
          ticket_index: number
          ticket_number: string
          tier_id: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_status?: string
          attendee_email?: string | null
          attendee_name: string
          attendee_phone?: string | null
          booking_id?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string
          ticket_index?: number
          ticket_number: string
          tier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_status?: string
          attendee_email?: string | null
          attendee_name?: string
          attendee_phone?: string | null
          booking_id?: string | null
          checked_in_at?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          status?: string
          ticket_index?: number
          ticket_number?: string
          tier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_ticket_pass_details: { Args: { p_identifier: string }; Returns: Json }
    }
    Enums: {
      attendance_status:
        | "registered"
        | "attended"
        | "absent"
        | "cancelled"
        | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Database

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
  public: {
    Enums: {
      attendance_status: [
        "registered",
        "attended",
        "absent",
        "cancelled",
        "refunded",
      ],
    },
  },
} as const
