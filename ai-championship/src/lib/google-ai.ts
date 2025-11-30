import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');

export async function generateAIResponse(prompt: string, context?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const enhancedPrompt = context 
      ? `Context: ${context}\n\nUser Query: ${prompt}\n\nProvide a helpful response for this recruitment platform scenario.`
      : prompt;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Google AI error:', error);
    throw new Error('AI response generation failed');
  }
}

export async function analyzeResume(resumeText: string, jobDescription?: string) {
  const prompt = jobDescription
    ? `Analyze this resume against the job description and provide matching insights:\n\nResume: ${resumeText}\n\nJob Description: ${jobDescription}`
    : `Analyze this resume and provide professional insights:\n\n${resumeText}`;

  return generateAIResponse(prompt, 'resume_analysis');
}

export async function generateInterviewQuestions(jobTitle: string, requirements: string[]) {
  const prompt = `Generate 5 relevant interview questions for a ${jobTitle} position with these requirements: ${requirements.join(', ')}`;
  return generateAIResponse(prompt, 'interview_questions');
}