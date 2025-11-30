'use client';

import { useUserRole } from '@/hooks/use-user-role';
import { PageHeader } from '@/components/page-header';
import { Loader2, Briefcase, Users, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useUserContext } from '../layout';

export default function DashboardPage() {
  const { role, isLoading } = useUserRole();
  const { firestore } = useFirebase();
  const { organizationId } = useUserContext();

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
    <div className="flex-1 space-y-8 py-6">
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
    </div>
  );
}