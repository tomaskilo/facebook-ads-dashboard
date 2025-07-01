import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Enhanced web scraping function using multiple strategies
async function crawlProductWebsite(url: string) {
  try {
    console.log(`🕷️ Starting enhanced crawl for: ${url}`)
    
    // Basic fetch approach with enhanced parsing
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const html = await response.text()
    
    // Enhanced extraction using regex patterns and intelligent parsing
    const extractedData = {
      // Basic Information
      productName: extractProductName(html, url),
      description: extractDescription(html),
      industry: extractIndustry(html, url),
      brandColor: extractBrandColor(html),
      
      // Marketing Information
      uniqueSellingPoints: extractUSPs(html),
      benefits: extractBenefits(html),
      painPoints: extractPainPoints(html),
      targetAudience: extractTargetAudience(html),
      
      // Product Features
      keyFeatures: extractKeyFeatures(html),
      ctaOffers: extractCTAOffers(html),
      toneOfVoice: extractToneOfVoice(html),
      additionalContext: extractAdditionalContext(html),
      
      // Technical Details
      pricing: extractPricing(html),
      competitors: extractCompetitors(html),
      category: extractCategory(html),
      
      // Meta Information
      metaTitle: extractMetaTitle(html),
      metaDescription: extractMetaDescription(html),
      images: extractImages(html, url),
      logos: extractLogos(html, url)
    }
    
    console.log(`✅ Successfully extracted data for: ${extractedData.productName}`)
    return extractedData
    
  } catch (error) {
    console.error('❌ Crawling error:', error)
    throw new Error(`Failed to crawl website: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Function to save crawled data to database
async function saveCrawledDataToDatabase(url: string, extractedData: any, userEmail: string | null = null) {
  try {
    console.log(`💾 Saving crawled data to database for: ${extractedData.productName}`)
    
    const crawledProduct = {
      url: url,
      product_name: extractedData.productName,
      description: extractedData.description,
      industry: extractedData.industry,
      brand_color: extractedData.brandColor,
      unique_selling_points: JSON.stringify(extractedData.uniqueSellingPoints),
      benefits: JSON.stringify(extractedData.benefits),
      pain_points: JSON.stringify(extractedData.painPoints),
      target_audience: JSON.stringify(extractedData.targetAudience),
      key_features: JSON.stringify(extractedData.keyFeatures),
      cta_offers: JSON.stringify(extractedData.ctaOffers),
      tone_of_voice: extractedData.toneOfVoice,
      additional_context: extractedData.additionalContext,
      pricing: JSON.stringify(extractedData.pricing),
      competitors: JSON.stringify(extractedData.competitors),
      category: extractedData.category,
      meta_title: extractedData.metaTitle,
      meta_description: extractedData.metaDescription,
      images: JSON.stringify(extractedData.images),
      logos: JSON.stringify(extractedData.logos),
      created_by: userEmail,
      crawl_status: 'success'
    }
    
    // Use upsert to handle duplicate URLs
    const { data, error } = await supabase
      .from('crawled_products')
      .upsert(crawledProduct, { 
        onConflict: 'url',
        ignoreDuplicates: false 
      })
      .select()
      .single()
    
    if (error) {
      console.error('❌ Database save error:', error)
      throw new Error(`Failed to save to database: ${error.message}`)
    }
    
    console.log(`✅ Successfully saved crawled data with ID: ${data.id}`)
    return data
    
  } catch (error) {
    console.error('❌ Database save error:', error)
    throw error
  }
}

// Function to check if URL was already crawled
async function checkExistingCrawl(url: string) {
  try {
    const { data, error } = await supabase
      .from('crawled_products')
      .select('*')
      .eq('url', url)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }
    
    return data
  } catch (error) {
    console.log('No existing crawl found, proceeding with new crawl')
    return null
  }
}

// Enhanced extraction functions
function extractProductName(html: string, url: string): string {
  // Multiple strategies to find product name
  const patterns = [
    /<title[^>]*>([^<]+)</i,
    /<h1[^>]*>([^<]+)</i,
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)/i,
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim().replace(/\s+/g, ' ')
      // Clean up common suffixes
      name = name.replace(/\s*[-|–]\s*(Home|Shop|Store|Official|Website).*$/i, '')
      if (name.length > 3) return name
    }
  }
  
  // Fallback to domain name
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
  } catch {
    return 'Unknown Product'
  }
}

function extractDescription(html: string): string {
  const patterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)/i,
    /<p[^>]*class=["'][^"']*description[^"']*["'][^>]*>([^<]+)/i,
    /<div[^>]*class=["'][^"']*intro[^"']*["'][^>]*>.*?<p[^>]*>([^<]+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match && match[1] && match[1].length > 50) {
      return match[1].trim().substring(0, 500)
    }
  }
  
  return 'No description found'
}

function extractIndustry(html: string, url: string): string {
  const industryKeywords = {
    'health': ['health', 'wellness', 'medical', 'fitness', 'nutrition', 'supplement'],
    'ecommerce': ['shop', 'store', 'buy', 'product', 'cart', 'checkout'],
    'finance': ['bank', 'finance', 'investment', 'loan', 'credit', 'insurance'],
    'technology': ['tech', 'software', 'app', 'digital', 'platform', 'saas'],
    'education': ['learn', 'course', 'education', 'training', 'tutorial'],
    'beauty': ['beauty', 'cosmetic', 'skincare', 'makeup', 'aesthetic'],
    'food': ['food', 'recipe', 'restaurant', 'meal', 'nutrition', 'diet']
  }
  
  const content = (html + ' ' + url).toLowerCase()
  let maxScore = 0
  let detectedIndustry = 'General'
  
  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const score = keywords.reduce((acc, keyword) => {
      const matches = (content.match(new RegExp(keyword, 'g')) || []).length
      return acc + matches
    }, 0)
    
    if (score > maxScore) {
      maxScore = score
      detectedIndustry = industry.charAt(0).toUpperCase() + industry.slice(1)
    }
  }
  
  return detectedIndustry
}

function extractBrandColor(html: string): string {
  // Look for CSS color patterns
  const colorPatterns = [
    /--primary[^:]*:\s*([^;]+)/i,
    /--brand[^:]*:\s*([^;]+)/i,
    /background[^:]*:\s*(#[0-9a-f]{6})/i,
    /color[^:]*:\s*(#[0-9a-f]{6})/i,
  ]
  
  for (const pattern of colorPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      const color = match[1].trim()
      if (color.startsWith('#') && color.length === 7) {
        return color
      }
    }
  }
  
  return '#3B82F6' // Default blue
}

function extractUSPs(html: string): string[] {
  const uspPatterns = [
    /(?:unique|special|why choose|what makes|benefits?)[^.]*?(?:because|that|:)[^.]*?\./gi,
    /<li[^>]*>([^<]+(?:guarantee|unique|exclusive|only|best|#1)[^<]*)</gi,
    /(?:unlike|different from|better than)[^.]*?\./gi,
  ]
  
  const usps: string[] = []
  
  for (const pattern of uspPatterns) {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const clean = match.replace(/<[^>]*>/g, '').trim()
      if (clean.length > 20 && clean.length < 200) {
        usps.push(clean)
      }
    })
  }
  
  return [...new Set(usps)].slice(0, 5)
}

function extractBenefits(html: string): string[] {
  const benefitPatterns = [
    /(?:benefit|advantage|help|improve|enhance|boost|increase)[^.]*?\./gi,
    /<li[^>]*>([^<]*(?:improve|better|enhance|boost|increase|reduce|eliminate)[^<]*)</gi,
    /(?:you will|you'll|users can|customers can)[^.]*?\./gi,
  ]
  
  const benefits: string[] = []
  
  for (const pattern of benefitPatterns) {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const clean = match.replace(/<[^>]*>/g, '').trim()
      if (clean.length > 15 && clean.length < 150) {
        benefits.push(clean)
      }
    })
  }
  
  return [...new Set(benefits)].slice(0, 6)
}

function extractPainPoints(html: string): string[] {
  const painPatterns = [
    /(?:problem|issue|struggle|difficulty|challenge|pain|frustrat)[^.]*?\./gi,
    /(?:tired of|sick of|struggling with|having trouble)[^.]*?\./gi,
    /(?:before|without)[^.]*?(?:difficult|hard|impossible|frustrating)[^.]*?\./gi,
  ]
  
  const painPoints: string[] = []
  
  for (const pattern of painPatterns) {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const clean = match.replace(/<[^>]*>/g, '').trim()
      if (clean.length > 20 && clean.length < 180) {
        painPoints.push(clean)
      }
    })
  }
  
  return [...new Set(painPoints)].slice(0, 4)
}

function extractTargetAudience(html: string): string[] {
  const audiencePatterns = [
    /(?:for|designed for|perfect for|ideal for)[^.]*?(?:people|users|customers|clients|individuals|men|women|adults|professionals)[^.]*?\./gi,
    /(?:if you|if you're|whether you)[^.]*?\./gi,
    /(?:target|audience|demographic)[^.]*?\./gi,
  ]
  
  const audience: string[] = []
  
  for (const pattern of audiencePatterns) {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const clean = match.replace(/<[^>]*>/g, '').trim()
      if (clean.length > 15 && clean.length < 120) {
        audience.push(clean)
      }
    })
  }
  
  return [...new Set(audience)].slice(0, 4)
}

function extractKeyFeatures(html: string): string[] {
  const featurePatterns = [
    /<li[^>]*>([^<]+(?:feature|function|capability|includes|comes with)[^<]*)</gi,
    /(?:features?|capabilities|functions)[^:]*:([^.]*)\./gi,
    /(?:includes|contains|offers|provides)[^.]*?\./gi,
  ]
  
  const features: string[] = []
  
  for (const pattern of featurePatterns) {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const clean = match.replace(/<[^>]*>/g, '').trim()
      if (clean.length > 10 && clean.length < 100) {
        features.push(clean)
      }
    })
  }
  
  return [...new Set(features)].slice(0, 8)
}

function extractCTAOffers(html: string): string[] {
  const ctaPatterns = [
    /<button[^>]*>([^<]*(?:buy|shop|order|get|start|try|download|sign up)[^<]*)</gi,
    /<a[^>]*class=["'][^"']*(?:btn|button|cta)[^"']*["'][^>]*>([^<]+)</gi,
    /(?:limited time|special offer|discount|save|% off|free)[^.]*?\./gi,
  ]
  
  const ctas: string[] = []
  
  for (const pattern of ctaPatterns) {
    const matches = html.match(pattern) || []
    matches.forEach(match => {
      const clean = match.replace(/<[^>]*>/g, '').trim()
      if (clean.length > 5 && clean.length < 80) {
        ctas.push(clean)
      }
    })
  }
  
  return [...new Set(ctas)].slice(0, 5)
}

function extractToneOfVoice(html: string): string {
  const content = html.replace(/<[^>]*>/g, ' ').toLowerCase()
  
  const toneIndicators = {
    'Professional': ['professional', 'business', 'corporate', 'enterprise', 'solution'],
    'Friendly': ['friendly', 'welcome', 'hello', 'community', 'together'],
    'Urgent': ['now', 'today', 'limited', 'hurry', 'act fast', 'don\'t wait'],
    'Scientific': ['research', 'study', 'proven', 'clinical', 'tested', 'evidence'],
    'Casual': ['easy', 'simple', 'fun', 'awesome', 'cool', 'great'],
    'Luxury': ['premium', 'exclusive', 'luxury', 'elite', 'sophisticated']
  }
  
  let maxScore = 0
  let detectedTone = 'Neutral'
  
  for (const [tone, indicators] of Object.entries(toneIndicators)) {
    const score = indicators.reduce((acc, indicator) => {
      const matches = (content.match(new RegExp(indicator, 'g')) || []).length
      return acc + matches
    }, 0)
    
    if (score > maxScore) {
      maxScore = score
      detectedTone = tone
    }
  }
  
  return detectedTone
}

function extractAdditionalContext(html: string): string {
  // Extract additional contextual information
  const aboutSection = html.match(/<section[^>]*(?:about|story|mission)[^>]*>([\s\S]*?)<\/section>/i)?.[1] || ''
  const cleanAbout = aboutSection.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  
  if (cleanAbout.length > 100) {
    return cleanAbout.substring(0, 300) + '...'
  }
  
  return 'Additional context can be manually added based on research and brand guidelines.'
}

function extractPricing(html: string): string[] {
  const pricePatterns = [
    /\$\d+(?:\.\d{2})?/g,
    /(?:price|cost|starting at)[^$]*\$\d+/gi,
    /(?:free|trial|subscription)/gi,
  ]
  
  const prices: string[] = []
  
  for (const pattern of pricePatterns) {
    const matches = html.match(pattern) || []
    prices.push(...matches)
  }
  
  return [...new Set(prices)].slice(0, 5)
}

function extractCompetitors(html: string): string[] {
  // This would require more sophisticated analysis
  // For now, return empty array - can be manually added
  return []
}

function extractCategory(html: string): string {
  const categoryPatterns = [
    /<meta[^>]*name=["']category["'][^>]*content=["']([^"']+)/i,
    /(?:category|section|type)[^:]*:([^.]*)/i,
  ]
  
  for (const pattern of categoryPatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return 'General'
}

function extractMetaTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)/i)
  return match ? match[1].trim() : ''
}

function extractMetaDescription(html: string): string {
  const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)/i)
  return match ? match[1].trim() : ''
}

function extractImages(html: string, baseUrl: string): string[] {
  const imgPattern = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
  const images: string[] = []
  let match
  
  while ((match = imgPattern.exec(html)) !== null) {
    let imgSrc = match[1]
    
    // Convert relative URLs to absolute
    if (imgSrc.startsWith('/')) {
      try {
        const url = new URL(baseUrl)
        imgSrc = `${url.protocol}//${url.host}${imgSrc}`
      } catch (e) {
        continue
      }
    }
    
    // Filter out small images, icons, etc.
    if (!imgSrc.includes('icon') && !imgSrc.includes('logo') && 
        !imgSrc.includes('placeholder') && imgSrc.includes('http')) {
      images.push(imgSrc)
    }
  }
  
  return [...new Set(images)].slice(0, 10)
}

