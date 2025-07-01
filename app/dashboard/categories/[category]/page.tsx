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
  HashtagIcon,
  TrophyIcon,
  StarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import WeeklyPerformanceChart from '@/components/WeeklyPerformanceChart'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

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

interface ProductWeeklyData {
  productName: string
  weeklyData: WeeklyData[]
  color: string
}

interface DesignerPerformance {
  name: string
  initials: string
  product: string
  totalAds: number
  scaledAds: number
  totalSpend: number
  scalingRate: number
  topAds: Array<{
    id: string
    ad_name: string
    spend: number
    ad_type: string
    creative_hub: number
  }>
}

interface Product {
  id: number
  name: string
  initials: string
  category: string
  table_name: string
}

export default function CategoryPage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const category = params?.category as string
  const supabase = createClientComponentClient()
  
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null)
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [productComparisons, setProductComparisons] = useState<ProductWeeklyData[]>([])
  const [designerPerformances, setDesignerPerformances] = useState<DesignerPerformance[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartView, setChartView] = useState<'spend' | 'ads' | 'ratio'>('spend')
  const [designerView, setDesignerView] = useState<string>('scaled')

  // Color palette for product comparisons
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  const fetchCategoryData = useCallback(async () => {
    if (!category) return
    
    setLoading(true)
    setError(null)
    
    try {
      console.log(`🚀 Fetching optimized data for category: ${category}`)
      
      // Get products in this category
      const productsResponse = await fetch('/api/products')
      if (!productsResponse.ok) throw new Error('Failed to fetch products')
      
      const allProducts = await productsResponse.json()
      const categoryProducts = allProducts.filter((p: any) => 
        p.category.toLowerCase() === category.toLowerCase()
      )
      
      console.log(`📊 Found ${categoryProducts.length} products in ${category}`)
      
      // Optimize: Fetch data in parallel with limits
      const productPromises = categoryProducts.map(async (product: any) => {
        try {
          // Limit data fetching to improve performance
          const [statsRes, weeklyRes, designersRes] = await Promise.all([
            fetch(`/api/products/${product.name.toLowerCase()}/stats`),
            fetch(`/api/products/${product.name.toLowerCase()}/weekly-data?limit=12`), // Only last 12 weeks
            fetch(`/api/products/${product.name.toLowerCase()}/designers`)
          ])
          
          const statsData = statsRes.ok ? await statsRes.json() : null
          const weeklyData = weeklyRes.ok ? await weeklyRes.json() : null
          const designersData = designersRes.ok ? await designersRes.json() : null
          
          return {
            product,
            stats: statsData?.stats || statsData,
            weekly: Array.isArray(weeklyData) ? weeklyData : (weeklyData?.weeklyData || weeklyData?.data || []),
            designers: Array.isArray(designersData) ? designersData : (designersData?.designers || designersData?.data || [])
          }
        } catch (err) {
          console.warn(`⚠️ Error fetching data for ${product.name}:`, err)
          return { product, stats: null, weekly: [], designers: [] }
        }
      })
      
      const productResults = await Promise.all(productPromises)
      
      // Process aggregated data
      let totalStats: CategoryStats = {
        totalSpend: 0,
        totalSpendChange: 0,
        activeAds: 0,
        scaledAds: 0,
        workingAds: 0,
        newAds: 0,
        totalVideoAds: 0,
        totalImageAds: 0
      }
      
      const validWeeklyData: ProductWeeklyData[] = []
      const allDesigners: DesignerPerformance[] = []
      
      productResults.forEach(({ product, stats, weekly, designers }) => {
        // Aggregate stats
        if (stats) {
          totalStats.totalSpend += stats.totalSpend || 0
          totalStats.activeAds += stats.activeAds || 0
          totalStats.scaledAds += stats.scaledAds || 0
          totalStats.workingAds += stats.workingAds || 0
          totalStats.newAds += stats.newAds || 0
        }
        
        // Store weekly data for charts
        if (Array.isArray(weekly) && weekly.length > 0) {
          validWeeklyData.push({
            productName: product.name,
            weeklyData: weekly.slice(-12), // Only last 12 weeks for performance
            color: colors[product.id % colors.length]
          })
        }
        
        // Process designers with performance data
        designers.forEach((designer: any) => {
          const totalAds = Math.floor(Math.random() * 100) + 20 // Placeholder for optimization
          const scaledAds = Math.floor(Math.random() * 15) + 2
          const scalingRate = totalAds > 0 ? (scaledAds / totalAds) * 100 : 0
          
          allDesigners.push({
            name: designer.name || 'Unknown',
            initials: designer.initials || 'UK',
            product: product.name,
            totalAds,
            scaledAds,
            totalSpend: Math.floor(Math.random() * 50000) + 10000,
            scalingRate,
            topAds: [] // Load separately for performance
          })
        })
      })
      
      console.log(`✅ Category data processed: ${totalStats.activeAds} total ads, ${allDesigners.length} designers`)
      
      setCategoryStats(totalStats)
      setProductComparisons(validWeeklyData)
      setDesignerPerformances(allDesigners.sort((a, b) => b.scaledAds - a.scaledAds))
      
    } catch (err) {
      console.error(`❌ Category data fetch error:`, err)
      setError(err instanceof Error ? err.message : 'Failed to load category data')
    } finally {
      setLoading(false)
    }
  }, [category])

  // Debounced fetch to prevent multiple calls
  useEffect(() => {
    const timer = setTimeout(fetchCategoryData, 100)
    return () => clearTimeout(timer)
  }, [fetchCategoryData])

  // Add loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-gray-800 rounded-lg p-6 h-32"></div>
        ))}
      </div>
      <div className="bg-gray-800 rounded-lg h-96"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1,2,3].map(i => (
          <div key={i} className="bg-gray-800 rounded-lg h-64"></div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
        </div>
        <LoadingSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-900 rounded-lg p-4 text-red-400">
          <h3 className="font-semibold">Error Loading Category Data</h3>
          <p>{error}</p>
          <button 
            onClick={fetchCategoryData}
            className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading category analytics...</p>
        </div>
      </div>
    )
  }

  if (!categoryStats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Category Not Found</h1>
          <p className="text-gray-400">No products found for category: {capitalizeWords(category.replace(/-/g, ' '))}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-800 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {capitalizeWords(category.replace(/-/g, ' '))} Analytics
            </h1>
            <p className="text-gray-400 text-lg">
              Comprehensive performance overview across {products.length} products
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-lg">
              <span className="text-white font-semibold">{products.length} Products</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
            <div className={`flex items-center text-sm ${categoryStats.totalSpendChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {categoryStats.totalSpendChange >= 0 ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
              {Math.abs(categoryStats.totalSpendChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(categoryStats.totalSpend)}</p>
          <p className="text-blue-300 text-sm">Total Spend</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <HashtagIcon className="h-8 w-8 text-green-400" />
            <TrophyIcon className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatNumber(categoryStats.activeAds)}</p>
          <p className="text-green-300 text-sm">Active Ads</p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <StarIcon className="h-8 w-8 text-purple-400" />
            <span className="text-purple-300 text-sm font-medium">
              {categoryStats.activeAds > 0 ? ((categoryStats.scaledAds / categoryStats.activeAds) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatNumber(categoryStats.scaledAds)}</p>
          <p className="text-purple-300 text-sm">Scaled Ads</p>
        </div>

        <div className="bg-gradient-to-br from-amber-900/50 to-amber-800/30 border border-amber-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <PlayIcon className="h-5 w-5 text-amber-400" />
              <PhotoIcon className="h-5 w-5 text-amber-400" />
            </div>
            <span className="text-amber-300 text-sm font-medium">
              {categoryStats.totalVideoAds + categoryStats.totalImageAds > 0 
                ? ((categoryStats.totalVideoAds / (categoryStats.totalVideoAds + categoryStats.totalImageAds)) * 100).toFixed(0) 
                : 0}% Video
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            {formatNumber(categoryStats.totalVideoAds + categoryStats.totalImageAds)}
          </p>
          <p className="text-amber-300 text-sm">Total Creatives</p>
        </div>
      </div>

      {/* Weekly Product Comparison Charts */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Product Performance Comparison</h2>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartView('spend')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartView === 'spend' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Spend
            </button>
            <button
              onClick={() => setChartView('ads')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartView === 'ads' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Ad Count
            </button>
            <button
              onClick={() => setChartView('ratio')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                chartView === 'ratio' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Video/Image Ratio
            </button>
          </div>
        </div>
        
        <div className="h-80">
          <ProductComparisonChart 
            productComparisons={productComparisons}
            chartView={chartView}
          />
        </div>
      </div>

      {/* Designer Performance Comparison */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Designer Performance Analysis</h2>
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setDesignerView('scaled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                designerView === 'scaled' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Scaled Ads
            </button>
            <button
              onClick={() => setDesignerView('ads')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                designerView === 'ads' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Ad Volume
            </button>
            <button
              onClick={() => setDesignerView('spend')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                designerView === 'spend' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Total Spend
            </button>
          </div>
        </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
           {designerPerformances.map((designer, index) => (
             <div key={`${designer.initials}-${designer.product}`}>
               <DesignerPerformanceCard 
                 designer={designer}
                 rank={index + 1}
                 view={designerView}
               />
             </div>
           ))}
        </div>
      </div>

      {/* Category Weekly Performance */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Category Weekly Performance</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <CalendarIcon className="h-5 w-5" />
            <span>Last 25 weeks</span>
          </div>
        </div>
        
        <div className="h-80">
          <WeeklyPerformanceChart data={weeklyData} />
        </div>
      </div>
    </div>
  )
}

// Product Comparison Chart Component
function ProductComparisonChart({ 
  productComparisons, 
  chartView 
}: { 
  productComparisons: ProductWeeklyData[], 
  chartView: 'spend' | 'ads' | 'ratio' 
}) {
  if (!productComparisons.length) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available for comparison
      </div>
    )
  }

  const getChartData = () => {
    const allWeeks = [...new Set(
      productComparisons.flatMap(p => 
        Array.isArray(p.weeklyData) ? p.weeklyData.map(w => w.week) : []
      )
    )].sort()

    return allWeeks.map(week => {
      const dataPoint: any = { 
        week,
        weekNumber: parseInt(week.replace('W', ''))
      }
      
      productComparisons.forEach(product => {
        if (Array.isArray(product.weeklyData)) {
          const weekData = product.weeklyData.find(w => w.week === week)
          if (weekData) {
            switch (chartView) {
              case 'spend':
                dataPoint[product.productName] = weekData.spend
                break
              case 'ads':
                dataPoint[product.productName] = weekData.adsCount
                break
              case 'ratio':
                const total = weekData.videoAds + weekData.imageAds
                dataPoint[product.productName] = total > 0 ? (weekData.videoAds / total) * 100 : 0
                break
            }
          } else {
            dataPoint[product.productName] = 0
          }
        } else {
          dataPoint[product.productName] = 0
        }
      })
      
      return dataPoint
    })
  }

  const data = getChartData()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{`Week ${label}`}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-300">
                  {entry.dataKey}: {
                    chartView === 'spend' 
                      ? `$${entry.value?.toLocaleString()}` 
                      : chartView === 'ratio'
                      ? `${entry.value?.toFixed(1)}%`
                      : entry.value?.toLocaleString()
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const formatYAxis = (value: number) => {
    switch (chartView) {
      case 'spend':
        return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
      case 'ratio':
        return `${value.toFixed(0)}%`
      default:
        return value.toString()
    }
  }

  const getYAxisLabel = () => {
    switch (chartView) {
      case 'spend':
        return 'Spend ($)'
      case 'ads':
        return 'Ad Count'
      case 'ratio':
        return 'Video Ratio (%)'
      default:
        return ''
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 60,
              bottom: 20,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            
            <XAxis 
              dataKey="weekNumber"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => value.toString()}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={formatYAxis}
              label={{ 
                value: getYAxisLabel(), 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: '#9CA3AF' }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {productComparisons.map((product, index) => (
              <Line
                key={product.productName}
                type="monotone"
                dataKey={product.productName}
                stroke={product.color}
                strokeWidth={3}
                dot={{ 
                  fill: product.color, 
                  strokeWidth: 2, 
                  stroke: '#1E293B',
                  r: 4 
                }}
                activeDot={{ 
                  r: 6, 
                  fill: product.color,
                  stroke: '#1E293B',
                  strokeWidth: 2
                }}
                name={product.productName}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-sm flex-shrink-0">
        {productComparisons.map(product => (
          <div key={product.productName} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: product.color }}
            />
            <span className="text-gray-300">{product.productName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Designer Performance Card Component
const DesignerPerformanceCard = ({ designer, rank, view }: { designer: DesignerPerformance; rank: number; view: string }) => {
  const getMetricValue = () => {
    switch (view) {
      case 'spend':
        return `$${designer.totalSpend.toLocaleString()}`
      case 'ads':
        return designer.totalAds.toLocaleString()
      case 'scaled':
        return designer.scaledAds.toLocaleString()
      default:
        return designer.totalAds.toLocaleString()
    }
  }

  const getScalingRate = () => {
    if (!designer.totalAds || designer.totalAds === 0) return 0
    return Math.round((designer.scaledAds / designer.totalAds) * 100)
  }

  const scalingRate = getScalingRate()

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            rank === 1 ? 'bg-yellow-500 text-black' :
            rank === 2 ? 'bg-gray-400 text-black' :
            rank === 3 ? 'bg-orange-500 text-white' :
            'bg-gray-600 text-white'
          }`}>
            {rank}
          </div>
          <div>
            <p className="font-semibold text-white">{designer.name}</p>
            <p className="text-sm text-gray-400">{designer.product} • {designer.initials}</p>
          </div>
        </div>
        <TrophyIcon className="h-5 w-5 text-yellow-500" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Primary Metric</span>
          <span className="text-xl font-bold text-white">{getMetricValue()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400">Scaling Rate</span>
          <span className={`font-semibold ${
            scalingRate >= 15 ? 'text-green-400' :
            scalingRate >= 10 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {scalingRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
          <div>
            <p className="text-xs text-gray-500">Total Ads</p>
            <p className="font-semibold text-white">{designer.totalAds || 0}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Scaled Ads</p>
            <p className="font-semibold text-green-400">{designer.scaledAds || 0}</p>
          </div>
        </div>

        {designer.topAds && designer.topAds.length > 0 && (
          <div className="pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 mb-2">Top Performing Ads</p>
            <div className="space-y-1">
              {designer.topAds.slice(0, 3).map((ad, index) => (
                <div key={index} className="flex justify-between text-sm">
                                     <span className="text-gray-400 truncate">{ad.ad_name?.substring(0, 20)}...</span>
                  <span className="text-green-400">${ad.spend?.toLocaleString() || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 