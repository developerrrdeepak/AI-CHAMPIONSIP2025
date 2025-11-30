'use server';

/**
 * @fileOverview An AI agent that suggests interview questions based on a job description.
 *
 * - aiSuggestInterviewQuestions - A function that suggests questions.
 * - AiSuggestInterviewQuestionsInput - The input type for the function.
 * - AiSuggestInterviewQuestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSuggestInterviewQuestionsInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job.'),
  jobDescription: z
    .string()
    .describe('The full job description.'),
});
export type AiSuggestInterviewQuestionsInput = z.infer<typeof AiSuggestInterviewQuestionsInputSchema>;

const AiSuggestInterviewQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('A list of suggested interview questions.'),
});
export type AiSuggestInterviewQuestionsOutput = z.infer<typeof AiSuggestInterviewQuestionsOutputSchema>;

export async function aiSuggestInterviewQuestions(
  input: AiSuggestInterviewQuestionsInput
): Promise<AiSuggestInterviewQuestionsOutput> {
  return aiSuggestInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSuggestInterviewQuestionsPrompt',
  input: {schema: AiSuggestInterviewQuestionsInputSchema},
  output: {schema: AiSuggestInterviewQuestionsOutputSchema},
  prompt: `You are an expert hiring manager. Based on the following job title and description, please generate a list of 5-7 insightful interview questions to ask a candidate. Focus on a mix of behavioral, technical, and situational questions.

Job Title: {{{jobTitle}}}

Job Description:
---
{{{jobDescription}}}
---
`,
});

const aiSuggestInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'aiSuggestInterviewQuestionsFlow',
    inputSchema: AiSuggestInterviewQuestionsInputSchema,
    outputSchema: AiSuggestInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
