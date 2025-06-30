'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  PaintBrushIcon, 
  SwatchIcon 
} from '@heroicons/react/24/outline'

export default function CreativeStudioPage() {
  const router = useRouter()
  const [creativeHubStats, setCreativeHubStats] = useState({
    totalAds: 0,
    activeDesigners: 0
  })
  const [brandAssetsCount, setBrandAssetsCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch Creative Hub stats and Brand Assets count in parallel
      const [creativeHubResponse, brandAssetsResponse] = await Promise.all([
        fetch('/api/creative-hub/stats'),
        fetch('/api/brand-assets')
      ])
      
      if (creativeHubResponse.ok) {
        const hubStats = await creativeHubResponse.json()
        setCreativeHubStats({
          totalAds: hubStats.totalAds || 0,
          activeDesigners: 3 // Fixed number: AS, KZ, AA
        })
      } else {
        console.error('Failed to fetch Creative Hub stats')
      }

      if (brandAssetsResponse.ok) {
        const brandAssets = await brandAssetsResponse.json()
        setBrandAssetsCount(Array.isArray(brandAssets) ? brandAssets.length : 0)
      } else {
        console.error('Failed to fetch Brand Assets count')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      title: 'Creative Hub',
      description: 'Analytics dashboard for Creative Hub department ads and designer performance',
      icon: ChartBarIcon,
      color: 'bg-gradient-to-br from-blue-600 to-blue-700',
      stats: [
        { label: 'Total Ads', value: loading ? '...' : creativeHubStats.totalAds.toLocaleString() },
        { label: 'Active Designers', value: loading ? '...' : creativeHubStats.activeDesigners }
      ],
      href: '/dashboard/creative-studio/creative-hub'
    },
    {
      title: 'Brand Assets',
      description: 'Product management with web scraping and competitor research for AI-powered creative context',
      icon: SwatchIcon,
      color: 'bg-gradient-to-br from-purple-600 to-purple-700',
      stats: [
        { label: 'Products', value: loading ? '...' : brandAssetsCount },
        { label: 'Ready for AI', value: loading ? '...' : '✓' }
      ],
      href: '/dashboard/creative-studio/brand-assets'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Creative Studio</h1>
          <p className="text-gray-400">
            Comprehensive analytics and management tools for creative operations and brand assets
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.map((card, index) => {
            const IconComponent = card.icon
            return (
              <div
                key={index}
                onClick={() => router.push(card.href)}
                className="relative bg-gray-900 rounded-lg border border-gray-800 p-6 cursor-pointer hover:bg-gray-800 transition-all duration-200 group overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-200`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon and Title */}
                  <div className="flex items-center mb-4">
                    <div className={`${card.color} p-3 rounded-lg mr-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    {card.stats.map((stat, statIndex) => (
                      <div key={statIndex} className="bg-gray-800 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                        <div className="text-sm text-gray-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="absolute top-6 right-6 text-gray-600 group-hover:text-gray-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* System Status */}
        <div className="mt-12 bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <DocumentTextIcon className="h-5 w-5 mr-2 text-green-400" />
            System Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-gray-300">Creative Hub Analytics</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              <span className="text-gray-300">Brand Assets Management</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              <span className="text-gray-300">AI Integration (Coming Soon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 