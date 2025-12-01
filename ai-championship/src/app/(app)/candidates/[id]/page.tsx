
'use client';

import { notFound, useParams, useSearchParams } from "next/navigation";
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, updateDoc, arrayUnion, arrayRemove, orderBy } from "firebase/firestore";
import type { Candidate, Application, ActivityLog, Interview } from "@/lib/definitions";
import { useMemo, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateHeader } from "@/components/candidates/candidate-header";
import { CandidateOverviewTab } from "@/components/candidates/candidate-overview-tab";
import { CandidateInterviewsTab } from "@/components/candidates/candidate-interviews-tab";
import { CandidateActivityTab } from "@/components/candidates/candidate-activity-tab";
import { CandidateSmarterResumeAnalysisTab } from "@/components/candidates/candidate-smarter-resume-analysis-tab";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

function CandidateProfileSkeleton() {
    return (
        <div className="space-y-6">
            <PageHeader title="Loading Candidate..." />
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-64" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-24" />
                </div>
            </div>
        </div>
    );
}

export default function CandidateDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const searchParams = useSearchParams();
    const role = searchParams.get('role');
    const isCandidateViewing = role === 'Candidate';

    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }, []);

    const organizationId = useMemo(() => {
        if (isCandidateViewing && user) return `personal-${user.uid}`;
        const orgId = localStorage.getItem('userOrgId');
        return orgId || (user ? `personal-${user.uid}` : null);
    }, [user, isCandidateViewing]);

    const candidateRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        if (isCandidateViewing && user) {
            return doc(firestore, `users`, user.uid);
        }
        if (!organizationId) return null;
        return doc(firestore, `organizations/${organizationId}/candidates`, id);
    }, [firestore, organizationId, id, isCandidateViewing, user]);

    const applicationsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId || !id) return null;
        return query(
            collection(firestore, `organizations/${organizationId}/applications`),
            where('candidateId', '==', id)
        );
    }, [firestore, organizationId, id]);

    const activityQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId || !id) return null;
        return query(
            collection(firestore, `organizations/${organizationId}/activity_logs`),
            where('target.id', '==', id),
            orderBy('timestamp', 'desc')
        );
    }, [firestore, organizationId, id]);

    const { data: candidate, isLoading: isCandidateLoading } = useDoc<Candidate>(candidateRef);
    const { data: applications, isLoading: areApplicationsLoading } = useCollection<Application>(applicationsQuery);
    const { data: activities, isLoading: areActivitiesLoading } = useCollection<ActivityLog>(activityQuery);
    
    const applicationIds = useMemo(() => applications?.map(app => app.id) || [], [applications]);

    const interviewsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId || applicationIds.length === 0) return null;
        return query(
            collection(firestore, `organizations/${organizationId}/interviews`),
            where('applicationId', 'in', applicationIds)
        );
    }, [firestore, organizationId, applicationIds]);

    const { data: interviews, isLoading: areInterviewsLoading } = useCollection<Interview>(interviewsQuery);

    const mostRecentApplication = applications?.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const hasStarred = useMemo(() => mostRecentApplication?.starredBy?.includes(user?.uid || ''), [mostRecentApplication, user?.uid]);

    const toggleStar = async () => {
        if (!firestore || !user || !mostRecentApplication || !organizationId) return;
        const appRef = doc(firestore, `organizations/${organizationId}/applications`, mostRecentApplication.id);
        try {
            await updateDoc(appRef, {
                starredBy: hasStarred ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
            toast({
                title: hasStarred ? "Candidate Unstarred" : "Candidate Starred",
            });
        } catch (error) {
            console.error("Failed to star/unstar candidate:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update starred status." });
        }
    };

    const isLoading = isCandidateLoading || areApplicationsLoading;

    useEffect(() => {
        if (!isLoading && !candidate) {
            notFound();
        }
    }, [isLoading, candidate]);


    if (isLoading) {
        return <CandidateProfileSkeleton />;
    }

    if (!candidate) {
        // This will be handled by the effect above, but as a fallback:
        return <CandidateProfileSkeleton />;
    }

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <CandidateHeader candidate={candidate} hasStarred={!!hasStarred} onToggleStar={toggleStar} isCandidateViewing={isCandidateViewing} />
      
      <Tabs defaultValue="overview" className="w-full mt-6">
        <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            {!isCandidateViewing && <TabsTrigger value="activity">Activity</TabsTrigger>}
            {!isCandidateViewing && <TabsTrigger value="smarter-resume-analysis">AI Resume Analysis</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="overview">
            <CandidateOverviewTab candidate={candidate} />
        </TabsContent>
        
        <TabsContent value="interviews">
           <CandidateInterviewsTab 
                interviews={interviews || []} 
                applications={applications || []}
                candidateName={candidate.name}
                isLoading={areInterviewsLoading}
            />
        </TabsContent>

        {!isCandidateViewing && <TabsContent value="activity">
            <CandidateActivityTab activities={activities || []} isLoading={areActivitiesLoading} />
        </TabsContent>}
        {!isCandidateViewing && <TabsContent value="smarter-resume-analysis">
            <CandidateSmarterResumeAnalysisTab candidateId={candidate.id} resumePath={`candidates/${candidate.id}/resume.pdf`} />
        </TabsContent>}
      </Tabs>
    </div>
  );
}
