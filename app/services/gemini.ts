import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

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