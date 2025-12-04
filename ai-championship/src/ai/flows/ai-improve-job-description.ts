'use server';

/**
 * @fileOverview An AI agent that improves job descriptions.
 *
 * - aiImproveJobDescription - A function that suggests improvements to a job description.
 * - AIImproveJobDescriptionInput - The input type for the aiImproveJobDescription function.
 * - AIImproveJobDescriptionOutput - The return type for the aiImproveJobDescription function.
 */

import {ai, geminiPro} from '@/ai/genkit';
import {z} from 'genkit';

const AIImproveJobDescriptionInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description to improve.'),
});
export type AIImproveJobDescriptionInput = z.infer<typeof AIImproveJobDescriptionInputSchema>;

const AIImproveJobDescriptionOutputSchema = z.object({
  improvedJobDescription: z.string().describe('The improved job description.'),
});
export type AIImproveJobDescriptionOutput = z.infer<typeof AIImproveJobDescriptionOutputSchema>;

export async function aiImproveJobDescription(input: AIImproveJobDescriptionInput): Promise<AIImproveJobDescriptionOutput> {
  return aiImproveJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiImproveJobDescriptionPrompt',
  input: {schema: AIImproveJobDescriptionInputSchema},
  output: {schema: AIImproveJobDescriptionOutputSchema},
  model: geminiPro,
  prompt: `You are an expert at writing compelling and inclusive job descriptions that attract top-tier, diverse candidates.

  Please review the following job description and rewrite it to be more engaging, clear, and appealing. Focus on:
  - Using inclusive language.
  - Highlighting the company culture and impact of the role.
  - Clearly defining responsibilities and qualifications.
  - Making it exciting for potential applicants.

  Job Description: {{{jobDescription}}}

  Return only the rewritten, improved job description.`,
});

const aiImproveJobDescriptionFlow = ai.defineFlow(
  {
    name: 'aiImproveJobDescriptionFlow',
    inputSchema: AIImproveJobDescriptionInputSchema,
    outputSchema: AIImproveJobDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
