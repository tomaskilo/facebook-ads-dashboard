import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ScrapedData {
  title?: string
  description?: string
  metaDescription?: string
  keywords?: string[]
  features?: string[]
  benefits?: string[]
  pricing?: string[]
  error?: string
}

export async function POST(request: Request) {
  try {
    const { assetId, websiteUrl } = await request.json()

    if (!assetId || !websiteUrl) {
      return NextResponse.json({ error: 'Asset ID and website URL are required' }, { status: 400 })
    }

    console.log(`Starting simplified web scraping for ${websiteUrl}`)

    // Perform basic web scraping
    const scrapedData = await scrapeWebsiteBasic(websiteUrl)

    // Update the brand asset with scraped data
    const { data: updatedAsset, error: updateError } = await supabase
      .from('brand_assets')
      .update({
        scraped_data: scrapedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating brand asset with scraped data:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Trigger competitor research in background (don't wait for it)
    if (scrapedData.title || scrapedData.description) {
      console.log('Triggering competitor research...')
      fetch(`${process.env.NEXTAUTH_URL}/api/brand-assets/research-competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          assetId,
          productName: scrapedData.title,
          category: scrapedData.keywords?.join(', ') || ''
        })
      }).catch(error => {
        console.error('Error triggering competitor research:', error)
      })
    }

    return NextResponse.json({
      success: true,
      scrapedData,
      updatedAsset
    })

  } catch (error) {
    console.error('Error in web scraping:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function scrapeWebsiteBasic(url: string): Promise<ScrapedData> {
  try {
    console.log(`Fetching basic content from ${url}`)
    
    // Basic fetch without cheerio to avoid compilation issues
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()

    // Simple regex-based extraction (basic but functional)
    const scrapedData: ScrapedData = {}

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch) {
      scrapedData.title = titleMatch[1].trim()
    }

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    if (metaDescMatch) {
      scrapedData.description = metaDescMatch[1].trim()
      scrapedData.metaDescription = metaDescMatch[1].trim()
    }

    // Extract keywords
    const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i)
    if (keywordsMatch) {
      scrapedData.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0)
    }

    // Extract some basic content features (simplified)
    const headingMatches = html.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi)
    if (headingMatches) {
      scrapedData.features = headingMatches
        .map(h => h.replace(/<[^>]+>/g, '').trim())
        .filter(h => h.length > 5 && h.length < 100)
        .slice(0, 10) // Limit to 10 features
    }

    // Look for price patterns
    const priceMatches = html.match(/[\$€£]\s*\d+(?:[.,]\d{2})?/g)
    if (priceMatches) {
      scrapedData.pricing = [...new Set(priceMatches)].slice(0, 5) // Unique prices, max 5
    }

    // Generate some basic benefits based on common keywords
    const benefitKeywords = ['benefit', 'advantage', 'helps', 'improves', 'reduces', 'increases', 'enhances']
    scrapedData.benefits = []
    
    benefitKeywords.forEach(keyword => {
      const regex = new RegExp(`[^.]*${keyword}[^.]*\\.`, 'gi')
      const matches = html.match(regex)
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/<[^>]+>/g, '').trim()
          if (cleanMatch.length > 20 && cleanMatch.length < 200) {
            scrapedData.benefits!.push(cleanMatch)
          }
        })
      }
    })

    // Limit benefits
    if (scrapedData.benefits) {
      scrapedData.benefits = [...new Set(scrapedData.benefits)].slice(0, 8)
    }

    console.log(`Successfully scraped ${url}:`, {
      title: scrapedData.title,
      features: scrapedData.features?.length || 0,
      benefits: scrapedData.benefits?.length || 0,
      pricing: scrapedData.pricing?.length || 0
    })

    return scrapedData

  } catch (error) {
    console.error('Error scraping website:', error)
    return {
      error: `Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
} 