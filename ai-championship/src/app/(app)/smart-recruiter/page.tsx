'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/page-header';
import { Brain, FileText, Target, Sparkles, Volume2 } from 'lucide-react';

export default function SmartRecruiterPage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/google-ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription })
      });

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const speakAnalysis = async () => {
    if (!analysis?.analysis) return;
    
    try {
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: analysis.analysis })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Voice synthesis error:', error);
    }
  };

  const sampleResume = `John Smith - Senior Software Engineer

EXPERIENCE:
• 5+ years developing React applications
• Led team of 4 developers on e-commerce platform  
• Implemented CI/CD pipelines reducing deployment time by 60%
• Expert in TypeScript, Node.js, and AWS services

EDUCATION:
• B.S. Computer Science, Stanford University
• AWS Certified Solutions Architect

SKILLS: React, TypeScript, Node.js, Python, AWS, Docker`;

  return (
    <div className="flex-1 space-y-6 py-6">
      <PageHeader
        title="Smart Recruiter AI"
        description="Google AI + Raindrop + ElevenLabs powered resume analysis"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Resume Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste resume text here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResumeText(sampleResume)}
              >
                Use Sample Resume
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Job Description (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste job description..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !resumeText.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Analyzing with Google AI...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Analyze Resume
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {analysis ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Analysis Results
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      Match: {analysis.matchScore}%
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={speakAnalysis}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-white rounded-lg border">
                  <p className="text-green-700 whitespace-pre-wrap">
                    {analysis.analysis}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Brain className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Google Gemini Pro</h4>
                    <p className="text-sm text-muted-foreground">Advanced AI analysis</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Volume2 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">ElevenLabs Voice</h4>
                    <p className="text-sm text-muted-foreground">Audio feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}