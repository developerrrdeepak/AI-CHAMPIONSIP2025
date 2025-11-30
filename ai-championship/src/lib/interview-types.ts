
import { z } from 'zod';

export const ConversationHistorySchema = z.object({
  speaker: z.enum(['ai', 'user']),
  text: z.string(),
});

export const MockInterviewInputSchema = z.object({
  jobType: z.string().describe('The type of job the user is interviewing for, e.g., "Software Engineer".'),
  history: z.array(ConversationHistorySchema).describe('The history of the conversation so far.'),
});
export type MockInterviewInput = z.infer<typeof MockInterviewInputSchema>;

export const MockInterviewOutputSchema = z.object({
  response: z.string().describe('The AI interviewer\'s next question or comment.'),
});
export type MockInterviewOutput = z.infer<typeof MockInterviewOutputSchema>;
