
'use client';

import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import type { Interview, Application, Candidate, Job } from '@/lib/definitions';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PlusCircle, Mic, Square, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import { placeholderImages } from '@/lib/placeholder-images';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { textToSpeech } from '@/ai/flows/ai-tts-flow';
import { mockInterview } from '@/ai/flows/ai-mock-interview-flow';
import { useUserContext } from '../layout';
import { cn } from '@/lib/utils';

type InterviewWithDetails = Interview & {
  candidateName?: string;
  candidateEmail?: string;
  jobTitle?: string;
  applicationId: string; 
  candidateId?: string;
};

// --- MOCK INTERVIEW COMPONENTS ---

const JobSelection = ({ onStart }: { onStart: (jobType: string) => void }) => {
    const [jobType, setJobType] = useState('');

    return (
        <Card className="max-w-md mx-auto animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <CardHeader>
                <CardTitle>AI Mock Interview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-muted-foreground">Select a role type to start your practice session. The AI will ask you common questions for this role.</p>
                <Select onValueChange={setJobType} value={jobType}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a job type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Software Engineer">Software Engineer</SelectItem>
                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                        <SelectItem value="UX Designer">UX Designer</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={() => onStart(jobType)} disabled={!jobType} className="w-full">
                    Start Interview
                </Button>
            </CardContent>
        </Card>
    );
};

const InterviewSession = ({ jobType, onEnd }: { jobType: string, onEnd: () => void }) => {
    const [conversation, setConversation] = useState<{ speaker: 'ai' | 'user', text: string }[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isAITurn, setIsAITurn] = useState(true);
    const [status, setStatus] = useState('Starting...'); // 'thinking', 'speaking', 'listening'

    const recognition = useMemo(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if(SpeechRecognition) {
                const recognitionInstance = new SpeechRecognition();
                recognitionInstance.continuous = false;
                recognitionInstance.interimResults = false;
                return recognitionInstance;
            }
        }
        return null;
    }, []);
    
    const conversationEndRef = React.useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation]);


    useEffect(() => {
        const startInterview = async () => {
            setStatus('thinking');
            const initialResponse = await mockInterview({ jobType, history: [] });
            setStatus('speaking');
            const audioData = await textToSpeech(initialResponse.response);
            
            setConversation([{ speaker: 'ai', text: initialResponse.response }]);
            const audio = new Audio(audioData);
            audio.play();
            audio.onended = () => {
                setIsAITurn(false);
                setStatus('listening');
            };
        };
        startInterview();
    }, [jobType]);
    
    useEffect(() => {
        if (!recognition) return;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setConversation(prev => [...prev, { speaker: 'user', text: transcript }]);
            setIsAITurn(true);
            setStatus('thinking');
            
            const getNextQuestion = async () => {
                const history = [...conversation, { speaker: 'user', text: transcript }];
                const nextResponse = await mockInterview({ jobType, history });
                setStatus('speaking');
                const audioData = await textToSpeech(nextResponse.response);

                setConversation(prev => [...prev, { speaker: 'ai', text: nextResponse.response }]);
                const audio = new Audio(audioData);
                audio.play();
                audio.onended = () => {
                    setIsAITurn(false);
                    setStatus('listening');
                };
            };
            getNextQuestion();
        };

        recognition.onend = () => {
            setIsRecording(false);
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
            setStatus('listening');
        };

    }, [recognition, conversation, jobType]);


    const toggleRecording = () => {
        if (!recognition) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
        setIsRecording(!isRecording);
    };

    return (
        <Card className="max-w-2xl mx-auto animate-in fade-in-0 duration-500">
            <CardHeader>
                <CardTitle>Mock Interview: {jobType}</CardTitle>
                <CardDescription>Your session is in progress. The AI is now {status}.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 h-96 overflow-y-auto p-4 border rounded-md mb-4 bg-muted/30">
                    {conversation.map((entry, index) => (
                        <div key={index} className={cn("flex items-end gap-2", entry.speaker === 'user' && 'justify-end')}>
                             {entry.speaker === 'ai' && <Avatar className="h-8 w-8"><AvatarFallback><BrainCircuit /></AvatarFallback></Avatar>}
                            <div className={cn("p-3 rounded-lg max-w-[80%]", entry.speaker === 'ai' ? 'bg-background' : 'bg-primary text-primary-foreground')}>
                                {entry.text}
                            </div>
                        </div>
                    ))}
                    <div ref={conversationEndRef} />
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={toggleRecording} disabled={isAITurn} className="w-full">
                        {isRecording ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                        {isRecording ? 'Stop Answering' : (isAITurn ? 'AI is speaking...' : 'Start Answering')}
                    </Button>
                    <Button variant="outline" onClick={onEnd}>End Session</Button>
                </div>
            </CardContent>
        </Card>
    );
};

// --- END MOCK INTERVIEW COMPONENTS ---


