'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, GlobeAltIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function ProductAssetsPage() {
  const { data: session } = useSession()
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false)
  const [website, setWebsite] = useState('')
  const [productId, setProductId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const [error, setError] = useState('')

  const handleAnalyzeWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnalyzing(true)
    setError('')

    try {
      const response = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, website }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze product')
      }

      setAnalysis(data.analysis)
      setIsAnalyzeModalOpen(false)
      setWebsite('')
      setProductId('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Product Assets</h1>
          <p className="text-gray-400">
            Analyze product websites with AI to extract insights and find competitors
          </p>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <button
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="btn-primary flex items-center"
          >
            <GlobeAltIcon className="w-5 h-5 mr-2" />
            Analyze Product Website
          </button>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Website Analysis */}
            <div className="dashboard-card">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <GlobeAltIcon className="w-6 h-6 mr-2" />
                Website Analysis
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">Category</h3>
                  <p className="text-gray-300">{analysis.websiteAnalysis?.category}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">Target Audience</h3>
                  <p className="text-gray-300">{analysis.websiteAnalysis?.targetAudience}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">Value Propositions</h3>
                  <ul className="text-gray-300 space-y-1">
                    {analysis.websiteAnalysis?.valuePropositions?.map((prop: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{prop}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">Creative Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.websiteAnalysis?.creativeThemes?.map((theme: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-600 bg-opacity-20 text-primary-400 rounded-full text-sm"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Analysis */}
            <div className="dashboard-card">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <MagnifyingGlassIcon className="w-6 h-6 mr-2" />
                Competitor Analysis
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white mb-2">Direct Competitors</h3>
                  <ul className="text-gray-300 space-y-1">
                    {analysis.competitorAnalysis?.directCompetitors?.map((comp: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">Market Positioning</h3>
                  <p className="text-gray-300">{analysis.competitorAnalysis?.marketPositioning}</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white mb-2">Marketing Approaches</h3>
                  <ul className="text-gray-300 space-y-1">
                    {analysis.competitorAnalysis?.marketingApproaches?.map((approach: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{approach}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!analysis && (
          <div className="text-center py-12">
            <GlobeAltIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Analysis Yet</h3>
            <p className="text-gray-400">
              Click "Analyze Product Website" to get AI-powered insights about any product
            </p>
          </div>
        )}
      </div>

      {/* Analyze Website Modal */}
      <Dialog open={isAnalyzeModalOpen} onClose={() => setIsAnalyzeModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md w-full bg-dark-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-white">
                Analyze Product Website
              </Dialog.Title>
              <button
                onClick={() => setIsAnalyzeModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 px-4 py-2 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleAnalyzeWebsite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Product ID
                </label>
                <input
                  type="text"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter product ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={analyzing}
                className="w-full btn-primary disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Website'}
              </button>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
} 