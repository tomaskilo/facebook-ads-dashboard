'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { PlusIcon, GlobeAltIcon, XMarkIcon } from '@heroicons/react/24/outline'
import ProductDetailsModal from '@/components/ProductDetailsModal'

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

export default function BrandAssetsPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<BrandAsset | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    description: '',
    product_category: '',
    market_segment: '',
    scrape_website: false
  })

  useEffect(() => {
    fetchBrandAssets()
  }, [])

  const fetchBrandAssets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/brand-assets')
      if (response.ok) {
        const assets = await response.json()
        setBrandAssets(assets)
      } else {
        console.error('Failed to fetch brand assets')
      }
    } catch (error) {
      console.error('Error fetching brand assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Product name is required')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch('/api/brand-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const newAsset = await response.json()
        setBrandAssets(prev => [newAsset, ...prev])
        
        // Reset form
        setFormData({
          name: '',
          website_url: '',
          description: '',
          product_category: '',
          market_segment: '',
          scrape_website: false
        })
        setShowAddForm(false)
        
        alert('Product added successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to add product'}`)
      }
    } catch (error) {
      console.error('Error creating brand asset:', error)
      alert('Error adding product. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      setDeleting(id)
      const response = await fetch(`/api/brand-assets?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setBrandAssets(prev => prev.filter(asset => asset.id !== id))
        alert('Product deleted successfully!')
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to delete product'}`)
      }
    } catch (error) {
      console.error('Error deleting brand asset:', error)
      alert('Error deleting product. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleProductClick = (product: BrandAsset) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Brand Assets</h1>
          <p className="text-gray-400">
            Manage product information, web scraping, and competitor research
          </p>
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <div className="text-sm text-gray-400">
              👤 {session.user?.name}
            </div>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <div className="dashboard-card">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Product</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e: any) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter product name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website URL
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e: any) => handleInputChange('website_url', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Category
                </label>
                <input
                  type="text"
                  value={formData.product_category}
                  onChange={(e: any) => handleInputChange('product_category', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Health & Wellness"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Market Segment
                </label>
                <input
                  type="text"
                  value={formData.market_segment}
                  onChange={(e: any) => handleInputChange('market_segment', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Digestive Health"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e: any) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-dark-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of the product..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="scrape_website"
                checked={formData.scrape_website}
                onChange={(e: any) => handleInputChange('scrape_website', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="scrape_website" className="text-sm text-gray-300">
                Automatically scrape website for product information and competitor research
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={submitting}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brand Assets List */}
      {brandAssets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {brandAssets.map((asset) => (
            <div 
              key={asset.id} 
              className="dashboard-card hover:bg-dark-750 transition-colors cursor-pointer relative group"
              onClick={() => handleProductClick(asset)}
            >
              {/* Delete Button */}
              <button
                onClick={(e: any) => {
                  e.stopPropagation()
                  handleDelete(asset.id, asset.name)
                }}
                disabled={deleting === asset.id}
                className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Delete product"
              >
                {deleting === asset.id ? (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XMarkIcon className="h-4 w-4" />
                )}
              </button>

              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-white pr-8">{asset.name}</h3>
              </div>

              <div className="space-y-3">
                {asset.description && (
                  <p className="text-gray-300 text-sm line-clamp-2">{asset.description}</p>
                )}

                {asset.website_url && (
                  <div className="flex items-center gap-2">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-blue-400 hover:text-blue-300 text-sm truncate">
                      {asset.website_url}
                    </span>
                  </div>
                )}

                {asset.product_category && (
                  <div className="text-xs">
                    <span className="text-gray-400">Category:</span>
                    <p className="text-white">{asset.product_category}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                  Created: {new Date(asset.created_at).toLocaleDateString()}
                </div>

                {/* Indicators for additional data */}
                <div className="flex flex-wrap gap-1 pt-2">
                  {asset.scraped_data && (asset.scraped_data.title || asset.scraped_data.description || asset.scraped_data.features) && (
                    <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 rounded text-xs">
                      Scraped
                    </span>
                  )}
                  {asset.competitors && asset.competitors.length > 0 && (
                    <span className="px-2 py-1 bg-red-600 bg-opacity-20 text-red-400 rounded text-xs">
                      Competitors
                    </span>
                  )}
                  {asset.ai_analysis && (
                    <span className="px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-400 rounded text-xs">
                      AI Analysis
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {brandAssets.length === 0 && (
        <div className="dashboard-card text-center py-12">
          <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Brand Assets Yet</h3>
          <p className="text-gray-400 mb-4">
            Start by adding your first product to analyze its brand positioning and competitors.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Your First Product
          </button>
        </div>
      )}

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="dashboard-card">
          <h4 className="font-semibold text-white mb-2">🌐 Web Scraping</h4>
          <p className="text-gray-400 text-sm">
            Automatically extract product information, benefits, features, and pricing from websites.
          </p>
        </div>
        <div className="dashboard-card">
          <h4 className="font-semibold text-white mb-2">🔍 Competitor Research</h4>
          <p className="text-gray-400 text-sm">
            Discover competitors in the same niche and analyze their positioning and features.
          </p>
        </div>
        <div className="dashboard-card">
          <h4 className="font-semibold text-white mb-2">🤖 AI Analysis</h4>
          <p className="text-gray-400 text-sm">
            Get AI-powered insights on market positioning and competitive advantages.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-white mb-4">Getting Started</h3>
        <div className="space-y-3 text-gray-300">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
            <div>
              <p className="font-medium">Add a Product</p>
              <p className="text-gray-400 text-sm">Create a new brand asset with basic information</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
            <div>
              <p className="font-medium">Enable Web Scraping</p>
              <p className="text-gray-400 text-sm">Automatically extract product details from the website</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
            <div>
              <p className="font-medium">Research Competitors</p>
              <p className="text-gray-400 text-sm">Discover and analyze competitors in the same market</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold">4</span>
            <div>
              <p className="font-medium">AI Context for Creative Studio</p>
              <p className="text-gray-400 text-sm">Use the collected data to inform AI-powered creative decisions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        product={selectedProduct}
      />

    </div>
  )
} 