
'use server';

/**
 * @fileOverview An AI agent that summarizes interview feedback.
 *
 * - aiSummarizeFeedback - A function that takes feedback from multiple interviewers and creates a consolidated summary.
 * - AiSummarizeFeedbackInput - The input type for the function.
 * - AiSummarizeFeedbackOutput - The return type for the function.
 */

import {ai, geminiPro} from '@/ai/genkit';
import {z} from 'genkit';

const InterviewerFeedbackSchema = z.object({
    interviewerName: z.string().describe("The name of the interviewer."),
    rating: z.number().describe("The overall rating the interviewer gave, from 1 to 5."),
    pros: z.string().describe("The strengths or positive points noted by the interviewer."),
    cons: z.string().describe("The weaknesses or concerns noted by the interviewer."),
    verdict: z.string().describe("The final recommendation from the interviewer (e.g., 'Hire', 'No Hire').")
});

const AiSummarizeFeedbackInputSchema = z.object({
  jobTitle: z.string().describe("The job title the candidate is being considered for."),
  candidateName: z.string().describe("The name of the candidate."),
  feedbacks: z.array(InterviewerFeedbackSchema).describe("An array of feedback objects from each interviewer."),
});
export type AiSummarizeFeedbackInput = z.infer<typeof AiSummarizeFeedbackInputSchema>;

const AiSummarizeFeedbackOutputSchema = z.object({
  overallSummary: z.string().describe("A 2-3 paragraph summary synthesizing all feedback into a coherent narrative about the candidate's performance."),
  keyStrengths: z.array(z.string()).describe("A bullet-point list of the most commonly cited strengths."),
  keyWeaknesses: z.array(z.string()).describe("A bullet-point list of the most commonly cited weaknesses or concerns."),
  conflictingSignals: z.array(z.string()).describe("A bullet-point list identifying any conflicting feedback or disagreements between interviewers."),
  recommendedNextStep: z.string().describe("A suggested next step, such as 'Advance to final round', 'Hold for team matching', or 'Reject'."),
});
export type AiSummarizeFeedbackOutput = z.infer<typeof AiSummarizeFeedbackOutputSchema>;


export async function aiSummarizeFeedback(input: any): Promise<AiSummarizeFeedbackOutput> {
  return aiSummarizeFeedbackFlow(input);
}

// @ts-ignore
const prompt = ai.definePrompt({
  name: 'aiSummarizeFeedbackPrompt',
  input: {schema: AiSummarizeFeedbackInputSchema},
  output: {schema: AiSummarizeFeedbackOutputSchema},
  model: geminiPro,
  prompt: `You are an expert HR analyst at a major tech company. Your task is to review the interview feedback for a candidate and produce a balanced, concise, and insightful summary for the hiring committee.

Candidate Name: {{{candidateName}}}
Applied for: {{{jobTitle}}}

Here is the raw feedback from the interview panel:
---
{{#each feedbacks}}
Interviewer: {{this.interviewerName}}
Rating: {{this.rating}}/5
Verdict: {{this.verdict}}
Strengths: {{this.pros}}
Weaknesses: {{this.cons}}
---
{{/each}}

Based on all the provided feedback, please generate the following:
1.  **Overall Summary:** A synthesized narrative of the candidate's performance.
2.  **Key Strengths:** A consolidated list of recurring positive themes.
3.  **Key Weaknesses:** A consolidated list of recurring concerns.
4.  **Conflicting Signals:** Any areas where interviewers had notably different opinions.
5.  **Recommended Next Step:** A clear recommendation for the hiring manager.`,
});

const aiSummarizeFeedbackFlow = ai.defineFlow(
  {
    name: 'aiSummarizeFeedbackFlow',
    inputSchema: AiSummarizeFeedbackInputSchema,
    outputSchema: AiSummarizeFeedbackOutputSchema,
  },
  async (input: any) => {
    const {output} = await prompt(input);
    return output!;
  }
);
