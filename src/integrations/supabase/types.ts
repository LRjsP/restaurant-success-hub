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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          created_at: string
          id: string
          message: string
          occurred_at: string
          resolved: boolean
          severity: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          occurred_at?: string
          resolved?: boolean
          severity?: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          occurred_at?: string
          resolved?: boolean
          severity?: string
          type?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          available_seats: number
          beer_cost: number
          beer_sales: number
          beverage_cost: number
          beverage_sales: number
          comps: number
          covers: number
          created_at: string
          date: string
          discounts: number
          food_cost: number
          food_sales: number
          gross_sales: number
          hours_open: number
          id: string
          labor_cost: number
          labor_hours: number
          liquor_cost: number
          liquor_sales: number
          net_sales: number
          no_shows: number
          revenue_center: string
          tables_served: number
          total_reservations: number
          wine_cost: number
          wine_sales: number
        }
        Insert: {
          available_seats?: number
          beer_cost?: number
          beer_sales?: number
          beverage_cost?: number
          beverage_sales?: number
          comps?: number
          covers?: number
          created_at?: string
          date: string
          discounts?: number
          food_cost?: number
          food_sales?: number
          gross_sales?: number
          hours_open?: number
          id?: string
          labor_cost?: number
          labor_hours?: number
          liquor_cost?: number
          liquor_sales?: number
          net_sales?: number
          no_shows?: number
          revenue_center?: string
          tables_served?: number
          total_reservations?: number
          wine_cost?: number
          wine_sales?: number
        }
        Update: {
          available_seats?: number
          beer_cost?: number
          beer_sales?: number
          beverage_cost?: number
          beverage_sales?: number
          comps?: number
          covers?: number
          created_at?: string
          date?: string
          discounts?: number
          food_cost?: number
          food_sales?: number
          gross_sales?: number
          hours_open?: number
          id?: string
          labor_cost?: number
          labor_hours?: number
          liquor_cost?: number
          liquor_sales?: number
          net_sales?: number
          no_shows?: number
          revenue_center?: string
          tables_served?: number
          total_reservations?: number
          wine_cost?: number
          wine_sales?: number
        }
        Relationships: []
      }
      digital_activity: {
        Row: {
          cart_completed: number
          cart_starts: number
          created_at: string
          date: string
          id: string
          mau: number
          online_orders: number
        }
        Insert: {
          cart_completed?: number
          cart_starts?: number
          created_at?: string
          date: string
          id?: string
          mau?: number
          online_orders?: number
        }
        Update: {
          cart_completed?: number
          cart_starts?: number
          created_at?: string
          date?: string
          id?: string
          mau?: number
          online_orders?: number
        }
        Relationships: []
      }
      events_pipeline: {
        Row: {
          company: string | null
          contact_name: string
          created_at: string
          event_date: string | null
          guest_id: string | null
          id: string
          notes: string | null
          stage: string
          value: number
        }
        Insert: {
          company?: string | null
          contact_name: string
          created_at?: string
          event_date?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          stage?: string
          value?: number
        }
        Update: {
          company?: string | null
          contact_name?: string
          created_at?: string
          event_date?: string | null
          guest_id?: string | null
          id?: string
          notes?: string | null
          stage?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_pipeline_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit_at: string | null
          lifetime_value: number
          name: string
          tier: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string | null
          lifetime_value?: number
          name: string
          tier?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit_at?: string | null
          lifetime_value?: number
          name?: string
          tier?: string
          visit_count?: number
        }
        Relationships: []
      }
      hourly_metrics: {
        Row: {
          available_seats: number
          covers: number
          created_at: string
          date: string
          hour: number
          id: string
          revenue: number
          revenue_center: string
        }
        Insert: {
          available_seats?: number
          covers?: number
          created_at?: string
          date: string
          hour: number
          id?: string
          revenue?: number
          revenue_center?: string
        }
        Update: {
          available_seats?: number
          covers?: number
          created_at?: string
          date?: string
          hour?: number
          id?: string
          revenue?: number
          revenue_center?: string
        }
        Relationships: []
      }
      menu_item_daily_sales: {
        Row: {
          cost: number
          created_at: string
          date: string
          id: string
          menu_item_id: string
          revenue: number
          revenue_center: string
          units_sold: number
          updated_at: string
        }
        Insert: {
          cost?: number
          created_at?: string
          date: string
          id?: string
          menu_item_id: string
          revenue?: number
          revenue_center?: string
          units_sold?: number
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          date?: string
          id?: string
          menu_item_id?: string
          revenue?: number
          revenue_center?: string
          units_sold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_daily_sales_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          plate_cost: number
          price: number
          units_sold_30d: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          plate_cost: number
          price: number
          units_sold_30d?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          plate_cost?: number
          price?: number
          units_sold_30d?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      restaurant_settings: {
        Row: {
          created_at: string
          id: string
          name: string
          revenue_centers: Json
          seats_total: number
          service_hours_per_day: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          revenue_centers?: Json
          seats_total?: number
          service_hours_per_day?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          revenue_centers?: Json
          seats_total?: number
          service_hours_per_day?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "staff"
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
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
