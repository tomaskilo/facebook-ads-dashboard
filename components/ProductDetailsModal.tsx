'use client'

import React from 'react'
import { XMarkIcon, GlobeAltIcon, TagIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline'

interface BrandAsset {
  id: number
  name: string
  website_url?: string
  description?: string
  product_category?: string
  market_segment?: string
  created_at: string
  scraped_data?: {
    title?: string
    description?: string
    metaDescription?: string
    keywords?: string[]
    features?: string[]
    benefits?: string[]
    pricing?: string[]
    error?: string
  }
  ai_analysis?: any
  competitors?: string[]
}

interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  product: BrandAsset | null
}

export default function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
  if (!isOpen || !product) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Extract scraped data from the JSON field
  const scrapedData = product.scraped_data || {}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{product.name}</h2>
            <p className="text-gray-400 text-sm">Created on {formatDate(product.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <TagIcon className="h-5 w-5 mr-2" />
                Basic Information
              </h3>
              
              {product.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <p className="text-gray-300">{product.description}</p>
                </div>
              )}

              {product.product_category && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <span className="inline-block px-3 py-1 bg-blue-600 bg-opacity-20 text-blue-400 rounded-full text-sm">
                    {product.product_category}
                  </span>
                </div>
              )}

              {product.market_segment && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Market Segment</label>
                  <span className="inline-block px-3 py-1 bg-purple-600 bg-opacity-20 text-purple-400 rounded-full text-sm">
                    {product.market_segment}
                  </span>
                </div>
              )}

              {product.website_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Website</label>
                  <a 
                    href={product.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <GlobeAltIcon className="h-4 w-4 mr-2" />
                    {product.website_url}
                  </a>
                </div>
              )}
            </div>

            {/* Scraped Data */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                Scraped Data
              </h3>

              {scrapedData.title && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Page Title</label>
                  <p className="text-gray-300">{scrapedData.title}</p>
                </div>
              )}

              {(scrapedData.description || scrapedData.metaDescription) && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Meta Description</label>
                  <p className="text-gray-300">{scrapedData.description || scrapedData.metaDescription}</p>
                </div>
              )}

              {scrapedData.keywords && scrapedData.keywords.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Keywords</label>
                  <p className="text-gray-300">{scrapedData.keywords.join(', ')}</p>
                </div>
              )}

              {scrapedData.pricing && scrapedData.pricing.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Pricing</label>
                  <p className="text-green-400 font-medium">{scrapedData.pricing.join(', ')}</p>
                </div>
              )}

              {scrapedData.benefits && scrapedData.benefits.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Benefits</label>
                  <div className="space-y-1">
                    {scrapedData.benefits.map((benefit, index) => (
                      <p key={index} className="text-gray-300 text-sm">• {benefit}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          {scrapedData.features && scrapedData.features.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center mb-3">
                <StarIcon className="h-5 w-5 mr-2" />
                Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {scrapedData.features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitors */}
          {product.competitors && product.competitors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center mb-3">
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Competitors
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.competitors.map((competitor, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-red-600 bg-opacity-20 text-red-400 rounded-full text-sm"
                  >
                    {competitor}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {product.ai_analysis && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">AI Analysis</h3>
              <div className="bg-dark-700 rounded-lg p-4">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap">
                  {typeof product.ai_analysis === 'string' 
                    ? product.ai_analysis 
                    : JSON.stringify(product.ai_analysis, null, 2)
                  }
                </pre>
              </div>
            </div>
          )}

          {/* Show error if scraping failed */}
          {scrapedData.error && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Scraping Error</h3>
              <p className="text-red-300 text-sm">{scrapedData.error}</p>
            </div>
          )}

          {/* No additional data message */}
          {!scrapedData.title && !scrapedData.description && !scrapedData.features && !product.competitors && !product.ai_analysis && !scrapedData.error && (
            <div className="text-center py-8">
              <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No additional data scraped yet.</p>
              <p className="text-sm text-gray-500">Enable web scraping when adding products to see more details.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-dark-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
} 