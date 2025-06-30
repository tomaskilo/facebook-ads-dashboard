'use client'

import { DashboardStats as DashboardStatsType } from '@/types'

interface DashboardStatsProps {
  stats: DashboardStatsType
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
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

  const statCards = [
    {
      label: 'Total Spend',
      value: formatCurrency(stats.totalSpend),
      change: stats.totalSpendChange,
      positive: stats.totalSpendChange > 0
    },
    {
      label: 'ROAS',
      value: `${stats.roas.toFixed(1)}x`,
      change: stats.roasChange,
      positive: stats.roasChange > 0
    },
    {
      label: 'CTR',
      value: `${stats.ctr.toFixed(2)}%`,
      change: stats.ctrChange,
      positive: stats.ctrChange > 0
    },
    {
      label: 'CPC',
      value: formatCurrency(stats.cpc),
      change: stats.cpcChange,
      positive: stats.cpcChange > 0
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => (
        <div key={index} className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
            <div className={`flex items-center text-sm font-medium ${
              stat.positive ? 'text-green-400' : 'text-red-400'
            }`}>
              <span className="mr-1">{stat.positive ? '↗' : '↘'}</span>
              {formatPercentage(Math.abs(stat.change))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 