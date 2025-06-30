'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'

interface ScaledAd {
  ad_name: string
  total_spend: number
  impressions: number
  days_running: number
  creative_type: string
  creative_hub: boolean
  aspect_ratio: string
  roas: number
  status: string
  week_number: string
  first_ad_spend_date: string
  last_ad_spend_date: string
}

interface ScaledAdsTooltipProps {
  isOpen: boolean
  onClose: () => void
  onCountChange: (newCount: number) => void
  selectedWeek?: string // Optional week filter
}

export default function ScaledAdsTooltip({ isOpen, onClose, onCountChange, selectedWeek }: ScaledAdsTooltipProps) {
  const [scaledAds, setScaledAds] = useState<ScaledAd[]>([])
  const [excludedAds, setExcludedAds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchScaledAds()
      // Reset exclusions when opening
      setExcludedAds(new Set())
    }
  }, [isOpen, selectedWeek])

  useEffect(() => {
    // Update parent component with new count when exclusions change
    const activeCount = scaledAds.length - excludedAds.size
    onCountChange(activeCount)
  }, [excludedAds, scaledAds, onCountChange])

  const fetchScaledAds = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Use week-specific endpoint if selectedWeek is provided, otherwise use general endpoint
      const endpoint = selectedWeek 
        ? `/api/colonbroom/scaled-ads/${selectedWeek}`
        : '/api/colonbroom/scaled-ads'
      
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error('Failed to fetch scaled ads')
      }
      
      const data = await response.json()
      setScaledAds(data.scaledAds)
    } catch (err: any) {
      setError(err.message || 'Failed to load scaled ads')
    } finally {
      setLoading(false)
    }
  }

  const toggleAdExclusion = (adName: string) => {
    const newExcluded = new Set(excludedAds)
    if (newExcluded.has(adName)) {
      newExcluded.delete(adName)
    } else {
      newExcluded.add(adName)
    }
    setExcludedAds(newExcluded)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full bg-slate-800 rounded-lg shadow-lg max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">
                Scaled Ads Details {selectedWeek && `- Week ${selectedWeek}`}
              </Dialog.Title>
              <p className="text-sm text-gray-400 mt-1">
                Ads with total spend {'>'} $1,000 • {scaledAds.length - excludedAds.size} of {scaledAds.length} included
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-400">{error}</p>
                <button 
                  onClick={fetchScaledAds}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-3">
                {scaledAds.map((ad, index) => {
                  const isExcluded = excludedAds.has(ad.ad_name)
                  
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 transition-all ${
                        isExcluded 
                          ? 'border-gray-600 bg-slate-900 opacity-50' 
                          : 'border-slate-600 bg-slate-700 hover:bg-slate-650'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-3 mb-2">
                            <button
                              onClick={() => toggleAdExclusion(ad.ad_name)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isExcluded
                                  ? 'border-gray-500 bg-gray-500'
                                  : 'border-blue-500 bg-blue-500'
                              }`}
                            >
                              {!isExcluded && <CheckIcon className="w-3 h-3 text-white" />}
                            </button>
                            
                            <h3 className={`font-medium text-sm break-all ${
                              isExcluded ? 'text-gray-400' : 'text-white'
                            }`}>
                              {ad.ad_name}
                            </h3>
                            
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              ad.status === 'Active' 
                                ? 'bg-green-600 bg-opacity-20 text-green-400'
                                : 'bg-gray-600 bg-opacity-20 text-gray-400'
                            }`}>
                              {ad.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400">Total Spend:</p>
                              <p className={`font-medium ${isExcluded ? 'text-gray-400' : 'text-white'}`}>
                                {formatCurrency(ad.total_spend)}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-gray-400">Impressions:</p>
                              <p className={`font-medium ${isExcluded ? 'text-gray-400' : 'text-white'}`}>
                                {formatNumber(ad.impressions)}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-gray-400">Days Running:</p>
                              <p className={`font-medium ${isExcluded ? 'text-gray-400' : 'text-white'}`}>
                                {ad.days_running}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              isExcluded ? 'bg-gray-700 text-gray-400' : 'bg-blue-600 bg-opacity-20 text-blue-400'
                            }`}>
                              {ad.creative_type}
                            </span>
                            
                            {ad.aspect_ratio && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                isExcluded ? 'bg-gray-700 text-gray-400' : 'bg-purple-600 bg-opacity-20 text-purple-400'
                              }`}>
                                {ad.aspect_ratio}
                              </span>
                            )}
                            
                            {ad.creative_hub && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                isExcluded ? 'bg-gray-700 text-gray-400' : 'bg-orange-600 bg-opacity-20 text-orange-400'
                              }`}>
                                Creative Hub
                              </span>
                            )}
                            
                            {selectedWeek && (
                              <span className={`px-2 py-1 rounded text-xs ${
                                isExcluded ? 'bg-gray-700 text-gray-400' : 'bg-gray-600 bg-opacity-20 text-gray-300'
                              }`}>
                                Week: {ad.week_number}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {scaledAds.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No scaled ads found{selectedWeek ? ` for week ${selectedWeek}` : ''}. Upload data to see ads with {'>'} $1,000 spend.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-700 p-4 bg-slate-750">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Click checkboxes to include/exclude ads from the scaled ads count
              </div>
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 