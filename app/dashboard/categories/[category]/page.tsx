'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { 
  ChartBarIcon, 
  CalendarIcon, 
  UsersIcon, 
  ClipboardIcon,
  EyeIcon,
  PlayIcon,
  PhotoIcon,
  HashtagIcon
} from '@heroicons/react/24/outline'
import WeeklyPerformanceChart from '@/components/WeeklyPerformanceChart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CategoryStats {
  totalSpend: number
  totalSpendChange: number
  activeAds: number
  scaledAds: number
  workingAds: number
  newAds: number
  totalVideoAds: number
  totalImageAds: number
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

interface DesignerPerformance {
  initials: string
  name: string
  surname: string
  totalAds: number
  totalSpend: number
  videoAds: number
  imageAds: number
  scaledAds: number
  workingAds: number
  products: string[]
}

interface Product {
  id: number
  name: string
  initials: string
  category: string
  table_name: string
}

type MetricView = 'spend' | 'ads' | 'video-image'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatPercentage = (value: number) => {
  const formatted = value.toFixed(1)
  return `${value >= 0 ? '+' : ''}${formatted}%`
}

export default function CategoryPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const categorySlug = params.category as string
  const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [metricView, setMetricView] = useState<MetricView>('spend')
  const [showTable, setShowTable] = useState(false)
  
  // State for aggregated data
  const [stats, setStats] = useState<CategoryStats>({
    totalSpend: 0,
    totalSpendChange: 0,
    activeAds: 0,
    scaledAds: 0,
    workingAds: 0,
    newAds: 0,
    totalVideoAds: 0,
    totalImageAds: 0
  })
  
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [designerPerformance, setDesignerPerformance] = useState<DesignerPerformance[]>([])

  const supabase = createClientComponentClient()

  // Fetch products in this category
  const fetchCategoryProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('category', `%${categoryName}%`)

      if (error) {
        console.error('Error fetching category products:', error)
        setError(`Failed to load products for category "${categoryName}"`)
        return []
      }

      setProducts(data || [])
      return data || []
    } catch (err) {
      console.error('Error fetching category products:', err)
      setError('Failed to load category information')
      return []
    }
  }

  // Aggregate data from all products in category
  const fetchCategoryData = async () => {
    try {
      setLoading(true)
      setError('')

      const categoryProducts = await fetchCategoryProducts()
      
      if (categoryProducts.length === 0) {
        setError(`No products found for category "${categoryName}"`)
        return
      }

      console.log(`📊 Fetching data for ${categoryProducts.length} products in ${categoryName} category`)

      // Fetch data from all products in parallel
      const productDataPromises = categoryProducts.map(async (product) => {
        const productName = product.name.toLowerCase()
        
        const [statsResponse, weeklyResponse, designersResponse] = await Promise.all([
          fetch(`/api/products/${productName}/stats`),
          fetch(`/api/products/${productName}/weekly-data`),
          fetch(`/api/products/${productName}/designers`)
        ])

        if (!statsResponse.ok || !weeklyResponse.ok || !designersResponse.ok) {
          console.warn(`Failed to fetch complete data for ${productName}`)
          return null
        }

        const [statsData, weeklyData, designersData] = await Promise.all([
          statsResponse.json(),
          weeklyResponse.json(), 
          designersResponse.json()
        ])

        return {
          product,
          stats: statsData.stats || {},
          weeklyData: weeklyData.weeklyData || [],
          designers: designersData.designers || []
        }
      })

      const productDataResults = await Promise.all(productDataPromises)
      const validProductData = productDataResults.filter(Boolean)

      // Aggregate stats across all products
      const aggregatedStats = validProductData.reduce((acc, data) => {
        const stats = data!.stats
        return {
          totalSpend: acc.totalSpend + (stats.totalSpend || 0),
          totalSpendChange: acc.totalSpendChange + (stats.totalSpendChange || 0),
          activeAds: acc.activeAds + (stats.activeAds || 0),
          scaledAds: acc.scaledAds + (stats.scaledAds || 0),
          workingAds: acc.workingAds + (stats.workingAds || 0),
          newAds: acc.newAds + (stats.newAds || 0),
          totalVideoAds: acc.totalVideoAds + (stats.videoAds || 0),
          totalImageAds: acc.totalImageAds + (stats.imageAds || 0)
        }
      }, {
        totalSpend: 0,
        totalSpendChange: 0,
        activeAds: 0,
        scaledAds: 0,
        workingAds: 0,
        newAds: 0,
        totalVideoAds: 0,
        totalImageAds: 0
      })

      // Average the spend change percentage
      if (validProductData.length > 0) {
        aggregatedStats.totalSpendChange = aggregatedStats.totalSpendChange / validProductData.length
      }

      setStats(aggregatedStats)

      // Aggregate weekly data across all products
      const weeklyDataMap: { [week: string]: WeeklyData } = {}
      
      validProductData.forEach(data => {
        data!.weeklyData.forEach((weekData: WeeklyData) => {
          if (!weeklyDataMap[weekData.week]) {
            weeklyDataMap[weekData.week] = {
              week: weekData.week,
              spend: 0,
              adsCount: 0,
              scaledAds: 0,
              workingAds: 0,
              videoAds: 0,
              imageAds: 0
            }
          }
          
          weeklyDataMap[weekData.week].spend += weekData.spend || 0
          weeklyDataMap[weekData.week].adsCount += weekData.adsCount || 0
          weeklyDataMap[weekData.week].scaledAds += weekData.scaledAds || 0
          weeklyDataMap[weekData.week].workingAds += weekData.workingAds || 0
          weeklyDataMap[weekData.week].videoAds += weekData.videoAds || 0
          weeklyDataMap[weekData.week].imageAds += weekData.imageAds || 0
        })
      })

      const aggregatedWeeklyData = Object.values(weeklyDataMap).sort((a, b) => 
        a.week.localeCompare(b.week)
      )
      setWeeklyData(aggregatedWeeklyData)

      // Aggregate designer performance across all products
      const designerMap: { [initials: string]: DesignerPerformance } = {}
      
      validProductData.forEach(data => {
        const productName = data!.product.name
        data!.designers.forEach((designer: any) => {
          if (!designerMap[designer.initials]) {
            designerMap[designer.initials] = {
              initials: designer.initials,
              name: designer.name,
              surname: designer.surname,
              totalAds: 0,
              totalSpend: 0,
              videoAds: 0,
              imageAds: 0,
              scaledAds: 0,
              workingAds: 0,
              products: []
            }
          }
          
          // Add product to designer's product list if not already there
          if (!designerMap[designer.initials].products.includes(productName)) {
            designerMap[designer.initials].products.push(productName)
          }
          
          // Note: We would need to fetch detailed designer performance from each product
          // For now, we'll just track which products they work on
        })
      })

      setDesignerPerformance(Object.values(designerMap))

      console.log(`✅ Category ${categoryName} data aggregated successfully`)
      console.log(`📊 Total products: ${validProductData.length}`)
      console.log(`💰 Total spend: ${formatCurrency(aggregatedStats.totalSpend)}`)
      console.log(`🎨 Total designers: ${Object.keys(designerMap).length}`)

    } catch (err: any) {
      console.error(`❌ Error fetching category data:`, err)
      setError(err.message || 'Failed to load category data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    if (status !== 'loading' && categoryName) {
      fetchCategoryData()
    }
  }, [status, categoryName])

  // Get chart data based on current metric view
  const getChartDataForView = () => {
    switch (metricView) {
      case 'spend':
        return weeklyData.map(week => ({ ...week, value: week.spend, label: 'Spend' }))
      case 'ads':
        return weeklyData.map(week => ({ ...week, value: week.adsCount, label: 'Total Ads' }))
      case 'video-image':
        return weeklyData.map(week => ({ 
          ...week, 
          videoAds: week.videoAds, 
          imageAds: week.imageAds,
          label: 'Video vs Image'
        }))
      default:
        return weeklyData
    }
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-white">Loading...</div>
    </div>
  }

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-white">Please sign in to view this page.</div>
    </div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading {categoryName} category data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <ClipboardIcon className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          {categoryName} Category
        </h1>
        <p className="text-gray-400 text-lg">
          Performance overview across {products.length} products
        </p>
        <div className="flex justify-center gap-2 mt-4">
          {products.map(product => (
            <span 
              key={product.id}
              className="inline-block px-3 py-1 bg-blue-600 bg-opacity-20 text-blue-400 rounded-full text-sm"
            >
              {product.name}
            </span>
          ))}
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
              <p className="text-xs text-gray-400">Across all products</p>
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

      {/* Metric View Toggle */}
      <div className="flex justify-center">
        <div className="bg-dark-700 rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setMetricView('spend')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              metricView === 'spend'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
            }`}
          >
            <ChartBarIcon className="w-4 h-4 inline mr-2" />
            Spend View
          </button>
          <button
            onClick={() => setMetricView('ads')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              metricView === 'ads'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
            }`}
          >
            <HashtagIcon className="w-4 h-4 inline mr-2" />
            Ad Count View
          </button>
          <button
            onClick={() => setMetricView('video-image')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              metricView === 'video-image'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
            }`}
          >
            <PlayIcon className="w-4 h-4 inline mr-1" />
            <PhotoIcon className="w-4 h-4 inline mr-2" />
            Video vs Image
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-3">
          <div className="dashboard-card h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-xl font-bold text-white">
                Category Performance - {metricView === 'spend' ? 'Spend' : metricView === 'ads' ? 'Ad Count' : 'Video vs Image'}
              </h2>
              <button
                onClick={() => setShowTable(!showTable)}
                className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors"
              >
                {showTable ? 'Show Chart' : 'Show Table'}
              </button>
            </div>

            {!showTable ? (
              <div className="flex-1 min-h-0">
                {weeklyData.length > 0 ? (
                  <WeeklyPerformanceChart data={getChartDataForView()} />
                ) : (
                  <div className="text-center py-16 text-gray-400 flex-1 flex flex-col items-center justify-center">
                    <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No weekly data available for this category.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="min-w-full text-white">
                  <thead className="bg-dark-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Week</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Spend</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Ads</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Video</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Image</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Scaled</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Working</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-600">
                    {weeklyData.map((week) => (
                      <tr key={week.week} className="hover:bg-dark-700">
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{week.week}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatCurrency(week.spend)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{week.adsCount}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{week.videoAds}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{week.imageAds}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{week.scaledAds}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{week.workingAds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Designer Performance */}
        <div className="lg:col-span-1">
          <div className="dashboard-card h-[600px] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6 flex-shrink-0">Category Designers</h2>
            <div className="flex-1 overflow-auto space-y-4">
              {designerPerformance.length > 0 ? (
                designerPerformance.map((designer) => (
                  <div key={designer.initials} className="bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">
                        {designer.name} {designer.surname}
                      </h3>
                      <span className="text-xs bg-blue-600 bg-opacity-20 text-blue-400 px-2 py-1 rounded">
                        {designer.initials}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>Products: {designer.products.join(', ')}</p>
                      <div className="flex justify-between">
                        <span>Works across {designer.products.length} product{designer.products.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No designers found in this category.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 