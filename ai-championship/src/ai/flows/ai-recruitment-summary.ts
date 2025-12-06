'use server';

/**
 * @fileOverview Generates a summary of the recruiting efforts over the last week.
 *
 * - generateRecruitmentSummary - A function that generates the recruitment summary.
 * - RecruitmentSummaryInput - The input type for the generateRecruitmentSummary function.
 * - RecruitmentSummaryOutput - The return type for the generateRecruitmentSummary function.
 */

import {ai, geminiPro} from '@/ai/genkit';
import {z} from 'genkit';

const RecruitmentSummaryInputSchema = z.object({
  timeRange: z
    .string()
    .default('last week')
    .describe('The time range for the recruitment summary.'),
});
export type RecruitmentSummaryInput = z.infer<typeof RecruitmentSummaryInputSchema>;

const RecruitmentSummaryOutputSchema = z.object({
  summary: z.string().describe('A summary of the recruiting efforts.'),
});
export type RecruitmentSummaryOutput = z.infer<typeof RecruitmentSummaryOutputSchema>;

export async function generateRecruitmentSummary(input: RecruitmentSummaryInput): Promise<RecruitmentSummaryOutput> {
  return recruitmentSummaryFlow(input);
}

// @ts-ignore
const prompt = ai.definePrompt({
  name: 'recruitmentSummaryPrompt',
  input: {schema: RecruitmentSummaryInputSchema},
  output: {schema: RecruitmentSummaryOutputSchema},
  model: geminiPro,
  prompt: `You are an expert HR assistant. You will generate a summary of the recruiting efforts over the {{{timeRange}}}. Consider metrics like the total number of jobs, candidates, applications, interviews, and the conversion rate per stage. Also include any key insights or bottlenecks that have been identified. The generated summary should be concise and easy to understand.
`,
});

const recruitmentSummaryFlow = ai.defineFlow(
  {
    name: 'recruitmentSummaryFlow',
    inputSchema: RecruitmentSummaryInputSchema,
    outputSchema: RecruitmentSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
