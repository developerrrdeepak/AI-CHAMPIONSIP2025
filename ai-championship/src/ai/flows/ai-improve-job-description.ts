import { geminiPro } from '@/ai/genkit';
import { z } from 'zod';

const AIImproveJobDescriptionInputSchema = z.object({
  jobDescription: z.string().describe('The job description to improve.'),
});

export type AIImproveJobDescriptionInput = z.infer<typeof AIImproveJobDescriptionInputSchema>;

const AIImproveJobDescriptionOutputSchema = z.object({
  improvedJobDescription: z.string().describe('The improved job description.'),
});

export type AIImproveJobDescriptionOutput = z.infer<typeof AIImproveJobDescriptionOutputSchema>;

export async function aiImproveJobDescription(input: AIImproveJobDescriptionInput): Promise<AIImproveJobDescriptionOutput> {
  try {
    const prompt = `You are an expert at writing compelling and inclusive job descriptions that attract top-tier, diverse candidates.

Please review the following job description and rewrite it to be more engaging, clear, and appealing. Focus on:
- Using inclusive language.
- Highlighting the company culture and impact of the role.
- Clearly defining responsibilities and qualifications.
- Making it exciting for potential applicants.

Job Description:
${input.jobDescription}

Return ONLY the improved job description text, no JSON, no markdown formatting.`;

    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    const improvedText = response.text().trim();
    
    return {
      improvedJobDescription: improvedText
    };
  } catch (error) {
    console.error('Error improving job description:', error);
    return {
      improvedJobDescription: input.jobDescription
    };
  }
}
