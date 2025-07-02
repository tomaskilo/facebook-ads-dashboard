import { createServiceSupabaseClient } from '@/lib/supabase-client'

// Central utility for all ads calculations
export class AdsCalculator {
  private supabase = createServiceSupabaseClient()

  /**
   * Get current week information for active ads filtering
   */
  private getCurrentWeekInfo() {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - start.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    const currentWeekNumber = Math.ceil(diff / oneWeek)
    
    const currentWeek = `W${currentWeekNumber.toString().padStart(2, '0')}`
    const lastWeek = `W${(currentWeekNumber - 1).toString().padStart(2, '0')}`
    
    return { currentWeek, lastWeek, currentWeekNumber }
  }

  /**
   * Calculate truly active ads using consistent business logic
   * Active = Recent (last 2 weeks) + Quality (days_running > 3) + Meaningful (spend > $1)
   */
  async calculateActiveAds(tableName: string, productName: string) {
    const { currentWeek, lastWeek } = this.getCurrentWeekInfo()
    
    console.log(`🔍 Calculating active ads for ${productName} in weeks ${lastWeek}, ${currentWeek}`)

    // Get ads from recent weeks with quality filters
    const { data: recentAds, error } = await this.supabase
      .from(tableName)
      .select('ad_name, spend_usd, days_running, week_number, creative_type')
      .or(`week_number.eq.${currentWeek},week_number.eq.${lastWeek}`)
      .gt('days_running', 3)
      .gt('spend_usd', 1)
      .order('spend_usd', { ascending: false })

    if (error) {
      console.error(`❌ Error fetching active ads for ${productName}:`, error)
      return { count: 0, totalSpend: 0, videoCount: 0, imageCount: 0, ads: [] }
    }

    // Remove duplicates by ad_name, keeping highest spend version
    const uniqueActiveAds = new Map()
    recentAds?.forEach(ad => {
      if (!uniqueActiveAds.has(ad.ad_name) || uniqueActiveAds.get(ad.ad_name).spend_usd < ad.spend_usd) {
        uniqueActiveAds.set(ad.ad_name, ad)
      }
    })

    const activeAds = Array.from(uniqueActiveAds.values())
    const count = activeAds.length
    const totalSpend = activeAds.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0)
    const videoCount = activeAds.filter(ad => ad.creative_type === 'VIDEO').length
    const imageCount = activeAds.filter(ad => ad.creative_type === 'IMAGE').length

    console.log(`✅ ${productName}: ${count} active ads (${videoCount} video, ${imageCount} image), $${totalSpend.toLocaleString()} spend`)

    return {
      count,
      totalSpend,
      videoCount,
      imageCount,
      ads: activeAds
    }
  }

  /**
   * Calculate scaled and working ads using consistent spend thresholds
   */
  async calculateScaledAndWorkingAds(tableName: string, productName: string) {
    const { data: allAds, error } = await this.supabase
      .from(tableName)
      .select('ad_name, spend_usd, week_number')

    if (error) {
      console.error(`❌ Error fetching ads for scaled/working calculation:`, error)
      return { scaledAds: 0, workingAds: 0 }
    }

    // Group by ad_name and calculate total spend per ad
    const adSpendMap = new Map<string, number>()
    allAds?.forEach(ad => {
      const current = adSpendMap.get(ad.ad_name) || 0
      adSpendMap.set(ad.ad_name, current + (ad.spend_usd || 0))
    })

    let scaledAds = 0
    let workingAds = 0

    adSpendMap.forEach(totalSpend => {
      if (totalSpend >= 1000) {
        scaledAds++
      } else if (totalSpend >= 100) {
        workingAds++
      }
    })

    console.log(`📊 ${productName}: ${scaledAds} scaled ads, ${workingAds} working ads`)

    return { scaledAds, workingAds }
  }

  /**
   * Calculate spend change between recent weeks
   */
  async calculateSpendChange(tableName: string, productName: string) {
    const { data: allAds, error } = await this.supabase
      .from(tableName)
      .select('week_number, spend_usd')

    if (error) {
      console.error(`❌ Error fetching ads for spend change:`, error)
      return 0
    }

    // Group by week and sum spend
    const weekSpendMap = new Map<string, number>()
    allAds?.forEach(ad => {
      const current = weekSpendMap.get(ad.week_number) || 0
      weekSpendMap.set(ad.week_number, current + (ad.spend_usd || 0))
    })

    const weeks = Array.from(weekSpendMap.keys()).sort()
    if (weeks.length < 2) return 0

    const lastWeekSpend = weekSpendMap.get(weeks[weeks.length - 1]) || 0
    const previousWeekSpend = weekSpendMap.get(weeks[weeks.length - 2]) || 0

    if (previousWeekSpend === 0) return 0

    const change = ((lastWeekSpend - previousWeekSpend) / previousWeekSpend) * 100
    console.log(`📈 ${productName}: ${change.toFixed(1)}% spend change`)

    return change
  }

  /**
   * Get complete stats for any product - ONE FUNCTION FOR ALL CALCULATIONS
   */
  async getProductStats(tableName: string, productName: string) {
    console.log(`🚀 Calculating complete stats for ${productName}`)

    // Run all calculations in parallel for performance
    const [
      { data: allAds, error: allAdsError },
      activeAdsResult,
      scaledWorkingResult,
      spendChange
    ] = await Promise.all([
      this.supabase.from(tableName).select('*'),
      this.calculateActiveAds(tableName, productName),
      this.calculateScaledAndWorkingAds(tableName, productName),
      this.calculateSpendChange(tableName, productName)
    ])

    if (allAdsError) {
      throw new Error(`Failed to fetch ads data for ${productName}: ${allAdsError.message}`)
    }

    const totalSpend = allAds?.reduce((sum, ad) => sum + (ad.spend_usd || 0), 0) || 0
    const totalAds = allAds?.length || 0

    const stats = {
      totalSpend,
      totalSpendChange: spendChange,
      activeAds: activeAdsResult.count,
      scaledAds: scaledWorkingResult.scaledAds,
      workingAds: scaledWorkingResult.workingAds,
      newAds: totalAds,
      // Additional detailed info
      activeAdsDetails: {
        totalActiveSpend: activeAdsResult.totalSpend,
        videoAds: activeAdsResult.videoCount,
        imageAds: activeAdsResult.imageCount
      }
    }

    console.log(`✅ Complete stats for ${productName}:`, stats)

    return stats
  }

  /**
   * Get product info by name (case-insensitive)
   */
  async getProductInfo(productName: string) {
    const { data: productInfo, error } = await this.supabase
      .from('products')
      .select('*')
      .ilike('name', `%${productName}%`)
      .single()

    if (error || !productInfo) {
      throw new Error(`Product "${productName}" not found`)
    }

    return productInfo
  }
}

// Export singleton instance
export const adsCalculator = new AdsCalculator() 