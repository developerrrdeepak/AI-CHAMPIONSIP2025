import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import * as pdf from 'pdf-parse';

interface ResumeAnalysis {
  skills: string[];
  experience: { skill: string; years: number }[];
  education: { institution: string; degree: string; year?: number }[];
  workHistory: { company: string; position: string; duration: string }[];
  demoMode?: boolean;
}

function AnalysisSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-8 w-1/fouro" />
            <Skeleton className="h-32 w-full" />
        </div>
    );
}

export function CandidateSmarterResumeAnalysisTab({ candidateId, resumePath }: { candidateId: string; resumePath: string }) {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalysis() {
      if (!resumePath) {
          setIsLoading(false);
          setError("No resume path provided.");
          return;
      };
      try {
        setIsLoading(true);

        // Fetch the resume file
        const resumeResponse = await fetch(resumePath);
        if (!resumeResponse.ok) {
          throw new Error('Failed to fetch resume file');
        }
        const resumeBuffer = await resumeResponse.arrayBuffer();

        // Extract text from the PDF
        const pdfData = await pdf(resumeBuffer);
        const resumeText = pdfData.text;

        const response = await fetch('/api/ai/smarter-resume-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText }),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch analysis');
        }
        const result = await response.json();
        setAnalysis(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalysis();
  }, [resumePath]);

  if (isLoading) {
    return <AnalysisSkeleton />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!analysis) {
    return <div>No analysis available.</div>;
  }

  return (
    <div className="space-y-6">
      {analysis.demoMode && (
        <Alert>
          <InfoCircledIcon className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            This is a demo of the Smarter Resume Analysis feature. The data below is not from a live AI model, but a placeholder to showcase the functionality.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5">
            {analysis.skills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Experience</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-2">
                {analysis.experience.map((exp, index) => (
                <li key={index}>
                    {exp.skill}: {exp.years} years
                </li>
                ))}
            </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Work History</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
                {analysis.workHistory.map((job, index) => (
                <li key={index}>
                    <p className="font-semibold">{job.position} at {job.company}</p>
                    <p className="text-sm text-gray-500">{job.duration}</p>
                </li>
                ))}
            </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Education</CardTitle>
        </CardHeader>
        <CardContent>
            <ul className="space-y-4">
            {analysis.education.map((edu, index) => (
              <li key={index}>
                <p className="font-semibold">{edu.degree} from {edu.institution}</p>
                {edu.year && <p className="text-sm text-gray-500">{edu.year}</p>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
