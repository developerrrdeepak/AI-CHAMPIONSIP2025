'use server';

/**
 * @fileOverview An AI agent that schedules interviews.
 *
 * - aiScheduleInterview - A function that schedules an interview based on candidate and job details.
 * - AIScheduleInterviewInput - The input type for the function.
 * - AIScheduleInterviewOutput - The return type for the function.
 */

import { ai, geminiPro } from '@/ai/genkit';
import { z } from 'genkit';

const AIScheduleInterviewInputSchema = z.object({
  candidateEmail: z.string().email().describe('Email address of the candidate'),
  interviewerEmail: z.string().email().describe('Email address of the interviewer'),
  jobTitle: z.string().describe('The title of the job the candidate is interviewing for'),
});
export type AIScheduleInterviewInput = z.infer<typeof AIScheduleInterviewInputSchema>;

const AIScheduleInterviewOutputSchema = z.object({
  emailSubject: z.string().describe('The subject of the email to be sent to the candidate'),
  emailBody: z.string().describe('The body of the email to be sent to the candidate'),
});
export type AIScheduleInterviewOutput = z.infer<typeof AIScheduleInterviewOutputSchema>;

export async function aiScheduleInterview(input: AIScheduleInterviewInput): Promise<AIScheduleInterviewOutput> {
  return aiScheduleInterviewFlow(input);
}

// @ts-ignore
const prompt = ai.definePrompt({
  name: 'aiScheduleInterviewPrompt',
  input: { schema: AIScheduleInterviewInputSchema },
  output: { schema: AIScheduleInterviewOutputSchema },
  model: geminiPro,
  prompt: `As an expert recruitment coordinator, your task is to write a friendly and professional email to a candidate to schedule an interview.

The candidate's email is: {{{candidateEmail}}}
The interviewer's email is: {{{interviewerEmail}}}
The job title is: {{{jobTitle}}}

The email should:
1. Congratulate the candidate on moving to the interview stage.
2. Propose a video interview for the position of {{{jobTitle}}}.
3. Ask the candidate to provide their availability for the next week.
4. Mention that the interview will be with the hiring manager ({{{interviewerEmail}}}).
5. Keep the tone warm and professional.

Generate a subject and body for this email.`,
});

const aiScheduleInterviewFlow = ai.defineFlow(
  {
    name: 'aiScheduleInterviewFlow',
    inputSchema: AIScheduleInterviewInputSchema,
    outputSchema: AIScheduleInterviewOutputSchema,
  },
  async (input: any) => {
    const { output } = await prompt(input);
    return output!;
  }
);
