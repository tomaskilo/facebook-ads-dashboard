'use client'

import React from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface CreativeHubWeeklyData {
  week: string
  totalAds: number
  videoAds: number
  imageAds: number
  scaledAds: number
  totalSpend: number
}

interface Props {
  data: CreativeHubWeeklyData[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-700 border border-gray-600 rounded p-3 shadow-lg">
        <p className="text-white font-medium">{`Week: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey === 'totalSpend' 
              ? `Total Spend: $${entry.value?.toLocaleString()}`
              : `${entry.name}: ${entry.value}`
            }
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function CreativeHubPerformanceChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-96 w-full flex items-center justify-center text-gray-400">
        <p>No Creative Hub data available</p>
      </div>
    )
  }

  // Sort data by week
  const sortedData = [...data].sort((a, b) => {
    const weekA = parseInt(a.week.replace('W', ''))
    const weekB = parseInt(b.week.replace('W', ''))
    return weekA - weekB
  })

  return (
    <div className="h-96 w-full flex flex-col">
      {/* Chart container with fixed height */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={sortedData}
            margin={{
              top: 20,
              right: 60,
              bottom: 20,
              left: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="week" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              yAxisId="ads"
              stroke="#9CA3AF"
              fontSize={12}
              label={{ value: 'Ad Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
            />
            <YAxis 
              yAxisId="spend"
              orientation="right"
              stroke="#EF4444"
              fontSize={12}
              label={{ value: 'Spend ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#EF4444' } }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#9CA3AF', fontSize: '12px' }}
            />
            
            {/* Stacked Bars for Ad Types */}
            <Bar 
              yAxisId="ads"
              dataKey="videoAds" 
              stackId="ads"
              fill="#3B82F6" 
              name="Video Ads"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              yAxisId="ads"
              dataKey="imageAds" 
              stackId="ads"
              fill="#8B5CF6" 
              name="Image Ads"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              yAxisId="ads"
              dataKey="scaledAds" 
              fill="#10B981" 
              name="Scaled Ads"
              radius={[2, 2, 0, 0]}
            />
            
            {/* Line for Total Spend */}
            <Line 
              yAxisId="spend"
              type="monotone" 
              dataKey="totalSpend" 
              stroke="#EF4444" 
              strokeWidth={3}
              dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
              name="Total Spend"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
} 