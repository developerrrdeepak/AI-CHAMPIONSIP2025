
'use client';

import { notFound, useParams } from "next/navigation";
import { useFirebase, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { Job, Application, Candidate } from "@/lib/definitions";
import { useMemo, useState, useEffect, DragEvent } from "react";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { placeholderImages } from "@/lib/placeholder-images";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


type CandidateWithAppInfo = Candidate & {
  applicationId: string;
  stage: Application['stage'];
  fitScore?: number;
};


const PIPELINE_STAGES: Application['stage'][] = [
    'Applied', 'Screening', 'Technical Interview', 'HR Interview', 'Offer', 'Hired'
];

function CandidateCard({ candidate }: { candidate: CandidateWithAppInfo }) {
    const router = useRouter();

    const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("applicationId", candidate.applicationId);
    };

    return (
        <Card 
            className="mb-2 cursor-grab active:cursor-grabbing hover:bg-muted/80 transition-all duration-200"
            draggable
            onDragStart={handleDragStart}
            onClick={() => router.push(`/candidates/${candidate.id}`)}
        >
            <CardContent className="p-3">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-1')?.imageUrl} data-ai-hint="person face" />
                        <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-sm font-semibold truncate">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{candidate.currentRole}</p>
                    </div>
                    {candidate.fitScore && (
                        <div className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span>{candidate.fitScore}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function PipelineColumn({ 
    title, 
    candidates, 
    onDrop,
}: { 
    title: Application['stage'], 
    candidates: CandidateWithAppInfo[],
    onDrop: (stage: Application['stage'], e: DragEvent<HTMLDivElement>) => void,
}) {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        onDrop(title, e);
        setIsDragOver(false);
    };

    return (
        <div 
            className="flex-1 min-w-[280px] h-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={cn("flex flex-col h-full bg-muted/50 rounded-lg transition-colors", isDragOver && 'bg-primary/10')}>
                <div className="p-3 border-b">
                    <h3 className="font-semibold text-sm">{title} <span className="text-muted-foreground font-normal">({candidates.length})</span></h3>
                </div>
                <div className="p-2 flex-1 overflow-y-auto">
                    {candidates.map(candidate => (
                        <CandidateCard key={candidate.applicationId} candidate={candidate} />
                    ))}
                </div>
            </div>
        </div>
    )
}

function PipelineSkeleton() {
    return (
        <div className="flex flex-col h-full">
            <PageHeader title={<Skeleton className="h-9 w-64" />} description={<Skeleton className="h-4 w-48" />} />
            <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-1 min-w-[280px] h-full">
                        <div className="flex flex-col h-full bg-muted/50 rounded-lg p-3">
                            <Skeleton className="h-5 w-1/2 mb-4" />
                            <div className="space-y-2">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function JobPipelinePage() {
    const params = useParams();
    const id = params.id as string;
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const organizationId = useMemo(() => user ? localStorage.getItem('userOrgId') : null, [user]);

    const [dragOverStage, setDragOverStage] = useState<Application['stage'] | null>(null);

    const jobRef = useMemoFirebase(() => {
        if (!firestore || !organizationId || !id) return null;
        return doc(firestore, `organizations/${organizationId}/jobs`, id);
    }, [firestore, organizationId, id]);

    const applicationsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId || !id) return null;
        return query(
          collection(firestore, `organizations/${organizationId}/applications`), 
          where('jobId', '==', id)
        );
    }, [firestore, organizationId, id]);

    const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
    const { data: applications, isLoading: areAppsLoading } = useCollection<Application>(applicationsQuery);

    const candidateIds = useMemo(() => applications?.map(app => app.candidateId) || [], [applications]);

    const candidatesQuery = useMemoFirebase(() => {
      if (!firestore || !organizationId || candidateIds.length === 0) return null;
      // Firestore 'in' queries are limited to 30 items at a time.
      return query(collection(firestore, `organizations/${organizationId}/candidates`), where('__name__', 'in', candidateIds.slice(0, 30)));
    }, [firestore, organizationId, candidateIds]);
  
    const { data: candidates, isLoading: areCandsLoading } = useCollection<Candidate>(candidatesQuery);

    const [localApplications, setLocalApplications] = useState<Application[] | null>(null);

    useEffect(() => {
        if(applications) {
            setLocalApplications(applications);
        }
    }, [applications]);

    const candidatesByStage = useMemo(() => {
        const initialMap: Record<Application['stage'], CandidateWithAppInfo[]> = {
            'Applied': [], 'Screening': [], 'Technical Interview': [], 'HR Interview': [], 'Offer': [], 'Hired': [], 'Rejected': []
        };
        if (!localApplications || !candidates) return initialMap;

        const candidateMap = new Map(candidates.map(c => [c.id, c]));

        return localApplications.reduce((acc, app) => {
            const candidate = candidateMap.get(app.candidateId);
            if (candidate && PIPELINE_STAGES.includes(app.stage)) {
                if (!acc[app.stage]) acc[app.stage] = [];
                acc[app.stage].push({
                    ...candidate,
                    applicationId: app.id,
                    stage: app.stage,
                    fitScore: app.fitScore
                });
            }
            return acc;
        }, initialMap);

    }, [localApplications, candidates]);

    const handleDrop = async (newStage: Application['stage'], e: DragEvent<HTMLDivElement>) => {
        const applicationId = e.dataTransfer.getData("applicationId");
        if (!applicationId || !firestore || !organizationId || !localApplications) return;

        const originalApplication = localApplications.find(app => app.id === applicationId);
        if (!originalApplication || originalApplication.stage === newStage) return;

        // Optimistic UI update
        setLocalApplications(prev => prev?.map(app => 
            app.id === applicationId ? { ...app, stage: newStage, updatedAt: new Date().toISOString() } : app
        ) || null);
        
        try {
            const appRef = doc(firestore, `organizations/${organizationId}/applications`, applicationId);
            await updateDoc(appRef, {
                stage: newStage,
                updatedAt: new Date().toISOString(),
            });
            toast({
                title: "Candidate Moved",
                description: `Candidate moved to ${newStage} stage.`,
            });
        } catch (error) {
            console.error("Failed to update application stage:", error);
            // Revert optimistic update on failure
             setLocalApplications(prev => prev?.map(app => 
                app.id === applicationId ? originalApplication : app
            ) || null);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not move candidate. Please try again.",
            });
        }
    };
    
    const isLoading = isJobLoading || areAppsLoading || areCandsLoading;

    if (isLoading || !localApplications) {
        return <PipelineSkeleton />;
    }

    if (!job) {
        notFound();
    }

    return (
        <div className="flex flex-col h-full">
            <PageHeader title={job.title} description="Candidate Pipeline" />
            <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
                {PIPELINE_STAGES.map(stage => (
                    <PipelineColumn 
                        key={stage}
                        title={stage}
                        candidates={candidatesByStage[stage] || []}
                        onDrop={handleDrop}
                    />
                ))}
            </div>
        </div>
    );
}
