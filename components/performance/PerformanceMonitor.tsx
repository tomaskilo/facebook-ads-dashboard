'use client'

import React, { useState, useEffect } from 'react'
import { adsCalculator } from '@/lib/ads-calculations'

interface PerformanceData {
  queryTime: number
  recordsProcessed: number
  cacheHits: number
  cacheMisses: number
  cacheHitRate: number
  averageQueryTime: number
  lastUpdated: string
}

export default function PerformanceMonitor() {
  const [performance, setPerformance] = useState<PerformanceData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updatePerformance = () => {
      const metrics = adsCalculator.getPerformanceMetrics()
      const totalQueries = metrics.cacheHits + metrics.cacheMisses
      
      setPerformance({
        ...metrics,
        cacheHitRate: totalQueries > 0 ? (metrics.cacheHits / totalQueries) * 100 : 0,
        averageQueryTime: metrics.recordsProcessed > 0 ? metrics.queryTime / metrics.recordsProcessed : 0,
        lastUpdated: new Date().toLocaleTimeString()
      })
    }

    // Update immediately
    updatePerformance()

    // Update every 30 seconds
    const interval = setInterval(updatePerformance, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!performance) return null

  const getPerformanceColor = (value: number, thresholds: { good: number; medium: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.medium) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Performance</span>
      </button>

      {/* Performance Panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 min-w-[320px] max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
            <button
              onClick={() => adsCalculator.resetPerformanceMetrics()}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Reset
            </button>
          </div>

          <div className="space-y-3 text-sm">
            {/* Cache Performance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Cache Performance</span>
                <div className={`text-lg font-bold ${getPerformanceColor(performance.cacheHitRate, { good: 80, medium: 60 })}`}>
                  {performance.cacheHitRate.toFixed(1)}%
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span className="text-green-600">● Hits:</span> {performance.cacheHits}
                </div>
                <div>
                  <span className="text-red-600">● Misses:</span> {performance.cacheMisses}
                </div>
              </div>
            </div>

            {/* Query Performance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Query Performance</span>
                <div className={`text-lg font-bold ${getPerformanceColor(5000 - performance.queryTime, { good: 4000, medium: 2000 })}`}>
                  {formatTime(performance.queryTime)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  <span>Records:</span> {formatNumber(performance.recordsProcessed)}
                </div>
                <div>
                  <span>Avg Time:</span> {formatTime(performance.averageQueryTime)}
                </div>
              </div>
            </div>

            {/* Optimization Status */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Optimizations</span>
                <div className="text-xs text-green-600 font-medium">ACTIVE</div>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>✅ Aggressive Caching (15min TTL)</div>
                <div>✅ Incremental Loading</div>
                <div>✅ Query Deduplication</div>
                <div>✅ Recent Data Priority</div>
              </div>
            </div>

            {/* Real-time Status */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">Last Updated</span>
              <span className="text-xs text-gray-700 font-medium">{performance.lastUpdated}</span>
            </div>
          </div>

          {/* Performance Tips */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <details className="text-xs">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                Optimization Tips
              </summary>
              <div className="mt-2 space-y-1 text-gray-600">
                <div>• Cache hit rate {'>'} 80% = Excellent</div>
                <div>• Query time {'<'} 2s = Good performance</div>
                <div>• Run SQL optimization script for indexes</div>
                <div>• Recent data loads 3-5x faster</div>
              </div>
            </details>
          </div>
        </div>
      )}
    </div>
  )
} 