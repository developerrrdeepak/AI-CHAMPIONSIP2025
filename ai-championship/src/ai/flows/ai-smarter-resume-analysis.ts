import { z } from 'zod';

const ResumeAnalysisSchema = z.object({
  skills: z.array(z.string()),
  experience: z.array(z.object({
    skill: z.string(),
    years: z.number(),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    year: z.number().optional(),
  })),
  workHistory: z.array(z.object({
    company: z.string(),
    position: z.string(),
    duration: z.string(),
  })),
});

// Flow temporarily disabled - requires Raindrop integration
export const smarterResumeAnalysisFlow = async (resumePath: string) => {
  const analysisResult = await callVultrModel(Buffer.from(''));
  return ResumeAnalysisSchema.parse(analysisResult);
};

async function callVultrModel(resumeFile: Buffer): Promise<any> {
  // Return demo data for now
  return {
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Next.js', 'GraphQL'],
    experience: [
      { skill: 'React', years: 5 },
      { skill: 'TypeScript', years: 4 },
      { skill: 'Node.js', years: 3 },
      { skill: 'Project Management', years: 2 },
    ],
    education: [
      { institution: 'University of Demo', degree: 'B.S. in Computer Science', year: 2018 },
    ],
    workHistory: [
      { company: 'Demo Corp', position: 'Senior Frontend Developer', duration: '2020-Present' },
      { company: 'Mockup Inc', position: 'Software Engineer', duration: '2018-2020' },
    ],
    demoMode: true,
  };
}
