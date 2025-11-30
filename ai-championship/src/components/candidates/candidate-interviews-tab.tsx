
'use client';

import { useState } from "react";
import { Interview, InterviewerFeedback, Application } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { aiSummarizeFeedback, AiSummarizeFeedbackOutput } from "@/ai/flows/ai-summarize-feedback";
import { useMemo } from "react";

function formatTimelineDate(dateString: string) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FeedbackSummary({ feedbacks, jobTitle, candidateName }: { feedbacks: InterviewerFeedback[], jobTitle: string, candidateName: string }) {
    const [summary, setSummary] = useState<AiSummarizeFeedbackOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const getSummary = async () => {
        setIsLoading(true);
        try {
            const result = await aiSummarizeFeedback({ feedbacks, jobTitle, candidateName });
            setSummary(result);
        } catch (error) {
            console.error("Error summarizing feedback:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate AI summary.' });
        } finally {
            setIsLoading(false);
        }
    };

    if (summary) {
        return (
            <div className="space-y-4 text-sm">
                {summary.overallSummary && <div>
                    <h4 className="font-semibold mb-1">Overall Summary</h4>
                    <p className="text-muted-foreground">{summary.overallSummary}</p>
                </div>}
                {summary.keyStrengths?.length > 0 && <div>
                    <h4 className="font-semibold mb-1">Key Strengths</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                        {summary.keyStrengths.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>}
                 {summary.keyWeaknesses?.length > 0 && <div>
                    <h4 className="font-semibold mb-1">Key Weaknesses</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                        {summary.keyWeaknesses.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>}
                {summary.recommendedNextStep && <div>
                    <h4 className="font-semibold mb-1">Recommendation</h4>
                    <p className="text-muted-foreground">{summary.recommendedNextStep}</p>
                </div>}
            </div>
        );
    }
    
    return (
        <Button onClick={getSummary} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
            Get AI Summary
        </Button>
    )
}

function InterviewFeedbackCard({ feedback }: { feedback: InterviewerFeedback }) {
    return (
         <Card className="mb-4">
            <CardHeader>
                <CardTitle className="text-base flex justify-between">
                    <span>Feedback from {feedback.interviewerName}</span>
                    <Badge variant={feedback.verdict.toLowerCase().includes('hire') ? 'default' : 'destructive'}>{feedback.verdict}</Badge>
                </CardTitle>
                <CardDescription>Rating: {feedback.rating} / 5</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
                    {feedback.pros && <div>
                    <h5 className="font-semibold mb-1">Pros</h5>
                    <p className="text-muted-foreground">{feedback.pros}</p>
                    </div>}
                    {feedback.cons && <div>
                    <h5 className="font-semibold mb-1">Cons</h5>
                    <p className="text-muted-foreground">{feedback.cons}</p>
                    </div>}
            </CardContent>
        </Card>
    );
}

type CandidateInterviewsTabProps = {
    interviews: Interview[];
    applications: Application[];
    candidateName: string;
    isLoading: boolean;
};

export function CandidateInterviewsTab({ interviews, applications, candidateName, isLoading }: CandidateInterviewsTabProps) {
    const allInterviewFeedback = useMemo(() => {
        return interviews?.flatMap(i => i.interviewerFeedback || []) || [];
    }, [interviews]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Interview Feedback</CardTitle>
                    <CardDescription>Consolidated feedback from all interview stages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-40 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Interview Feedback</CardTitle>
                <CardDescription>Consolidated feedback from all interview stages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {allInterviewFeedback.length > 0 && (
                    <Card className="bg-muted/50">
                        <CardHeader>
                            <CardTitle className="text-base">AI-Powered Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FeedbackSummary 
                                feedbacks={allInterviewFeedback}
                                jobTitle={applications?.map(app => app.jobId).join(', ') || 'N/A'}
                                candidateName={candidateName}
                            />
                        </CardContent>
                    </Card>
                )}

                {interviews.map(interview => (
                    <div key={interview.id}>
                        <h4 className="font-semibold mb-2">{interview.type} Interview on {formatTimelineDate(interview.scheduledAt)}</h4>
                            {interview.interviewerFeedback && interview.interviewerFeedback.length > 0 ? (
                            interview.interviewerFeedback.map((fb, i) => <InterviewFeedbackCard key={i} feedback={fb} />)
                            ) : (
                            <Link href={`/interviews/${interview.id}/feedback`}>
                                <p className="text-sm text-muted-foreground hover:text-primary">No feedback submitted yet for this interview. Click to add.</p>
                            </Link>
                            )}
                    </div>
                ))}

                {interviews.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No interviews have been scheduled for this candidate yet.</p>
                )}
            </CardContent>
        </Card>
    );
}
