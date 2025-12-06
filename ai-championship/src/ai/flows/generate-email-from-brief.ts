
// src/ai/flows/generate-email-from-brief.ts
'use server';
/**
 * @fileOverview Generates an email template from a brief description.
 *
 * - generateEmailFromBrief - A function that generates an email template based on a given brief.
 * - GenerateEmailFromBriefInput - The input type for the generateEmailFromBrief function.
 * - GenerateEmailFromBriefOutput - The return type for the generateEmailFromBrief function.
 */

import {ai, geminiPro} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailFromBriefInputSchema = z.object({
  brief: z.string().describe('A brief description of the email to generate, including context like candidate name and job title.'),
});
export type GenerateEmailFromBriefInput = z.infer<
  typeof GenerateEmailFromBriefInputSchema
>;

const GenerateEmailFromBriefOutputSchema = z.object({
  subject: z.string().describe('The generated email subject line.'),
  body: z.string().describe('The generated email body content.'),
});
export type GenerateEmailFromBriefOutput = z.infer<
  typeof GenerateEmailFromBriefOutputSchema
>;

export async function generateEmailFromBrief(
  input: any
): Promise<GenerateEmailFromBriefOutput> {
  return generateEmailFromBriefFlow(input);
}

const generateEmailFromBriefPrompt = ai.definePrompt({
  name: 'generateEmailFromBriefPrompt',
  input: {schema: GenerateEmailFromBriefInputSchema},
  output: {schema: GenerateEmailFromBriefOutputSchema},
  model: geminiPro,
  prompt: `You are an expert recruitment email writer. Based on the provided brief, create a professional, empathetic, and effective email.

Keep the tone appropriate for the context (e.g., encouraging for an invite, respectful for a rejection). Ensure the output is only the subject and body.

Brief Description: {{{brief}}}`,
});

const generateEmailFromBriefFlow = ai.defineFlow(
  {
    name: 'generateEmailFromBriefFlow',
    inputSchema: GenerateEmailFromBriefInputSchema,
    outputSchema: GenerateEmailFromBriefOutputSchema,
  },
  async input => {
    const {output} = await generateEmailFromBriefPrompt(input);
    return output!;
  }
);
