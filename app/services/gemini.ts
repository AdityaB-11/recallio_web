import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Simple in-memory cache for nutrition info
interface NutritionCache {
  [key: string]: {
    data: NutritionInfo;
    timestamp: number;
  };
}

// Cache expires after 24 hours
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const nutritionCache: NutritionCache = {};

interface AnalysisResult {
  type: 'task' | 'expense' | 'calorie';
  data: any;
  confidence: number;
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  try {
    // Use Gemini-flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare the prompt for the model
    const prompt = `
      Analyze this text and categorize it as either a task, an expense, or a calorie/food entry.
      If it's a task, extract the task name, due date (if any), priority (if any), and any other relevant details.
      If it's an expense, extract the amount, category, date, and any other relevant details.
      If it's a calorie/food entry, extract the food item(s), calorie count (if specified), macronutrients (if specified), and any other relevant details.
      
      Respond with a JSON object with the following format:
      {
        "type": "task" | "expense" | "calorie",
        "data": {
          // Extracted data based on the type
        },
        "confidence": 0.0 to 1.0 // How confident the model is in its categorization
      }
      
      Text to analyze: "${text}"
    `;

    // Generate content and get the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as AnalysisResult;
    }
    
    throw new Error('Could not parse AI response');
  } catch (error) {
    console.error('Error analyzing text with Gemini:', error);
    
    // Return a default response if there's an error
    return {
      type: 'task', // Default type
      data: { raw: text },
      confidence: 0
    };
  }
}

/**
 * Interface representing nutritional information for a food item
 */
export interface NutritionInfo {
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
  };
  servingSize?: string;
}

/**
 * Get cache key for nutrition info
 */
function getNutritionCacheKey(foodName: string, servingSize?: string): string {
  return `${foodName.toLowerCase().trim()}:${(servingSize || '').toLowerCase().trim()}`;
}

/**
 * Generate nutritional information for a food item using Gemini AI
 * @param foodName The name of the food item
 * @param servingSize Optional serving size specification
 * @returns Promise with the nutritional information
 */
export async function generateNutritionInfo(foodName: string, servingSize?: string): Promise<NutritionInfo> {
  try {
    // Check cache first
    const cacheKey = getNutritionCacheKey(foodName, servingSize);
    const now = Date.now();
    
    // If we have a valid cached result, return it
    if (nutritionCache[cacheKey] && (now - nutritionCache[cacheKey].timestamp) < CACHE_EXPIRY) {
      console.log('Cache hit for nutrition info:', cacheKey);
      return nutritionCache[cacheKey].data;
    }
    
    console.log('Cache miss for nutrition info, generating:', cacheKey);
    
    // Use Gemini-flash model for faster response
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const servingSizeText = servingSize ? `for ${servingSize} of` : 'for a standard serving of';
    
    // Prepare the prompt for the model
    const prompt = `
      Generate accurate nutritional information ${servingSizeText} ${foodName}.
      
      Respond with a JSON object with the following format:
      {
        "calories": number,
        "macros": {
          "protein": number (in grams),
          "carbs": number (in grams),
          "fat": number (in grams),
          "fiber": number (in grams),
          "sugar": number (in grams)
        },
        "servingSize": "standard serving description if not provided"
      }
      
      Make sure all numerical values are realistic and accurate. If the exact nutritional information is uncertain,
      provide a reasonable estimate based on similar foods. All numbers should be just the number without units.
    `;

    // Generate content and get the response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    
    // Extract JSON from the response
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const nutritionData = JSON.parse(jsonMatch[0]);
      
      // Ensure we have all required fields with reasonable values
      const nutritionInfo = {
        calories: Math.max(0, Math.round(nutritionData.calories) || 0),
        macros: {
          protein: Math.max(0, parseFloat(nutritionData.macros?.protein) || 0),
          carbs: Math.max(0, parseFloat(nutritionData.macros?.carbs) || 0),
          fat: Math.max(0, parseFloat(nutritionData.macros?.fat) || 0),
          fiber: nutritionData.macros?.fiber !== undefined ? Math.max(0, parseFloat(nutritionData.macros.fiber)) : undefined,
          sugar: nutritionData.macros?.sugar !== undefined ? Math.max(0, parseFloat(nutritionData.macros.sugar)) : undefined
        },
        servingSize: nutritionData.servingSize || servingSize
      };
      
      // Cache the result
      nutritionCache[cacheKey] = {
        data: nutritionInfo,
        timestamp: now
      };
      
      return nutritionInfo;
    }
    
    throw new Error('Could not parse AI response for nutrition information');
  } catch (error) {
    console.error('Error generating nutrition info with Gemini:', error);
    
    // Return a default/fallback response with conservative estimates
    return {
      calories: 100,
      macros: {
        protein: 5,
        carbs: 10,
        fat: 5
      },
      servingSize: servingSize || 'standard serving'
    };
  }
} 