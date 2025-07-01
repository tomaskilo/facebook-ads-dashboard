'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'

interface Product {
  id: number;
  name: string;
  initials: string;
  category: string;
  table_name: string;
  created_at: string;
}

interface UploadDataModalProps {
  onClose: () => void
  products: Product[]
}

interface ParsedAdData {
  ad_name: string
  adset_name: string
  creative_type: string
  spend_usd: number
  impressions: number
  first_ad_spend_date: string
  last_ad_spend_date: string
  days_running: number
  is_creative_hub: number
  year_created?: number
  month_created?: string
  aspect_ratio?: string
  week_number: string
}

interface FileUploadStatus {
  file: File
  status: 'pending' | 'processing' | 'success' | 'error'
  weekNumber: string
  productInitials: string
  tableName: string
  message?: string
  recordsCount?: number
}

export default function UploadDataModal({ onClose, products }: UploadDataModalProps) {
  const [files, setFiles] = useState<FileUploadStatus[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [createdProducts, setCreatedProducts] = useState<Product[]>([]) // Track auto-created products
  const [showSqlModal, setShowSqlModal] = useState(false)
  const [sqlInstructions, setSqlInstructions] = useState('')
  const [missingTableProduct, setMissingTableProduct] = useState('')

  // Get combined products list (existing + auto-created)
  const getAllProducts = (): Product[] => {
    return [...products, ...createdProducts]
  }

  // Extract week number and product initials from filename (e.g., "BI W04.csv" -> "W04", "BI")
  const extractFileInfo = (filename: string): { weekNumber: string, productInitials: string } => {
    // Match pattern: {INITIALS} W{NUMBER}.csv (e.g., "BI W04.csv", "CB W01.csv", "RH W01.csv")
    const match = filename.match(/^([A-Z]{2,5})\s+W(\d+)\.csv$/i)
    if (match) {
      return {
        productInitials: match[1].toUpperCase(),
        weekNumber: `W${match[2].padStart(2, '0')}`
      }
    }
    return { weekNumber: '', productInitials: '' }
  }

  // Find product by initials (from existing + auto-created)
  const findProductByInitials = (initials: string): Product | undefined => {
    return getAllProducts().find(p => p.initials.toUpperCase() === initials.toUpperCase())
  }

  // Auto-create a new product with smart defaults
  const autoCreateProduct = async (initials: string): Promise<Product | null> => {
    try {
      console.log(`🚀 Auto-creating product with initials: ${initials}`)
      
      // Generate a smart product name from initials
      const productName = generateProductName(initials)
      const category = 'Ecommerce' // Default category, user can change later
      
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: productName,
          initials: initials.toUpperCase(),
          category: category
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create product')
      }

      const result = await response.json()
      
      // Create product object to add to our local list
      const newProduct: Product = {
        id: Date.now(), // Temporary ID
        name: productName,
        initials: initials.toUpperCase(),
        category: category,
        table_name: `${initials.toLowerCase()}_ads_data`,
        created_at: new Date().toISOString()
      }
      
      // Add to our local created products list
      setCreatedProducts(prev => [...prev, newProduct])
      
      console.log(`✅ Auto-created product: ${productName} (${initials})`)
      
      // Note: The user will still need to run the SQL to create the table
      // but we'll handle that in the upload process
      
      return newProduct
      
    } catch (error) {
      console.error('❌ Failed to auto-create product:', error)
      return null
    }
  }

  // Generate a smart product name from initials
  const generateProductName = (initials: string): string => {
    const commonMappings: { [key: string]: string } = {
      'BI': 'Bioma',
      'CB': 'Colonbroom', 
      'RH': 'Rhea',
      'BW': 'Beyond Wellness',
      'WMA': 'Weight Management Assistant',
      'GH': 'Go Health',
      'EA': 'Ecom Accelerator'
    }
    
    // Return mapped name if available, otherwise generate from initials
    return commonMappings[initials.toUpperCase()] || 
           initials.toUpperCase().split('').map(char => `${char}${char.toLowerCase()}`).join('') ||
           `Product ${initials.toUpperCase()}`
  }

  // Parse creative type based on ad name conventions
  const parseCreativeType = (adName: string, originalType: string): string => {
    // If original type exists and is not SHARE, use it (but convert SHARE to IMAGE)
    if (originalType && originalType !== 'SHARE') {
      return originalType === 'VIDEO' ? 'VIDEO' : 'IMAGE'
    }
    
    // Convert SHARE to IMAGE
    if (originalType === 'SHARE') {
      return 'IMAGE'
    }

    // If empty, infer from ad name
    const lowerName = adName.toLowerCase()
    
    // Video indicators
    if (lowerName.includes('vid') || lowerName.includes('adt-v')) {
      return 'VIDEO'
    }
    
    // Image indicators
    if (lowerName.includes('_img_') || lowerName.includes('-img-') || 
        lowerName.includes('_img-') || lowerName.includes('adt-st')) {
      return 'IMAGE'
    }
    
    // Default to IMAGE if can't determine
    return 'IMAGE'
  }

  // Extract year and month from ad name (e.g., "BI_2024_Dec_..." -> 2024, "Dec")
  const extractYearMonth = (adName: string, productInitials: string): { year?: number, month?: string } => {
    const pattern = new RegExp(`${productInitials}_(\\d{4})_([A-Za-z]{3})`, 'i')
    const match = adName.match(pattern)
    if (match) {
      return {
        year: parseInt(match[1]),
        month: match[2]
      }
    }
    return {}
  }

  // Extract aspect ratio from ad name (1x1, 4x5, 9x16)
  const extractAspectRatio = (adName: string): string | undefined => {
    const match = adName.match(/(\d+x\d+)/i)
    return match ? match[1] : undefined
  }

  // Clean ad name (remove everything after |)
  const cleanAdName = (adName: string): string => {
    return adName.split('|')[0].trim()
  }

  // Check if ad uses Creative Hub
  const isCreativeHub = (adName: string): number => {
    return adName.toLowerCase().includes('_chub_') ? 1 : 0
  }

  // Parse CSV data
  const parseCSVData = (csvData: any[], weekNumber: string, productInitials: string): ParsedAdData[] => {
    return csvData.slice(1).map((row: any[]) => { // Skip header row
      const [
        adNumber, // Skip this column
        rawAdName,
        adsetName,
        rawCreativeType,
        rawSpend,
        rawImpressions,
        firstSpendDate,
        lastSpendDate,
        daysRunning
      ] = row

      const cleanedAdName = cleanAdName(rawAdName || '')
      const creativeType = parseCreativeType(cleanedAdName, rawCreativeType || '')
      const { year, month } = extractYearMonth(cleanedAdName, productInitials)
      const aspectRatio = extractAspectRatio(cleanedAdName)

      return {
        ad_name: cleanedAdName,
        adset_name: adsetName || '',
        creative_type: creativeType,
        spend_usd: parseFloat(rawSpend?.toString().replace(/[^\d.-]/g, '') || '0'),
        impressions: parseInt(rawImpressions || '0'),
        first_ad_spend_date: firstSpendDate || '',
        last_ad_spend_date: lastSpendDate || '',
        days_running: parseInt(daysRunning || '0'),
        is_creative_hub: isCreativeHub(cleanedAdName),
        year_created: year,
        month_created: month,
        aspect_ratio: aspectRatio,
        week_number: weekNumber
      }
    })
  }

  // Upload data via API
  const uploadViaAPI = async (parsedData: ParsedAdData[], weekNumber: string, tableName: string) => {
    const response = await fetch('/api/upload-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csvData: parsedData,
        weekNumber: weekNumber,
        tableName: tableName
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      // Create enhanced error object for missing table case
      const error = new Error(result.error || 'Upload failed') as any
      if (result.tableNotFound) {
        error.response = result
      }
      throw error
    }

    return result
  }

  // Update file status
  const updateFileStatus = (index: number, updates: Partial<FileUploadStatus>) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, ...updates } : file
    ))
  }

  // Process a single file
  const processFile = async (fileStatus: FileUploadStatus, index: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      updateFileStatus(index, { status: 'processing' })

      Papa.parse(fileStatus.file, {
        complete: async (parseResult) => {
          try {
            const parsedData = parseCSVData(parseResult.data, fileStatus.weekNumber, fileStatus.productInitials)
            
            // Upload via API
            const uploadResult = await uploadViaAPI(parsedData, fileStatus.weekNumber, fileStatus.tableName)
            
            updateFileStatus(index, { 
              status: 'success', 
              message: uploadResult.message,
              recordsCount: parsedData.length
            })
            resolve()
          } catch (err: any) {
            console.error('Upload error:', err)
            
            // Check if this is a missing table error
            if (err.response && err.response.tableNotFound) {
              updateFileStatus(index, { 
                status: 'error', 
                message: `Table missing for ${err.response.productInitials}. SQL provided - run it and retry.`
              })
              
              // Show SQL modal
              setSqlInstructions(err.response.sqlToCreate)
              setMissingTableProduct(err.response.productInitials)
              setShowSqlModal(true)
            } else {
              updateFileStatus(index, { 
                status: 'error', 
                message: err.message 
              })
            }
            
            reject(err)
          }
        },
        error: (error) => {
          updateFileStatus(index, { 
            status: 'error', 
            message: `CSV parsing error: ${error.message}` 
          })
          reject(error)
        }
      })
    })
  }

  // Process all files
  const processAllFiles = async () => {
    setUploading(true)
    setError('')
    setOverallProgress(0)

    let completedFiles = 0
    const totalFiles = files.length

    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < files.length; i++) {
      try {
        await processFile(files[i], i)
        completedFiles++
        setOverallProgress((completedFiles / totalFiles) * 100)
      } catch (err) {
        // Continue with other files even if one fails
        completedFiles++
        setOverallProgress((completedFiles / totalFiles) * 100)
      }
    }

    setUploading(false)
    
    // Check if all files processed successfully
    const successCount = files.filter(f => f.status === 'success').length
    const errorCount = files.filter(f => f.status === 'error').length
    
    if (errorCount === 0) {
      setTimeout(() => {
        onClose()
      }, 3000)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    setError('')
    
    // Process files sequentially to avoid state conflicts
    for (const file of acceptedFiles) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setFiles(prev => [...prev, {
          file,
          status: 'error' as const,
          weekNumber: '',
          productInitials: '',
          tableName: '',
          message: 'File must be a CSV file'
        }])
        continue
      }

      // Extract file info
      const { weekNumber, productInitials } = extractFileInfo(file.name)
      
      if (!weekNumber || !productInitials) {
        setFiles(prev => [...prev, {
          file,
          status: 'error' as const,
          weekNumber: '',
          productInitials: '',
          tableName: '',
          message: 'Invalid filename format. Use: {INITIALS} W{NUMBER}.csv (e.g., BI W04.csv, RH W01.csv)'
        }])
        continue
      }

      // Find matching product or auto-create
      let product = findProductByInitials(productInitials)
      
      if (!product) {
        // Attempt to auto-create the product
        console.log(`🔄 Product with initials "${productInitials}" not found, attempting auto-creation...`)
        
        // Add file with processing status first
        setFiles(prev => [...prev, {
          file,
          status: 'processing' as const,
          weekNumber,
          productInitials,
          tableName: '',
          message: `Auto-creating product with initials "${productInitials}"...`
        }])
        
        // Attempt auto-creation
        const createdProduct = await autoCreateProduct(productInitials)
        
        if (createdProduct) {
          // Update the specific file status to pending
          setFiles(prev => prev.map(f => 
            f.file === file && f.status === 'processing' 
              ? {
                  ...f,
                  status: 'pending' as const,
                  tableName: createdProduct.table_name,
                  message: `✅ Auto-created ${createdProduct.name} (${productInitials}) • Ready to upload ${weekNumber}`
                }
              : f
          ))
        } else {
          // Auto-creation failed, update status
          setFiles(prev => prev.map(f => 
            f.file === file && f.status === 'processing'
              ? {
                  ...f,
                  status: 'error' as const,
                  message: `Failed to auto-create product with initials "${productInitials}". Please create manually first.`
                }
              : f
          ))
        }
      } else {
        // Product found, add as pending
        setFiles(prev => [...prev, {
          file,
          status: 'pending' as const,
          weekNumber,
          productInitials,
          tableName: product.table_name,
          message: `Ready to upload ${weekNumber} for ${product.name}`
        }])
      }
    }

    // Validate for duplicates after all files are processed
    setTimeout(() => {
      setFiles(currentFiles => {
        const productWeeks = new Map<string, string[]>()
        
        currentFiles.forEach(f => {
          if (f.status === 'pending') {
            const key = f.productInitials
            if (!productWeeks.has(key)) {
              productWeeks.set(key, [])
            }
            productWeeks.get(key)!.push(f.weekNumber)
          }
        })

        // Check for duplicates
        for (const [product, weeks] of productWeeks) {
          const duplicates = weeks.filter((week, index) => weeks.indexOf(week) !== index)
          if (duplicates.length > 0) {
            setError(`Duplicate week numbers found for ${product}: ${duplicates.join(', ')}. Please remove duplicate files.`)
            break
          }
        }
        
        return currentFiles
      })
    }, 100)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setFiles([])
    setError('')
    setOverallProgress(0)
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDragOver: (e: any) => e.preventDefault(),
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: true, // Enable multiple file selection
  })

  const getStatusIcon = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'processing':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full" />
    }
  }

  const validFiles = files.filter(f => f.status !== 'error')
  const canStartUpload = validFiles.length > 0 && !uploading

  // Get available products for display
  const availableProducts = getAllProducts().map(p => `${p.initials} (${p.name})`).join(', ') || 'No products available'

  // Handle SQL modal close
  const handleSqlModalClose = () => {
    setShowSqlModal(false)
    setSqlInstructions('')
    setMissingTableProduct('')
  }

  // Copy SQL to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlInstructions)
    alert('SQL copied to clipboard!')
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl bg-white rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Bulk Upload Product Data
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload Multiple CSV Files
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your product CSV files here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Format: {availableProducts} • Example: BI W04.csv, CB W01.csv
              </p>
            </div>

            {/* Files List */}
            {files.length > 0 && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    Selected Files ({files.length})
                  </h3>
                  <button
                    onClick={clearAllFiles}
                    className="text-xs text-gray-500 hover:text-gray-700"
                    disabled={uploading}
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {files.map((fileStatus, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStatusIcon(fileStatus.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {fileStatus.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {fileStatus.productInitials && `${fileStatus.productInitials} • `}
                            {fileStatus.weekNumber && `${fileStatus.weekNumber} • `}
                            {fileStatus.message}
                            {fileStatus.recordsCount && ` • ${fileStatus.recordsCount} records`}
                          </p>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-500 ml-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {uploading && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Upload Progress</span>
                  <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {files.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={processAllFiles}
                  disabled={!canStartUpload}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {uploading ? 'Uploading...' : `Upload ${validFiles.length} Files`}
                </button>
                {!uploading && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 text-xs text-gray-600">
              <h4 className="font-semibold mb-2">Enhanced Bulk Upload Instructions:</h4>
              <ul className="space-y-1">
                <li>• <strong>Smart Product Detection:</strong> New products are automatically created from filename initials</li>
                <li>• <strong>Filename format:</strong> {`{INITIALS} W{NUMBER}.csv`} (e.g., BI W04.csv, RH W01.csv, CB W01.csv)</li>
                <li>• <strong>Auto-Creation:</strong> If product doesn't exist, it will be created automatically in Ecommerce category</li>
                <li>• <strong>Examples:</strong> RH W01.csv → Creates "Rhea" product, WMA W05.csv → Creates "Weight Management Assistant"</li>
                <li>• <strong>Multiple files:</strong> Select multiple CSV files at once (Ctrl/Cmd + click)</li>
                <li>• <strong>Processing:</strong> Files are processed sequentially with real-time status updates</li>
                <li>• <strong>Validation:</strong> Duplicate week numbers for same product are automatically detected</li>
                <li>• <strong>CSV format:</strong> Standard 9-column format with ad data required</li>
                <li>• <strong>Available products:</strong> {availableProducts}</li>
                {createdProducts.length > 0 && (
                  <li className="text-green-600 font-medium">
                    • <strong>✅ Auto-created this session:</strong> {createdProducts.map(p => `${p.initials} (${p.name})`).join(', ')}
                  </li>
                )}
              </ul>
              {createdProducts.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-700">
                  <strong>📝 Note:</strong> Auto-created products need their database tables created. 
                  The SQL will be provided after upload completion.
                </div>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/30" aria-hidden="true">
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel className="mx-auto max-w-2xl bg-white rounded-lg shadow-lg max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <Dialog.Title className="text-lg font-semibold text-gray-900">
                  SQL Instructions for {missingTableProduct}
                </Dialog.Title>
                <button
                  onClick={handleSqlModalClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  ⚠️ Table missing for product "{missingTableProduct}". 
                  <br />
                  📋 Run the SQL below in your Supabase SQL Editor to create the table, then retry the upload.
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SQL to run in Supabase:
                  </label>
                  <textarea
                    value={sqlInstructions}
                    readOnly
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-gray-50 font-mono text-sm"
                  />
                </div>

                <div className="text-xs text-gray-600">
                  <h4 className="font-semibold mb-2">Instructions:</h4>
                  <ol className="space-y-1 list-decimal list-inside">
                    <li>Copy the SQL above using the button below</li>
                    <li>Open your Supabase dashboard and go to SQL Editor</li>
                    <li>Paste and run the SQL to create the table</li>
                    <li>Return here and retry the upload</li>
                  </ol>
                </div>
              </div>

              <div className="p-6 border-t">
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    📋 Copy SQL
                  </button>
                  <button
                    onClick={handleSqlModalClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      )}
    </Dialog>
  )
} 