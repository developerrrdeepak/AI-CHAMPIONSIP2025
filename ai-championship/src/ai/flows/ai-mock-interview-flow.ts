
'use server';

/**
 * @fileOverview An AI agent that conducts a mock interview.
 *
 * - mockInterview - A function that takes conversation history and a job type, and returns the next interview question.
 */

import { ai } from '@/ai/genkit';
import {
    MockInterviewInput,
    MockInterviewInputSchema,
    MockInterviewOutput,
    MockInterviewOutputSchema
} from '@/lib/interview-types';


export async function mockInterview(input: MockInterviewInput): Promise<MockInterviewOutput> {
  return mockInterviewFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mockInterviewPrompt',
  input: { schema: MockInterviewInputSchema },
  output: { schema: MockInterviewOutputSchema },
  prompt: `You are an expert, friendly interviewer conducting a mock interview for a {{jobType}} role.
Your goal is to ask relevant behavioral and technical questions, and keep the conversation flowing naturally.
Keep your responses and questions concise (1-2 sentences). Ask one question at a time.

Here is the conversation history so far:
---
{{#if history.length}}
{{#each history}}
{{this.speaker}}: {{this.text}}
{{/each}}
{{else}}
(No history yet)
{{/if}}
---

If the history is empty, start with a friendly opening question to get things started.
Otherwise, ask a relevant follow-up question based on the user's last answer, or move to a new topic.
If the user's last response was short or seems like they are finished, it's your turn to ask the next question.
Do not say "Great" or "That's a good answer" after every user response. Vary your affirmations.
At the end of the interview (after 5-6 questions), provide a brief, encouraging closing statement.`,
});

const mockInterviewFlow = ai.defineFlow(
  {
    name: 'mockInterviewFlow',
    inputSchema: MockInterviewInputSchema,
    outputSchema: MockInterviewOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
