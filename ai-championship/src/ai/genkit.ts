import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || '';

if (!apiKey) {
  console.warn('GOOGLE_GENAI_API_KEY not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });
export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

// Simple AI wrapper for flows
export const ai = {
  defineFlow: (config: any, handler: any) => handler,
  definePrompt: (config: any) => async (input: any) => {
    let promptText = config.prompt;
    if (typeof input === 'object') {
        for (const key in input) {
            promptText = promptText.replace(new RegExp(`{{{${key}}}}`, 'g'), input[key]);
        }
    } else if (typeof input === 'string') {
        promptText = promptText.replace(/{{{.*}}}/g, input);
    }
    
    try {
        const result = await geminiPro.generateContent(promptText);
        const response = await result.response;
        const text = response.text();
        // Try to parse JSON if the output is expected to be JSON
        if (config.output && config.output.schema) {
             const cleanText = text.replace(/```json\n|\n```/g, '').replace(/```/g, '');
             try {
                return { output: JSON.parse(cleanText) };
             } catch (e) {
                 console.warn("Failed to parse JSON from AI response", text);
                 return { output: text };
             }
        }
        return { output: text };
    } catch (error) {
        console.error("AI Generation failed", error);
        throw error;
    }
  },
  generate: async (input: any) => {
    const prompt = typeof input === 'string' ? input : input.resumeText || JSON.stringify(input);
    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      return { output: JSON.parse(text) };
    } catch {
      return { output: text };
    }
  }
};
