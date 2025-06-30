export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'regular'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'regular'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'regular'
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category_id: string
          website?: string
          naming_convention?: string
          ai_analysis?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id: string
          website?: string
          naming_convention?: string
          ai_analysis?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string
          website?: string
          naming_convention?: string
          ai_analysis?: any
          updated_at?: string
        }
      }
      designers: {
        Row: {
          id: string
          name: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
        }
      }
      ads: {
        Row: {
          id: string
          product_id: string
          ad_name: string
          adset_name: string
          creative_type: 'SHARE' | 'VIDEO'
          spend_usd: number
          impressions: number
          first_ad_spend_date: string
          last_ad_spend_date: string
          days_ad_spending: number
          week_number: number
          is_creative_hub: boolean
          designer_id?: string
          aspect_ratio?: string
          ad_format?: 'IMG' | 'VIDEO'
          ad_type?: 'New' | 'Opti'
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          ad_name: string
          adset_name: string
          creative_type: 'SHARE' | 'VIDEO'
          spend_usd: number
          impressions: number
          first_ad_spend_date: string
          last_ad_spend_date: string
          days_ad_spending: number
          week_number: number
          is_creative_hub: boolean
          designer_id?: string
          aspect_ratio?: string
          ad_format?: 'IMG' | 'VIDEO'
          ad_type?: 'New' | 'Opti'
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          ad_name?: string
          adset_name?: string
          creative_type?: 'SHARE' | 'VIDEO'
          spend_usd?: number
          impressions?: number
          first_ad_spend_date?: string
          last_ad_spend_date?: string
          days_ad_spending?: number
          week_number?: number
          is_creative_hub?: boolean
          designer_id?: string
          aspect_ratio?: string
          ad_format?: 'IMG' | 'VIDEO'
          ad_type?: 'New' | 'Opti'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 