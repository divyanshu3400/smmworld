export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          country: string | null
          avatar_url: string | null
          bio: string | null
          referral_code: string | null
          referred_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          country?: string | null
          avatar_url?: string | null
          bio?: string | null
          referral_code?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          country?: string | null
          avatar_url?: string | null
          bio?: string | null
          referral_code?: string | null
          referred_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wallets: {
        Row: {
          id: string
          user_id: string
          balance: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      wallet_transactions: {
        Row: {
          id: string
          wallet_id: string
          user_id: string
          type: 'credit' | 'debit' | 'refund' | 'bonus' | 'purchase'
          amount: number
          description: string | null
          reference_id: string | null
          balance_after: number
          created_at: string
        }
        Insert: {
          id?: string
          wallet_id: string
          user_id: string
          type: 'credit' | 'debit' | 'refund' | 'bonus' | 'purchase'
          amount: number
          description?: string | null
          reference_id?: string | null
          balance_after: number
          created_at?: string
        }
        Update: {
          id?: string
          wallet_id?: string
          user_id?: string
          type?: 'credit' | 'debit' | 'refund' | 'bonus' | 'purchase'
          amount?: number
          description?: string | null
          reference_id?: string | null
          balance_after?: number
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          external_order_id: string | null
          service_id: string
          service_name: string
          platform: string | null
          link: string
          quantity: number
          price: number
          currency: string
          price_usd: number
          status: 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'cancelled' | 'refunded'
          start_count: number | null
          remains: number | null
          charge: number | null
          error_message: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          external_order_id?: string | null
          service_id: string
          service_name: string
          platform?: string | null
          link: string
          quantity: number
          price: number
          currency?: string
          price_usd: number
          status?: 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'cancelled' | 'refunded'
          start_count?: number | null
          remains?: number | null
          charge?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          external_order_id?: string | null
          service_id?: string
          service_name?: string
          platform?: string | null
          link?: string
          quantity?: number
          price?: number
          currency?: string
          price_usd?: number
          status?: 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'cancelled' | 'refunded'
          start_count?: number | null
          remains?: number | null
          charge?: number | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error' | 'announcement'
          read_at: string | null
          action_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'info' | 'warning' | 'success' | 'error' | 'announcement'
          read_at?: string | null
          action_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'success' | 'error' | 'announcement'
          read_at?: string | null
          action_url?: string | null
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          sms_notifications: boolean
          push_notifications: boolean
          two_factor_enabled: boolean
          two_factor_secret: string | null
          theme: 'light' | 'dark' | 'system'
          language: string
          timezone: string
          preferred_currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          theme?: 'light' | 'dark' | 'system'
          language?: string
          timezone?: string
          preferred_currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          sms_notifications?: boolean
          push_notifications?: boolean
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          theme?: 'light' | 'dark' | 'system'
          language?: string
          timezone?: string
          preferred_currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: string
          base_currency: string
          target_currency: string
          rate: number
          source: string
          updated_at: string
        }
        Insert: {
          id?: string
          base_currency?: string
          target_currency: string
          rate: number
          source?: string
          updated_at?: string
        }
        Update: {
          id?: string
          base_currency?: string
          target_currency?: string
          rate?: number
          source?: string
          updated_at?: string
        }
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          type: 'info' | 'warning' | 'success' | 'error' | 'announcement'
          is_active: boolean
          published_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          type?: 'info' | 'warning' | 'success' | 'error' | 'announcement'
          is_active?: boolean
          published_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          type?: 'info' | 'warning' | 'success' | 'error' | 'announcement'
          is_active?: boolean
          published_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
    }
    Enums: {
      transaction_type: 'credit' | 'debit' | 'refund' | 'bonus' | 'purchase'
      notification_type: 'info' | 'warning' | 'success' | 'error' | 'announcement'
      theme: 'light' | 'dark' | 'system'
      order_status: 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'cancelled' | 'refunded'
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Wallet = Database['public']['Tables']['wallets']['Row']
export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type ExchangeRate = Database['public']['Tables']['exchange_rates']['Row']
