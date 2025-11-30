
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table';
import type { Candidate, Application, Job } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { placeholderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { useUserContext } from '../layout';

type CandidateWithAppInfo = Candidate & {
  jobTitle?: string;
  stage?: string;
  fitScore?: number;
};

const columns: {
  accessorKey: keyof CandidateWithAppInfo;
  header: string;
  cell?: ({ row }: { row: { original: CandidateWithAppInfo } }) => JSX.Element;
  enableSorting?: boolean;
}[] = [
  {
    accessorKey: 'name',
    header: 'Candidate',
    enableSorting: true,
    cell: ({ row }) => (
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-2')?.imageUrl} data-ai-hint="person face" />
                <AvatarFallback>{row.original.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="font-semibold">{row.original.name}</div>
                <div className="text-sm text-muted-foreground">{row.original.email}</div>
            </div>
        </div>
    ),
  },
  {
    accessorKey: 'jobTitle',
    header: 'Applied For',
    enableSorting: true,
    cell: ({ row }) => row.original.jobTitle ? row.original.jobTitle : <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: 'stage',
    header: 'Current Stage',
    cell: ({ row }) => {
        if (!row.original.stage) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="secondary">{row.original.stage}</Badge>;
    },
  },
  {
    accessorKey: 'fitScore',
    header: 'Fit Score',
    enableSorting: true,
    cell: ({ row }) => (row.original.fitScore ? <div className="flex items-center gap-1 font-semibold">{row.original.fitScore} <Star className="w-4 h-4 text-amber-400 fill-amber-400" /></div> : <span className="text-muted-foreground">-</span>),
  },
  {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      enableSorting: true,
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
  }
];

export default function CandidatesPage() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { organizationId, isUserLoading } = useUserContext();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }, []);

    const candidatesQuery = useMemoFirebase(() => {
        if (!organizationId || !firestore) return null;
        return query(collection(firestore, `organizations/${organizationId}/candidates`), orderBy('updatedAt', 'desc'));
    }, [organizationId, firestore]);

    const { data: candidates, isLoading: isLoadingCandidates } = useCollection<Candidate>(candidatesQuery);

    const [applicationsByCandidate, setApplicationsByCandidate] = useState<Map<string, Application>>(new Map());
    const [isLoadingApps, setIsLoadingApps] = useState(true);

     useEffect(() => {
        if (!firestore || !organizationId) {
            setIsLoadingApps(false);
            return;
        };

        const fetchApplications = async () => {
            setIsLoadingApps(true);
            const newAppMap = new Map<string, Application>();
            
            const appsQuery = query(
                collection(firestore, `organizations/${organizationId}/applications`)
            );

            try {
                const querySnapshot = await getDocs(appsQuery);
                querySnapshot.forEach(doc => {
                    const app = doc.data() as Application;
                    const existingApp = newAppMap.get(app.candidateId);
                     if (!existingApp || new Date(app.updatedAt) > new Date(existingApp.updatedAt)) {
                        newAppMap.set(app.candidateId, app);
                    }
                });
            } catch (e) {
                console.error("Error fetching applications for candidates:", e);
            }
            
            setApplicationsByCandidate(newAppMap);
            setIsLoadingApps(false);
        };

        fetchApplications();

    }, [firestore, organizationId]);


    const jobsQuery = useMemoFirebase(() => {
        if (!organizationId || !firestore) return null;
        return query(collection(firestore, `organizations/${organizationId}/jobs`));
    }, [organizationId, firestore]);

    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
    
    const candidatesWithInfo: CandidateWithAppInfo[] = useMemo(() => {
        if (!candidates) return [];
        if (!jobs && isLoadingJobs) return candidates; 

        const jobsMap = new Map(jobs?.map(job => [job.id, job]));

        return candidates.map(candidate => {
            const application = applicationsByCandidate.get(candidate.id);
            const job = application ? jobsMap.get(application.jobId) : undefined;
            return {
                ...candidate,
                jobTitle: job?.title,
                stage: application?.stage,
                fitScore: application?.fitScore,
            };
        });
    }, [candidates, applicationsByCandidate, jobs, isLoadingJobs]);


    const handleRowClick = (row: CandidateWithAppInfo) => {
        router.push(`/candidates/${row.id}`);
    };
    
    const isLoading = isUserLoading || isLoadingCandidates || isLoadingApps || isLoadingJobs;

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <PageHeader
        title="Candidates"
        description="Browse and manage all candidates in your pipeline."
      >
        <Button asChild>
          <Link href="/candidates/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Candidate
          </Link>
        </Button>
      </PageHeader>
       <div className="rounded-xl border bg-card text-card-foreground shadow-sm mt-6 animate-in fade-in-0 duration-500">
        <DataTable columns={columns} data={candidatesWithInfo} searchKey="name" onRowClick={handleRowClick}/>
      </div>
    </div>
  );
}
