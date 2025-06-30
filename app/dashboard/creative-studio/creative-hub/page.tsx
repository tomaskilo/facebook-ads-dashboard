'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  ChartBarIcon, 
  PlayIcon,
  PhotoIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import CreativeHubPerformanceChart from '@/components/CreativeHubPerformanceChart'
import CreativeHubDesignerAnalytics from '@/components/CreativeHubDesignerAnalytics'

interface CreativeHubStats {
  totalSpend: number
  totalSpendChange: number
  totalAds: number
  videoAds: number
  imageAds: number
  scaledAds: number
  workingAds: number
  activeDesigners: number
}

interface CreativeHubWeeklyData {
  week: string
  totalAds: number
  videoAds: number
  imageAds: number
  scaledAds: number
  totalSpend: number
}

export default function CreativeHubPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTable, setShowTable] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // State for Creative Hub data
  const [stats, setStats] = useState<CreativeHubStats>({
    totalSpend: 0,
    totalSpendChange: 0,
    totalAds: 0,
    videoAds: 0,
    imageAds: 0,
    scaledAds: 0,
    workingAds: 0,
    activeDesigners: 0
  })

  const [weeklyData, setWeeklyData] = useState<CreativeHubWeeklyData[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch Creative Hub stats and weekly data in parallel
      const [statsResponse, weeklyResponse] = await Promise.all([
        fetch('/api/creative-hub/stats'),
        fetch('/api/creative-hub/weekly-data')
      ])

      if (!statsResponse.ok || !weeklyResponse.ok) {
        throw new Error('Failed to fetch Creative Hub data')
      }

      const [statsData, weeklyDataArray] = await Promise.all([
        statsResponse.json(),
        weeklyResponse.json()
      ])

      setStats(statsData)
      setWeeklyData(weeklyDataArray)

    } catch (error) {
      console.error('Error fetching Creative Hub data:', error)
      setError('Failed to load Creative Hub data')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchData()
  }

  // Calculate pagination for weekly data
  const totalPages = Math.ceil(weeklyData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedWeeklyData = weeklyData
    .slice()
    .reverse() // Show latest weeks first
    .slice(startIndex, startIndex + itemsPerPage)

  const renderPaginationButtons = () => {
    const buttons = []
    const maxButtons = 5
    const startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
    const endPage = Math.min(totalPages, startPage + maxButtons - 1)

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded-md text-sm ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
          }`}
        >
          {i}
        </button>
      )
    }
    return buttons
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Creative Hub</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Creative Hub Analytics</h1>
          <p className="text-gray-400">
            Performance analysis for Creative Hub campaigns and designer contributions
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <BanknotesIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Spend</p>
              <p className="text-2xl font-bold text-white">
                ${stats.totalSpend.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Total Ads</p>
              <p className="text-2xl font-bold text-white">{stats.totalAds}</p>
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <PlayIcon className="h-3 w-3 mr-1" />
                  {stats.videoAds} Video
                </span>
                <span className="flex items-center">
                  <PhotoIcon className="h-3 w-3 mr-1" />
                  {stats.imageAds} Image
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Scaled Ads</p>
              <p className="text-2xl font-bold text-white">{stats.scaledAds}</p>
              <p className="text-xs text-gray-500">Working: {stats.workingAds}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-400">Active Designers</p>
              <p className="text-2xl font-bold text-white">{stats.activeDesigners}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Weekly Performance Chart */}
        <div className="lg:col-span-3">
          <div className="dashboard-card h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Weekly Performance</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTable(false)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    !showTable 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setShowTable(true)}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    showTable 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              {!showTable ? (
                <CreativeHubPerformanceChart data={weeklyData} />
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-400 uppercase bg-dark-700 sticky top-0">
                        <tr>
                          <th scope="col" className="px-4 py-3">Week</th>
                          <th scope="col" className="px-4 py-3">Total Ads</th>
                          <th scope="col" className="px-4 py-3">Video</th>
                          <th scope="col" className="px-4 py-3">Image</th>
                          <th scope="col" className="px-4 py-3">Scaled</th>
                          <th scope="col" className="px-4 py-3">Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedWeeklyData.map((week, index) => (
                          <tr key={week.week} className="bg-dark-750 border-b border-dark-600">
                            <td className="px-4 py-3 font-medium text-white">{week.week}</td>
                            <td className="px-4 py-3 text-gray-300">{week.totalAds}</td>
                            <td className="px-4 py-3 text-blue-400">{week.videoAds}</td>
                            <td className="px-4 py-3 text-purple-400">{week.imageAds}</td>
                            <td className="px-4 py-3 text-green-400">{week.scaledAds}</td>
                            <td className="px-4 py-3 text-gray-300">${week.totalSpend.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-dark-600">
                      <div className="text-sm text-gray-400">
                        Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, weeklyData.length)} of {weeklyData.length} weeks
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 rounded-md text-sm bg-dark-700 text-gray-300 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        <div className="flex space-x-1">
                          {renderPaginationButtons()}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 rounded-md text-sm bg-dark-700 text-gray-300 hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div className="dashboard-card">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Creative Hub Overview</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Total Campaigns</span>
                <span className="text-white font-medium">{weeklyData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Avg. Weekly Spend</span>
                <span className="text-white font-medium">
                  ${weeklyData.length > 0 ? Math.round(stats.totalSpend / weeklyData.length).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Video/Image Ratio</span>
                <span className="text-white font-medium">
                  {stats.totalAds > 0 ? Math.round((stats.videoAds / stats.totalAds) * 100) : 0}% / {stats.totalAds > 0 ? Math.round((stats.imageAds / stats.totalAds) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Designer Analytics Section */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-white mb-4">Creative Hub Designer Analytics</h3>
        <CreativeHubDesignerAnalytics />
      </div>

    </div>
  )
} 