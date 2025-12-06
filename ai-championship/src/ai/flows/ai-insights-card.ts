'use server';

/**
 * @fileOverview An AI insights card generator for the dashboard.
 *
 * - generateDashboardInsights - A function that generates insights for the dashboard.
 * - GenerateDashboardInsightsInput - The input type for the generateDashboardInsights function. Currently empty.
 * - GenerateDashboardInsightsOutput - The return type for the generateDashboardInsights function.
 */

import {ai, geminiFlash} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDashboardInsightsInputSchema = z.object({});
export type GenerateDashboardInsightsInput = z.infer<
  typeof GenerateDashboardInsightsInputSchema
>;

const GenerateDashboardInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of insights for the dashboard.'),
});
export type GenerateDashboardInsightsOutput = z.infer<
  typeof GenerateDashboardInsightsOutputSchema
>;

export async function generateDashboardInsights(
  input: GenerateDashboardInsightsInput
): Promise<GenerateDashboardInsightsOutput> {
  return generateDashboardInsightsFlow(input);
}

// @ts-ignore
const prompt = ai.definePrompt({
  name: 'generateDashboardInsightsPrompt',
  input: {schema: GenerateDashboardInsightsInputSchema},
  output: {schema: GenerateDashboardInsightsOutputSchema},
  model: geminiFlash,
  prompt: `You are an AI assistant that analyzes recruiting data and generates a summary of insights for a hiring manager's dashboard. Focus on trends and key metrics related to jobs, candidates, applications, and interviews.
`,
});

const generateDashboardInsightsFlow = ai.defineFlow(
  {
    name: 'generateDashboardInsightsFlow',
    inputSchema: GenerateDashboardInsightsInputSchema,
    outputSchema: GenerateDashboardInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
