
'use server';

/**
 * @fileOverview An AI agent that analyzes a candidate's resume.
 *
 * - aiAnalyzeCandidate - A function that analyzes a resume and provides a structured summary.
 * - AiAnalyzeCandidateInput - The input type for the function.
 * - AiAnalyzeCandidateOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {geminiPro} from '@/ai/genkit';
import {z} from 'genkit';

const AiAnalyzeCandidateInputSchema = z.object({
  resumeText: z.string().describe("The full text content of the candidate's resume."),
});
export type AiAnalyzeCandidateInput = z.infer<typeof AiAnalyzeCandidateInputSchema>;

const ProfileJsonSchema = z.object({
    summary: z.string().describe("A 2-3 paragraph summary of the candidate's profile, experience, and qualifications."),
    skills: z.array(z.string()).describe("A list of key technical and soft skills extracted from the resume."),
    strengths: z.array(z.string()).describe("A bullet-point list of the candidate's main strengths."),
    risks: z.array(z.string()).describe("A bullet-point list of potential risks or concerns based on the resume (e.g., job hopping, gaps in employment, missing key skills)."),
});

const AiAnalyzeCandidateOutputSchema = z.object({
  aiProfileJson: z.string().describe(`A JSON string containing the structured analysis of the candidate's profile, matching this schema: ${JSON.stringify(ProfileJsonSchema.shape)}`),
});
export type AiAnalyzeCandidateOutput = z.infer<typeof AiAnalyzeCandidateOutputSchema>;


export async function aiAnalyzeCandidate(input: any): Promise<AiAnalyzeCandidateOutput> {
  return aiAnalyzeCandidateFlow(input);
}

// // @ts-ignore
const prompt = ai.definePrompt({
  name: 'aiAnalyzeCandidatePrompt',
  input: {schema: AiAnalyzeCandidateInputSchema},
  output: {schema: ProfileJsonSchema},
  model: geminiPro,
  prompt: `You are an expert HR analyst. Analyze the following resume text and provide a structured analysis.

Resume:
{{{resumeText}}}

Based on the resume, provide the following:
1.  A concise 2-3 paragraph summary of the candidate's professional profile.
2.  A list of their key skills.
3.  A list of their primary strengths.
4.  A list of potential risks or red flags.`,
});

const aiAnalyzeCandidateFlow = ai.defineFlow(
  {
    name: 'aiAnalyzeCandidateFlow',
    inputSchema: AiAnalyzeCandidateInputSchema,
    outputSchema: AiAnalyzeCandidateOutputSchema,
  },
  async (input: any) => {
    // // @ts-ignore
    const {output} = await prompt(input);
    return {
        aiProfileJson: JSON.stringify(output)
    };
  }
);
