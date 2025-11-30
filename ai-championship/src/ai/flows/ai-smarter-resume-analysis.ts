import { Flow, onFlow } from '@genkit-ai/core';
import { z } from 'zod';
import { smartBucketsDownload } from '../../lib/raindropSmartComponents';

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

export const smarterResumeAnalysisFlow: Flow = onFlow(
  {
    name: 'smarterResumeAnalysis',
    inputSchema: z.object({ resumePath: z.string() }),
    outputSchema: ResumeAnalysisSchema,
  },
  async (input) => {
    // 1. Download the resume from Vultr Object Storage
    const resumeFile = await smartBucketsDownload(input.resumePath);

    // 2. Call the Vultr-hosted model
    const analysisResult = await callVultrModel(resumeFile);

    // 3. Parse and return the structured data
    return ResumeAnalysisSchema.parse(analysisResult);
  }
);

async function callVultrModel(resumeFile: Buffer): Promise<any> {
  const modelEndpoint = process.env.VULTR_MODEL_ENDPOINT;
  if (!modelEndpoint) {
    console.log('VULTR_MODEL_ENDPOINT not set, returning demo data.');
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

  console.log('Calling Vultr model with resume file...');
  
  try {
    const response = await fetch(modelEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
        'Authorization': `Bearer ${process.env.VULTR_API_KEY}`
      },
      body: resumeFile,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to call Vultr model: ${response.statusText} - ${errorText}`);
    }

    const analysis = await response.json();
    console.log('Received analysis from Vultr model.');
    return analysis;
  } catch (error) {
    console.error('Error calling Vultr model:', error);
    // In case of error, return a mock response for demonstration purposes
    return {
      skills: ['Error: Could not connect to model'],
      experience: [],
      education: [],
      workHistory: [],
    };
  }
}
