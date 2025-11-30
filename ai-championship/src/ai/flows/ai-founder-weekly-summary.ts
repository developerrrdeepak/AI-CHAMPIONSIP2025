
'use server';

/**
 * @fileOverview An AI agent that generates a weekly summary for founders.
 *
 * - aiFounderWeeklySummary - A function that generates the weekly summary.
 * - AiFounderWeeklySummaryInput - The input type for the function.
 * - AiFounderWeeklySummaryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


const AiFounderWeeklySummaryInputSchema = z.object({
  openRoles: z.number(),
  criticalRoles: z.array(z.object({ title: z.string() })),
  pipelineHealthScore: z.number(),
  hiringVelocityDays: z.number(),
  timeToHireDays: z.number(),
  funnelData: z.array(z.object({ stage: z.string(), count: z.number() })),
  bottleneckRoles: z.array(z.object({ title: z.string(), stage: z.string() })),
});

export type AiFounderWeeklySummaryInput = z.infer<typeof AiFounderWeeklySummaryInputSchema>;

const AiFounderWeeklySummaryOutputSchema = z.object({
  keyObservations: z.array(z.string()).describe("Key observations from the week's hiring data."),
  whatWentWell: z.array(z.string()).describe("Positive trends or successes."),
  whatDidNot: z.array(z.string()).describe("Negative trends or challenges."),
  rolesAtRisk: z.array(z.string()).describe("Specific roles that are facing hiring challenges."),
  pipelineOutlook: z.string().describe("A brief forecast for the upcoming week."),
  founderActionItems: z.array(z.string()).describe("Recommended actions for the founder."),
});

export type AiFounderWeeklySummaryOutput = z.infer<typeof AiFounderWeeklySummaryOutputSchema>;


export async function aiFounderWeeklySummary(input: AiFounderWeeklySummaryInput): Promise<AiFounderWeeklySummaryOutput> {
    return aiFounderWeeklySummaryFlow(input);
}


const prompt = ai.definePrompt({
  name: 'aiFounderWeeklySummaryPrompt',
  input: {schema: AiFounderWeeklySummaryInputSchema },
  output: {schema: AiFounderWeeklySummaryOutputSchema},
  prompt: `You are an expert HR analyst and strategist, reporting directly to the CEO of a fast-growing startup.
Your task is to analyze the following weekly hiring data and generate a concise, insightful executive summary.
Focus on what matters to a founder: hiring velocity, pipeline health, risks, and strategic action items.

Here is the data for the week:
- Total Open Roles: {{{openRoles}}}
- Critical Roles: {{#if criticalRoles.length}}{{#each criticalRoles}}{{this.title}}, {{/each}}{{else}}None{{/if}}
- Pipeline Health Score: {{{pipelineHealthScore}}}/100
- Average Hiring Velocity: {{{hiringVelocityDays}}} days
- Average Time to Hire: {{{timeToHireDays}}} days
- Funnel Conversion:
  {{#each funnelData}}
  - {{{this.stage}}}: {{{this.count}}}
  {{/each}}
- Bottleneck Roles: {{#if bottleneckRoles.length}}{{#each bottleneckRoles}}{{this.title}} (stuck at {{this.stage}}), {{/each}}{{else}}None{{/if}}

Based on this data, provide the executive summary. Be direct and insightful.
`,
});


const aiFounderWeeklySummaryFlow = ai.defineFlow(
  {
    name: 'aiFounderWeeklySummaryFlow',
    inputSchema: AiFounderWeeklySummaryInputSchema,
    outputSchema: AiFounderWeeklySummaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

    