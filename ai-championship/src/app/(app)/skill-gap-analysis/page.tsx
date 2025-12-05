'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Target, Zap, BookOpen, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SkillGapAnalysis {
  requiredSkills: string[];
  currentSkills: string[];
  missingSkills: string[];
  learningPath: {
    step: number;
    skill: string;
    duration: string;
    resources: string[];
  }[];
  projectSuggestions: string[];
  estimatedTime: string;
  difficulty: string;
}

export default function SkillGapAnalysisPage() {
  const { user, firestore } = useFirebase() as any;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [targetRole, setTargetRole] = useState('');
  const [experience, setExperience] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !firestore) return;

    const loadUserSkills = async () => {
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserSkills(data.skills || []);
      }
    };

    loadUserSkills();
  }, [user, firestore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole) {
      toast({
        title: 'Target Role Required',
        description: 'Please enter a target role to begin the analysis.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await fetch('/api/ai/skill-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole,
          currentSkills: userSkills,
          experience,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get analysis from the server.');
      }

      const result = await response.json();
      setAnalysis(result.analysis);
    } catch (error) {
      console.error('Skill gap analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Skill Gap Analysis"
        description="Identify the skills you need to land your dream job."
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Analyze Your Skill Gap</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="targetRole">Your Dream Job / Target Role</Label>
              <Input
                id="targetRole"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Senior Product Manager"
                required
              />
            </div>
            <div>
              <Label htmlFor="experience">Your Current Experience</Label>
              <Textarea
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Briefly describe your current role and responsibilities..."
              />
               <p className="text-xs text-muted-foreground mt-1">
                Your skills from your profile will be automatically included.
              </p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Skill Gap'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {analysis && (
        <div className="mt-8 space-y-6">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertTitle>Analysis Complete!</AlertTitle>
            <AlertDescription>
             Here's your personalized skill gap analysis.
            </AlertDescription>
          </Alert>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                  <CardHeader>
                      <CardTitle>Skill Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Required Skills:</strong> {analysis.requiredSkills.join(', ')}</p>
                    <p><strong>Your Skills:</strong> {analysis.currentSkills.join(', ')}</p>
                    <p className="text-red-500"><strong>Missing Skills:</strong> {analysis.missingSkills.join(', ')}</p>
                  </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                      <CardTitle>Estimated Time to Bridge the Gap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{analysis.estimatedTime}</p>
                    <p>Difficulty: {analysis.difficulty}</p>
                  </CardContent>
              </Card>
          </div>
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Personalized Learning Path
                </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {analysis.learningPath.map((step) => (
                  <li key={step.step}>
                    <p><strong>Step {step.step}: {step.skill}</strong> ({step.duration})</p>
                    <p>Resources: <a href={step.resources[0]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{step.resources[0]}</a></p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Project Suggestions
                </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                {analysis.projectSuggestions.map((project, index) => (
                  <li key={index}>{project}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
