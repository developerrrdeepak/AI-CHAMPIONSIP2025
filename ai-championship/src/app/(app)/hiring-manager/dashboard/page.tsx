
'use client';

import { PageHeader } from "@/components/page-header";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { Job, Application, Candidate } from '@/lib/definitions';
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { placeholderImages } from '@/lib/placeholder-images';
import { useUserContext } from '../../layout';

type ApplicationWithDetails = Application & {
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  candidateId: string;
};


export default function HiringManagerDashboard() {
  const { firestore } = useFirebase();
  const { user, organizationId, isUserLoading: isAppLoading } = useUserContext();
  const router = useRouter();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId || !user) return null;
    // As a hiring manager, I only care about jobs assigned to me.
    return query(
      collection(firestore, `organizations/${organizationId}/jobs`),
      where('hiringManagerId', '==', user.id)
    );
  }, [firestore, organizationId, user]);

  const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

  const managedJobIds = useMemo(() => jobs?.map(j => j.id) || [], [jobs]);

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId || managedJobIds.length === 0) return null;
    // Get applications for the jobs I manage that are in a review stage.
    return query(
        collection(firestore, `organizations/${organizationId}/applications`),
        where('jobId', 'in', managedJobIds),
        where('stage', 'in', ['Screening', 'Technical Interview', 'HR Interview']),
        orderBy('updatedAt', 'desc')
    );
  }, [firestore, organizationId, managedJobIds]);

  const { data: applications, isLoading: isLoadingApps } = useCollection<Application>(applicationsQuery);

  const candidateIds = useMemo(() => applications?.map(app => app.candidateId) || [], [applications]);

  const candidatesQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId || candidateIds.length === 0) return null;
     // Firestore 'in' queries are limited to 30 items. For a real app, pagination or a different query structure would be needed.
    return query(collection(firestore, `organizations/${organizationId}/candidates`), where('__name__', 'in', candidateIds.slice(0, 30)));
  }, [firestore, organizationId, candidateIds]);

  const { data: candidates, isLoading: isLoadingCands } = useCollection<Candidate>(candidatesQuery);

  const candidatesAwaitingDecision: ApplicationWithDetails[] = useMemo(() => {
    if (!applications || !jobs || !candidates) return [];
    
    const jobsMap = new Map(jobs.map(j => [j.id, j]));
    const candidatesMap = new Map(candidates.map(c => [c.id, c]));

    return applications
      .map(app => {
          const candidate = candidatesMap.get(app.candidateId);
          const job = jobsMap.get(app.jobId);
          if (!candidate || !job) return null;
          return {
              ...app,
              candidateName: candidate.name,
              candidateEmail: candidate.email,
              jobTitle: job.title,
          }
      }).filter((c): c is ApplicationWithDetails => c !== null);
  }, [applications, jobs, candidates]);

  const isLoading = isAppLoading || isLoadingJobs || isLoadingApps || isLoadingCands;

  if (isLoading && !jobs) { // Show skeleton only on initial load
    return <HiringManagerDashboardSkeleton />;
  }

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.displayName?.split(' ')[0] || 'Manager'}!`}
        description="Here are the candidates awaiting your review."
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Candidates Awaiting Your Decision</CardTitle>
                <CardDescription>These candidates have been shortlisted for your roles and are ready for review.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Job</TableHead>
                            <TableHead>Stage</TableHead>
                            <TableHead>Fit Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                                </TableRow>
                            ))
                        ) : candidatesAwaitingDecision.length > 0 ? candidatesAwaitingDecision.map(app => (
                            <TableRow key={app.id} onClick={() => router.push(`/candidates/${app.candidateId}`)} className="cursor-pointer">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-3')?.imageUrl} data-ai-hint="person face" />
                                            <AvatarFallback>{app.candidateName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">{app.candidateName}</div>
                                            <div className="text-sm text-muted-foreground">{app.candidateEmail}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{app.jobTitle}</TableCell>
                                <TableCell><Badge variant="secondary">{app.stage}</Badge></TableCell>
                                <TableCell className="font-semibold">{app.fitScore}</TableCell>
                            </TableRow>
                        )) : (
                           <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                No candidates are awaiting your decision.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Card>
           <CardHeader>
                <CardTitle>Your Jobs</CardTitle>
                <CardDescription>Roles you are managing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoadingJobs ? (
                     [...Array(2)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-2">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-6 w-16" />
                        </div>
                     ))
                ) : jobs && jobs.length > 0 ? jobs.map(job => (
                     <Link href={`/jobs/${job.id}`} key={job.id} className="flex items-center justify-between p-2 -m-2 rounded-md hover:bg-muted">
                        <div>
                            <p className="font-medium">{job.title}</p>
                            <p className="text-sm text-muted-foreground">{job.department}</p>
                        </div>
                        <Badge variant={job.status === 'open' ? 'default' : 'outline'} className="capitalize">{job.status}</Badge>
                    </Link>
                )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">You are not assigned to any jobs.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </>
  );
}

function HiringManagerDashboardSkeleton() {
    return (
        <>
            <PageHeader title="Hiring Manager Dashboard" description="Review candidates and manage your open roles." />
             <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                             <div key={i} className="flex items-center p-2 justify-between">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                     <CardContent className="space-y-4">
                         {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-2">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-16" />
                            </div>
                         ))}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
