'use client'

import React, { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { 
  GlobeAltIcon,
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  CogIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface ExtractedData {
  // Basic Information
  productName: string
  description: string
  industry: string
  brandColor: string
  
  // Marketing Information  
  uniqueSellingPoints: string[]
  benefits: string[]
  painPoints: string[]
  targetAudience: string[]
  
  // Product Features
  keyFeatures: string[]
  ctaOffers: string[]
  toneOfVoice: string
  additionalContext: string
  
  // Technical Details
  pricing: string[]
  competitors: string[]
  category: string
  
  // Meta Information
  metaTitle: string
  metaDescription: string
  images: string[]
  logos: string[]
}

interface UploadedAsset {
  id: string
  name: string
  type: 'image' | 'logo' | 'document'
  url: string
  uploadedAt: Date
}

export default function BrandAssetsPage() {
  const { data: session } = useSession()
  
  // Main state
  const [activeTab, setActiveTab] = useState('crawler')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([])
  
  // Edit states for extracted data
  const [editableData, setEditableData] = useState<ExtractedData | null>(null)
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const tabs = [
    { id: 'crawler', name: 'Web Crawler', icon: GlobeAltIcon },
    { id: 'product-info', name: 'Product Info', icon: DocumentTextIcon },
    { id: 'marketing', name: 'Marketing Insights', icon: SparklesIcon },
    { id: 'features', name: 'Features & CTAs', icon: CogIcon },
    { id: 'assets', name: 'Assets Library', icon: PhotoIcon },
  ]
  
  const handleCrawlWebsite = async () => {
    if (!websiteUrl.trim()) {
      setError('Please enter a valid website URL')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🕷️ Starting website crawl...')
      
      const response = await fetch('/api/brand-assets/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: websiteUrl }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to crawl website')
      }
      
      console.log('✅ Crawl completed successfully')
      setExtractedData(result.data)
      setEditableData(result.data)
      setActiveTab('product-info')
      
    } catch (err) {
      console.error('❌ Crawl error:', err)
      setError(err instanceof Error ? err.message : 'Failed to crawl website')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileUpload = (event: any) => {
    const files = event.target.files
    if (!files) return
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const reader = new FileReader()
      reader.onload = (e: any) => {
        const newAsset: UploadedAsset = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: e.target?.result as string,
          uploadedAt: new Date()
        }
        
        setUploadedAssets(prev => [...prev, newAsset])
      }
      reader.readAsDataURL(file)
    }
  }
  
  const updateEditableData = (field: keyof ExtractedData, value: any) => {
    if (!editableData) return
    setEditableData({
      ...editableData,
      [field]: value
    })
  }
  
  const addListItem = (field: keyof ExtractedData, item: string) => {
    if (!editableData || !item.trim()) return
    const currentList = editableData[field] as string[]
    updateEditableData(field, [...currentList, item.trim()])
  }
  
  const removeListItem = (field: keyof ExtractedData, index: number) => {
    if (!editableData) return
    const currentList = editableData[field] as string[]
    updateEditableData(field, currentList.filter((_, i) => i !== index))
  }
  
  const generateInitials = (productName: string): string => {
    return productName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3)
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'crawler':
        return (
          <div className="space-y-6">
            <div className="text-center py-8">
              <GlobeAltIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">AI-Powered Web Crawler</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Enter any product website URL and our AI will automatically extract comprehensive 
                product information, marketing insights, features, and brand assets.
              </p>
            </div>
            
            <div className="max-w-xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e: any) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleCrawlWebsite}
                  disabled={isLoading || !websiteUrl.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Crawling...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-5 w-5" />
                      Extract Data
                    </>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-900/20 border border-red-900 rounded-lg flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400">{error}</span>
                </div>
              )}
              
              {extractedData && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-900 rounded-lg flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-400">
                    Successfully extracted data for: <strong>{extractedData.productName}</strong>
                  </span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-6">
                <DocumentTextIcon className="h-8 w-8 text-blue-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">Product Information</h4>
                <p className="text-gray-400 text-sm">Name, description, industry, brand colors, and basic details</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-xl p-6">
                <SparklesIcon className="h-8 w-8 text-purple-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">Marketing Insights</h4>
                <p className="text-gray-400 text-sm">USPs, benefits, pain points, target audience analysis</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-xl p-6">
                <CogIcon className="h-8 w-8 text-green-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">Features & CTAs</h4>
                <p className="text-gray-400 text-sm">Key features, call-to-actions, tone of voice</p>
              </div>
              
              <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/20 border border-amber-700/50 rounded-xl p-6">
                <PhotoIcon className="h-8 w-8 text-amber-400 mb-3" />
                <h4 className="font-semibold text-white mb-2">Visual Assets</h4>
                <p className="text-gray-400 text-sm">Images, logos, and uploadable brand assets</p>
              </div>
            </div>
          </div>
        )
        
      case 'product-info':
        if (!editableData) {
          return <div className="text-center text-gray-400 py-12">No data available. Please crawl a website first.</div>
        }
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
                <input
                  type="text"
                  value={editableData.productName}
                  onChange={(e: any) => updateEditableData('productName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Product Initials */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Product Initials</label>
                <input
                  type="text"
                  value={generateInitials(editableData.productName)}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300"
                />
              </div>
              
              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
                <select
                  value={editableData.industry}
                  onChange={(e: any) => updateEditableData('industry', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Health">Health & Wellness</option>
                  <option value="Ecommerce">Ecommerce</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Beauty">Beauty & Cosmetics</option>
                  <option value="Food">Food & Nutrition</option>
                  <option value="General">General</option>
                </select>
              </div>
              
              {/* Brand Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Brand Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={editableData.brandColor}
                    onChange={(e: any) => updateEditableData('brandColor', e.target.value)}
                    className="w-16 h-12 rounded-lg border border-gray-700 bg-gray-800"
                  />
                  <input
                    type="text"
                    value={editableData.brandColor}
                    onChange={(e: any) => updateEditableData('brandColor', e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Description</label>
              <textarea
                value={editableData.description}
                onChange={(e: any) => updateEditableData('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Additional Context</label>
              <textarea
                value={editableData.additionalContext}
                onChange={(e: any) => updateEditableData('additionalContext', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional brand guidelines, context, or notes..."
              />
            </div>
          </div>
        )
        
      case 'marketing':
        if (!editableData) {
          return <div className="text-center text-gray-400 py-12">No data available. Please crawl a website first.</div>
        }
        
        return (
          <div className="space-y-8">
            {/* USPs */}
            <EditableList
              title="Unique Selling Points"
              items={editableData.uniqueSellingPoints}
              onAdd={(item) => addListItem('uniqueSellingPoints', item)}
              onRemove={(index) => removeListItem('uniqueSellingPoints', index)}
              placeholder="Add a unique selling point..."
              color="blue"
            />
            
            {/* Benefits */}
            <EditableList
              title="Customer Benefits"
              items={editableData.benefits}
              onAdd={(item) => addListItem('benefits', item)}
              onRemove={(index) => removeListItem('benefits', index)}
              placeholder="Add a customer benefit..."
              color="green"
            />
            
            {/* Pain Points */}
            <EditableList
              title="Customer Pain Points"
              items={editableData.painPoints}
              onAdd={(item) => addListItem('painPoints', item)}
              onRemove={(index) => removeListItem('painPoints', index)}
              placeholder="Add a customer pain point..."
              color="red"
            />
            
            {/* Target Audience */}
            <EditableList
              title="Target Audience"
              items={editableData.targetAudience}
              onAdd={(item) => addListItem('targetAudience', item)}
              onRemove={(index) => removeListItem('targetAudience', index)}
              placeholder="Add target audience description..."
              color="purple"
            />
            
            {/* Tone of Voice */}
            <div>
              <label className="block text-lg font-semibold text-white mb-4">Tone of Voice</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {['Professional', 'Friendly', 'Urgent', 'Scientific', 'Casual', 'Luxury'].map(tone => (
                  <button
                    key={tone}
                    onClick={() => updateEditableData('toneOfVoice', tone)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      editableData.toneOfVoice === tone
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 'features':
        if (!editableData) {
          return <div className="text-center text-gray-400 py-12">No data available. Please crawl a website first.</div>
        }
        
        return (
          <div className="space-y-8">
            {/* Key Features */}
            <EditableList
              title="Key Features"
              items={editableData.keyFeatures}
              onAdd={(item) => addListItem('keyFeatures', item)}
              onRemove={(index) => removeListItem('keyFeatures', index)}
              placeholder="Add a key feature..."
              color="blue"
            />
            
            {/* CTAs and Offers */}
            <EditableList
              title="Call-to-Actions & Offers"
              items={editableData.ctaOffers}
              onAdd={(item) => addListItem('ctaOffers', item)}
              onRemove={(index) => removeListItem('ctaOffers', index)}
              placeholder="Add a CTA or offer..."
              color="orange"
            />
            
            {/* Pricing Information */}
            <EditableList
              title="Pricing Information"
              items={editableData.pricing}
              onAdd={(item) => addListItem('pricing', item)}
              onRemove={(index) => removeListItem('pricing', index)}
              placeholder="Add pricing information..."
              color="green"
            />
          </div>
        )
        
      case 'assets':
        return (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center">
              <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Upload Brand Assets</h3>
              <p className="text-gray-400 mb-4">Upload logos, product images, or brand guidelines</p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Choose Files
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            {/* Extracted Images */}
            {extractedData && extractedData.images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Extracted Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {extractedData.images.map((image, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`Extracted ${index + 1}`}
                        className="w-full h-32 object-cover"
                        onError={(e: any) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <div className="p-2">
                        <p className="text-xs text-gray-400 truncate">Image {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Uploaded Assets */}
            {uploadedAssets.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Uploaded Assets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedAssets.map((asset) => (
                    <div key={asset.id} className="bg-gray-800 rounded-lg p-4 flex items-center gap-3">
                      {asset.type === 'image' ? (
                        <img src={asset.url} alt={asset.name} className="w-12 h-12 object-cover rounded" />
                      ) : (
                        <DocumentTextIcon className="w-12 h-12 text-blue-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{asset.name}</p>
                        <p className="text-gray-400 text-sm">{asset.type}</p>
                      </div>
                      <button
                        onClick={() => setUploadedAssets(prev => prev.filter(a => a.id !== asset.id))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
        
      default:
        return <div>Content for {activeTab}</div>
    }
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Brand Assets</h1>
        <p className="text-gray-400">
          AI-powered product analysis and brand asset management for creative campaigns
        </p>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-800 mb-8">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
        {renderTabContent()}
      </div>
    </div>
  )
}

// Reusable component for editable lists
function EditableList({ 
  title, 
  items, 
  onAdd, 
  onRemove, 
  placeholder, 
  color = 'blue' 
}: {
  title: string
  items: string[]
  onAdd: (item: string) => void
  onRemove: (index: number) => void
  placeholder: string
  color?: string
}) {
  const [newItem, setNewItem] = useState('')
  
  const colorClasses = {
    blue: 'bg-blue-900/20 border-blue-700/50 text-blue-300',
    green: 'bg-green-900/20 border-green-700/50 text-green-300',
    red: 'bg-red-900/20 border-red-700/50 text-red-300',
    purple: 'bg-purple-900/20 border-purple-700/50 text-purple-300',
    orange: 'bg-orange-900/20 border-orange-700/50 text-orange-300'
  }
  
  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem)
      setNewItem('')
    }
  }
  
  return (
    <div>
      <label className="block text-lg font-semibold text-white mb-4">{title}</label>
      
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={newItem}
          onChange={(e: any) => setNewItem(e.target.value)}
          onKeyPress={(e: any) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Add
        </button>
      </div>
      
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-lg border ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
          >
            <span className="flex-1">{item}</span>
            <button
              onClick={() => onRemove(index)}
              className="text-red-400 hover:text-red-300 ml-3"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {title.toLowerCase()} added yet
          </div>
        )}
      </div>
    </div>
  )
} 