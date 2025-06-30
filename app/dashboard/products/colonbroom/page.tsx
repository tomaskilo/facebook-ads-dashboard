'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function ColonbroomPage() {
  const [timeRange, setTimeRange] = useState('weekly')
  const [selectedWeek, setSelectedWeek] = useState('W01')
  
  // Mock data for Colonbroom
  const colonbroomStats = {
    totalSpend: 12750,
    totalSpendChange: 22.8,
    activeAds: 18,
    activeAdsChange: 3,
    scaledAds: 4,
    workingAds: 8,
    newAds: 6,
    reusedAds: 12
  }

  const weeklyData = [
    { week: 'W01', spend: 2100, adsCount: 4, scaledAds: 1, workingAds: 2, videoAds: 2, imageAds: 2 },
    { week: 'W02', spend: 2850, adsCount: 5, scaledAds: 1, workingAds: 3, videoAds: 2, imageAds: 3 },
    { week: 'W03', spend: 3200, adsCount: 6, scaledAds: 2, workingAds: 3, videoAds: 3, imageAds: 3 },
    { week: 'W04', spend: 4600, adsCount: 8, scaledAds: 2, workingAds: 4, videoAds: 4, imageAds: 4 },
  ]

  const topAds = [
    {
      name: 'CB_ER_VIDEO_9x16_New_gut_detox_testimonial_V01',
      spend: 2250,
      roas: 5.2,
      status: 'Active',
      creative_hub: false
    },
    {
      name: 'CB_MC_IMG_1x1_Opti_colon_cleanse_before_after_V03',
      spend: 1850,
      roas: 4.1,
      status: 'Active',
      creative_hub: false
    },
    {
      name: 'CB_SJ_VIDEO_4x5_New_chub_weight_loss_journey_V01',
      spend: 1400,
      roas: 3.8,
      status: 'Active',
      creative_hub: true
    },
    {
      name: 'CB_ER_IMG_9x16_Opti_digestive_health_infographic_V02',
      spend: 980,
      roas: 3.2,
      status: 'Paused',
      creative_hub: false
    }
  ]

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Colonbroom - Digestive Health</h1>
            <p className="text-gray-400">Colon cleanse and digestive health supplement performance tracking</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(colonbroomStats.totalSpend)}</p>
            </div>
            <div className="flex items-center text-sm font-medium text-green-400">
              <span className="mr-1">↗</span>
              {formatPercentage(colonbroomStats.totalSpendChange)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Active Ads</p>
              <p className="text-2xl font-bold text-white">{colonbroomStats.activeAds}</p>
            </div>
            <div className="flex items-center text-sm font-medium text-green-400">
              <span className="mr-1">↗</span>
              {Math.abs(colonbroomStats.activeAdsChange)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Scaled Ads</p>
              <p className="text-2xl font-bold text-white">{colonbroomStats.scaledAds}</p>
              <p className="text-xs text-gray-400">&gt;$1000/week</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Working Ads</p>
              <p className="text-2xl font-bold text-white">{colonbroomStats.workingAds}</p>
              <p className="text-xs text-gray-400">$100-$1000/week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Data */}
        <div className="lg:col-span-2">
          <div className="dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Weekly Performance</h2>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {weeklyData.map(week => (
                  <option key={week.week} value={week.week}>{week.week}</option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-3 text-gray-400">Week</th>
                    <th className="text-left py-3 text-gray-400">Spend</th>
                    <th className="text-left py-3 text-gray-400">Ads Count</th>
                    <th className="text-left py-3 text-gray-400">Scaled</th>
                    <th className="text-left py-3 text-gray-400">Working</th>
                    <th className="text-left py-3 text-gray-400">Video</th>
                    <th className="text-left py-3 text-gray-400">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.map((week, index) => (
                    <tr key={index} className="border-b border-dark-700">
                      <td className="py-3 text-white font-medium">{week.week}</td>
                      <td className="py-3 text-white">{formatCurrency(week.spend)}</td>
                      <td className="py-3 text-white">{week.adsCount}</td>
                      <td className="py-3 text-green-400">{week.scaledAds}</td>
                      <td className="py-3 text-blue-400">{week.workingAds}</td>
                      <td className="py-3 text-purple-400">{week.videoAds}</td>
                      <td className="py-3 text-orange-400">{week.imageAds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Performing Ads */}
        <div className="lg:col-span-1">
          <div className="dashboard-card">
            <h2 className="text-xl font-bold text-white mb-6">Top Performing Ads</h2>
            
            <div className="space-y-4">
              {topAds.map((ad, index) => (
                <div key={index} className="bg-dark-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-xs break-all">{ad.name}</h3>
                      {ad.creative_hub && (
                        <span className="inline-block mt-1 px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-400 text-xs rounded">
                          Creative Hub
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                      ad.status === 'Active' 
                        ? 'bg-green-600 bg-opacity-20 text-green-400'
                        : 'bg-gray-600 bg-opacity-20 text-gray-400'
                    }`}>
                      {ad.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-400">Spend:</p>
                      <p className="text-white font-medium">{formatCurrency(ad.spend)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">ROAS:</p>
                      <p className="text-green-400 font-medium">{ad.roas}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Colonbroom-specific Stats */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creative Performance by Category */}
        <div className="dashboard-card">
          <h2 className="text-xl font-bold text-white mb-6">Creative Performance by Category</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Before/After Transformations</p>
                <p className="text-sm text-gray-400">Weight loss focused</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">4.2x ROAS</p>
                <p className="text-sm text-gray-400">8 ads</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Health Benefits</p>
                <p className="text-sm text-gray-400">Digestive health focused</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">3.8x ROAS</p>
                <p className="text-sm text-gray-400">6 ads</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
              <div>
                <p className="text-white font-medium">Testimonials</p>
                <p className="text-sm text-gray-400">Customer reviews</p>
              </div>
              <div className="text-right">
                <p className="text-green-400 font-bold">3.5x ROAS</p>
                <p className="text-sm text-gray-400">4 ads</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card">
          <h2 className="text-xl font-bold text-white mb-6">Quick Insights</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <p className="text-white font-medium">Best Performing Format</p>
              <p className="text-gray-400">Video ads (9x16) - 4.1x avg ROAS</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-white font-medium">Top Designer</p>
              <p className="text-gray-400">ER - 68% of scaled ads</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <p className="text-white font-medium">Creative Hub Performance</p>
              <p className="text-gray-400">22% of total ads, 3.6x avg ROAS</p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <p className="text-white font-medium">Optimization Opportunity</p>
              <p className="text-gray-400">Image ads (1x1) - potential for scaling</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 