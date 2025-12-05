'use client';

import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from '@/components/page-header';
import { Loader2, Briefcase, Users, FileText, Calendar, BrainCircuit, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUserContext } from '../layout';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { role, isLoading } = useUserRole();
  const { firestore } = useFirebase();
  const { organizationId } = useUserContext();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, `organizations/${organizationId}/jobs`), where('status', '==', 'open'));
  }, [firestore, organizationId]);

  const candidatesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, `organizations/${organizationId}/candidates`);
  }, [firestore, organizationId]);

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return collection(firestore, `organizations/${organizationId}/applications`);
  }, [firestore, organizationId]);

  const interviewsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, `organizations/${organizationId}/interviews`), where('status', '==', 'scheduled'));
  }, [firestore, organizationId]);

  const { data: jobs } = useCollection(jobsQuery);
  const { data: candidates } = useCollection(candidatesQuery);
  const { data: applications } = useCollection(applicationsQuery);
  const { data: interviews } = useCollection(interviewsQuery);

  // AI Insights
  const aiInsights = [
    {
      title: "Hiring Velocity",
      description: applications && applications.length > 0 
        ? `You have ${applications.length} active applications. ${applications.filter(a => a.stage === 'screening').length} need review.`
        : "No active applications yet. Start by posting a job!",
      icon: TrendingUp,
      color: "text-blue-500"
    },
    {
      title: "Top Candidates",
      description: applications && applications.length > 0
        ? `${applications.filter(a => (a.fitScore || 0) > 80).length} high-fit candidates (80%+ match) available.`
        : "Post jobs to start receiving candidate matches.",
      icon: Users,
      color: "text-green-500"
    },
    {
      title: "Action Required",
      description: interviews && interviews.length > 0
        ? `${interviews.length} interviews scheduled. Don't forget to prepare!`
        : "No pending interviews. Schedule interviews with top candidates.",
      icon: AlertCircle,
      color: "text-orange-500"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const widgets = [
    { title: 'Open Jobs', count: jobs?.length || 0, icon: Briefcase, href: '/jobs' },
    { title: 'Total Candidates', count: candidates?.length || 0, icon: Users, href: '/candidates' },
    { title: 'Applications', count: applications?.length || 0, icon: FileText, href: '/applications' },
    { title: 'Scheduled Interviews', count: interviews?.length || 0, icon: Calendar, href: '/interviews' },
  ];

  return (
    <div className={`flex-1 space-y-8 py-6 transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {role}! 👋</h1>
              <p className="text-white/90 text-lg">Here's what's happening with your recruitment today</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold">Live Dashboard</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold">{jobs?.length || 0}</div>
              <div className="text-sm text-white/80">Active Jobs</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold">{candidates?.length || 0}</div>
              <div className="text-sm text-white/80">Total Candidates</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold">{applications?.length || 0}</div>
              <div className="text-sm text-white/80">Applications</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-3xl font-bold">{interviews?.length || 0}</div>
              <div className="text-sm text-white/80">Interviews</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {widgets.map((widget, idx) => {
          const gradients = [
            'from-primary/10 to-purple-500/10',
            'from-purple-500/10 to-pink-500/10',
            'from-pink-500/10 to-orange-500/10',
            'from-orange-500/10 to-primary/10'
          ];
          return (
            <Link href={widget.href} key={widget.title}>
              <Card className={`bg-gradient-to-br ${gradients[idx]} hover-lift border-primary/20`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                  <widget.icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold gradient-text">{widget.count}</div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* AI Insights Section */}
      <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-primary" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {aiInsights.map((insight, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-background/50 border">
                <div className="flex items-start gap-3">
                  <insight.icon className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                  <div>
                    <h3 className="font-semibold mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}