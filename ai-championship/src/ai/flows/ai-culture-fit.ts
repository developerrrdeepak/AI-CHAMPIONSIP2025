
'use server';

/**
 * @fileOverview An AI agent that analyzes cultural fit between a candidate and a job.
 *
 * - aiCultureFit - A function that provides a short summary of cultural alignment.
 * - AiCultureFitInput - The input type for the function.
 * - AiCultureFitOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCultureFitInputSchema = z.object({
  jobDescription: z.string().describe("The full text of the job description, including company values if available."),
  candidateResume: z.string().describe("The full text of the candidate's resume."),
});
export type AiCultureFitInput = z.infer<typeof AiCultureFitInputSchema>;

const AiCultureFitOutputSchema = z.object({
  cultureFitSummary: z.string().describe("A concise, one-paragraph summary of the candidate's potential cultural fit, highlighting alignment and potential mismatches based on language, project types, and experience described in the resume versus the job description."),
});
export type AiCultureFitOutput = z.infer<typeof AiCultureFitOutputSchema>;


export async function aiCultureFit(input: any): Promise<AiCultureFitOutput> {
  return aiCultureFitFlow(input);
}

// @ts-ignore
const prompt = ai.definePrompt({
  name: 'aiCultureFitPrompt',
  input: {schema: AiCultureFitInputSchema},
  output: {schema: AiCultureFitOutputSchema},
  prompt: `You are an expert organizational psychologist. Your task is to analyze the provided job description and candidate resume to determine a potential cultural fit.
Do not focus on skills or technical qualifications. Instead, focus on the soft signals in the language used.

- Analyze the job description for words that suggest a specific culture (e.g., "fast-paced," "highly collaborative," "autonomous," "mission-driven," "work-life balance").
- Analyze the resume for experiences and descriptions that align or clash with that culture (e.g., experience at large, slow-moving corporations vs. scrappy startups; mentions of team projects vs. solo achievements).

Based on this analysis, provide a concise, one-paragraph summary of the candidate's potential cultural fit.

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

const aiCultureFitFlow = ai.defineFlow(
  {
    name: 'aiCultureFitFlow',
    inputSchema: AiCultureFitInputSchema,
    outputSchema: AiCultureFitOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt(input);
    return output!;
  }
);
