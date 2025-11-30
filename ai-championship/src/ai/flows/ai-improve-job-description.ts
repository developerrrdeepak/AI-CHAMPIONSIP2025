'use server';

/**
 * @fileOverview An AI agent that improves job descriptions.
 *
 * - aiImproveJobDescription - A function that suggests improvements to a job description.
 * - AIImproveJobDescriptionInput - The input type for the aiImproveJobDescription function.
 * - AIImproveJobDescriptionOutput - The return type for the aiImproveJobDescription function.
 */

import {ai} from '@/ai/genkit';
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
  prompt: `You are an expert at writing job descriptions that attract high-quality candidates.

  Please review the following job description and suggest improvements to make it more appealing to potential applicants.

  Job Description: {{{jobDescription}}}`,
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