const getColumns = (
    isInterviewer: boolean, 
    currentUserId: string | undefined, 
    onFeedbackClick: (interviewId: string) => void
): {
  accessorKey: keyof InterviewWithDetails;
  header: string;
  cell?: ({ row }: { row: { original: InterviewWithDetails } }) => JSX.Element;
  enableSorting?: boolean;
}[] => [
  {
    accessorKey: 'candidateName',
    header: 'Candidate',
    enableSorting: true,
     cell: ({ row }) => (
        <div className="flex items-center gap-3">
            <Avatar>
                <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-3')?.imageUrl} data-ai-hint="person face" />
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => <Badge variant="outline">{row.original.type}</Badge>,
  },
  {
    accessorKey: 'scheduledAt',
    header: 'Scheduled At',
    enableSorting: true,
    cell: ({ row }) => new Date(row.original.scheduledAt).toLocaleString(),
  },
    {
    accessorKey: 'status',
    header: 'Status',
    enableSorting: true,
    cell: ({ row }) => {
         const variant =
            row.original.status === 'completed'
            ? 'default'
            : row.original.status === 'cancelled'
            ? 'destructive'
            : 'secondary';
        return <Badge variant={variant} className="capitalize">{row.original.status}</Badge>;
    },
  },
  ...(isInterviewer ? [{
      accessorKey: 'id',
      header: 'Action',
      cell: ({ row }: { row: { original: InterviewWithDetails } }) => {
        const userHasSubmitted = row.original.interviewerFeedback?.some(fb => fb.interviewerId === currentUserId);
        const isPending = row.original.status === 'scheduled';

        if (isPending && !userHasSubmitted) {
            return (
                <Button variant="outline" size="sm" onClick={(e) => {
                    e.stopPropagation();
                    onFeedbackClick(row.original.id);
                }}>
                    Submit Feedback
                </Button>
            );
        }
        return null;
      },
  }] : []),
];

export default function InterviewsPage() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { user, role, organizationId, isUserLoading } = useUserContext();
    const isInterviewer = role === 'Interviewer';
    const isCandidate = role === 'Candidate';
    const [mockInterviewState, setMockInterviewState] = useState<{ inProgress: boolean, jobType: string }>({ inProgress: false, jobType: '' });

    const interviewsQuery = useMemoFirebase(() => {
        if (!firestore || !organizationId || !user) return null;
        const interviewsCollection = collection(firestore, `organizations/${organizationId}/interviews`);
        if (isInterviewer) {
            // Filter to only show interviews assigned to the current user
            return query(interviewsCollection, where('interviewerIds', 'array-contains', user.id));
        }
        return query(interviewsCollection);
    }, [firestore, organizationId, user, isInterviewer]);

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

    const { data: interviews, isLoading: isLoadingInterviews } = useCollection<Interview>(interviewsQuery);
    const { data: applications, isLoading: isLoadingApplications } = useCollection<Application>(applicationsQuery);
    const { data: candidates, isLoading: isLoadingCandidates } = useCollection<Candidate>(candidatesQuery);
    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
    
    const interviewsWithDetails: InterviewWithDetails[] = useMemo(() => {
        if (!interviews || !applications || !candidates || !jobs) return [];

        const applicationsMap = new Map(applications.map(a => [a.id, a]));
        const candidatesMap = new Map(candidates.map(c => [c.id, c]));
        const jobsMap = new Map(jobs.map(j => [j.id, j]));

        return interviews.map(interview => {
            const application = applicationsMap.get(interview.applicationId);
            const candidate = application ? candidatesMap.get(application.candidateId) : undefined;
            const job = application ? jobsMap.get(application.jobId) : undefined;
            return {
                ...interview,
                candidateName: candidate?.name,
                candidateEmail: candidate?.email,
                jobTitle: job?.title,
                candidateId: candidate?.id,
            };
        });
    }, [interviews, applications, candidates, jobs]);

  const handleRowClick = (row: InterviewWithDetails) => {
    if (row.candidateId) {
        router.push(`/candidates/${row.candidateId}?role=${role || ''}`);
    }
  };

  const handleFeedbackClick = (interviewId: string) => {
      router.push(`/interviews/${interviewId}/feedback?role=${role || ''}`);
  };

  const isLoading = isUserLoading || isLoadingInterviews || isLoadingApplications || isLoadingCandidates || isLoadingJobs;
  const columns = getColumns(isInterviewer, user?.id, handleFeedbackClick);
  
  const pageTitle = isInterviewer ? "My Interviews" : isCandidate ? "AI Mock Interview" : "Interviews";
  const pageDescription = isInterviewer 
    ? "Upcoming interviews assigned to you." 
    : isCandidate 
    ? "Practice for your real interviews with our AI voice assistant." 
    : "Schedule and manage all candidate interviews.";

  if (isCandidate) {
    return (
        <>
            <PageHeader title={pageTitle} description={pageDescription} />
            {mockInterviewState.inProgress 
                ? <InterviewSession jobType={mockInterviewState.jobType} onEnd={() => setMockInterviewState({ inProgress: false, jobType: '' })} /> 
                : <JobSelection onStart={(jobType) => setMockInterviewState({ inProgress: true, jobType })} />
            }
        </>
    )
  }

  return (
    <>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      >
        {!isInterviewer && !isCandidate && (
            <Button asChild>
            <Link href="/interviews/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Schedule Interview
            </Link>
            </Button>
        )}
      </PageHeader>
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        {isLoading ? (
            <InterviewsPageSkeleton isInterviewer={isInterviewer} />
        ) : (
            <DataTable columns={columns} data={interviewsWithDetails} searchKey="candidateName" onRowClick={handleRowClick} />
        )}
      </div>
    </>
  );
}


function InterviewsPageSkeleton({ isInterviewer }: { isInterviewer: boolean }) {
    
    const headerCount = isInterviewer ? 6 : 5;

    return (
        <>
             <div className="flex items-center py-4">
                <Skeleton className="h-10 w-64" />
            </div>
            <div className="rounded-md border">
                <div className="w-full text-sm">
                    <div className="border-b">
                        <div className="flex h-12 items-center px-4">
                            {[...Array(headerCount)].map((_, i) => (
                                 <Skeleton key={i} className="h-6 w-24" style={{marginLeft: i > 0 ? 'auto' : '0'}} />
                            ))}
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
                                 {[...Array(headerCount - 1)].map((_, j) => (
                                     <Skeleton key={j} className="h-6 w-24 ml-auto" />
                                 ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
            </div>
        </>
    )
}
