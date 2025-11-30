
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Lightbulb, User, Briefcase } from 'lucide-react';
import { aiCandidatePrep, AICandidatePrepOutput } from '@/ai/flows/ai-candidate-prep';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function CandidatePortalPage() {
  const [resumeText, setResumeText] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AICandidatePrepOutput | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!resumeText || !targetRole) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please paste your resume and specify a target role.',
      });
      return;
    }
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await aiCandidatePrep({ resumeText, targetRole });
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'There was an error analyzing your resume. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Candidate Prep Portal"
        description="Get instant AI feedback on your resume for your target role."
      />

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Resume</CardTitle>
            <CardDescription>Paste your resume and tell us what role you're targeting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="resume-text">Paste Resume Text</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste the full text of your resume here..."
                className="min-h-[300px] font-code text-xs"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target-role">Target Role</Label>
              <Input
                id="target-role"
                placeholder="e.g., Senior Frontend Engineer"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleAnalysis} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get AI Feedback
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Feedback</CardTitle>
            <CardDescription>Your personalized analysis will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
            {isLoading ? (
              <div className="space-y-4 w-full">
                 <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>AI is analyzing your profile...</p>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-6 text-left w-full">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2"><User className="h-5 w-5 text-primary" /> Profile Summary</h3>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2"><Briefcase className="h-5 w-5 text-primary" /> Suggested Roles</h3>
                   <div className="flex flex-wrap gap-2">
                        {analysis.suggestedRoles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)}
                    </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-2"><Lightbulb className="h-5 w-5 text-primary" /> Improvement Tips</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-2 text-sm">
                    {analysis.improvementTips.map((tip, i) => <li key={i}>{tip}</li>)}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">
                <Sparkles className="mx-auto h-12 w-12" />
                <p className="mt-4 text-sm">Your feedback is just a click away.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
