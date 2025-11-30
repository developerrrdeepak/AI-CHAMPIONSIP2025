'use server';

/**
 * @fileOverview A candidate ranking AI agent.
 *
 * - aiCandidateRanking - A function that handles the candidate ranking process.
 * - AiCandidateRankingInput - The input type for the aiCandidateRanking function.
 * - AiCandidateRankingOutput - The return type for the aiCandidateRanking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCandidateRankingInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for which the candidate will be ranked.'),
  candidateResume: z
    .string()
    .describe('The text content of the candidate resume.'),
});
export type AiCandidateRankingInput = z.infer<typeof AiCandidateRankingInputSchema>;

const AiCandidateRankingOutputSchema = z.object({
  fitScore: z.number().describe('A score from 0-100 indicating how well the candidate fits the job description.'),
  reasoning: z.string().describe('A brief explanation for the assigned fit score.'),
});

export type AiCandidateRankingOutput = z.infer<typeof AiCandidateRankingOutputSchema>;

export async function aiCandidateRanking(input: AiCandidateRankingInput): Promise<AiCandidateRankingOutput> {
  return aiCandidateRankingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCandidateRankingPrompt',
  input: {schema: AiCandidateRankingInputSchema},
  output: {schema: AiCandidateRankingOutputSchema},
  prompt: `You are an expert AI recruiter. Your task is to score a candidate based on their resume against a specific job description.

Provide a fit score from 0 to 100, where 100 is a perfect match.
Also provide a concise, one-paragraph reasoning for your score, highlighting the key matching skills and experience, as well as any potential gaps.

Job Description:
---
{{{jobDescription}}}
---

Candidate's Resume:
---
{{{candidateResume}}}
---
`,
});

const aiCandidateRankingFlow = ai.defineFlow(
  {
    name: 'aiCandidateRankingFlow',
    inputSchema: AiCandidateRankingInputSchema,
    outputSchema: AiCandidateRankingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
