
'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Interview, Candidate, Job, Application } from '@/lib/definitions';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const feedbackFormSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  pros: z.string().min(10, 'Please provide at least a brief summary of strengths.'),
  cons: z.string().min(10, 'Please provide at least a brief summary of weaknesses.'),
  verdict: z.enum(['Strong Hire', 'Hire', 'No Hire', 'Strong No Hire']),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export default function InterviewFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const { firestore, user } = useFirebase();

  const organizationId = useMemo(() => user ? localStorage.getItem('userOrgId') : null, [user]);

  const interviewRef = useMemoFirebase(() => {
    if (!firestore || !organizationId || !id) return null;
    return doc(firestore, `organizations/${organizationId}/interviews`, id);
  }, [firestore, organizationId, id]);

  const { data: interview, isLoading: isInterviewLoading } = useDoc<Interview>(interviewRef);
  
  const applicationRef = useMemoFirebase(() => {
    if (!firestore || !organizationId || !interview) return null;
    return doc(firestore, `organizations/${organizationId}/applications`, interview.applicationId);
  }, [firestore, organizationId, interview]);
  const { data: application } = useDoc<Application>(applicationRef);

  const candidateRef = useMemoFirebase(() => {
    if (!firestore || !organizationId || !application) return null;
    return doc(firestore, `organizations/${organizationId}/candidates`, application.candidateId);
  }, [firestore, organizationId, application]);
  const { data: candidate } = useDoc<Candidate>(candidateRef);
  
  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
        rating: 3,
        pros: '',
        cons: '',
        verdict: 'Hire',
    },
  });

  async function onSubmit(values: FeedbackFormData) {
    if (!interviewRef || !user) return;

    const newFeedback = {
        ...values,
        interviewerId: user.uid,
        interviewerName: user.displayName || 'Unnamed Interviewer',
        submittedAt: new Date().toISOString(),
    };

    try {
        await updateDoc(interviewRef, {
            interviewerFeedback: arrayUnion(newFeedback),
            status: 'completed',
        });
        toast({
            title: 'Feedback Submitted',
            description: `Your feedback for ${candidate?.name} has been recorded.`,
        });
        router.push(`/candidates/${candidate?.id}`);
    } catch(error) {
        console.error('Failed to submit feedback', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not submit feedback. Please try again.'
        });
    }
  }
  
  if (isInterviewLoading || !interview || !candidate) {
    return (
      <>
        <PageHeader title={<Skeleton className="h-8 w-64" />} description={<Skeleton className="h-4 w-48" />} />
        <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
      </>
    )
  }

  if (interview.interviewerFeedback?.some(fb => fb.interviewerId === user?.uid)) {
    return (
        <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Feedback Already Submitted</h2>
            <p className="text-muted-foreground mb-4">You have already submitted feedback for this interview.</p>
            <Button onClick={() => router.push(`/candidates/${candidate?.id}`)}>View Candidate Profile</Button>
        </div>
    )
  }

  return (
    <>
      <PageHeader
        title={`Interview Feedback for ${candidate.name}`}
        description={`Regarding the ${interview.type} interview.`}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Your Assessment</CardTitle>
                    <CardDescription>Provide your evaluation of the candidate's performance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <FormField
                        control={form.control}
                        name="rating"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Overall Rating (1-5)</FormLabel>
                             <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={String(field.value)}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a rating" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {[1,2,3,4,5].map(num => <SelectItem key={num} value={String(num)}>{num}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="pros"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Strengths / Pros</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="What went well? What are the candidate's key strengths?"
                                className="min-h-[120px]"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cons"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Weaknesses / Cons</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Any concerns? Where could the candidate improve?"
                                className="min-h-[120px]"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="verdict"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Final Verdict</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your final recommendation" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {['Strong Hire', 'Hire', 'No Hire', 'Strong No Hire'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
             <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Feedback
              </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
