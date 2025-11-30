
'use server';

/**
 * @fileOverview An AI agent that enriches a candidate's profile from raw text.
 *
 * - aiEnrichProfile - A function that takes raw text (like a resume) and returns a structured profile.
 * - AiEnrichProfileInput - The input type for the function.
 * - AiEnrichProfileOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Education, Experience, Link } from '@/lib/definitions';

const AiEnrichProfileInputSchema = z.object({
  rawText: z.string().describe("The full text content of the candidate's resume or profile."),
});
export type AiEnrichProfileInput = z.infer<typeof AiEnrichProfileInputSchema>;

const ExperienceSchema = z.object({
    title: z.string(),
    company: z.string(),
    startDate: z.string().describe("The start date, preferably in YYYY-MM format."),
    endDate: z.string().optional().describe("The end date, preferably in YYYY-MM format, or 'Present'."),
    description: z.string().optional().describe("A brief summary of responsibilities and achievements."),
});

const EducationSchema = z.object({
    institution: z.string(),
    degree: z.string(),
    fieldOfStudy: z.string().optional(),
    startYear: z.string().describe("The start year."),
    endYear: z.string().optional().describe("The end year or expected graduation year."),
});

const LinkSchema = z.object({
    name: z.string().describe("The name of the platform (e.g., LinkedIn, GitHub, Portfolio)."),
    url: z.string().url(),
});

const AiEnrichProfileOutputSchema = z.object({
  summary: z.string().describe("A 2-3 paragraph professional summary of the candidate."),
  skills: z.array(z.string()).describe("A list of key technical and soft skills."),
  experience: z.array(ExperienceSchema).describe("A structured list of the candidate's work experience."),
  education: z.array(EducationSchema).describe("A structured list of the candidate's education history."),
  links: z.array(LinkSchema).describe("A list of relevant web links like portfolio or social profiles."),
});
export type AiEnrichProfileOutput = z.infer<typeof AiEnrichProfileOutputSchema>;


export async function aiEnrichProfile(input: AiEnrichProfileInput): Promise<AiEnrichProfileOutput> {
  return aiEnrichProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiEnrichProfilePrompt',
  input: {schema: AiEnrichProfileInputSchema},
  output: {schema: AiEnrichProfileOutputSchema},
  prompt: `You are an expert HR data analyst. Analyze the following resume text and extract a structured professional profile.
The dates should be parsed and returned in a consistent format (e.g., YYYY-MM or YYYY).

Resume Text:
---
{{{rawText}}}
---

Based on the resume, extract the following information in the specified JSON format.
- A professional summary.
- A list of skills.
- A structured list of work experiences.
- A structured list of education history.
- Any links to portfolios, GitHub, or LinkedIn profiles.`,
});

const aiEnrichProfileFlow = ai.defineFlow(
  {
    name: 'aiEnrichProfileFlow',
    inputSchema: AiEnrichProfileInputSchema,
    outputSchema: AiEnrichProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
