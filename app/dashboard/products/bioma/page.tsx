'use client'

import { useState, useEffect } from 'react'
import { ChartBarIcon, CalendarIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function BiomaPage() {
  const [timeRange, setTimeRange] = useState('weekly')
  const [selectedWeek, setSelectedWeek] = useState('W01')
  
  // Mock data for Bioma
  const biomaStats = {
    totalSpend: 8450,
    totalSpendChange: 15.2,
    activeAds: 24,
    activeAdsChange: -2,
    scaledAds: 3,
    workingAds: 12,
    newAds: 8,
    reusedAds: 16
  }

  const weeklyData = [
    { week: 'W01', spend: 1250, adsCount: 5, scaledAds: 1, workingAds: 3, videoAds: 2, imageAds: 3 },
    { week: 'W02', spend: 1680, adsCount: 7, scaledAds: 1, workingAds: 4, videoAds: 3, imageAds: 4 },
    { week: 'W03', spend: 2100, adsCount: 8, scaledAds: 2, workingAds: 5, videoAds: 3, imageAds: 5 },
    { week: 'W04', spend: 1890, adsCount: 6, scaledAds: 1, workingAds: 4, videoAds: 2, imageAds: 4 },
  ]

  const topAds = [
    {
      name: 'BI_ER_IMG_1x1_New_gut_health_testimonial_V01',
      spend: 1250,
      roas: 4.8,
      status: 'Active',
      creative_hub: false
    },
    {
      name: 'BI_MC_VIDEO_9x16_Opti_before_after_transformation_V02',
      spend: 980,
      roas: 3.9,
      status: 'Active',
      creative_hub: false
    },
    {
      name: 'BI_SJ_IMG_4x5_New_chub_probiotic_benefits_V01',
      spend: 750,
      roas: 3.2,
      status: 'Paused',
      creative_hub: true
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
            <h1 className="text-3xl font-bold text-white mb-2">Bioma - E-Commerce</h1>
            <p className="text-gray-400">Gut health and probiotic supplements performance tracking</p>
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
              <p className="text-2xl font-bold text-white">{formatCurrency(biomaStats.totalSpend)}</p>
            </div>
            <div className="flex items-center text-sm font-medium text-green-400">
              <span className="mr-1">↗</span>
              {formatPercentage(biomaStats.totalSpendChange)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Active Ads</p>
              <p className="text-2xl font-bold text-white">{biomaStats.activeAds}</p>
            </div>
            <div className="flex items-center text-sm font-medium text-red-400">
              <span className="mr-1">↘</span>
              {Math.abs(biomaStats.activeAdsChange)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Scaled Ads</p>
              <p className="text-2xl font-bold text-white">{biomaStats.scaledAds}</p>
                             <p className="text-xs text-gray-400">&gt;$1000/week</p>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">Working Ads</p>
              <p className="text-2xl font-bold text-white">{biomaStats.workingAds}</p>
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

      {/* Additional Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dashboard-card">
          <h3 className="text-lg font-bold text-white mb-4">Ad Composition</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{biomaStats.newAds}</p>
              <p className="text-sm text-gray-400">New Ads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{biomaStats.reusedAds}</p>
              <p className="text-sm text-gray-400">Reused Ads</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <h3 className="text-lg font-bold text-white mb-4">Designer Performance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">ER (Emily Rodriguez)</span>
              <span className="text-white font-medium">8 ads, $2,450</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">MC (Marcus Chen)</span>
              <span className="text-white font-medium">6 ads, $1,890</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SJ (Sarah Johnson)</span>
              <span className="text-white font-medium">4 ads, $1,200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 