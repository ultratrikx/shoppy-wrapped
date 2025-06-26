export interface ShoppingPersonality {
  title: string
  description: string
  emoji: string
}

export const generateShoppingPersonality = async (productTitles: string[]): Promise<string> => {
  if (!productTitles.length) {
    return "fresh shopper, discovery seeker, journey beginner"
  }

  // For hackathon demo, you can add your OpenAI API key here
  const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY

  if (!OPENAI_API_KEY) {
    // Fallback to local analysis if no API key
    return generateLocalPersonality(productTitles)
  }

  const vibePrompt = `
You are a shopper‐persona generator. Given a list of product titles, output exactly 3–5 vivid, comma-separated persona labels—no explanations or extra text. Use diverse, creative terms drawn from a broad vocabulary.

Example:
Products: ["roses", "Valentine's chocolates", "greeting card"]
Labels: romantic admirer, heartfelt gift-giver, sentiment seeker`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: vibePrompt
          },
          {
            role: 'user',
            content: `Products: ${JSON.stringify(productTitles)}`
          }
        ],
        max_tokens: 50,
        temperature: 0.8
      })
    })

    const data = await response.json()
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      // Clean up the response to extract just the labels
      let labels = data.choices[0].message.content.trim()
      
      // Remove "Labels:" prefix if present
      labels = labels.replace(/^Labels:\s*/i, '')
      
      return labels
    } else {
      throw new Error('Invalid OpenAI response')
    }
  } catch (error) {
    console.log('OpenAI API error, falling back to local analysis:', error)
    return generateLocalPersonality(productTitles)
  }
}

const generateLocalPersonality = (productTitles: string[]): string => {
  const categories = analyzeProductCategories(productTitles)
  return generatePersonalityFromCategories(categories)
}

const analyzeProductCategories = (productTitles: string[]) => {
  const categories = {
    romantic: 0,
    streetwear: 0,
    wellness: 0,
    tech: 0,
    books: 0,
    beauty: 0,
    food: 0,
    music: 0,
    cottagecore: 0,
    party: 0,
    academic: 0,
    fitness: 0
  }

  productTitles.forEach(title => {
    const lowerTitle = title.toLowerCase()
    
    // Romantic vibes
    if (lowerTitle.match(/rose|valentine|chocolate|card|love|heart|romantic|flower|date|wine|candle|jewelry|ring/)) {
      categories.romantic++
    }
    
    // Streetwear/Hype
    if (lowerTitle.match(/sneaker|nike|adidas|supreme|off.white|yeezy|jordan|hoodie|streetwear|hype|vintage|thrift|oversized/)) {
      categories.streetwear++
    }
    
    // Wellness/Health
    if (lowerTitle.match(/matcha|green.tea|supplement|vitamin|yoga|pilates|meditation|crystal|sage|essential.oil|skincare|gua.sha/)) {
      categories.wellness++
    }
    
    // Music/Concert vibes
    if (lowerTitle.match(/ticket|concert|vinyl|taylor.swift|laufey|spotify|headphone|speaker|festival|band.tee/)) {
      categories.music++
    }
    
    // Tech
    if (lowerTitle.match(/gadget|laptop|monitor|keyboard|mouse|charger|cable|phone|tablet|airpod|tech|coding|productivity/)) {
      categories.tech++
    }
    
    // Cottage core
    if (lowerTitle.match(/plant|succulent|pottery|ceramic|linen|mushroom|cottagecore|vintage.book|tea.set|basket|dried.flower/)) {
      categories.cottagecore++
    }
    
    // Party/Social
    if (lowerTitle.match(/party|alcohol|champagne|cocktail|glitter|sequin|party.dress|heels|going.out|club/)) {
      categories.party++
    }
    
    // Academic
    if (lowerTitle.match(/book|journal|pen|notebook|library|study|coffee|academia|planner|stationery/)) {
      categories.academic++
    }
    
    // Beauty
    if (lowerTitle.match(/makeup|lipstick|foundation|mascara|eyeshadow|blush|perfume|nail.polish|beauty|cosmetic/)) {
      categories.beauty++
    }
    
    // Food/Snacks
    if (lowerTitle.match(/snack|chips|candy|cookie|chocolate|coffee|tea|food|drink|protein.bar/)) {
      categories.food++
    }
    
    // Fitness
    if (lowerTitle.match(/gym|workout|protein|weights|fitness|running|sports|athletic|activewear/)) {
      categories.fitness++
    }
  })

  return categories
}

const generatePersonalityFromCategories = (categories: any): string => {
  const sortedCategories = Object.keys(categories).sort((a, b) => categories[b] - categories[a])
  const topCategories = sortedCategories.slice(0, 3).filter(cat => categories[cat] > 0)
  
  const personalityMap = {
    romantic: "romantic admirer, heartfelt gift-giver, sentiment seeker",
    streetwear: "style maverick, trend collector, aesthetic curator",
    wellness: "mindful consumer, self-care devotee, wellness warrior",
    music: "melody chaser, concert enthusiast, sound collector",
    tech: "innovation seeker, digital optimizer, gadget connoisseur",
    cottagecore: "nature enthusiast, cozy curator, simple living advocate",
    party: "social butterfly, celebration planner, nightlife navigator",
    academic: "knowledge seeker, literary collector, study companion",
    beauty: "beauty explorer, self-expression artist, glow enhancer",
    food: "flavor adventurer, taste explorer, comfort seeker",
    fitness: "wellness warrior, strength builder, active lifestyle champion"
  }

  if (topCategories.length === 0) {
    return "curious explorer, discovery enthusiast, journey beginner"
  }

  // Generate a mix from top categories
  const selectedLabels = topCategories.slice(0, 2).map(cat => {
    const labels = personalityMap[cat as keyof typeof personalityMap].split(', ')
    return labels[Math.floor(Math.random() * labels.length)]
  })

  // Add a general descriptor
  const generalDescriptors = ["mindful shopper", "taste maker", "lifestyle curator", "thoughtful buyer", "conscious consumer"]
  selectedLabels.push(generalDescriptors[Math.floor(Math.random() * generalDescriptors.length)])

  return selectedLabels.join(', ')
} 