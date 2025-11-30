
'use client';

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { 
  Briefcase, 
  Gauge,
  Clock,
  BrainCircuit,
  PlusCircle,
  Users,
  Loader2
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { aiFounderWeeklySummary, AiFounderWeeklySummaryOutput } from "@/ai/flows/ai-founder-weekly-summary";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from 'firebase/firestore';
import type { Job, Application, Candidate } from '@/lib/definitions';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { differenceInDays } from "date-fns";
import { useUserContext } from '../../layout';

function FounderWeeklyReport({ dashboardData, jobs }: { dashboardData: any, jobs: Job[] | null }) {
    const [summary, setSummary] = useState<AiFounderWeeklySummaryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGenerated, setHasGenerated] = useState(false);

    const generateSummary = async () => {
        if (!dashboardData) return;
        setIsLoading(true);
        setHasGenerated(true);
        try {
            const result = await aiFounderWeeklySummary({
              openRoles: dashboardData.openRoles,
              criticalRoles: dashboardData.criticalRoles.map((id: string) => ({ title: jobs?.find(j => j.id === id)?.title || 'Unknown' })),
              pipelineHealthScore: dashboardData.pipelineHealth.score,
              hiringVelocityDays: dashboardData.hiringVelocity.days,
              timeToHireDays: dashboardData.timeToHire.avgDays,
              funnelData: dashboardData.funnelData,
              bottleneckRoles: dashboardData.bottleneckRoles.map((role: any) => ({ title: role.title, stage: role.stage })),
            });
            setSummary(result);
        } catch (error) {
            console.error("Failed to fetch founder weekly summary:", error);
            setSummary(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
      <div className="space-y-4 text-sm">
        {!hasGenerated && !isLoading && (
          <Button onClick={generateSummary} disabled={isLoading}>
            <BrainCircuit className="mr-2 h-4 w-4"/>
            Generate Weekly Report
          </Button>
        )}
        
        {isLoading && (
             <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI is analyzing your week...</span>
                </div>
            </div>
        )}

        {hasGenerated && !isLoading && !summary && (
            <p className="text-sm text-muted-foreground">Could not load AI summary. Please try again.</p>
        )}

        {summary && (
            <>
                <div>
                    <h4 className="font-semibold mb-1">Key Observations</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {summary.keyObservations.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-1">Roles at Risk</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {summary.rolesAtRisk.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-1">Founder's Action Items</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        {summary.founderActionItems.map((item, i) => <li key_i={i}>{item}</li>)}
                    </ul>
                </div>
            </>
        )}
      </div>
    )
}

export default function FounderDashboard() {
  const { firestore } = useFirebase();
  const { user, organizationId, isUserLoading: isAppLoading } = useUserContext();
  const router = useRouter();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, `organizations/${organizationId}/jobs`));
  }, [firestore, organizationId]);
  
  const candidatesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, `organizations/${organizationId}/candidates`));
  }, [firestore, organizationId]);

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, `organizations/${organizationId}/applications`));
  }, [firestore, organizationId]);

  const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
  const { data: candidates, isLoading: isLoadingCandidates } = useCollection<Candidate>(candidatesQuery);
  const { data: applications, isLoading: isLoadingApps } = useCollection<Application>(applicationsQuery);

  const dashboardData = useMemo(() => {
    if (!jobs || !applications || !candidates) {
        return null;
    }
    
    const openJobs = jobs.filter(j => j.status === 'open');
    
    const funnelData = [
      { stage: 'Applied', count: applications.length },
      { stage: 'Screening', count: applications.filter(a => ['Screening', 'Technical Interview', 'HR Interview', 'Offer', 'Hired'].includes(a.stage)).length },
      { stage: 'Interview', count: applications.filter(a => ['Technical Interview', 'HR Interview', 'Offer', 'Hired'].includes(a.stage)).length },
      { stage: 'Offer', count: applications.filter(a => a.stage === 'Offer' || a.stage === 'Hired').length },
      { stage: 'Hired', count: applications.filter(a => a.stage === 'Hired').length },
    ];
    
    const hiredApplications = applications.filter(a => a.stage === 'Hired');
    const pipelineHealthScore = Math.round((hiredApplications.length / (applications.length || 1)) * 100);

    let totalDays = 0;
    hiredApplications.forEach(app => {
        totalDays += differenceInDays(new Date(app.updatedAt), new Date(app.createdAt));
    });
    const hiringVelocityDays = hiredApplications.length > 0 ? Math.round(totalDays / hiredApplications.length) : 0;

    return {
      totalJobs: jobs.length,
      openRoles: openJobs.length,
      totalCandidates: candidates.length,
      totalHires: hiredApplications.length,
      criticalRoles: openJobs.slice(0, 2).map(j => j.id),
      pipelineHealth: { score: pipelineHealthScore, trend: 'up' }, // Placeholder trend
      hiringVelocity: { days: hiringVelocityDays, trend: 'down' }, // Placeholder trend
      timeToHire: { avgDays: hiringVelocityDays },
      funnelData,
      bottleneckRoles: jobs.filter(j => j.status === 'paused').map(j => ({ title: j.title, id: j.id, stage: 'Stalled' })),
    };
  }, [jobs, applications, candidates]);
  
  const isLoading = isAppLoading || isLoadingJobs || isLoadingApps || isLoadingCandidates;

  if (isLoading || !dashboardData) {
      return <FounderDashboardSkeleton />;
  }

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.displayName?.split(' ')[0] || 'Founder'}!`}
        description="Here's a high-level view of your hiring performance."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-0">
            <StatCard title="Open Roles" value={dashboardData.openRoles.toString()} icon={Briefcase} description={`${dashboardData.totalJobs} total jobs`}/>
        </div>
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-100">
            <StatCard title="Total Candidates" value={dashboardData.totalCandidates.toString()} icon={Users} description={`${dashboardData.totalHires} hires`}/>
        </div>
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-200">
            <StatCard title="Pipeline Health" value={`${dashboardData.pipelineHealth.score}%`} icon={Gauge} trend={dashboardData.pipelineHealth.trend} description="Hire to applicant ratio" />
        </div>
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-300">
            <StatCard title="Avg. Time to Hire" value={`${dashboardData.hiringVelocity.days} days`} icon={Clock} description="From application to hire"/>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 mt-6">
          <Card className="flex flex-col items-center justify-center p-6 hover:bg-muted/50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-400" onClick={() => router.push('/jobs/new')}>
              <PlusCircle className="w-10 h-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold">Create New Job</h3>
              <p className="text-sm text-muted-foreground">Start building your team.</p>
          </Card>
          <Card className="flex flex-col items-center justify-center p-6 hover:bg-muted/50 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-500" onClick={() => router.push('/candidates')}>
              <Users className="w-10 h-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-semibold">View All Candidates</h3>
              <p className="text-sm text-muted-foreground">Browse your talent pipeline.</p>
          </Card>
       </div>

      <div className="grid gap-6 lg:grid-cols-5 mt-6">
        <Card className="lg:col-span-3 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-600 hover:shadow-md hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Hiring Funnel</CardTitle>
            <CardDescription>Candidate conversion rates in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full pl-2">
            <ChartContainer config={{}} className="h-full w-full">
                <RechartsBarChart accessibilityLayer data={dashboardData.funnelData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="stage" type="category" tickLine={false} tickMargin={10} axisLine={false} className="text-muted-foreground text-xs" width={80} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={4} />
                </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-700 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>AI Weekly Report</CardTitle>
                    <CardDescription>Generated executive summary.</CardDescription>
                </div>
                <BrainCircuit className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
               <FounderWeeklyReport dashboardData={dashboardData} jobs={jobs} />
            </CardContent>
        </Card>
      </div>

       <div className="grid gap-4 mt-6">
        <Card className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-800 hover:shadow-md hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Top Bottlenecks</CardTitle>
            <CardDescription>Roles where the hiring process is slowing down.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-3">
                {dashboardData.bottleneckRoles.length > 0 ? dashboardData.bottleneckRoles.map(role => (
                    <div key={role.id} className="flex items-center justify-between p-2 -m-2 rounded-lg hover:bg-muted/50">
                        <div>
                            <Link href={`/jobs/${role.id}`} className="font-semibold hover:underline">{role.title}</Link>
                            <p className="text-sm text-muted-foreground">Stuck at <Badge variant="secondary">{role.stage}</Badge></p>
                        </div>
                        <Button variant="ghost" size="sm" asChild><Link href={`/jobs/${role.id}`}>View Role</Link></Button>
                    </div>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No bottleneck roles identified.</p>
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function FounderDashboardSkeleton() {
    return (
        <>
            <PageHeader title="Dashboard" description="High-level visibility into hiring performance and strategy." />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-2/5" />
                            <Skeleton className="h-4 w-4 rounded-sm" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/4" />
                            <Skeleton className="h-3 w-4/5 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
             <div className="grid gap-4 md:grid-cols-2 mt-6">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
             </div>
            <div className="grid gap-6 lg:grid-cols-5 mt-6">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/3" />
                        <Skeleton className="h-4 w-2/3" />
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <Skeleton className="h-full w-full" />
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-10 w-40" />
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 mt-6">
              <Skeleton className="h-40 w-full" />
            </div>
        </>
    );
}
