import { createServiceSupabaseClient } from '@/lib/supabase-client'

// Performance monitoring
interface PerformanceMetrics {
  queryTime: number
  recordsProcessed: number
  cacheHits: number
  cacheMisses: number
}

// Comprehensive centralized calculation engine with AGGRESSIVE PERFORMANCE OPTIMIZATION
export class AdsCalculator {
  private supabase = createServiceSupabaseClient()
  private dataCache = new Map<string, { data: any, timestamp: number, metadata?: any }>()
  private queryCache = new Map<string, Promise<any>>() // Deduplicate in-flight queries
  private CACHE_TTL = 15 * 60 * 1000 // 15 minutes cache (3x longer)
  private LONG_CACHE_TTL = 60 * 60 * 1000 // 1 hour for expensive full dataset queries
  private performance: PerformanceMetrics = { queryTime: 0, recordsProcessed: 0, cacheHits: 0, cacheMisses: 0 }

  /**
   * Get current week information
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
   * Check if cached data is still valid with different TTLs
   */
  private isCacheValid(cacheKey: string, useLongCache: boolean = false): boolean {
    const cached = this.dataCache.get(cacheKey)
    if (!cached) return false
    
    const ttl = useLongCache ? this.LONG_CACHE_TTL : this.CACHE_TTL
    const isValid = (Date.now() - cached.timestamp) < ttl
    
    if (isValid) {
      this.performance.cacheHits++
    } else {
      this.performance.cacheMisses++
    }
    
    return isValid
  }

  /**
   * Clear old cache entries to prevent memory leaks
   */
  private cleanupCache() {
    const now = Date.now()
    for (const [key, value] of this.dataCache.entries()) {
      if (now - value.timestamp > this.LONG_CACHE_TTL) {
        this.dataCache.delete(key)
      }
    }
  }

  /**
   * Get product info by name (case-insensitive) with caching
   */
  async getProductInfo(productName: string) {
    const cacheKey = `product_${productName.toLowerCase()}`
    
    if (this.isCacheValid(cacheKey)) {
      return this.dataCache.get(cacheKey)!.data
    }

    const { data: productInfo, error } = await this.supabase
      .from('products')
      .select('*')
      .ilike('name', `%${productName}%`)
      .single()

    if (error || !productInfo) {
      throw new Error(`Product "${productName}" not found`)
    }

    this.dataCache.set(cacheKey, { data: productInfo, timestamp: Date.now() })
    return productInfo
  }

  /**
   * OPTIMIZED: Get recent ads data first (last 6 weeks) for immediate display
   */
  async getRecentAdsData(tableName: string, weeksBack: number = 6) {
    const cacheKey = `recent_${tableName}_${weeksBack}w`
    
    if (this.isCacheValid(cacheKey)) {
      console.log(`⚡ Cache hit for recent ${tableName} (${weeksBack} weeks)`)
      return this.dataCache.get(cacheKey)!.data
    }

    const startTime = Date.now()
    console.log(`🚀 Fetching RECENT ${tableName} data (${weeksBack} weeks)...`)

    try {
      const { currentWeekNumber } = this.getCurrentWeekInfo()
      const minWeek = Math.max(1, currentWeekNumber - weeksBack)
      const minWeekStr = `W${minWeek.toString().padStart(2, '0')}`

      const { data: recentAds, error } = await this.supabase
        .from(tableName)
        .select('*')
        .gte('week_number', minWeekStr)
        .order('week_number', { ascending: true })
        .order('spend_usd', { ascending: false }) // Get highest spend ads first

      if (error) {
        throw new Error(`Failed to fetch recent ads: ${error.message}`)
      }

      const queryTime = Date.now() - startTime
      const result = recentAds || []
      
      console.log(`⚡ RECENT query completed: ${result.length} records in ${queryTime}ms`)
      
      // Cache with normal TTL
      this.dataCache.set(cacheKey, { 
        data: result, 
        timestamp: Date.now(),
        metadata: { queryTime, recordCount: result.length, type: 'recent' }
      })

      this.performance.queryTime += queryTime
      this.performance.recordsProcessed += result.length

      return result
    } catch (error: any) {
      console.error(`❌ Recent query failed for ${tableName}:`, error.message)
      return []
    }
  }

