'use client';

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Target, Zap, FileText, Users, Briefcase, MessageSquare, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUserContext } from '../layout';

export default function AIHubPage() {
  const { role } = useUserContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const isCandidate = role === 'Candidate';

  const candidateAITools = [
    {
      title: 'Resume Scoring',
      description: 'Get AI-powered analysis of your resume with detailed scoring and improvement suggestions.',
      icon: FileText,
      href: '/profile/edit',
      badge: 'Smart',
      color: 'text-blue-500',
    },
    {
      title: 'Skill Gap Analysis',
      description: 'Identify missing skills for your dream job and get personalized learning recommendations.',
      icon: Target,
      href: '/ai-assistant',
      badge: 'Insights',
      color: 'text-purple-500',
    },
    {
      title: 'AI Mock Interview',
      description: 'Practice interviews with AI-powered voice assistant using ElevenLabs technology.',
      icon: MessageSquare,
      href: '/voice-interview',
      badge: 'Voice AI',
      color: 'text-green-500',
    },
    {
      title: 'Interview Prep',
      description: 'Get AI-generated interview questions tailored to your role and experience.',
      icon: Brain,
      href: '/interview-prep',
      badge: 'Practice',
      color: 'text-amber-500',
    },
    {
      title: 'Job Recommendations',
      description: 'AI matches you with jobs based on your skills, experience, and preferences.',
      icon: Briefcase,
      href: '/jobs',
      badge: 'Matching',
      color: 'text-rose-500',
    },
    {
      title: 'Profile Optimization',
      description: 'AI analyzes your profile and suggests improvements to increase visibility.',
      icon: TrendingUp,
      href: '/profile/edit',
      badge: 'Boost',
      color: 'text-cyan-500',
    },
  ];

  const employerAITools = [
    {
      title: 'Auto-Screening',
      description: 'Automatically screen candidates using AI-powered resume analysis and scoring.',
      icon: Zap,
      href: '/smart-recruiter',
      badge: 'Automation',
      color: 'text-blue-500',
    },
    {
      title: 'Candidate Insights',
      description: 'Get deep insights into candidate profiles with AI-generated summaries and fit scores.',
      icon: Users,
      href: '/candidates',
      badge: 'Analytics',
      color: 'text-purple-500',
    },
    {
      title: 'Interview Question Generator',
      description: 'Generate role-specific interview questions using AI based on job descriptions.',
      icon: MessageSquare,
      href: '/ai-assistant',
      badge: 'Smart',
      color: 'text-green-500',
    },
    {
      title: 'JD → Skill Mapping',
      description: 'AI extracts required skills from job descriptions and suggests additional skills.',
      icon: Target,
      href: '/smart-recruiter',
      badge: 'Extraction',
      color: 'text-amber-500',
    },
    {
      title: 'Real-time Matching',
      description: 'Ultra-fast candidate matching using Raindrop SmartInference + Vultr compute.',
      icon: Sparkles,
      href: '/ultra-fast-matching',
      badge: 'Raindrop',
      color: 'text-rose-500',
    },
    {
      title: 'Diversity Hiring',
      description: 'AI-powered tools to reduce bias and improve diversity in your hiring process.',
      icon: Award,
      href: '/diversity-hiring',
      badge: 'Fair',
      color: 'text-cyan-500',
    },
  ];

  const tools = isCandidate ? candidateAITools : employerAITools;

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <PageHeader
        title="AI Hub"
        description={isCandidate ? 'Supercharge your job search with AI-powered tools.' : 'Transform your hiring process with AI automation.'}
      >
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Powered by Raindrop + Vultr + ElevenLabs
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-muted ${tool.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge variant="outline">{tool.badge}</Badge>
                </div>
                <CardTitle className="mt-4">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={tool.href}>
                    Launch Tool
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            How Our AI Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Raindrop SmartInference
              </h4>
              <p className="text-sm text-muted-foreground">
                Advanced AI models for resume analysis, candidate matching, and skill extraction.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Vultr GPU Compute
              </h4>
              <p className="text-sm text-muted-foreground">
                High-performance GPU instances for real-time AI inference and matching.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                ElevenLabs Voice AI
              </h4>
              <p className="text-sm text-muted-foreground">
                Natural text-to-speech for voice interviews and accessibility features.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
