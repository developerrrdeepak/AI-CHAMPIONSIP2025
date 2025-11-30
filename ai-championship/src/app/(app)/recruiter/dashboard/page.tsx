
'use client';

import { 
  Briefcase, 
  Users, 
  UserCheck, 
  BrainCircuit,
  CalendarCheck
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { Job, Application, Candidate } from '@/lib/definitions';
import { useMemo, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { generateRecruitmentSummary, RecruitmentSummaryOutput } from "@/ai/flows/ai-recruitment-summary";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/page-header";
import { useUserContext } from "../../layout";

type ApplicationWithDetails = Application & {
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
};

function AiInsightsCard() {
    const [insight, setInsight] = useState<RecruitmentSummaryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            setIsLoading(true);
            try {
                const result = await generateRecruitmentSummary({ timeRange: "the last 7 days" });
                setInsight(result);
            } catch (error) {
                console.error("Failed to fetch dashboard insights:", error);
                setInsight({ summary: "Could not load AI insights. Please try again later." });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInsight();
    }, []);

    return (
        <Card className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-500 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>AI-Powered Weekly Briefing</CardTitle>
                        <CardDescription>Key recruitment insights from the last 7 days.</CardDescription>
                    </div>
                    <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        {insight?.summary}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ActionCard({ title, icon: Icon, href, delay }: { title: string, icon: React.ElementType, href: string, delay: number }) {
    return (
        <Link href={href}>
            <Card className="text-center p-4 hover:bg-muted/50 cursor-pointer h-full flex flex-col items-center justify-center hover:shadow-md hover:-translate-y-0.5 animate-in fade-in-0 slide-in-from-top-4" style={{ animationDelay: `${delay}ms`}}>
                <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold text-sm">{title}</h3>
            </Card>
        </Link>
    );
}


export default function RecruiterDashboardPage() {
  const { firestore } = useFirebase();
  const { user, organizationId, isUserLoading } = useUserContext();

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
    return query(collection(firestore, `organizations/${organizationId}/applications`), orderBy('updatedAt', 'desc'), limit(5));
  }, [firestore, organizationId]);

  const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
  const { data: candidates, isLoading: isLoadingCandidates } = useCollection<Candidate>(candidatesQuery);
  const { data: applications, isLoading: isLoadingApps } = useCollection<Application>(applicationsQuery);

  const openJobsCount = useMemo(() => jobs?.filter(j => j.status === 'open').length || 0, [jobs]);
  const newCandidatesCount = useMemo(() => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return candidates?.filter(c => new Date(c.createdAt) > oneWeekAgo).length || 0;
  }, [candidates]);
  
  const allApplicationsQuery = useMemoFirebase(() => {
      if (!firestore || !organizationId) return null;
      return query(collection(firestore, `organizations/${organizationId}/applications`));
  }, [firestore, organizationId]);
  const { data: allApplications } = useCollection<Application>(allApplicationsQuery);
  
  const hiredCount = useMemo(() => allApplications?.filter(a => a.stage === 'Hired').length || 0, [allApplications]);


  const recentApplications = useMemo((): ApplicationWithDetails[] => {
    if (!applications || !jobs || !candidates) return [];
    const jobsMap = new Map(jobs.map(j => [j.id, j]));
    const candidatesMap = new Map(candidates.map(c => [c.id, c]));

    return applications.map(app => ({
      ...app,
      jobTitle: jobsMap.get(app.jobId)?.title,
      candidateName: candidatesMap.get(app.candidateId)?.name,
      candidateEmail: candidatesMap.get(app.candidateId)?.email,
    }));
  }, [applications, jobs, candidates]);

  const isLoading = isUserLoading || isLoadingJobs || isLoadingCandidates || isLoadingApps;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.displayName?.split(' ')[0] || 'Recruiter'}!`}
        description="Here's what's happening in your hiring pipeline today."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-0">
            <StatCard title="Open Jobs" value={openJobsCount.toString()} icon={Briefcase} description={`${jobs?.length || 0} total jobs`}/>
        </div>
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-100">
            <StatCard title="New Candidates" value={newCandidatesCount.toString()} icon={Users} description="In the last 7 days"/>
        </div>
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-200">
            <StatCard title="Total Hires" value={hiredCount.toString()} icon={UserCheck} description="All time hires"/>
        </div>
        <ActionCard title="Schedule Interview" icon={CalendarCheck} href="/interviews/new" delay={300} />
      </div>

      <div className="grid gap-4 mt-6 md:grid-cols-2">
        <AiInsightsCard />
        <Card className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-600 hover:shadow-md hover:-translate-y-0.5">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>The latest candidates that have entered the pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Stage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentApplications.length > 0 ? recentApplications.map(app => (
                  <TableRow key={app.id}>
                    <TableCell>{app.candidateName}</TableCell>
                    <TableCell>{app.jobTitle}</TableCell>
                    <TableCell><Badge variant="secondary">{app.stage}</Badge></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No recent applications.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <PageHeader title="Recruiter Dashboard" description="Your central hub for all hiring activities."/>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid gap-4 mt-6 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    </>
  )
}
