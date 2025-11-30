
'use client';

import { notFound, useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Challenge } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Trophy, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export default function ChallengeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const role = useMemo(() => searchParams.get('role'), [searchParams]);
  const isCandidate = role === 'Candidate';

  const { firestore, user } = useFirebase();
  
  const organizationId = useMemo(() => {
    if (isCandidate) return 'org-demo-owner-id';
    return user ? localStorage.getItem('userOrgId') : null;
  }, [user, isCandidate]);

  const challengeRef = useMemoFirebase(() => {
    if (!firestore || !organizationId || !id) return null;
    return doc(firestore, `organizations/${organizationId}/challenges`, id);
  }, [firestore, organizationId, id]);

  const { data: challenge, isLoading: isChallengeLoading } = useDoc<Challenge>(challengeRef);

  if (isChallengeLoading) {
    return <ChallengeDetailSkeleton />;
  }

  // If the challenge isn't found in the derived org, we can't display it.
  if (!challenge) {
    notFound();
  }

  return <ChallengeContent challenge={challenge} isCandidate={isCandidate} />;
}


function ChallengeContent({ challenge, isCandidate }: { challenge: Challenge, isCandidate: boolean }) {
    return (
    <>
      <PageHeader title={challenge.title} description={<Badge variant="secondary">{challenge.type}</Badge>}>
        {isCandidate && (
            <Button size="lg" disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              Participate Now
            </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card className={cn(isCandidate && 'glassmorphism')}>
                <CardHeader>
                    <CardTitle>Challenge Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{challenge.description}</p>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <Card className={cn(isCandidate && 'glassmorphism')}>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-2">
                        <Trophy className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Reward</p>
                            <p className="text-muted-foreground">{challenge.reward || 'Recognition and glory!'}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Deadline</p>
                            <p className="text-muted-foreground">{new Date(challenge.deadline).toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
    )
}


function ChallengeDetailSkeleton() {
    return (
        <>
            <PageHeader title={<Skeleton className="h-9 w-64" />} description={<Skeleton className="h-6 w-24" />}>
                <Skeleton className="h-11 w-36" />
            </PageHeader>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Challenge Description</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                             <Skeleton className="h-4 w-full mt-4" />
                            <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
