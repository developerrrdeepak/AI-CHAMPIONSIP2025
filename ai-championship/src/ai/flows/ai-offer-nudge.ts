
'use server';

/**
 * @fileOverview An AI agent that provides suggestions to make a job offer more competitive.
 *
 * - aiOfferNudge - A function that generates "nudges" or suggestions for a job offer.
 * - AiOfferNudgeInput - The input type for the function.
 * - AiOfferNudgeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiOfferNudgeInputSchema = z.object({
  jobTitle: z.string().describe("The title of the job."),
  seniorityLevel: z.string().describe("The seniority level for the role (e.g., Junior, Senior, Lead)."),
  requiredSkills: z.array(z.string()).describe("A list of key required skills for the job."),
  location: z.string().describe("The job location (e.g., 'Remote', 'New York, NY')."),
  currentMinSalary: z.number().optional().describe("The current minimum salary for the offer, if any."),
  currentMaxSalary: z.number().optional().describe("The current maximum salary for the offer, if any."),
});
export type AiOfferNudgeInput = z.infer<typeof AiOfferNudgeInputSchema>;

const NudgeSchema = z.object({
    category: z.enum(['Salary', 'Benefits', 'Perks', 'Culture']).describe("The category of the suggestion."),
    suggestion: z.string().describe("The specific, actionable suggestion to improve the offer."),
    reasoning: z.string().describe("A brief explanation of why this suggestion would be effective for this type of role."),
});

const AiOfferNudgeOutputSchema = z.object({
  nudges: z.array(NudgeSchema).describe("A list of suggestions to make the job offer more competitive."),
});
export type AiOfferNudgeOutput = z.infer<typeof AiOfferNudgeOutputSchema>;

export async function aiOfferNudge(input: AiOfferNudgeInput): Promise<AiOfferNudgeOutput> {
  return aiOfferNudgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiOfferNudgePrompt',
  input: {schema: AiOfferNudgeInputSchema},
  output: {schema: AiOfferNudgeOutputSchema},
  prompt: `You are an expert compensation and benefits strategist with deep knowledge of the tech industry job market.
Your task is to analyze the details of a job and provide 3-4 specific, actionable "nudges" to make the offer more competitive and attractive to top candidates.

Job Details:
- Title: {{{jobTitle}}}
- Seniority: {{{seniorityLevel}}}
- Location: {{{location}}}
- Key Skills: {{#each requiredSkills}}{{{this}}}, {{/each}}
{{#if currentMinSalary}}- Current Salary Range: {{{currentMinSalary}}} - {{{currentMaxSalary}}}{{/if}}

Based on these details, generate a list of suggestions. Focus on what would be most impactful for this specific role. For example, for a senior remote engineer, you might suggest a higher stipend for home office setup. For a junior role, you might suggest a stronger professional development budget.

Provide a mix of suggestions across categories like Salary, Benefits, Perks, and Culture. Be creative and specific.`,
});

const aiOfferNudgeFlow = ai.defineFlow(
  {
    name: 'aiOfferNudgeFlow',
    inputSchema: AiOfferNudgeInputSchema,
    outputSchema: AiOfferNudgeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
