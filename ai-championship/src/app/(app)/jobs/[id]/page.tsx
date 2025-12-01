
'use client';

import { notFound, useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrainCircuit, Briefcase, Calendar, DollarSign, Edit, MapPin, PlusCircle, UserCheck, Users, Loader2, HelpCircle, Target, Columns } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useMemo, useEffect } from "react";
import { aiImproveJobDescription } from "@/ai/flows/ai-improve-job-description";
import { suggestSkills } from "@/ai/flows/ai-suggest-skills";
import { aiSuggestInterviewQuestions } from "@/ai/flows/ai-suggest-interview-questions";
import { aiOfferNudge, AiOfferNudgeOutput } from "@/ai/flows/ai-offer-nudge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import type { Job, Candidate, Application } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import { placeholderImages } from '@/lib/placeholder-images';
import { useUserContext } from "../../layout";

type ModalContent = {
    title: string;
    content: string | string[] | AiOfferNudgeOutput['nudges'];
};

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const { role, organizationId, isUserLoading: isAppLoading } = useUserContext();
  const isCandidate = role === 'Candidate';

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({title: '', content: ''});
  const [mounted, setMounted] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }, []);

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !organizationId || !id) return null;
    return doc(firestore, `organizations/${organizationId}/jobs`, id);
  }, [firestore, organizationId, id]);

  const applicationsQuery = useMemoFirebase(() => {
      if (!firestore || !organizationId || !id) return null;
      return query(
        collection(firestore, `organizations/${organizationId}/applications`), 
        where('jobId', '==', id),
        orderBy('fitScore', 'desc')
      );
  }, [firestore, organizationId, id]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobRef);
  const { data: applications, isLoading: areApplicationsLoading } = useCollection<Application>(applicationsQuery);

  const candidateIds = useMemo(() => applications?.map(app => app.candidateId) || [], [applications]);

  const candidatesQuery = useMemoFirebase(() => {
    // Firestore 'in' queries are limited to 30 items.
    if (!firestore || !organizationId || candidateIds.length === 0) return null;
    return query(collection(firestore, `organizations/${organizationId}/candidates`), where('__name__', 'in', candidateIds.slice(0, 30)));
  }, [firestore, organizationId, candidateIds]);

  const { data: candidates, isLoading: areCandidatesLoading } = useCollection<Candidate>(candidatesQuery);

  const topCandidates = useMemo(() => {
    if (!applications || !candidates) return [];

    const candidateMap = new Map(candidates.map(c => [c.id, c]));

    return applications
      .map(app => {
        const candidate = candidateMap.get(app.candidateId);
        if (!candidate) return null;
        return {
          ...candidate,
          fitScore: app.fitScore,
          applicationId: app.id,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .slice(0, 5);
  }, [applications, candidates]);


  if (isAppLoading || isJobLoading || areApplicationsLoading || areCandidatesLoading) {
    return <JobDetailSkeleton isCandidateView={isCandidate} />;
  }

  if (!job) {
    notFound();
  }

  const handleImproveDescription = async () => {
    if(!job.jobDescription) return;
    setIsLoadingAI(true);
    setModalContent({ title: "Improving Job Description...", content: ""});
    setIsModalOpen(true);
    try {
      const result = await aiImproveJobDescription({ jobDescription: job.jobDescription });
      setModalContent({ title: "AI-Improved Job Description", content: result.improvedJobDescription });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to improve job description.",
      });
      setIsModalOpen(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleSuggestSkills = async () => {
     if(!job.jobDescription) return;
    setIsLoadingAI(true);
    setModalContent({ title: "Suggesting Skills...", content: ""});
    setIsModalOpen(true);
    try {
      const result = await suggestSkills({ jobDescription: job.jobDescription });
      setModalContent({ title: "AI-Suggested Skills", content: result.suggestedSkills });
    } catch (error) {
      console.error(error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suggest skills.",
      });
      setIsModalOpen(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

   const handleSuggestQuestions = async () => {
     if(!job.jobDescription) return;
    setIsLoadingAI(true);
    setModalContent({ title: "Generating Interview Questions...", content: ""});
    setIsModalOpen(true);
    try {
      const result = await aiSuggestInterviewQuestions({ jobTitle: job.title, jobDescription: job.jobDescription });
      setModalContent({ title: "AI-Suggested Interview Questions", content: result.questions });
    } catch (error) {
      console.error(error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suggest questions.",
      });
      setIsModalOpen(false);
    } finally {
      setIsLoadingAI(false);
    }
  };

    const handleOfferNudge = async () => {
        if (!job) return;
        setIsLoadingAI(true);
        setModalContent({ title: "Generating Offer Nudges...", content: ""});
        setIsModalOpen(true);
        try {
            const result = await aiOfferNudge({
                jobTitle: job.title,
                seniorityLevel: job.seniorityLevel,
                requiredSkills: job.requiredSkills || [],
                location: job.isRemote ? 'Remote' : `${job.locationCity}, ${job.locationCountry}`,
                currentMinSalary: job.salaryRangeMin,
                currentMaxSalary: job.salaryRangeMax,
            });
            setModalContent({ title: "AI Offer Nudges", content: result.nudges });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to generate offer nudges.",
            });
            setIsModalOpen(false);
        } finally {
            setIsLoadingAI(false);
        }
    };


  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <PageHeader title={job.title} description={`${job.department} · ${job.isRemote ? 'Remote' : `${job.locationCity}, ${job.locationCountry}`}`}>
        {isCandidate ? (
            <div className="flex gap-2">
              <Button asChild size="lg">
                <Link href={`/applications/new?jobId=${id}`}>Easy Apply</Link>
              </Button>
              {job.externalApplyUrl && (
                <Button asChild size="lg" variant="outline">
                  <a href={job.externalApplyUrl} target="_blank" rel="noopener noreferrer">Apply on Company Site</a>
                </Button>
              )}
            </div>
        ) : (
            <div className="flex gap-2">
                <Button variant="outline" asChild>
                    <Link href={`/jobs/${job.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Link>
                </Button>
                 <Button variant="outline" asChild>
                    <Link href={`/jobs/${job.id}/pipeline`}>
                        <Columns className="mr-2 h-4 w-4" />
                        Pipeline
                    </Link>
                </Button>
                <Button asChild>
                <Link href={`/candidates/new?jobId=${id}`}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Candidate
                </Link>
                </Button>
            </div>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-muted-foreground" />
                            <span>{job.employmentType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{job.isRemote ? "Remote" : `${job.locationCity}, ${job.locationCountry}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-muted-foreground" />
                            <span>{job.seniorityLevel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{job.numberOfOpenings} Opening(s)</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span>${job.salaryRangeMin ? job.salaryRangeMin/1000 : 'N/A'}k - ${job.salaryRangeMax ? job.salaryRangeMax/1000 : 'N/A'}k {job.salaryCurrency}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">{job.jobDescription}</p>
                    {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <>
                            <Separator className="my-4" />
                            <h3 className="font-semibold mb-2">Required Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.requiredSkills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                            </div>
                        </>
                    )}
                    {job.niceToHaveSkills && job.niceToHaveSkills.length > 0 && (
                        <>
                            <Separator className="my-4" />
                            <h3 className="font-semibold mb-2">Nice-to-have Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {job.niceToHaveSkills.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            {!isCandidate && (
                <>
                <Card>
                    <CardHeader>
                        <CardTitle>AI Helpers</CardTitle>
                        <CardDescription>Get assistance from HireBot AI.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleImproveDescription} disabled={isLoadingAI}>
                            <BrainCircuit className="w-4 h-4" />
                            Improve Job Description
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSuggestSkills} disabled={isLoadingAI}>
                            <BrainCircuit className="w-4 h-4" />
                            Suggest Skills
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSuggestQuestions} disabled={isLoadingAI}>
                            <HelpCircle className="w-4 h-4" />
                            Suggest Interview Questions
                        </Button>
                         <Button variant="outline" className="w-full justify-start gap-2" onClick={handleOfferNudge} disabled={isLoadingAI}>
                            <Target className="w-4 h-4" />
                            Get Offer Nudges
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Candidates</CardTitle>
                        <CardDescription>Highest scoring applicants for this role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {topCandidates.map(candidate => (
                            <Link href={`/candidates/${candidate?.id}`} key={candidate?.id} className="flex items-center justify-between p-2 -m-2 rounded-md hover:bg-muted">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-4')?.imageUrl} data-ai-hint="person face" />
                                        <AvatarFallback>{candidate?.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{candidate?.name}</p>
                                        <p className="text-sm text-muted-foreground">{candidate?.currentRole}</p>
                                    </div>
                                </div>
                                <Badge variant="secondary">{candidate?.fitScore}</Badge>
                            </Link>
                        ))}
                        {topCandidates.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">No candidates yet.</p>
                        )}
                    </CardContent>
                </Card>
                </>
            )}
        </div>
      </div>
       <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalContent.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            {isLoadingAI ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Generating...</p>
              </div>
            ) : (
                <>
                {Array.isArray(modalContent.content) ? (
                    'category' in (modalContent.content[0] || {}) ? (
                         <div className="space-y-4">
                            {(modalContent.content as AiOfferNudgeOutput['nudges']).map((nudge, i) => (
                                <div key={i} className="p-3 bg-muted/50 rounded-lg">
                                    <p className="font-semibold flex items-center gap-2"><Badge>{nudge.category}</Badge> {nudge.suggestion}</p>
                                    <p className="text-sm text-muted-foreground mt-1 pl-2 border-l-2">{nudge.reasoning}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ul className="list-disc pl-5 space-y-2">
                            {(modalContent.content as string[]).map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    )
                ) : (
                    <p className="whitespace-pre-wrap">{modalContent.content as string}</p>
                )}
                </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function JobDetailSkeleton({ isCandidateView }: { isCandidateView: boolean }) {
    return (
        <div className="animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <PageHeader title={<Skeleton className="h-9 w-64" />} description={<Skeleton className="h-4 w-48" />}>
                <Skeleton className="h-9 w-36" />
            </PageHeader>
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Details</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-5 w-3/4" />)}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Job Description</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </CardContent>
                    </Card>
                </div>
                {!isCandidateView && (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>AI Helpers</CardTitle>
                                <CardDescription>Get assistance from HireBot AI.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Candidates</CardTitle>
                                <CardDescription>Highest scoring applicants for this role.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-6 w-12 rounded-full" />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
