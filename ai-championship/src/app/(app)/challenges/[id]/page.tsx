
'use client';

import { notFound, useParams, useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, setDoc } from "firebase/firestore";
import type { Challenge } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Trophy, Sparkles, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId || !id) return null;
    return query(
      collection(firestore, `organizations/${organizationId}/challenge_participants`),
      where('challengeId', '==', id)
    );
  }, [firestore, organizationId, id]);

  const { data: participants, isLoading: isLoadingParticipants } = useCollection(participantsQuery);

  if (isChallengeLoading) {
    return <ChallengeDetailSkeleton />;
  }

  // If the challenge isn't found in the derived org, we can't display it.
  if (!challenge) {
    notFound();
  }

  return <ChallengeContent challenge={challenge} isCandidate={isCandidate} participants={participants || []} organizationId={organizationId || ''} />;
}


function ChallengeContent({ challenge, isCandidate, participants, organizationId }: { challenge: Challenge, isCandidate: boolean, participants: any[], organizationId: string }) {
    const { user, firestore } = useFirebase() as any;
    const { toast } = useToast();
    const router = useRouter();
    const [isJoining, setIsJoining] = useState(false);

    const hasJoined = useMemo(() => {
      return participants.some(p => p.userId === user?.uid);
    }, [participants, user]);

    const handleJoin = async () => {
      if (!user || !firestore || !organizationId) return;

      setIsJoining(true);
      try {
        const participantId = `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const participantRef = doc(firestore, `organizations/${organizationId}/challenge_participants`, participantId);

        await setDoc(participantRef, {
          id: participantId,
          challengeId: challenge.id,
          userId: user.uid,
          userName: user.displayName || 'Participant',
          userEmail: user.email,
          joinedAt: new Date().toISOString(),
          status: 'active'
        });

        toast({
          title: 'Joined Challenge!',
          description: 'You are now participating in this challenge.',
        });
      } catch (error) {
        console.error('Join error:', error);
        toast({
          title: 'Error',
          description: 'Failed to join challenge. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsJoining(false);
      }
    };

    return (
    <>
      <PageHeader title={challenge.title} description={<Badge variant="secondary">{challenge.type}</Badge>}>
        {isCandidate && (
            <Button size="lg" onClick={handleJoin} disabled={isJoining || hasJoined}>
              <Sparkles className="mr-2 h-4 w-4" />
              {hasJoined ? 'Already Joined' : isJoining ? 'Joining...' : 'Join Now'}
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
                    <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 mt-1 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Participants</p>
                            <p className="text-muted-foreground">{participants.length} joined</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {participants.length > 0 && (
              <Card className={cn(isCandidate && 'glassmorphism')}>
                  <CardHeader>
                      <CardTitle>Participants</CardTitle>
                      <CardDescription>Real-time participant list</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {participants.slice(0, 10).map((participant) => (
                        <div key={participant.id} className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {participant.userName?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{participant.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              Joined {new Date(participant.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {participants.length > 10 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          +{participants.length - 10} more participants
                        </p>
                      )}
                  </CardContent>
              </Card>
            )}
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