  /**
   * OPTIMIZED: Get paginated historical data for comprehensive analysis
   */
  async getHistoricalAdsData(tableName: string, limit: number = 10000, offset: number = 0) {
    const cacheKey = `historical_${tableName}_${limit}_${offset}`
    
    if (this.isCacheValid(cacheKey, true)) { // Use long cache
      console.log(`📦 Cache hit for historical ${tableName} (limit: ${limit}, offset: ${offset})`)
      return this.dataCache.get(cacheKey)!.data
    }

    const startTime = Date.now()
    console.log(`📊 Fetching HISTORICAL ${tableName} data (limit: ${limit}, offset: ${offset})...`)

    try {
      const { data: historicalAds, error } = await this.supabase
        .from(tableName)
        .select('*')
        .order('week_number', { ascending: true })
        .order('spend_usd', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new Error(`Failed to fetch historical ads: ${error.message}`)
      }

      const queryTime = Date.now() - startTime
      const result = historicalAds || []
      
      console.log(`📊 HISTORICAL query completed: ${result.length} records in ${queryTime}ms`)
      
      // Cache with long TTL for historical data
      this.dataCache.set(cacheKey, { 
        data: result, 
        timestamp: Date.now(),
        metadata: { queryTime, recordCount: result.length, type: 'historical' }
      })

      this.performance.queryTime += queryTime
      this.performance.recordsProcessed += result.length

      return result
    } catch (error: any) {
      console.error(`❌ Historical query failed for ${tableName}:`, error.message)
      return []
    }
  }

