'use client'

import React, { useState, useEffect } from 'react'
import { PlusIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import DesignerPerformanceChart from './DesignerPerformanceChart'

interface Designer {
  id: number
  name: string
  surname: string
  initials: string
  product: string
  created_at: string
}

interface DesignerPerformance {
  week: string
  totalAds: number
  videoAds: number
  imageAds: number
  scaledAds: number
  totalSpend: number
}

export default function DesignerAnalytics() {
  const [designers, setDesigners] = useState<Designer[]>([])
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null)
  const [designerPerformance, setDesignerPerformance] = useState<DesignerPerformance[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    initials: ''
  })
  const [formError, setFormError] = useState('')

  // Fetch designers on component mount
  useEffect(() => {
    fetchDesigners()
  }, [])

  const fetchDesigners = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/colonbroom/designers')
      if (response.ok) {
        const data = await response.json()
        setDesigners(data.designers || [])
      }
    } catch (error) {
      console.error('Error fetching designers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDesignerPerformance = async (initials: string) => {
    try {
      setPerformanceLoading(true)
      const response = await fetch(`/api/colonbroom/designer-performance/${initials}`)
      if (response.ok) {
        const data = await response.json()
        setDesignerPerformance(data.designerPerformance || [])
      }
    } catch (error) {
      console.error('Error fetching designer performance:', error)
      setDesignerPerformance([])
    } finally {
      setPerformanceLoading(false)
    }
  }

  const handleAddDesigner = async (e: any) => {
    e.preventDefault()
    setFormError('')

    if (!formData.name.trim() || !formData.surname.trim() || !formData.initials.trim()) {
      setFormError('All fields are required')
      return
    }

    if (formData.initials.length > 10) {
      setFormError('Initials must be 10 characters or less')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/colonbroom/designers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setDesigners(prev => [...prev, data.designer])
        setFormData({ name: '', surname: '', initials: '' })
        setShowAddForm(false)
      } else {
        const errorData = await response.json()
        setFormError(errorData.error || 'Failed to add designer')
      }
    } catch (error) {
      setFormError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDesignerSelect = (designer: Designer) => {
    setSelectedDesigner(designer)
    setCurrentPage(1) // Reset pagination when selecting new designer
    fetchDesignerPerformance(designer.initials)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const totalStats = designerPerformance.reduce(
    (acc, week) => ({
      totalAds: acc.totalAds + week.totalAds,
      videoAds: acc.videoAds + week.videoAds,
      imageAds: acc.imageAds + week.imageAds,
      scaledAds: acc.scaledAds + week.scaledAds,
      totalSpend: acc.totalSpend + week.totalSpend,
    }),
    { totalAds: 0, videoAds: 0, imageAds: 0, scaledAds: 0, totalSpend: 0 }
  )

  // Sort and paginate performance data (latest weeks first)
  const sortedPerformanceData = [...designerPerformance].sort((a, b) => {
    const getWeekNumber = (week: string) => parseInt(week.replace('W', ''))
    return getWeekNumber(b.week) - getWeekNumber(a.week)
  })

  const totalPages = Math.ceil(sortedPerformanceData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPerformanceData = sortedPerformanceData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Designer Analytics</h2>
          <p className="text-gray-400 text-sm">Track individual designer performance and ad creation statistics</p>
        </div>
      </div>

      {/* Main Layout - Left Sidebar + Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Designer Management */}
        <div className="lg:col-span-1 space-y-4">
          {/* Add Designer Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Designer
          </button>

          {/* Add Designer Form */}
          {showAddForm && (
            <div className="dashboard-card p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Add New Designer</h3>
              <form onSubmit={handleAddDesigner} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Tomas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Surname</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, surname: e.target.value }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Vytas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Initials</label>
                  <input
                    type="text"
                    value={formData.initials}
                    onChange={(e: any) => setFormData(prev => ({ ...prev, initials: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="TV"
                    maxLength={10}
                  />
                </div>
                {formError && (
                  <p className="text-red-400 text-sm">{formError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormError('')
                      setFormData({ name: '', surname: '', initials: '' })
                    }}
                    className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Designer List */}
          <div className="dashboard-card p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Designers</h3>
            {loading ? (
              <p className="text-gray-400 text-sm">Loading...</p>
            ) : designers.length === 0 ? (
              <p className="text-gray-400 text-sm">No designers found. Add one to get started.</p>
            ) : (
              <div className="space-y-2">
                {designers.map((designer) => (
                  <button
                    key={designer.id}
                    onClick={() => handleDesignerSelect(designer)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      selectedDesigner?.id === designer.id
                        ? 'border-blue-500 bg-blue-600 bg-opacity-10'
                        : 'border-dark-600 bg-dark-700 hover:bg-dark-650'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-white text-sm truncate">
                        {designer.name} {designer.surname}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs">Initials: {designer.initials}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Content - Performance Area */}
        <div className="lg:col-span-3">
          {selectedDesigner ? (
            <div className="dashboard-card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Performance: {selectedDesigner.name} {selectedDesigner.surname} ({selectedDesigner.initials})
                </h3>
                <div className="flex items-center gap-3">
                  {performanceLoading && (
                    <div className="text-gray-400 text-sm">Loading performance...</div>
                  )}
                  {designerPerformance.length > 0 && (
                    <button
                      onClick={() => setShowChart(!showChart)}
                      className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors"
                    >
                      {showChart ? 'Show Table' : 'Show Chart'}
                    </button>
                  )}
                </div>
              </div>

              {performanceLoading ? (
                <div className="text-center py-8 text-gray-400">
                  <ChartBarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Loading designer performance...</p>
                </div>
              ) : designerPerformance.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No ads found for designer {selectedDesigner.initials}</p>
                  <p className="text-sm mt-1">Ads must contain _{selectedDesigner.initials}_ in the name</p>
                </div>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Total Ads</p>
                      <p className="text-white text-lg font-bold">{totalStats.totalAds}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Video Ads</p>
                      <p className="text-purple-400 text-lg font-bold">{totalStats.videoAds}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Image Ads</p>
                      <p className="text-orange-400 text-lg font-bold">{totalStats.imageAds}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Scaled Ads</p>
                      <p className="text-green-400 text-lg font-bold">{totalStats.scaledAds}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Total Spend</p>
                      <p className="text-blue-400 text-lg font-bold">{formatCurrency(totalStats.totalSpend)}</p>
                    </div>
                  </div>

                  {!showChart ? (
                    <>
                      {/* Weekly Performance Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-dark-700">
                              <th className="text-left py-3 text-gray-400">Week</th>
                              <th className="text-left py-3 text-gray-400">Total Ads</th>
                              <th className="text-left py-3 text-gray-400">Video</th>
                              <th className="text-left py-3 text-gray-400">Image</th>
                              <th className="text-left py-3 text-gray-400">Scaled</th>
                              <th className="text-left py-3 text-gray-400">Spend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedPerformanceData.map((week, index) => (
                              <tr key={index} className="border-b border-dark-700">
                                <td className="py-3 text-white font-medium">{week.week}</td>
                                <td className="py-3 text-white">{week.totalAds}</td>
                                <td className="py-3 text-purple-400">{week.videoAds}</td>
                                <td className="py-3 text-orange-400">{week.imageAds}</td>
                                <td className="py-3 text-green-400">{week.scaledAds}</td>
                                <td className="py-3 text-blue-400">{formatCurrency(week.totalSpend)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {designerPerformance.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-400">
                            Showing {startIndex + 1}-{Math.min(endIndex, sortedPerformanceData.length)} of {sortedPerformanceData.length} weeks
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 rounded-md text-sm transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-dark-700 border border-dark-600 text-white hover:bg-dark-600'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                            
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white text-sm hover:bg-dark-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Chart View */
                    <div>
                      <DesignerPerformanceChart data={designerPerformance} />
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="dashboard-card p-8 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Select a Designer</h3>
              <p className="text-gray-400">Choose a designer from the left panel to view their performance analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 