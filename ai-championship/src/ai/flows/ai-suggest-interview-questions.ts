import { geminiPro } from '@/ai/genkit';
import { z } from 'zod';

const AiSuggestInterviewQuestionsInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job.'),
  jobDescription: z.string().describe('The full job description.'),
});

export type AiSuggestInterviewQuestionsInput = z.infer<typeof AiSuggestInterviewQuestionsInputSchema>;

const AiSuggestInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of suggested interview questions.'),
});

export type AiSuggestInterviewQuestionsOutput = z.infer<typeof AiSuggestInterviewQuestionsOutputSchema>;

export async function aiSuggestInterviewQuestions(
  input: AiSuggestInterviewQuestionsInput
): Promise<AiSuggestInterviewQuestionsOutput> {
  try {
    const prompt = `You are an expert hiring manager. Based on the following job title and description, please generate a list of 5-7 insightful interview questions to ask a candidate. Focus on a mix of behavioral, technical, and situational questions.

Job Title: ${input.jobTitle}

Job Description:
---
${input.jobDescription}
---

Return ONLY valid JSON with this structure:
{
  "questions": ["question 1", "question 2", ...]
}`;

    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return {
      questions: Array.isArray(parsed.questions) ? parsed.questions : []
    };
  } catch (error) {
    console.error('Error suggesting interview questions:', error);
    return {
      questions: [
        'Tell me about your experience with this role.',
        'What are your key strengths?',
        'Describe a challenging project you worked on.',
        'How do you handle tight deadlines?',
        'Why are you interested in this position?'
      ]
    };
  }
}
