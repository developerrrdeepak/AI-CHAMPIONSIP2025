'use server';

/**
 * @fileOverview An AI agent that sources candidates for a job description.
 *
 * - aiSourceCandidates - A function that sources potential candidates based on a job description.
 * - AISourceCandidatesInput - The input type for the function.
 * - AISourceCandidatesOutput - The return type for the function.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'genkit';

export const CandidateProfileSchema = z.object({
  name: z.string().describe('Full name of the candidate'),
  profileUrl: z.string().url().describe('URL of the candidate’s professional profile (e.g., LinkedIn, GitHub)'),
  summary: z.string().describe('A brief summary of the candidate’s skills and experience relevant to the job'),
  location: z.string().optional().describe('The candidate’s current location'),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;


const AISourceCandidatesInputSchema = z.object({
  jobDescription: z.string().describe('The job description to source candidates for'),
});
export type AISourceCandidatesInput = z.infer<typeof AISourceCandidatesInputSchema>;

const AISourceCandidatesOutputSchema = z.object({
  candidates: z.array(CandidateProfileSchema).describe('A list of potential candidates'),
});
export type AISourceCandidatesOutput = z.infer<typeof AISourceCandidatesOutputSchema>;

export async function sourceCandidatesFlow(jobDescription: string): Promise<CandidateProfile[]> {
    const input = { jobDescription };
    const result = await aiSourceCandidatesFlow(input);
    return result.candidates;
}

// @ts-ignore
const prompt = ai.definePrompt({
  name: 'aiSourceCandidatesPrompt',
  input: { schema: AISourceCandidatesInputSchema },
  output: { schema: AISourceCandidatesOutputSchema },
  model: geminiPro,
  prompt: `You are an expert technical recruiter with access to a vast network of professional profiles. Your task is to find the best possible candidates for the following job description.
Search public platforms like LinkedIn, GitHub, and technical communities for suitable candidates.

Job Description:
{{{jobDescription}}}

Based on your search, provide a list of 3-5 potential candidates who appear to be a strong match.
For each candidate, return their full name, a URL to their professional profile, a brief summary of their relevant skills and experience, and their location if available.`,
});

const aiSourceCandidatesFlow = ai.defineFlow(
  {
    name: 'aiSourceCandidatesFlow',
    inputSchema: AISourceCandidatesInputSchema,
    outputSchema: AISourceCandidatesOutputSchema,
  },
  async (input: any) => {
    const { output } = await prompt(input);
    return output!;
  }
);
