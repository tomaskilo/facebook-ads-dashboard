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
  const [chartView, setChartView] = useState<'spend' | 'ads' | 'ratio'>('spend')
  const [designerView, setDesignerView] = useState<'ads' | 'scaling' | 'spend'>('scaling')

  // Color palette for product comparisons
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ]

  const fetchCategoryData = useCallback(async () => {
    if (!category) return
    
    try {
      setLoading(true)
      
      // Fetch products in this category
      const { data: categoryProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .ilike('category', `%${category}%`)
      
      if (productsError) throw productsError
      if (!categoryProducts?.length) {
        console.log(`No products found for category: ${category}`)
        setLoading(false)
        return
      }
      
      setProducts(categoryProducts)
      
      // Fetch aggregated data for all products
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
      
      let allWeeklyData: { [week: string]: WeeklyData } = {}
      let productWeeklyComparisons: ProductWeeklyData[] = []
      let allDesigners: DesignerPerformance[] = []
      
      // Process each product
      for (let i = 0; i < categoryProducts.length; i++) {
        const product = categoryProducts[i]
        
        try {
          // Fetch product stats
          const statsResponse = await fetch(`/api/products/${product.name.toLowerCase()}/stats`)
          if (statsResponse.ok) {
            const productStats = await statsResponse.json()
            totalStats.totalSpend += productStats.totalSpend || 0
            totalStats.activeAds += productStats.activeAds || 0
            totalStats.scaledAds += productStats.scaledAds || 0
            totalStats.workingAds += productStats.workingAds || 0
            totalStats.newAds += productStats.newAds || 0
          }
          
          // Fetch weekly data
          const weeklyResponse = await fetch(`/api/products/${product.name.toLowerCase()}/weekly-data`)
          if (weeklyResponse.ok) {
            const productWeeklyData = await weeklyResponse.json()
            
            // Store for product comparison
            productWeeklyComparisons.push({
              productName: product.name,
              weeklyData: productWeeklyData,
              color: colors[i % colors.length]
            })
            
            // Aggregate for category totals
            productWeeklyData.forEach((week: WeeklyData) => {
              if (!allWeeklyData[week.week]) {
                allWeeklyData[week.week] = {
                  week: week.week,
                  spend: 0,
                  adsCount: 0,
                  scaledAds: 0,
                  workingAds: 0,
                  videoAds: 0,
                  imageAds: 0
                }
              }
              
              allWeeklyData[week.week].spend += week.spend || 0
              allWeeklyData[week.week].adsCount += week.adsCount || 0
              allWeeklyData[week.week].scaledAds += week.scaledAds || 0
              allWeeklyData[week.week].workingAds += week.workingAds || 0
              allWeeklyData[week.week].videoAds += week.videoAds || 0
              allWeeklyData[week.week].imageAds += week.imageAds || 0
            })
          }
          
          // Fetch designers for this product
          const designersResponse = await fetch(`/api/products/${product.name.toLowerCase()}/designers`)
          if (designersResponse.ok) {
            const designers = await designersResponse.json()
            
            for (const designer of designers) {
              try {
                // Fetch designer performance
                const perfResponse = await fetch(`/api/products/${product.name.toLowerCase()}/designer-performance/${designer.initials}`)
                if (perfResponse.ok) {
                  const performance = await perfResponse.json()
                  
                  // Fetch top ads for this designer
                  const topAdsResponse = await fetch(`/api/products/${product.name.toLowerCase()}/top-ads?designer=${designer.initials}&limit=3`)
                  const topAds = topAdsResponse.ok ? await topAdsResponse.json() : []
                  
                  allDesigners.push({
                    name: `${designer.name} ${designer.surname}`,
                    initials: designer.initials,
                    product: product.name,
                    totalAds: performance.totalAds || 0,
                    scaledAds: performance.scaledAds || 0,
                    totalSpend: performance.totalSpend || 0,
                    scalingRate: performance.totalAds > 0 ? (performance.scaledAds / performance.totalAds) * 100 : 0,
                    topAds: topAds.slice(0, 3) || []
                  })
                }
              } catch (error) {
                console.error(`Error fetching designer ${designer.initials} performance:`, error)
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching data for product ${product.name}:`, error)
        }
      }
      
      // Calculate video/image ratios
      const totalAds = totalStats.activeAds
      totalStats.totalVideoAds = Object.values(allWeeklyData).reduce((sum, week) => sum + week.videoAds, 0)
      totalStats.totalImageAds = Object.values(allWeeklyData).reduce((sum, week) => sum + week.imageAds, 0)
      
      // Calculate spend change (simplified - using last vs first week)
      const weeks = Object.keys(allWeeklyData).sort()
      if (weeks.length >= 2) {
        const firstWeek = allWeeklyData[weeks[0]]?.spend || 0
        const lastWeek = allWeeklyData[weeks[weeks.length - 1]]?.spend || 0
        totalStats.totalSpendChange = firstWeek > 0 ? ((lastWeek - firstWeek) / firstWeek) * 100 : 0
      }
      
      setCategoryStats(totalStats)
      setWeeklyData(Object.values(allWeeklyData).sort((a, b) => a.week.localeCompare(b.week)))
      setProductComparisons(productWeeklyComparisons)
      setDesignerPerformances(allDesigners.sort((a, b) => b.scalingRate - a.scalingRate))
      
    } catch (error) {
      console.error('Error fetching category data:', error)
    } finally {
      setLoading(false)
    }
  }, [category, supabase])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCategoryData()
    }
  }, [status, fetchCategoryData])

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
              onClick={() => setDesignerView('scaling')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                designerView === 'scaling' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Scaling Rate
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
      productComparisons.flatMap(p => p.weeklyData.map(w => w.week))
    )].sort()

    return allWeeks.map(week => {
      const dataPoint: any = { week }
      
      productComparisons.forEach(product => {
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
      })
      
      return dataPoint
    })
  }

  const data = getChartData()

  return (
    <div className="w-full h-full">
      {/* This would integrate with your existing chart library */}
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-white text-lg mb-2">Product Comparison Chart</div>
          <div className="text-gray-400 text-sm">
            Showing {chartView} comparison across {productComparisons.length} products
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {productComparisons.map(product => (
              <div key={product.productName} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: product.color }}
                />
                <span className="text-gray-300 text-sm">{product.productName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Designer Performance Card Component
function DesignerPerformanceCard({ 
  designer, 
  rank, 
  view 
}: { 
  designer: DesignerPerformance, 
  rank: number, 
  view: 'ads' | 'scaling' | 'spend' 
}) {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-yellow-600'
    if (rank === 2) return 'from-gray-400 to-gray-500'
    if (rank === 3) return 'from-amber-600 to-amber-700'
    return 'from-gray-600 to-gray-700'
  }

  const getMetricValue = () => {
    switch (view) {
      case 'scaling':
        return `${designer.scalingRate.toFixed(1)}%`
      case 'ads':
        return designer.totalAds.toString()
      case 'spend':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(designer.totalSpend)
    }
  }

  const getMetricLabel = () => {
    switch (view) {
      case 'scaling':
        return 'Scaling Rate'
      case 'ads':
        return 'Total Ads'
      case 'spend':
        return 'Total Spend'
    }
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getRankColor(rank)} flex items-center justify-center text-white font-bold text-sm`}>
            #{rank}
          </div>
          <div>
            <h3 className="font-semibold text-white">{designer.name}</h3>
            <p className="text-sm text-gray-400">{designer.product}</p>
          </div>
        </div>
        <div className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs font-medium">
          {designer.initials}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{getMetricValue()}</p>
          <p className="text-xs text-gray-400">{getMetricLabel()}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">{designer.scaledAds}</p>
          <p className="text-xs text-gray-400">Scaled Ads</p>
        </div>
      </div>

      {designer.topAds.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Top Performing Ads</h4>
          <div className="space-y-2">
            {designer.topAds.map((ad, index) => (
              <div key={ad.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">#{index + 1}</span>
                  {ad.ad_type === 'video' ? (
                    <PlayIcon className="h-3 w-3 text-blue-400" />
                  ) : (
                    <PhotoIcon className="h-3 w-3 text-green-400" />
                  )}
                  <span className="text-gray-300 truncate max-w-24">
                    {ad.ad_name || 'Untitled'}
                  </span>
                </div>
                <span className="text-yellow-400 font-medium">
                  ${Math.round(ad.spend).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 