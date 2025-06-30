export interface User {
  id: string
  email: string
  role: 'admin' | 'regular'
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  name: string
  category_id: string
  website?: string
  naming_convention?: string
  ai_analysis?: any
  created_at: string
  updated_at: string
  category?: Category
}

export interface Designer {
  id: string
  name: string
  code: string
  created_at: string
}

export interface Ad {
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
  product?: Product
  designer?: Designer
}

export interface DashboardStats {
  totalSpend: number
  totalSpendChange: number
  roas: number
  roasChange: number
  ctr: number
  ctrChange: number
  cpc: number
  cpcChange: number
}

export interface WeeklyReport {
  week: number
  month: string
  year: number
  adsCount: number
  totalSpend: number
  scaledAds: number
  workingAds: number
  videoAds: number
  imageAds: number
}

export interface CSVUploadData {
  adName: string
  adsetName: string
  creativeType?: string
  spendUsd: number
  impressions: number
  firstAdSpendDate: string
  lastAdSpendDate: string
  daysAdSpending: number
} 