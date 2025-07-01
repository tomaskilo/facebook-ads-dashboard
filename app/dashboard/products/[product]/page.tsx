'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { ChartBarIcon, CalendarIcon, UsersIcon, ClipboardIcon } from '@heroicons/react/24/outline'
import ScaledAdsTooltip from '@/components/ScaledAdsTooltip'
import WeeklyPerformanceChart from '@/components/WeeklyPerformanceChart'
import DesignerAnalytics from '@/components/DesignerAnalytics'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ProductStats {
  totalSpend: number
  totalSpendChange: number
  activeAds: number
  scaledAds: number
  workingAds: number
  newAds: number
}

interface WeeklyData {
  week: string
  spend: number
  adsCount: number
  scaledAds: number
  workingAds: number
  videoAds: number
  imageAds: number
}

interface TopAd {
  name: string
  spend: number
  roas: number
  status: string
  creative_hub: boolean
  impressions: number
  days_running: number
  creative_type: string
  week_number: string
}

interface ProductInfo {
  name: string
  category: string
  initials: string
}

// Product descriptions by category
const getProductDescription = (product: ProductInfo) => {
  const descriptions: Record<string, string> = {
    'Ecommerce': 'E-commerce product performance tracking and optimization',
    'Go Health': 'Health and wellness product analytics and insights', 
    'WMA': 'Weight management product performance analysis',
    'Beyond Wellness': 'Advanced wellness product tracking and optimization',
    'Ecom Accelerator': 'Accelerated e-commerce growth analytics'
  }
  
  return descriptions[product.category] || 'Product performance tracking and optimization'
}

