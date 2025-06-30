import OpenAI from 'openai'
import * as cheerio from 'cheerio'
import axios from 'axios'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeProductWebsite(url: string) {
  try {
    // Scrape website content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // Extract relevant content
    const title = $('title').text()
    const description = $('meta[name="description"]').attr('content') || ''
    const h1 = $('h1').first().text()
    const h2Elements = $('h2').map((i, el) => $(el).text()).get().slice(0, 5)
    const paragraphs = $('p').map((i, el) => $(el).text()).get().slice(0, 10).join(' ')
    
    const content = `
    Title: ${title}
    Description: ${description}
    Main Heading: ${h1}
    Subheadings: ${h2Elements.join(', ')}
    Content: ${paragraphs.substring(0, 2000)}
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