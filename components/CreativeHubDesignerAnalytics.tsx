'use client'

import React, { useState, useEffect } from 'react'
import { 
  UserIcon, 
  ChartBarIcon, 
  PlayIcon,
  PhotoIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

interface CreativeHubDesigner {
  initials: string
  name: string
  totalAds: number
  totalSpend: number
  activeWeeks: number
  videoAds: number
  imageAds: number
  scaledAds: number
  isPrePopulated: boolean
}

export default function CreativeHubDesignerAnalytics() {
  const [designers, setDesigners] = useState<CreativeHubDesigner[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch Creative Hub designers on component mount
  useEffect(() => {
    fetchCreativeHubDesigners()
  }, [])

  const fetchCreativeHubDesigners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/creative-hub/designers')
      if (response.ok) {
        const data = await response.json()
        setDesigners(data || [])
      } else {
        console.error('Failed to fetch Creative Hub designers')
      }
    } catch (error) {
      console.error('Error fetching Creative Hub designers:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    fetchCreativeHubDesigners()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-white">Designer Performance</h4>
          <p className="text-sm text-gray-400">Creative Hub team analytics</p>
        </div>
        <button
          onClick={refreshData}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Designers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designers.map((designer) => (
          <div key={designer.initials} className="bg-dark-800 rounded-lg border border-dark-600 p-6">
            {/* Designer Header */}
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <UserIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h5 className="font-semibold text-white">{designer.name}</h5>
                <p className="text-sm text-gray-400">{designer.initials}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{designer.totalAds}</div>
                <div className="text-xs text-gray-400">Total Ads</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">${designer.totalSpend.toLocaleString()}</div>
                <div className="text-xs text-gray-400">Total Spend</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-purple-400">{designer.activeWeeks}</div>
                <div className="text-xs text-gray-400">Active Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-orange-400">{designer.scaledAds}</div>
                <div className="text-xs text-gray-400">Scaled Ads</div>
              </div>
            </div>

            {/* Creative Type Breakdown */}
            <div className="border-t border-dark-600 pt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-blue-400">
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Video: {designer.videoAds}
                </div>
                <div className="flex items-center text-purple-400">
                  <PhotoIcon className="h-4 w-4 mr-1" />
                  Image: {designer.imageAds}
                </div>
              </div>
            </div>

            {/* Performance Indicator */}
            <div className="mt-4 pt-4 border-t border-dark-600">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Performance</span>
                <div className="flex items-center">
                  {designer.totalAds > 0 ? (
                    <div className="flex items-center text-green-400">
                      <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span className="text-xs">No Ads Yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="bg-dark-800 rounded-lg border border-dark-600 p-6">
        <h5 className="font-semibold text-white mb-4">Team Summary</h5>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {designers.reduce((sum, d) => sum + d.totalAds, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Team Ads</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-green-400">
              ${designers.reduce((sum, d) => sum + d.totalSpend, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Team Spend</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-400">
              {designers.reduce((sum, d) => sum + d.videoAds, 0)}
            </div>
            <div className="text-sm text-gray-400">Team Video Ads</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-400">
              {designers.reduce((sum, d) => sum + d.scaledAds, 0)}
            </div>
            <div className="text-sm text-gray-400">Team Scaled Ads</div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
        <div className="flex items-start">
          <ChartBarIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h6 className="text-sm font-medium text-blue-400 mb-1">Creative Hub Analytics</h6>
            <p className="text-xs text-gray-300">
              Showing performance for Creative Hub designers (AS, KZ, AA) only. 
              Ads must contain both Creative Hub identifiers and designer initials to be tracked.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 