export default function DynamicProductPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const productName = params.product as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null)
  const [showScaledAdsTooltip, setShowScaledAdsTooltip] = useState(false)
  const [selectedWeekForTooltip, setSelectedWeekForTooltip] = useState('')
  const [showTable, setShowTable] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // State for real data
  const [stats, setStats] = useState<ProductStats>({
    totalSpend: 0,
    totalSpendChange: 0,
    activeAds: 0,
    scaledAds: 0,
    workingAds: 0,
    newAds: 0
  })
  
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [topAds, setTopAds] = useState<TopAd[]>([])

  const supabase = createClientComponentClient()

  // Fetch product info
  const fetchProductInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('name, category, initials')
        .ilike('name', `%${productName}%`)
        .single()

      if (error || !data) {
        console.error('Product not found:', error)
        setError(`Product "${productName}" not found`)
        return null
      }

      setProductInfo(data)
      return data
    } catch (err) {
      console.error('Error fetching product info:', err)
      setError('Failed to load product information')
      return null
    }
  }

  // Fetch data using dynamic API endpoints
  const fetchAllData = async () => {
    setLoading(true)
    setError('')
    
    try {
      console.log(`🔄 Fetching data for ${productName} via dynamic API endpoints...`)
      console.log('👤 Session status:', status)
      console.log('👤 Session data:', session ? `${session.user?.name} (${session.user?.email})` : 'No session')

      if (status === 'loading') {
        console.log('⏳ Session still loading, waiting...')
        return
      }

      if (status === 'unauthenticated') {
        console.log('🚫 Not authenticated')
        setError('Please log in to view data')
        return
      }

      // First get product info
      const productData = await fetchProductInfo()
      if (!productData) {
        return // Error already set in fetchProductInfo
      }

      // Fetch all data in parallel
      const [statsResponse, weeklyResponse, topAdsResponse] = await Promise.all([
        fetch(`/api/products/${productName}/stats`),
        fetch(`/api/products/${productName}/weekly-data`),
        fetch(`/api/products/${productName}/top-ads`)
      ])

      console.log(`📡 API Response Status for ${productName}:`, {
        stats: statsResponse.status,
        weekly: weeklyResponse.status,
        topAds: topAdsResponse.status
      })

      // Check for specific error responses
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text()
        console.error(`${productName} Stats API Error:`, statsResponse.status, errorText)
      }
      if (!weeklyResponse.ok) {
        const errorText = await weeklyResponse.text()
        console.error(`${productName} Weekly API Error:`, weeklyResponse.status, errorText)
      }
      if (!topAdsResponse.ok) {
        const errorText = await topAdsResponse.text()
        console.error(`${productName} Top Ads API Error:`, topAdsResponse.status, errorText)
      }

      if (!statsResponse.ok || !weeklyResponse.ok || !topAdsResponse.ok) {
        throw new Error(`API Error for ${productName}: Stats(${statsResponse.status}) Weekly(${weeklyResponse.status}) TopAds(${topAdsResponse.status})`)
      }

      const [statsData, weeklyDataResult, topAdsData] = await Promise.all([
        statsResponse.json(),
        weeklyResponse.json(),
        topAdsResponse.json()
      ])

      console.log(`📊 API Response Data for ${productName}:`)
      console.log('Stats Data:', statsData)
      console.log('Weekly Data:', weeklyDataResult)
      console.log('Top Ads:', topAdsData)

      // Set the data
      setStats(statsData.stats || { totalSpend: 0, totalSpendChange: 0, activeAds: 0, scaledAds: 0, workingAds: 0, newAds: 0 })
      setWeeklyData(weeklyDataResult.weeklyData || [])
      setTopAds(topAdsData.topAds || [])
      
      // Reset pagination when new data is loaded
      setCurrentPage(1)

      console.log(`✅ ${productName} API data fetch completed successfully`)

    } catch (err: any) {
      console.error(`❌ Error fetching data for ${productName} via API:`, err)
      setError(err.message || `Failed to load ${productName} data`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount (wait for session)
  useEffect(() => {
    if (status !== 'loading' && productName) {
      fetchAllData()
    }
  }, [status, productName])

  // Refresh data when needed (expose to child components)
  const refreshData = useCallback(() => {
    fetchAllData()
  }, [productName])

  const handleScaledAdsCountChange = useCallback((newCount: number) => {
    setStats(prevStats => ({
      ...prevStats,
      scaledAds: newCount
    }))
  }, [])

  const handleScaledAdsClick = (week: string, scaledCount: number) => {
    if (scaledCount > 0) {
      setSelectedWeekForTooltip(week)
      setShowScaledAdsTooltip(true)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const shortenAdName = (adName: string, maxLength: number = 40) => {
    if (adName.length <= maxLength) return adName
    return adName.substring(0, maxLength) + '...'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  // Sort and paginate weekly data
  const sortedWeeklyData = [...weeklyData].sort((a, b) => {
    // Extract numeric part from week strings like "W01", "W02" and sort descending (latest first)
    const getWeekNumber = (week: string) => parseInt(week.replace('W', ''))
    return getWeekNumber(b.week) - getWeekNumber(a.week)
  })

  const totalPages = Math.ceil(sortedWeeklyData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedWeeklyData = sortedWeeklyData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">
            {status === 'loading' ? 'Checking authentication...' : `Loading ${productName} data...`}
          </p>
          {session && (
            <p className="text-gray-400 text-sm mt-2">
              Logged in as {session.user?.name}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-400 mb-4">Please log in to view {productName} analytics</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={fetchAllData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Format product name for display (capitalize first letter)
  const displayName = productName.charAt(0).toUpperCase() + productName.slice(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-dark-700 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{displayName} Analytics</h1>
            <p className="text-gray-400">
              {productInfo ? getProductDescription(productInfo) : 'Product performance tracking and optimization'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {session && (
              <div className="text-sm text-gray-400">
                👤 {session.user?.name}
              </div>
            )}
            <button
              onClick={refreshData}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalSpend)}</p>
              <p className={`text-xs font-medium ${
                stats.totalSpendChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatPercentage(stats.totalSpendChange)} vs last week
              </p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Active Ads</p>
              <p className="text-2xl font-bold text-white">{stats.activeAds}</p>
              <p className="text-xs text-gray-400">Running campaigns</p>
            </div>
            <UsersIcon className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Scaled Ads</p>
              <p className="text-2xl font-bold text-white">{stats.scaledAds}</p>
              <p className="text-xs text-gray-400">$1000+/week</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Working Ads</p>
              <p className="text-2xl font-bold text-white">{stats.workingAds}</p>
              <p className="text-xs text-gray-400">$100-$1000/week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weekly Performance Chart */}
        <div className="lg:col-span-3">
          <div className="dashboard-card h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">Weekly Performance</h2>
              <button
                onClick={() => setShowTable(!showTable)}
                className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors"
              >
                {showTable ? 'Show Chart' : 'Show Table'}
              </button>
            </div>

            {!showTable ? (
              // Chart View
              <div className="flex-1 min-h-0">
                {weeklyData.length > 0 ? (
                  <WeeklyPerformanceChart data={weeklyData} />
                ) : (
                  <div className="text-center py-16 text-gray-400 flex-1 flex flex-col items-center justify-center">
                    <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No weekly data available.</p>
                    <p className="text-sm">Upload CSV files to see weekly performance chart.</p>
                  </div>
                )}
              </div>
            ) : (
              // Table View
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-dark-800">
                      <tr className="border-b border-dark-700">
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Week</th>
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Spend</th>
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Ads Count</th>
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Scaled</th>
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Working</th>
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Video</th>
                        <th className="text-left py-3 text-gray-400 bg-dark-800">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedWeeklyData.map((week, index) => (
                        <tr key={index} className="border-b border-dark-700">
                          <td className="py-3 text-white font-medium">{week.week}</td>
                          <td className="py-3 text-white">{formatCurrency(week.spend)}</td>
                          <td className="py-3 text-white">{week.adsCount}</td>
                          <td className="py-3">
                            {week.scaledAds > 0 ? (
                              <button
                                onClick={() => handleScaledAdsClick(week.week, week.scaledAds)}
                                className="text-green-400 hover:text-green-300 underline cursor-pointer"
                              >
                                {week.scaledAds}
                              </button>
                            ) : (
                              <span className="text-green-400">{week.scaledAds}</span>
                            )}
                          </td>
                          <td className="py-3 text-blue-400">{week.workingAds}</td>
                          <td className="py-3 text-purple-400">{week.videoAds}</td>
                          <td className="py-3 text-orange-400">{week.imageAds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {weeklyData.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No weekly data available. Upload some CSV files to see weekly performance.
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                {weeklyData.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1}-{Math.min(endIndex, sortedWeeklyData.length)} of {sortedWeeklyData.length} weeks
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-dark-700 border border-dark-600 text-white hover:bg-dark-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Ads */}
        <div className="lg:col-span-1">
          <div className="dashboard-card h-[600px] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6 flex-shrink-0">Top Performing Ads</h2>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              {topAds.slice(0, 6).map((ad, index) => (
                <div key={index} className="bg-dark-700 rounded-lg p-3 flex-shrink-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-xs leading-tight mb-1 truncate" title={ad.name}>
                            {ad.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => copyToClipboard(ad.name)}
                          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                          title="Copy full ad name"
                        >
                          <ClipboardIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {ad.creative_hub && (
                        <span className="inline-block px-2 py-0.5 bg-purple-600 bg-opacity-20 text-purple-400 text-xs rounded">
                          Creative Hub
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Spend:</p>
                      <p className="text-white font-medium text-sm">{formatCurrency(ad.spend)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Status:</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ad.status === 'Active' 
                          ? 'bg-green-600 bg-opacity-20 text-green-400'
                          : 'bg-gray-600 bg-opacity-20 text-gray-400'
                      }`}>
                        {ad.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {topAds.length === 0 && (
              <div className="text-center py-8 text-gray-400 flex-1 flex items-center justify-center">
                <div>
                  <p>No ads data available.</p>
                  <p className="text-sm">Upload some CSV files to see top performing ads.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Total Ads</p>
              <p className="text-2xl font-bold text-white">{stats.newAds}</p>
              <p className="text-xs text-gray-400">All time</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Available Weeks</p>
              <p className="text-2xl font-bold text-white">{weeklyData.length}</p>
              <p className="text-xs text-gray-400">Data coverage</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Avg Spend/Week</p>
              <p className="text-2xl font-bold text-white">
                {weeklyData.length > 0 
                  ? formatCurrency(stats.totalSpend / weeklyData.length)
                  : formatCurrency(0)
                }
              </p>
              <p className="text-xs text-gray-400">Weekly average</p>
            </div>
          </div>
        </div>
      </div>

      {/* Designer Analytics Section */}
      <DesignerAnalytics productName={productName} />

      {/* Scaled Ads Tooltip */}
      <ScaledAdsTooltip
        isOpen={showScaledAdsTooltip}
        onClose={() => setShowScaledAdsTooltip(false)}
        onCountChange={handleScaledAdsCountChange}
        selectedWeek={selectedWeekForTooltip}
      />
    </div>
  )
} 