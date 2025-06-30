'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { CSVUploadData } from '@/types'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [step, setStep] = useState(1)
  const [productData, setProductData] = useState({
    name: '',
    category: '',
    website: '',
    namingConvention: ''
  })
  const [csvData, setCsvData] = useState<CSVUploadData[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    'E-Commerce',
    'E-com Accelerator', 
    'WMA',
    'Go Health'
  ]

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) {
        setCsvFileName(file.name)
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const data = results.data as any[]
            const processedData = data.map((row, index) => ({
              adName: row['Ad Name'] || '',
              adsetName: row['Adset Name'] || '',
              creativeType: row['Creative Type'] || '',
              spendUsd: parseFloat(row['Spend In USD']) || 0,
              impressions: parseInt(row['Impressions']) || 0,
              firstAdSpendDate: row['First Ad Spend Date'] || '',
              lastAdSpendDate: row['Last Ad Spend Date'] || '',
              daysAdSpending: parseInt(row['Days ad spending']) || 0
            }))
            setCsvData(processedData)
          },
          error: (error) => {
            setError('Error parsing CSV file: ' + error.message)
          }
        })
      }
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          category_id: productData.category,
          website: productData.website,
          naming_convention: productData.namingConvention
        })
        .select()
        .single()

      if (productError) throw productError

      // Process and insert ads data
      if (csvData.length > 0) {
        const weekMatch = csvFileName.match(/W(\d+)/)
        const weekNumber = weekMatch ? parseInt(weekMatch[1]) : 1

        const adsData = csvData.map(row => {
          // Parse naming convention
          const isCreativeHub = row.adName.includes('_chub_')
          const aspectRatio = row.adName.match(/_(\d+x\d+)_/)?.[1] || ''
          const adFormat = row.adName.includes('_IMG_') ? 'IMG' : row.adName.includes('_VIDEO_') ? 'VIDEO' : ''
          const adType = row.adName.includes('_New_') ? 'New' : row.adName.includes('_Opti_') ? 'Opti' : ''
          
          // Determine creative type if empty
          let creativeType = row.creativeType
          if (!creativeType) {
            creativeType = adFormat === 'VIDEO' ? 'VIDEO' : 'SHARE'
          }

          return {
            product_id: product.id,
            ad_name: row.adName,
            adset_name: row.adsetName,
            creative_type: creativeType as 'SHARE' | 'VIDEO',
            spend_usd: row.spendUsd,
            impressions: row.impressions,
            first_ad_spend_date: row.firstAdSpendDate,
            last_ad_spend_date: row.lastAdSpendDate,
            days_ad_spending: row.daysAdSpending,
            week_number: weekNumber,
            is_creative_hub: isCreativeHub,
            aspect_ratio: aspectRatio,
            ad_format: adFormat as 'IMG' | 'VIDEO',
            ad_type: adType as 'New' | 'Opti'
          }
        })

        const { error: adsError } = await supabase
          .from('ads')
          .insert(adsData)

        if (adsError) throw adsError
      }

      onClose()
      setStep(1)
      setProductData({ name: '', category: '', website: '', namingConvention: '' })
      setCsvData([])
      setCsvFileName('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && productData.name && productData.category) {
      setStep(2)
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-dark-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-white">
              Add New Product
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="bg-red-600 bg-opacity-20 border border-red-600 text-red-400 px-4 py-2 rounded mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productData.name}
                  onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g. Bioma"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={productData.category}
                  onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={productData.website}
                  onChange={(e) => setProductData({ ...productData, website: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Naming Convention
                </label>
                <textarea
                  value={productData.namingConvention}
                  onChange={(e) => setProductData({ ...productData, namingConvention: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="BI_F-WL1932_2025_AL_W03-4_FB_982_ER_IMG_1x1_New_420_HE-3007_BC-508_CTA-1384_P-GLP1_M-TR_E-BADGE3_C-CompetitorAds_S-Limited_S-3_Red_T-4_V01"
                />
              </div>

              <button
                onClick={nextStep}
                disabled={!productData.name || !productData.category}
                className="w-full btn-primary disabled:opacity-50"
              >
                Next: Upload CSV Data
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload CSV File
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-primary-500 bg-primary-500 bg-opacity-10' 
                      : 'border-dark-600 hover:border-dark-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {csvFileName ? (
                    <p className="text-white font-medium">File: {csvFileName}</p>
                  ) : (
                    <div>
                      <p className="text-white font-medium mb-2">
                        {isDragActive ? 'Drop the CSV file here' : 'Drag & drop CSV file here'}
                      </p>
                      <p className="text-gray-400 text-sm">or click to select file</p>
                    </div>
                  )}
                </div>
              </div>

              {csvData.length > 0 && (
                <div className="bg-dark-700 rounded-lg p-4">
                  <p className="text-white font-medium mb-2">
                    CSV Data Preview ({csvData.length} rows)
                  </p>
                  <div className="text-sm text-gray-300 space-y-1">
                    <p>First ad: {csvData[0]?.adName}</p>
                    <p>Total spend: ${csvData.reduce((sum, row) => sum + row.spendUsd, 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || csvData.length === 0}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 