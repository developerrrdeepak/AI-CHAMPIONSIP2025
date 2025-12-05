import { geminiPro } from '@/ai/genkit';
import { z } from 'zod';

const AiCandidateRankingInputSchema = z.object({
  jobDescription: z.string().describe('The job description for which the candidate will be ranked.'),
  candidateResume: z.string().describe('The text content of the candidate resume.'),
});

export type AiCandidateRankingInput = z.infer<typeof AiCandidateRankingInputSchema>;

const AiCandidateRankingOutputSchema = z.object({
  fitScore: z.number().describe('A score from 0-100 indicating how well the candidate fits the job description.'),
  reasoning: z.string().describe('A brief explanation for the assigned fit score.'),
});

export type AiCandidateRankingOutput = z.infer<typeof AiCandidateRankingOutputSchema>;

export async function aiCandidateRanking(input: AiCandidateRankingInput): Promise<AiCandidateRankingOutput> {
  try {
    const prompt = `You are an expert AI recruiter. Your task is to score a candidate based on their resume against a specific job description.

Provide a fit score from 0 to 100, where 100 is a perfect match.
Also provide a concise, one-paragraph reasoning for your score, highlighting the key matching skills and experience, as well as any potential gaps.

Job Description:
---
${input.jobDescription}
---

Candidate's Resume:
---
${input.candidateResume}
---

Return ONLY valid JSON with this structure:
{
  "fitScore": number (0-100),
  "reasoning": "string"
}`;

    const result = await geminiPro.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return {
      fitScore: Math.min(100, Math.max(0, parsed.fitScore || 0)),
      reasoning: parsed.reasoning || 'No reasoning provided'
    };
  } catch (error) {
    console.error('Error in candidate ranking:', error);
    return {
      fitScore: 50,
      reasoning: 'Unable to analyze candidate fit at this time.'
    };
  }
}
