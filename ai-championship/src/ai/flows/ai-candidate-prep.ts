
'use server';

/**
 * @fileOverview An AI agent that provides feedback on a candidate's resume for a target role.
 *
 * - aiCandidatePrep - A function that analyzes a resume and provides a summary, suggested roles, and improvement tips.
 * - AICandidatePrepInput - The input type for the function.
 * - AICandidatePrepOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AICandidatePrepInputSchema = z.object({
  resumeText: z.string().describe("The full text content of the candidate's resume."),
  targetRole: z.string().describe("The job title or role the candidate is targeting."),
});
export type AICandidatePrepInput = z.infer<typeof AICandidatePrepInputSchema>;

const AICandidatePrepOutputSchema = z.object({
  summary: z.string().describe("A 2-3 sentence summary of the candidate's professional profile based on their resume."),
  suggestedRoles: z.array(z.string()).describe("A list of 3-5 alternative or similar job titles that might be a good fit."),
  improvementTips: z.array(z.string()).describe("A bullet-point list of 3-5 actionable tips to improve the resume for the target role."),
});
export type AICandidatePrepOutput = z.infer<typeof AICandidatePrepOutputSchema>;


export async function aiCandidatePrep(input: AICandidatePrepInput): Promise<AICandidatePrepOutput> {
  return aiCandidatePrepFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCandidatePrepPrompt',
  input: { schema: AICandidatePrepInputSchema },
  output: { schema: AICandidatePrepOutputSchema },
  prompt: `You are a friendly and expert career coach. A candidate has provided their resume and a target role.
Your task is to provide concise, helpful feedback.

Resume Text:
---
{{{resumeText}}}
---

Target Role: {{{targetRole}}}

Based on the information provided, generate the following:
1. A 2-3 sentence summary of the candidate's professional profile.
2. A list of 3-5 alternative job titles that seem like a good fit.
3. A list of 3-5 specific, actionable tips on how they could improve their resume to better match the target role. Focus on things like quantifying achievements, adding specific keywords, or highlighting relevant projects.`,
});

const aiCandidatePrepFlow = ai.defineFlow(
  {
    name: 'aiCandidatePrepFlow',
    inputSchema: AICandidatePrepInputSchema,
    outputSchema: AICandidatePrepOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
