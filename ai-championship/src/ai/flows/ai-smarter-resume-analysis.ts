import { z } from 'zod';
import { ai, geminiPro } from '@/ai/genkit';

const ResumeAnalysisSchema = z.object({
  skills: z.array(z.string()).describe("List of technical and soft skills."),
  experience: z.array(z.object({
    skill: z.string(),
    years: z.number(),
  })).describe("Years of experience per key skill."),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    year: z.number().optional(),
  })).describe("Educational background."),
  workHistory: z.array(z.object({
    company: z.string(),
    position: z.string(),
    duration: z.string(),
  })).describe("Timeline of work experience."),
});

const SmarterResumeAnalysisInputSchema = z.object({
  resumeText: z.string().describe("The full text of the resume to analyze."),
});

const smarterResumeAnalysisFlow = ai.defineFlow(
  {
    name: 'smarterResumeAnalysisFlow',
    inputSchema: SmarterResumeAnalysisInputSchema,
    outputSchema: ResumeAnalysisSchema,
    model: geminiPro,
    prompt: `Analyze the following resume text and extract a structured analysis.
    Infer the years of experience for each skill based on the work history dates.

    Resume:
    {{{resumeText}}}

    Provide a structured JSON output with skills, experience summary, education, and work history.`,
  },
  async (input) => {
    const { output } = await ai.generate(input);
    return output as z.infer<typeof ResumeAnalysisSchema>;
  }
);


export async function smarterResumeAnalysis(resumeText: string) {
  try {
    const analysisResult = await smarterResumeAnalysisFlow({ resumeText });
    return analysisResult;
  } catch (error) {
    console.error('Error in smarter resume analysis flow:', error);
    // Fallback to a simpler structure or mock if the AI call fails
    return {
      skills: ['React', 'TypeScript', 'Node.js', 'Error Handling'],
      experience: [{ skill: 'Error', years: 0 }],
      education: [],
      workHistory: [],
    };
  }
}
