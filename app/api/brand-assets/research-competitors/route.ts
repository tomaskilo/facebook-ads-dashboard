import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CompetitorData {
  name: string
  website?: string
  description?: string
  keyFeatures?: string[]
  pricing?: string
  positioning?: string
  source: string
}

export async function POST(request: Request) {
  try {
    const { assetId, productName, category } = await request.json()

    if (!assetId || !productName) {
      return NextResponse.json({ error: 'Asset ID and product name are required' }, { status: 400 })
    }

    console.log(`Starting competitor research for ${productName} in category: ${category}`)

    // Research competitors
    const competitors = await researchCompetitors(productName, category)

    // Update the brand asset with competitor data
    const { data: updatedAsset, error: updateError } = await supabase
      .from('brand_assets')
      .update({
        competitors: competitors.map(c => c.name),
        ai_analysis: {
          competitorData: competitors,
          analysisDate: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', assetId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating brand asset with competitor data:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      competitors,
      updatedAsset
    })

  } catch (error) {
    console.error('Error in competitor research:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function researchCompetitors(productName: string, category: string): Promise<CompetitorData[]> {
  try {
    const competitors: CompetitorData[] = []

    // Generate search queries for competitor research
    const searchQueries = [
      `${productName} competitors`,
      `${productName} alternatives`,
      `${category} products similar to ${productName}`,
      `best ${category} products`,
      `top ${category} brands`,
      `${productName} vs`
    ]

    console.log('Generated search queries:', searchQueries)

    // Use web search API to find competitors
    for (const query of searchQueries.slice(0, 3)) { // Limit to 3 queries to avoid rate limits
      try {
        console.log(`Searching for: ${query}`)
        
        const searchResults = await searchWeb(query)
        const extractedCompetitors = extractCompetitorsFromSearchResults(searchResults, productName)
        
        // Add unique competitors
        extractedCompetitors.forEach(competitor => {
          if (!competitors.find(c => c.name.toLowerCase() === competitor.name.toLowerCase())) {
            competitors.push(competitor)
          }
        })

        // Limit total competitors to avoid overwhelming data
        if (competitors.length >= 10) break

      } catch (searchError) {
        console.error(`Error searching for "${query}":`, searchError)
        continue
      }
    }

    // Add some manual competitor data based on common patterns
    const manualCompetitors = generateManualCompetitors(productName, category)
    manualCompetitors.forEach(competitor => {
      if (!competitors.find(c => c.name.toLowerCase() === competitor.name.toLowerCase())) {
        competitors.push(competitor)
      }
    })

    console.log(`Found ${competitors.length} competitors for ${productName}`)
    return competitors.slice(0, 15) // Limit to 15 competitors

  } catch (error) {
    console.error('Error researching competitors:', error)
    return []
  }
}

async function searchWeb(query: string): Promise<any[]> {
  try {
    // For now, we'll simulate web search results
    // In production, you would use Google Custom Search API, Bing Search API, or similar
    
    // Simulate search results based on query patterns
    const simulatedResults = [
      {
        title: `Top 5 ${query} - Comprehensive Review`,
        snippet: `Discover the best alternatives and competitors in this comprehensive review of ${query}`,
        url: `https://example.com/review-${encodeURIComponent(query)}`
      },
      {
        title: `${query} - Comparison Guide`,
        snippet: `Compare features, pricing, and reviews for the top products in this category`,
        url: `https://example.com/comparison-${encodeURIComponent(query)}`
      }
    ]

    return simulatedResults

  } catch (error) {
    console.error('Error in web search:', error)
    return []
  }
}

function extractCompetitorsFromSearchResults(searchResults: any[], excludeProduct: string): CompetitorData[] {
  const competitors: CompetitorData[] = []

  // This is a simplified extraction - in production you would parse the actual search results
  // and extract competitor information from the snippets and titles
  
  searchResults.forEach(result => {
    const title = result.title || ''
    const snippet = result.snippet || ''
    const url = result.url || ''

    // Extract potential competitor names from titles and snippets
    const text = `${title} ${snippet}`.toLowerCase()
    
    // Look for company/product names (this is a basic implementation)
    const potentialNames = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
    
    potentialNames.forEach(name => {
      if (name.toLowerCase() !== excludeProduct.toLowerCase() && 
          name.length > 2 && 
          name.length < 50 &&
          !name.includes('http') &&
          !name.includes('www')) {
        
        competitors.push({
          name: name,
          website: url,
          description: snippet.substring(0, 200),
          source: 'web_search'
        })
      }
    })
  })

  return competitors.slice(0, 5) // Limit per search result
}

function generateManualCompetitors(productName: string, category: string): CompetitorData[] {
  const competitors: CompetitorData[] = []
  
  // Generate some hypothetical competitors based on category
  const categoryCompetitors: { [key: string]: string[] } = {
    'health': ['HealthPlus', 'WellnessPro', 'VitalLife', 'NutriMax'],
    'wellness': ['WellnessWorks', 'HealthyLife', 'PureWellness', 'VitalityPlus'],
    'digestive': ['DigestPro', 'GutHealth', 'DigestiveWell', 'CleanDigest'],
    'supplement': ['SupplementPro', 'NutriBoost', 'HealthSupply', 'VitalSup'],
    'fitness': ['FitnessPro', 'ActiveLife', 'FitWell', 'PowerFit'],
    'beauty': ['BeautyPro', 'GlowWell', 'PureSkin', 'BeautyBoost'],
    'skincare': ['SkinPro', 'ClearSkin', 'PureDerm', 'GlowSkin']
  }

  // Find matching category keywords
  const lowerCategory = category.toLowerCase()
  Object.keys(categoryCompetitors).forEach(key => {
    if (lowerCategory.includes(key)) {
      categoryCompetitors[key].forEach(competitorName => {
        competitors.push({
          name: competitorName,
          description: `A competitor in the ${category} space`,
          positioning: `Alternative to ${productName}`,
          source: 'category_analysis'
        })
      })
    }
  })

  return competitors.slice(0, 5)
} 