'use client';

export const dynamic = 'force-dynamic';

import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import type { Application, Candidate, Job, ApplicationStage, ApplicationStatus } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, updateDoc, addDoc } from 'firebase/firestore';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { placeholderImages } from '@/lib/placeholder-images';
import { useUserContext } from '../layout';
import { useToast } from '@/hooks/use-toast';

type ApplicationWithDetails = Application & {
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
};

const columns: {
  accessorKey: keyof ApplicationWithDetails;
  header: string;
  cell?: ({ row }: { row: { original: ApplicationWithDetails } }) => JSX.Element;
  enableSorting?: boolean;
}[] = [
  {
    accessorKey: 'candidateName',
    header: 'Candidate',
    enableSorting: true,
     cell: ({ row }) => (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-1')?.imageUrl} data-ai-hint="person face" />
                <AvatarFallback>{row.original.candidateName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="font-medium">{row.original.candidateName || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{row.original.candidateEmail || 'N/A'}</div>
            </div>
        </div>
    ),
  },
  {
    accessorKey: 'jobTitle',
    header: 'Job',
    enableSorting: true,
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
    enableSorting: true,
    cell: ({ row }) => <Badge variant="secondary">{row.original.stage}</Badge>,
  },
  {
    accessorKey: 'fitScore',
    header: 'Fit Score',
    enableSorting: true,
  },
  {
    accessorKey: 'updatedAt',
    header: 'Last Activity',
    enableSorting: true,
    cell: ({ row }) => <span>{new Date(row.original.updatedAt).toLocaleDateString()}</span>,
  },
  {
    accessorKey: 'id',
    header: 'Actions',
    cell: ({ row }) => <ApplicationActions application={row.original} />,
  },
];

function ApplicationActions({ application }: { application: ApplicationWithDetails }) {
  const { firestore } = useFirebase();
  const { organizationId } = useUserContext();
  const { toast } = useToast();
  const router = useRouter();

  const updateStatus = async (stage: ApplicationStage, status: ApplicationStatus) => {
    if (!firestore || !organizationId) return;
    try {
      const appRef = doc(firestore, `organizations/${organizationId}/applications`, application.id);
      await updateDoc(appRef, { stage, status, updatedAt: new Date().toISOString() });
      
      // Create notification for candidate
      const notifRef = collection(firestore, `users/${application.candidateId}/notifications`);
      await addDoc(notifRef, {
        title: `Application ${stage}`,
        message: `Your application for ${application.jobTitle} has been moved to ${stage}`,
        link: `/jobs/${application.jobId}`,
        isRead: false,
        type: 'info',
        createdAt: new Date().toISOString()
      });

      toast({ title: 'Status Updated', description: `Application moved to ${stage}` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update status' });
    }
  };

  const scheduleInterview = () => {
    router.push(`/interviews/new?applicationId=${application.id}`);
  };

  if (application.stage === 'Applied') {
    return (
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={() => updateStatus('Screening', 'shortlisted')}>Accept</Button>
        <Button size="sm" variant="destructive" onClick={() => updateStatus('Rejected', 'rejected')}>Reject</Button>
      </div>
    );
  }

  if (application.stage === 'Screening') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={scheduleInterview}>Schedule Interview</Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('Rejected', 'rejected')}>Reject</Button>
      </div>
    );
  }

  if (application.stage === 'Technical Interview' || application.stage === 'HR Interview') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateStatus('Offer', 'offer')}>Send Offer</Button>
        <Button size="sm" variant="outline" onClick={() => updateStatus('Rejected', 'rejected')}>Reject</Button>
      </div>
    );
  }

  if (application.stage === 'Offer') {
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => updateStatus('Hired', 'hired')}>Mark Hired</Button>
      </div>
    );
  }

  return <Badge variant="secondary">{application.stage}</Badge>;
}

export default function ApplicationsPage() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { organizationId, isUserLoading } = useUserContext();


     const applicationsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, `organizations/${organizationId}/applications`));
    }, [firestore, organizationId]);

    const candidatesQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, `organizations/${organizationId}/candidates`));
    }, [firestore, organizationId]);

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return query(collection(firestore, `organizations/${organizationId}/jobs`));
    }, [firestore, organizationId]);

    const { data: applications, isLoading: isLoadingApplications } = useCollection<Application>(applicationsQuery);
    const { data: candidates, isLoading: isLoadingCandidates } = useCollection<Candidate>(candidatesQuery);
    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
    
    const applicationsWithDetails: ApplicationWithDetails[] = useMemo(() => {
        if (!applications || !candidates || !jobs) return [];

        const candidatesMap = new Map(candidates.map(c => [c.id, c]));
        const jobsMap = new Map(jobs.map(j => [j.id, j]));

        return applications.map(app => {
            const candidate = candidatesMap.get(app.candidateId);
            const job = jobsMap.get(app.jobId);
            return {
                ...app,
                candidateName: candidate?.name,
                candidateEmail: candidate?.email,
                jobTitle: job?.title,
            };
        });
    }, [applications, candidates, jobs]);

  const handleRowClick = (row: ApplicationWithDetails) => {
    router.push(`/candidates/${row.candidateId}`);
  };

  const isLoading = isUserLoading || isLoadingApplications || isLoadingCandidates || isLoadingJobs;

  if (isLoading) {
    return <ApplicationsPageSkeleton />;
  }

  return (
    <>
      <PageHeader
        title="Applications"
        description="Track and manage all candidate applications."
      />
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <DataTable columns={columns} data={applicationsWithDetails} searchKey="candidateName" onRowClick={handleRowClick} />
      </div>
    </>
  );
}


function ApplicationsPageSkeleton() {
    return (
        <>
            <PageHeader
                title="Applications"
                description="Track and manage all candidate applications."
            />
            <div className="bg-card p-4 rounded-lg border shadow-sm">
                <div className="flex items-center py-4">
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="rounded-md border">
                    <div className="w-full text-sm">
                        <div className="border-b">
                            <div className="flex h-12 items-center px-4">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-32 ml-auto" />
                                <Skeleton className="h-6 w-24 ml-auto" />
                                <Skeleton className="h-6 w-20 ml-auto" />
                                <Skeleton className="h-6 w-24 ml-auto" />
                            </div>
                        </div>
                        <div>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center px-4 py-2 border-b">
                                    <div className="flex items-center gap-3 w-full">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-32 ml-auto" />
                                    <Skeleton className="h-6 w-24 ml-auto" />
                                    <Skeleton className="h-4 w-20 ml-auto" />
                                    <Skeleton className="h-4 w-24 ml-auto" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                 <div className="flex items-center justify-end space-x-2 py-4">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
        </>
    )
}
