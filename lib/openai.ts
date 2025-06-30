import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Simplified web scraping without cheerio
async function scrapeWebsiteContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract content using regex patterns
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ''
    const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] || ''
    
    // Extract headings
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const h1 = h1Match?.[1] || ''
    
    const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || []
    const h2Elements = h2Matches.slice(0, 5).map(match => 
      match.replace(/<[^>]*>/g, '').trim()
    )
    
    // Extract some paragraph content
    const pMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || []
    const paragraphs = pMatches.slice(0, 10).map(match => 
      match.replace(/<[^>]*>/g, '').trim()
    ).join(' ')
    
    return {
      title: title.trim(),
      description: description.trim(),
      h1: h1.trim(),
      h2Elements,
      content: paragraphs.substring(0, 2000)
    }
  } catch (error) {
    console.error('Error scraping website:', error)
    throw new Error('Failed to scrape website content')
  }
}

export async function analyzeProductWebsite(url: string) {
  try {
    // Scrape website content using simplified approach
    const scrapedData = await scrapeWebsiteContent(url)
    
    const content = `
    Title: ${scrapedData.title}
    Description: ${scrapedData.description}
    Main Heading: ${scrapedData.h1}
    Subheadings: ${scrapedData.h2Elements.join(', ')}
    Content: ${scrapedData.content}
    `
    
    // Analyze with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert marketing analyst. Analyze the website content and provide:
          1. Product category and type
          2. Target audience
          3. Key value propositions
          4. Product benefits and features
          5. Potential competitors (suggest 3-5 similar products/brands)
          6. Marketing angles and hooks
          7. Suggested ad creative themes
          
          Format your response as JSON with these keys: category, targetAudience, valuePropositions, benefits, competitors, marketingAngles, creativeThemes`
        },
        {
          role: "user",
          content: `Analyze this website content: ${content}`
        }
      ],
      temperature: 0.7,
    })

    const analysis = completion.choices[0].message.content
    return JSON.parse(analysis || '{}')
  } catch (error) {
    console.error('Error analyzing website:', error)
    throw new Error('Failed to analyze website')
  }
}

export async function findCompetitors(productName: string, category: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a competitive intelligence expert. Find and analyze competitors for the given product. Provide detailed information about:
          1. Direct competitors (3-5)
          2. Indirect competitors (2-3)
          3. Market positioning
          4. Key differentiators
          5. Pricing strategies
          6. Marketing approaches
          
          Format as JSON with keys: directCompetitors, indirectCompetitors, marketPositioning, differentiators, pricingStrategies, marketingApproaches`
        },
        {
          role: "user",
          content: `Find competitors for: ${productName} in the ${category} category`
        }
      ],
      temperature: 0.7,
    })

    const analysis = completion.choices[0].message.content
    return JSON.parse(analysis || '{}')
  } catch (error) {
    console.error('Error finding competitors:', error)
    throw new Error('Failed to find competitors')
  }
} 