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
