import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Database Types (enhanced with authentication tables for admin-provisioned system)
export interface Database {
  public: {
    Tables: {
      // =============================================================================
      // AUTHENTICATION TABLES (Admin-Provisioned)
      // =============================================================================
      roles: {
        Row: {
          id: string
          name: string
          description: string
          permissions: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          permissions?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          permissions?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string // References auth.users.id
          email: string
          full_name: string | null
          role_id: string // References roles.id
          last_login: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string // Must match auth.users.id
          email: string
          full_name?: string | null
          role_id: string
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role_id?: string
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // =============================================================================
      // EXISTING APPLICATION TABLES
      // =============================================================================
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant'
          content?: string
          created_at?: string
        }
      }
      agent_steps: {
        Row: {
          id: string
          message_id: string
          step_type: string
          step_name: string
          status: 'pending' | 'running' | 'completed' | 'error'
          input_data: Record<string, any> | null
          output_data: Record<string, any> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          message_id: string
          step_type: string
          step_name: string
          status?: 'pending' | 'running' | 'completed' | 'error'
          input_data?: Record<string, any> | null
          output_data?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          step_type?: string
          step_name?: string
          status?: 'pending' | 'running' | 'completed' | 'error'
          input_data?: Record<string, any> | null
          output_data?: Record<string, any> | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// =============================================================================
// AUTHENTICATION TYPE DEFINITIONS (Admin-Provisioned)
// =============================================================================

// Role type for role-based access control
export type Role = Database['public']['Tables']['roles']['Row']

// Profile type with optional role relationship
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  role?: Role
}

// Extended user type that includes profile
export type AuthUser = {
  id: string
  email: string
  profile?: Profile
}

// Authentication error types for better error handling
export type AuthError = {
  message: string
  status?: number
} 