  /**
   * OPTIMIZED: Intelligent data fetching with incremental loading
   */
  async getAllAdsData(tableName: string, incrementalLoad: boolean = true) {
    // For immediate display, always start with recent data
    const recentData = await this.getRecentAdsData(tableName, 8) // 8 weeks for good analysis
    
    if (!incrementalLoad) {
      return recentData
    }

    // Check if we have full historical data cached
    const fullCacheKey = `full_${tableName}`
    if (this.isCacheValid(fullCacheKey, true)) {
      console.log(`📦 Using cached full dataset for ${tableName}`)
      return this.dataCache.get(fullCacheKey)!.data
    }

    // For complete analysis, try to get more historical data in chunks
    try {
      console.log(`🔄 Attempting incremental load for ${tableName}...`)
      
      // Get count first to determine strategy
      const { count, error: countError } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.warn(`⚠️ Could not get count for ${tableName}, using recent data only`)
        return recentData
      }

             console.log(`📊 Total records in ${tableName}: ${count}`)

       // If dataset is small enough, get it all
       if (count && count <= 15000) {
         console.log(`📥 Dataset small enough (${count}), fetching all data...`)
         const historicalData = await this.getHistoricalAdsData(tableName, count)
        
        // Cache full dataset with long TTL
        this.dataCache.set(fullCacheKey, { 
          data: historicalData, 
          timestamp: Date.now(),
          metadata: { recordCount: historicalData.length, type: 'full' }
        })
        
        return historicalData
      } else {
        // For large datasets, use recent data + strategic sampling
        console.log(`📊 Large dataset (${count}), using optimized sampling strategy`)
        
        // Get additional historical samples for trend analysis
        const additionalSamples = await this.getHistoricalAdsData(tableName, 5000, 0) // Top 5k by spend
        
        // Merge recent + samples, remove duplicates
        const mergedData = this.mergeAndDeduplicateData(recentData, additionalSamples)
        
        console.log(`✅ Optimized dataset: ${mergedData.length} records (${recentData.length} recent + ${additionalSamples.length - (recentData.length + additionalSamples.length - mergedData.length)} additional)`)
        
        return mergedData
      }
    } catch (error: any) {
      console.warn(`⚠️ Incremental load failed for ${tableName}, using recent data:`, error.message)
      return recentData
    }
  }

  /**
   * Merge and deduplicate data arrays
   */
  private mergeAndDeduplicateData(recentData: any[], additionalData: any[]) {
    const seen = new Set()
    const merged = []
    
    // Add recent data first (prioritize recent)
    for (const item of recentData) {
      const key = `${item.ad_name}_${item.week_number}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(item)
      }
    }
    
    // Add additional data if not already seen
    for (const item of additionalData) {
      const key = `${item.ad_name}_${item.week_number}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(item)
      }
    }
    
    return merged
  }

  /**
   * OPTIMIZED: Calculate truly active ads with early returns
   */
  async calculateActiveAds(tableName: string, productName: string) {
    // Use recent data for active ads calculation (most relevant)
    const recentAds = await this.getRecentAdsData(tableName, 6)
    
    if (recentAds.length === 0) {
      return { count: 0, totalSpend: 0, videoCount: 0, imageCount: 0, ads: [] }
    }
    
    // Get unique weeks and take the last 3 weeks with data
    const uniqueWeeks = [...new Set(recentAds.map((ad: any) => ad.week_number))].sort().reverse()
    const recentWeeks = uniqueWeeks.slice(0, 3)
    
    console.log(`🔍 Calculating active ads for ${productName} in recent weeks: ${recentWeeks.join(', ')}`)

    // Filter ads: recent weeks + quality filters (optimized)
    const activeAdsMap = new Map()
    
    for (const ad of recentAds) {
      if (recentWeeks.includes(ad.week_number) &&
          (ad.days_running || 0) > 3 &&
          (ad.spend_usd || 0) > 1) {
        
        const adName = ad.ad_name
        if (!activeAdsMap.has(adName) || activeAdsMap.get(adName).spend_usd < ad.spend_usd) {
          activeAdsMap.set(adName, ad)
        }
      }
    }

    const activeAds = Array.from(activeAdsMap.values())
    const count = activeAds.length
    const totalSpend = activeAds.reduce((sum: any, ad: any) => sum + (ad.spend_usd || 0), 0)
    const videoCount = activeAds.filter((ad: any) => ad.creative_type === 'VIDEO').length
    const imageCount = activeAds.filter((ad: any) => ad.creative_type === 'IMAGE').length

    console.log(`✅ ${productName}: ${count} active ads (${videoCount} video, ${imageCount} image), $${totalSpend.toLocaleString()} spend`)

    return { count, totalSpend, videoCount, imageCount, ads: activeAds }
  }

  /**
   * OPTIMIZED: Calculate scaled and working ads with Map for performance
   */
  calculateScaledAndWorkingAds(allAds: any[]) {
    const adSpendMap = new Map<string, number>()
    
    // Use for loop for better performance
    for (let i = 0; i < allAds.length; i++) {
      const ad = allAds[i]
      const adName = ad.ad_name
      const spend = ad.spend_usd || 0
      adSpendMap.set(adName, (adSpendMap.get(adName) || 0) + spend)
    }

    let scaledAds = 0
    let workingAds = 0

    for (const totalSpend of adSpendMap.values()) {
      if (totalSpend >= 1000) {
        scaledAds++
      } else if (totalSpend >= 100) {
        workingAds++
      }
    }

    return { scaledAds, workingAds }
  }

  /**
   * OPTIMIZED: Calculate spend change with early termination
   */
  calculateSpendChange(allAds: any[]) {
    const weekSpendMap = new Map<string, number>()
    
    for (const ad of allAds) {
      const week = ad.week_number
      if (week) {
        weekSpendMap.set(week, (weekSpendMap.get(week) || 0) + (ad.spend_usd || 0))
      }
    }

    const weeks = Array.from(weekSpendMap.keys()).sort()
    if (weeks.length < 2) return 0

    const lastWeekSpend = weekSpendMap.get(weeks[weeks.length - 1]) || 0
    const previousWeekSpend = weekSpendMap.get(weeks[weeks.length - 2]) || 0

    if (previousWeekSpend === 0) return 0

    return ((lastWeekSpend - previousWeekSpend) / previousWeekSpend) * 100
  }

  /**
   * OPTIMIZED: Generate weekly data with improved grouping
   */
  generateWeeklyData(allAds: any[], productName: string) {
    console.log(`📊 Generating weekly data for ${productName}, ${allAds.length} total ads`)

    const weeklyMap = new Map()

    // Single pass through data
    for (const ad of allAds) {
      const week = ad.week_number
      if (!week) continue

      if (!weeklyMap.has(week)) {
        weeklyMap.set(week, {
          week,
          uniqueAdNames: new Set(),
          totalSpend: 0,
          videoAds: new Set(),
          imageAds: new Set(),
          adSpends: new Map()
        })
      }

      const weekData = weeklyMap.get(week)
      const adName = ad.ad_name
      const spend = ad.spend_usd || 0

      weekData.uniqueAdNames.add(adName)
      weekData.totalSpend += spend
      
      if (ad.creative_type === 'VIDEO') weekData.videoAds.add(adName)
      if (ad.creative_type === 'IMAGE') weekData.imageAds.add(adName)
      
      weekData.adSpends.set(adName, (weekData.adSpends.get(adName) || 0) + spend)
    }

    // Process weekly data
    const weeklyData = Array.from(weeklyMap.values()).map((weekData: any) => {
      // Calculate scaled/working ads for this week
      let scaledAds = 0
      let workingAds = 0
      
      for (const spend of weekData.adSpends.values()) {
        if (spend >= 1000) scaledAds++
        else if (spend >= 100) workingAds++
      }

      return {
        week: weekData.week,
        spend: Math.round(weekData.totalSpend),
        adsCount: weekData.uniqueAdNames.size,
        scaledAds,
        workingAds,
        videoAds: weekData.videoAds.size,
        imageAds: weekData.imageAds.size
      }
    })

    // Sort by week number
    return weeklyData.sort((a, b) => {
      const getWeekNumber = (week: string) => parseInt(week.replace('W', ''))
      return getWeekNumber(a.week) - getWeekNumber(b.week)
    })
  }

  /**
   * OPTIMIZED: Generate top ads with Map for better performance
   */
  generateTopAds(allAds: any[], limit: number = 20) {
    const adMap = new Map()

    // Single pass aggregation
    for (const ad of allAds) {
      const adName = ad.ad_name
      if (!adMap.has(adName)) {
        adMap.set(adName, {
          ...ad,
          total_spend: 0,
          impressions_total: 0,
          latest_date: ad.last_ad_spend_date || ad.week_number
        })
      }
      
      const existing = adMap.get(adName)
      existing.total_spend += (ad.spend_usd || 0)
      existing.impressions_total += (ad.impressions || 0)
      
      // Keep latest data
      if ((ad.last_ad_spend_date || ad.week_number) > existing.latest_date) {
        Object.assign(existing, ad)
        existing.latest_date = ad.last_ad_spend_date || ad.week_number
      }
    }

    // Sort and format
    return Array.from(adMap.values())
      .sort((a: any, b: any) => b.total_spend - a.total_spend)
      .slice(0, limit)
      .map((ad: any) => {
        const lastSpendDate = new Date(ad.last_ad_spend_date || 0)
        const daysSinceLastSpend = Math.floor((Date.now() - lastSpendDate.getTime()) / (1000 * 60 * 60 * 24))
        const isActive = daysSinceLastSpend <= 7 && (ad.days_running || 0) > 0

        return {
          name: ad.ad_name || 'Unknown',
          spend: ad.total_spend,
          roas: 0,
          status: isActive ? 'Active' : 'Inactive',
          creative_hub: ad.is_creative_hub === 1,
          impressions: ad.impressions_total,
          days_running: ad.days_running || 0,
          creative_type: ad.creative_type || 'Unknown',
          week_number: ad.week_number || 'Unknown'
        }
      })
  }

  /**
   * OPTIMIZED: Designer performance with better error handling
   */
  async calculateDesignerPerformance(tableName: string, productName: string, productInitials: string) {
    try {
      // Use recent data for designer analysis (most relevant for current performance)
      const allAds = await this.getRecentAdsData(tableName, 12) // 12 weeks for good designer analysis
      
      // Get designers for this product
      const { data: designers, error } = await this.supabase
        .from('designers')
        .select('*')
        .eq('product', productInitials)

      if (error) {
        console.warn(`⚠️ Could not fetch designers for ${productName}:`, error)
        return []
      }

      if (!designers || designers.length === 0) {
        console.log(`ℹ️ No designers found for ${productName} (${productInitials})`)
        return []
      }

      return designers.map((designer: any) => {
        // Find ads for this designer
        const designerAds = allAds.filter((ad: any) => 
          ad.ad_name && ad.ad_name.includes(`_${designer.initials}_`)
        )

        const totalAds = new Set(designerAds.map((ad: any) => ad.ad_name)).size
        const totalSpend = designerAds.reduce((sum: any, ad: any) => sum + (ad.spend_usd || 0), 0)
        const activeWeeks = new Set(designerAds.map((ad: any) => ad.week_number)).size

        const { scaledAds } = this.calculateScaledAndWorkingAds(designerAds)

        return {
          initials: designer.initials,
          name: designer.name,
          totalAds,
          totalSpend: Math.round(totalSpend),
          activeWeeks,
          scaledAds,
          videoAds: new Set(designerAds.filter((ad: any) => ad.creative_type === 'VIDEO').map((ad: any) => ad.ad_name)).size,
          imageAds: new Set(designerAds.filter((ad: any) => ad.creative_type === 'IMAGE').map((ad: any) => ad.ad_name)).size
        }
      })
    } catch (error: any) {
      console.warn(`⚠️ Designer calculation failed for ${productName}:`, error.message)
      return []
    }
  }

  /**
   * OPTIMIZED: Master method with query deduplication and parallel optimization
   */
  async getCompleteProductAnalytics(tableName: string, productName: string, productInitials?: string) {
    const cacheKey = `complete_${tableName}_${productName}`
    
    // Check if this exact query is already in progress
    if (this.queryCache.has(cacheKey)) {
      console.log(`🔄 Waiting for in-progress query: ${cacheKey}`)
      return await this.queryCache.get(cacheKey)
    }

    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      console.log(`📦 Cache hit for complete analytics: ${productName}`)
      return this.dataCache.get(cacheKey)!.data
    }

    console.log(`🚀 Generating complete analytics for ${productName}`)
    
    const analyticsPromise = this._generateCompleteAnalytics(tableName, productName, productInitials)
    
    // Store the promise to prevent duplicate queries
    this.queryCache.set(cacheKey, analyticsPromise)
    
    try {
      const result = await analyticsPromise
      
      // Cache the result
      this.dataCache.set(cacheKey, { 
        data: result, 
        timestamp: Date.now(),
        metadata: { type: 'complete_analytics' }
      })
      
      return result
    } finally {
      // Remove from query cache when done
      this.queryCache.delete(cacheKey)
      
      // Cleanup old cache entries
      this.cleanupCache()
    }
  }

  private async _generateCompleteAnalytics(tableName: string, productName: string, productInitials?: string) {
    const startTime = Date.now()
    
    // Get data once with optimized fetching
    const allAds = await this.getAllAdsData(tableName, true) // Enable incremental load
    
    // Calculate all metrics efficiently
    const [
      activeAdsResult,
      scaledWorkingResult,
      spendChange,
      weeklyData,
      topAds,
      designers
    ] = await Promise.all([
      this.calculateActiveAds(tableName, productName),
      Promise.resolve(this.calculateScaledAndWorkingAds(allAds)),
      Promise.resolve(this.calculateSpendChange(allAds)),
      Promise.resolve(this.generateWeeklyData(allAds, productName)),
      Promise.resolve(this.generateTopAds(allAds)),
      productInitials ? this.calculateDesignerPerformance(tableName, productName, productInitials) : Promise.resolve([])
    ])

    const totalSpend = allAds.reduce((sum: any, ad: any) => sum + (ad.spend_usd || 0), 0)
    const totalAds = allAds.length
    const processingTime = Date.now() - startTime

    const analytics = {
      stats: {
        totalSpend,
        totalSpendChange: spendChange,
        activeAds: activeAdsResult.count,
        scaledAds: scaledWorkingResult.scaledAds,
        workingAds: scaledWorkingResult.workingAds,
        newAds: totalAds,
        activeAdsDetails: {
          totalActiveSpend: activeAdsResult.totalSpend,
          videoAds: activeAdsResult.videoCount,
          imageAds: activeAdsResult.imageCount
        }
      },
      weeklyData,
      topAds,
      designers,
      metadata: {
        totalRecords: totalAds,
        processingTime,
        performance: { ...this.performance },
        uniqueWeeks: [...new Set(allAds.map((ad: any) => ad.week_number))].sort(),
        calculatedAt: new Date().toISOString()
      }
    }

    console.log(`✅ Complete analytics generated for ${productName}: ${totalAds} records in ${processingTime}ms`)

    return analytics
  }

  /**
   * Performance monitoring
   */
  getPerformanceMetrics() {
    return { ...this.performance }
  }

  resetPerformanceMetrics() {
    this.performance = { queryTime: 0, recordsProcessed: 0, cacheHits: 0, cacheMisses: 0 }
  }

  /**
   * Clear ALL caches - use when database is reset or data is erased
   */
  clearAllCaches() {
    console.log(`🧹 Clearing ALL caches (${this.dataCache.size} data entries, ${this.queryCache.size} query entries)`)
    this.dataCache.clear()
    this.queryCache.clear()
    this.resetPerformanceMetrics()
    console.log(`✅ All caches cleared successfully`)
  }

  /**
   * LEGACY COMPATIBILITY: Individual stat methods
   */
  async getProductStats(tableName: string, productName: string) {
    const analytics = await this.getCompleteProductAnalytics(tableName, productName)
    return analytics.stats
  }

  async getProductWeeklyData(tableName: string, productName: string) {
    const analytics = await this.getCompleteProductAnalytics(tableName, productName)
    return analytics.weeklyData
  }

  async getProductTopAds(tableName: string, productName: string) {
    const analytics = await this.getCompleteProductAnalytics(tableName, productName)
    return analytics.topAds
  }

  async getProductDesigners(tableName: string, productName: string, productInitials: string) {
    const analytics = await this.getCompleteProductAnalytics(tableName, productName, productInitials)
    return analytics.designers
  }
}

// Export singleton instance
export const adsCalculator = new AdsCalculator() 