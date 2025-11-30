
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { Briefcase, Users, UserCheck, Clock, BarChart } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Job, Application, Candidate } from '@/lib/definitions';
import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { DataTable } from '@/components/data-table';
import { useUserContext } from '../layout';


type JobPerformance = {
    id: string;
    title: string;
    department: string;
    status: string;
    applications: number;
    hires: number;
};

const columns: {
  accessorKey: keyof JobPerformance;
  header: string;
  cell?: ({ row }: { row: { original: JobPerformance } }) => JSX.Element;
}[] = [
  {
    accessorKey: 'title',
    header: 'Job Title',
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
   {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'applications',
    header: 'Applicants',
  },
  {
    accessorKey: 'hires',
    header: 'Hires',
  },
];


export default function ReportsPage() {
    const { firestore } = useFirebase();
    const { organizationId, isUserLoading } = useUserContext();

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

    const reportData = useMemo(() => {
        if (!jobs || !candidates || !applications) return null;

        const totalJobs = jobs.length;
        const totalCandidates = candidates.length;
        const hiredApplications = applications.filter(a => a.stage === 'Hired');
        const totalHires = hiredApplications.length;

        let totalDays = 0;
        hiredApplications.forEach(app => {
            totalDays += differenceInDays(new Date(app.updatedAt), new Date(app.createdAt));
        });
        const avgTimeToHire = hiredApplications.length > 0 ? Math.round(totalDays / hiredApplications.length) : 0;
        
        const funnelData = [
            { stage: 'Applied', count: applications.length },
            { stage: 'Screening', count: applications.filter(a => ['Screening', 'Technical Interview', 'HR Interview', 'Offer', 'Hired'].includes(a.stage)).length },
            { stage: 'Interview', count: applications.filter(a => ['Technical Interview', 'HR Interview', 'Offer', 'Hired'].includes(a.stage)).length },
            { stage: 'Offer', count: applications.filter(a => ['Offer', 'Hired'].includes(a.stage)).length },
            { stage: 'Hired', count: totalHires },
        ].reverse(); // Reverse for better chart visualization

        const jobPerformance: JobPerformance[] = jobs.map(job => {
            const jobApps = applications.filter(app => app.jobId === job.id);
            return {
                id: job.id,
                title: job.title,
                department: job.department,
                status: job.status,
                applications: jobApps.length,
                hires: jobApps.filter(app => app.stage === 'Hired').length
            };
        });

        return {
            totalJobs,
            totalCandidates,
            totalHires,
            avgTimeToHire,
            funnelData,
            jobPerformance
        }

    }, [jobs, candidates, applications]);
    
    const isLoading = isUserLoading || isLoadingJobs || isLoadingCandidates || isLoadingApps;

    if (isLoading || !reportData) {
        return <ReportsPageSkeleton />;
    }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Analyze your recruitment data and key performance indicators."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Jobs" value={reportData.totalJobs.toString()} icon={Briefcase} />
        <StatCard title="Total Candidates" value={reportData.totalCandidates.toString()} icon={Users} />
        <StatCard title="Total Hires" value={reportData.totalHires.toString()} icon={UserCheck} />
        <StatCard title="Avg. Time to Hire" value={`${reportData.avgTimeToHire} days`} icon={Clock} />
      </div>

       <div className="grid gap-6 mt-6 md:grid-cols-5">
         <Card className="md:col-span-3">
            <CardHeader>
                <CardTitle>Hiring Funnel</CardTitle>
                <CardDescription>Overview of the candidate pipeline stages.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full pl-2">
                 <ChartContainer config={{}} className="h-full w-full">
                    <RechartsBarChart accessibilityLayer data={reportData.funnelData} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" dataKey="count" />
                        <YAxis dataKey="stage" type="category" tickLine={false} tickMargin={10} axisLine={false} className="text-muted-foreground text-xs" width={80} />
                        <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
                    </RechartsBarChart>
                </ChartContainer>
            </CardContent>
         </Card>
          <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Top Open Jobs</CardTitle>
                <CardDescription>Jobs with the most applications.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {reportData.jobPerformance
                        .filter(j => j.status === 'open')
                        .sort((a,b) => b.applications - a.applications)
                        .slice(0, 5)
                        .map(job => (
                            <div key={job.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{job.title}</p>
                                    <p className="text-sm text-muted-foreground">{job.department}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{job.applications}</p>
                                    <p className="text-sm text-muted-foreground">Applicants</p>
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
          </Card>
       </div>
       
       <Card className="mt-6">
            <CardHeader>
                <CardTitle>Job Performance</CardTitle>
                <CardDescription>Detailed breakdown of applications and hires per job.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={reportData.jobPerformance} searchKey='title' />
            </CardContent>
       </Card>
    </>
  );
}


function ReportsPageSkeleton() {
    return (
         <>
            <PageHeader
                title="Reports"
                description="Analyze your recruitment data and key performance indicators."
            />
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
            <div className="grid gap-6 mt-6 md:grid-cols-5">
                <Skeleton className="md:col-span-3 h-80" />
                <Skeleton className="md:col-span-2 h-80" />
            </div>
            <Skeleton className="mt-6 h-96" />
        </>
    )
}