function extractLogos(html: string, baseUrl: string): string[] {
  const logoPattern = /<img[^>]*(?:class=["'][^"']*logo[^"']*["']|alt=["'][^"']*logo[^"']*["']|src=["'][^"']*logo[^"']*["'])[^>]*>/gi
  const logos: string[] = []
  let match
  
  while ((match = logoPattern.exec(html)) !== null) {
    const srcMatch = match[0].match(/src=["']([^"']+)["']/)
    if (srcMatch) {
      let logoSrc = srcMatch[1]
      
      // Convert relative URLs to absolute
      if (logoSrc.startsWith('/')) {
        try {
          const url = new URL(baseUrl)
          logoSrc = `${url.protocol}//${url.host}${logoSrc}`
        } catch (e) {
          continue
        }
      }
      
      if (logoSrc.includes('http')) {
        logos.push(logoSrc)
      }
    }
  }
  
  return [...new Set(logos)].slice(0, 3)
}

export async function POST(request: NextRequest) {
  try {
    const { url, forceRefresh = false } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    console.log(`🚀 Starting crawl for: ${url}`)
    
    // Get user session for tracking
    const session = await getServerSession()
    const userEmail = session?.user?.email || null
    
    // Check if URL was already crawled (unless force refresh is requested)
    if (!forceRefresh) {
      const existingCrawl = await checkExistingCrawl(url)
      if (existingCrawl) {
        console.log(`📚 Found existing crawl for: ${url}`)
        
        // Increment view count
        await supabase.rpc('increment_crawled_product_views', { 
          product_id: existingCrawl.id 
        })
        
        // Parse JSON fields back to arrays/objects
        const parsedData = {
          ...existingCrawl,
          uniqueSellingPoints: JSON.parse(existingCrawl.unique_selling_points),
          benefits: JSON.parse(existingCrawl.benefits),
          painPoints: JSON.parse(existingCrawl.pain_points),
          targetAudience: JSON.parse(existingCrawl.target_audience),
          keyFeatures: JSON.parse(existingCrawl.key_features),
          ctaOffers: JSON.parse(existingCrawl.cta_offers),
          pricing: JSON.parse(existingCrawl.pricing),
          competitors: JSON.parse(existingCrawl.competitors),
          images: JSON.parse(existingCrawl.images),
          logos: JSON.parse(existingCrawl.logos)
        }
        
        return NextResponse.json({
          success: true,
          data: parsedData,
          message: 'Loaded from existing crawl data',
          fromCache: true
        })
      }
    }
    
    // Perform fresh crawl
    const extractedData = await crawlProductWebsite(url)
    
    // Save to database
    try {
      const savedData = await saveCrawledDataToDatabase(url, extractedData, userEmail)
      console.log(`✅ Successfully saved crawl data with ID: ${savedData.id}`)
      
      return NextResponse.json({
        success: true,
        data: extractedData,
        message: 'Website successfully crawled and saved to database',
        savedId: savedData.id,
        fromCache: false
      })
      
    } catch (dbError) {
      console.error('❌ Database save failed, but crawl succeeded:', dbError)
      
      // Return crawled data even if database save failed
      return NextResponse.json({
        success: true,
        data: extractedData,
        message: 'Website successfully crawled (database save failed)',
        warning: 'Data was not saved to library',
        fromCache: false
      })
    }
    
  } catch (error) {
    console.error('❌ API Error:', error)
    
    // Try to save error to database for debugging
    try {
      const { url } = await request.json()
      const session = await getServerSession()
      
      await supabase
        .from('crawled_products')
        .upsert({
          url: url,
          product_name: 'Failed Crawl',
          crawl_status: 'error',
          crawl_error: error instanceof Error ? error.message : 'Unknown error',
          created_by: session?.user?.email || null
        }, { onConflict: 'url' })
        
    } catch (logError) {
      console.error('Failed to log error to database:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to crawl website',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 