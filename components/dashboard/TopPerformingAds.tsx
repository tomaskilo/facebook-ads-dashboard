'use client'

export default function TopPerformingAds() {
  const topAds = [
    {
      name: 'CB_TV_IMG_summer_sale_001.png',
      status: 'Active',
      spend: 1250,
      roas: 4.2,
      impressions: 125000
    },
    {
      name: 'CB_MH_VID_testimonial_002.mp4',
      status: 'Active',
      spend: 980,
      roas: 3.8,
      impressions: 89000
    },
    {
      name: 'CB_AC_IMG_before_after_003.png',
      status: 'Paused',
      spend: 750,
      roas: 3.2,
      impressions: 67000
    }
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Top Performing Ads</h2>
        <p className="text-sm text-gray-400">Your best performing ads based on ROAS</p>
        <button className="btn-secondary text-sm">View All</button>
      </div>

      <div className="space-y-4">
        {topAds.map((ad, index) => (
          <div key={index} className="bg-dark-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-white text-sm">{ad.name}</h3>
              </div>
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
                <p className="text-gray-400">Spend:</p>
                <p className="text-white font-medium">{formatCurrency(ad.spend)}</p>
              </div>
              <div>
                <p className="text-gray-400">ROAS:</p>
                <p className="text-green-400 font-medium">{ad.roas}x</p>
              </div>
              <div>
                <p className="text-gray-400">Impressions:</p>
                <p className="text-white font-medium">{formatNumber(ad.impressions)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 