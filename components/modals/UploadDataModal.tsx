'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { createClient } from '@supabase/supabase-js'

// Temporary Supabase client - will be properly configured
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface UploadDataModalProps {
  onClose: () => void
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

export default function UploadDataModal({ onClose }: UploadDataModalProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragActive, setDragActive] = useState(false)

  // Extract week number from filename (e.g., "CB W01.csv" -> "W01")
  const extractWeekNumber = (filename: string): string => {
    const match = filename.match(/CB\s+W(\d+)/i)
    return match ? `W${match[1].padStart(2, '0')}` : ''
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

  // Extract year and month from ad name (e.g., "CB_2024_Dec_..." -> 2024, "Dec")
  const extractYearMonth = (adName: string): { year?: number, month?: string } => {
    const match = adName.match(/CB_(\d{4})_([A-Za-z]{3})/i)
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
  const parseCSVData = (csvData: any[], weekNumber: string): ParsedAdData[] => {
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
      const { year, month } = extractYearMonth(cleanedAdName)
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

  // Check for duplicate week data
  const checkDuplicateWeek = async (weekNumber: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('cb_ads_data')
      .select('week_number')
      .eq('week_number', weekNumber)
      .limit(1)

    if (error) {
      console.error('Error checking duplicates:', error)
      return false
    }

    return data && data.length > 0
  }

  // Upload data to Supabase
  const uploadToDatabase = async (parsedData: ParsedAdData[]) => {
    const { error } = await supabase
      .from('cb_ads_data')
      .insert(parsedData)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please upload a CSV file.')
      return
    }

    // Validate filename format (must start with CB)
    if (!file.name.toLowerCase().startsWith('cb')) {
      setError('File must be a Colonbroom CSV file (starting with CB).')
      return
    }

    const weekNumber = extractWeekNumber(file.name)
    if (!weekNumber) {
      setError('Could not extract week number from filename. Please use format: CB W01.csv')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      // Check for duplicate week
      const isDuplicate = await checkDuplicateWeek(weekNumber)
      if (isDuplicate) {
        throw new Error(`Week ${weekNumber} data already exists in the database. Please choose a different week or delete existing data first.`)
      }

      // Parse CSV
      Papa.parse(file, {
        complete: async (result) => {
          try {
            const parsedData = parseCSVData(result.data, weekNumber)
            
            // Upload to database
            await uploadToDatabase(parsedData)
            
            setSuccess(`Successfully uploaded ${parsedData.length} ads for week ${weekNumber}!`)
            setTimeout(() => {
              onClose()
            }, 2000)
          } catch (err: any) {
            setError(err.message)
          } finally {
            setUploading(false)
          }
        },
        error: (error) => {
          setError(`CSV parsing error: ${error.message}`)
          setUploading(false)
        }
      })
    } catch (err: any) {
      setError(err.message)
      setUploading(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  })

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              Upload Colonbroom Data
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Upload CSV File
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Drag and drop your Colonbroom CSV file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Format: CB W01.csv, CB W12.csv, etc.
              </p>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {success}
              </div>
            )}

            {uploading && (
              <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Processing and uploading data...
              </div>
            )}

            <div className="mt-6 text-xs text-gray-600">
              <h4 className="font-semibold mb-2">File Requirements:</h4>
              <ul className="space-y-1">
                <li>• File must start with "CB" (Colonbroom)</li>
                <li>• Include week number: CB W01.csv, CB W12.csv</li>
                <li>• Standard CSV format with 9 columns</li>
                <li>• Will automatically detect Creative Hub, year/month, aspect ratio</li>
              </ul>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
} 