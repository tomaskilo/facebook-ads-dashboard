'use client'

import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface DesignerPerformance {
  week: string
  totalAds: number
  videoAds: number
  imageAds: number
  scaledAds: number
  totalSpend: number
}

interface DesignerPerformanceChartProps {
  data: DesignerPerformance[]
}

export default function DesignerPerformanceChart({ data }: DesignerPerformanceChartProps) {
  // Transform data for the chart
  const chartData = data.map((week, index) => ({
    weekNumber: parseInt(week.week.replace('W', '')),
    weekLabel: week.week,
    spend: week.totalSpend,
    videoAds: week.videoAds,
    imageAds: week.imageAds,
    scaledAds: week.scaledAds,
    totalAds: week.totalAds
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{`Week ${data.weekLabel}`}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-gray-300">Spend: ${data.spend.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-gray-300">Video Ads: {data.videoAds}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-gray-300">Image Ads: {data.imageAds}</span>
            </div>
            <div className="text-white font-medium mt-1">
              Total Ads: {data.totalAds}
            </div>
            <div className="text-green-400 font-medium">
              Scaled Ads: {data.scaledAds}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // Format currency for left axis
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return `$${value}`
  }

  // Sort data by week number
  const sortedData = [...chartData].sort((a, b) => a.weekNumber - b.weekNumber)

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
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#374151" 
              opacity={0.3}
            />
            
            {/* Bottom axis - Week numbers */}
            <XAxis 
              dataKey="weekNumber"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => value.toString()}
            />
            
            {/* Left axis - Spend */}
            <YAxis 
              yAxisId="spend"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#60A5FA', fontSize: 11 }}
              tickFormatter={formatCurrency}
            />
            
            {/* Right axis - Ad Count */}
            <YAxis 
              yAxisId="ads"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A78BFA', fontSize: 11 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Stacked bars for ad counts */}
            <Bar 
              yAxisId="ads"
              dataKey="videoAds" 
              stackId="ads"
              fill="#A855F7"
              radius={[0, 0, 0, 0]}
              name="Video Ads"
            />
            <Bar 
              yAxisId="ads"
              dataKey="imageAds" 
              stackId="ads"
              fill="#FB923C"
              radius={[2, 2, 0, 0]}
              name="Image Ads"
            />
            
            {/* Line for spend */}
            <Line
              yAxisId="spend"
              type="monotone"
              dataKey="spend"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ 
                fill: '#3B82F6', 
                strokeWidth: 2, 
                stroke: '#1E293B',
                r: 4 
              }}
              activeDot={{ 
                r: 6, 
                fill: '#3B82F6',
                stroke: '#1E293B',
                strokeWidth: 2
              }}
              name="Spend ($)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend - fixed at bottom */}
      <div className="flex items-center justify-center gap-4 mt-3 text-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded flex-shrink-0"></div>
          <span className="text-gray-300">Spend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded flex-shrink-0"></div>
          <span className="text-gray-300">Video Ads</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded flex-shrink-0"></div>
          <span className="text-gray-300">Image Ads</span>
        </div>
      </div>
    </div>
  )
} 