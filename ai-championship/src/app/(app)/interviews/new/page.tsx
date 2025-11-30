
'use client';

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query } from "firebase/firestore";
import type { Job, Application, Candidate } from "@/lib/definitions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { useMemo } from "react";
import { useUserContext } from "../../layout";

const interviewFormSchema = z.object({
  applicationId: z.string().min(1, "Please select a candidate application."),
  type: z.string().min(1, "Interview type is required."),
  scheduledAt: z.date({ required_error: "A date is required."}),
  durationMinutes: z.coerce.number().min(15, "Duration must be at least 15 minutes."),
  locationOrLink: z.string().min(1, "Location or a meeting link is required."),
  interviewerIds: z.array(z.string()).min(1, "At least one interviewer must be assigned."),
});

type InterviewFormData = z.infer<typeof interviewFormSchema>;

export default function NewInterviewPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { firestore } = useFirebase();
    const { organizationId, isUserLoading } = useUserContext();

    const form = useForm<InterviewFormData>({
        resolver: zodResolver(interviewFormSchema),
        defaultValues: {
            applicationId: "",
            type: "Technical",
            durationMinutes: 60,
            locationOrLink: "Google Meet",
            interviewerIds: [],
        },
    });

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

    const { data: applications, isLoading: isLoadingApps } = useCollection<Application>(applicationsQuery);
    const { data: candidates, isLoading: isLoadingCands } = useCollection<Candidate>(candidatesQuery);
    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

    const applicationsWithDetails = useMemo(() => {
        if (!applications || !candidates || !jobs) return [];
        const candMap = new Map(candidates.map(c => [c.id, c.name]));
        const jobMap = new Map(jobs.map(j => [j.id, j.title]));

        return applications
            .filter(app => app.stage !== 'Hired' && app.stage !== 'Rejected')
            .map(app => ({
                ...app,
                candidateName: candMap.get(app.candidateId),
                jobTitle: jobMap.get(app.jobId)
            }));
    }, [applications, candidates, jobs]);

    async function onSubmit(values: InterviewFormData) {
        if (!firestore || !organizationId) return;

        const interviewsCol = collection(firestore, `organizations/${organizationId}/interviews`);
        
        const newInterviewData = {
            ...values,
            organizationId,
            scheduledAt: values.scheduledAt.toISOString(),
            status: 'scheduled',
            interviewerFeedback: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addDocumentNonBlocking(interviewsCol, newInterviewData);

        toast({
            title: "Interview Scheduled",
            description: `The interview has been successfully scheduled.`,
        });
        router.push("/interviews");
    }
    
    const isLoading = isUserLoading || isLoadingApps || isLoadingCands || isLoadingJobs;

  return (
    <>
      <PageHeader title="Schedule Interview" description="Set up an interview with a candidate." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="applicationId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Candidate Application</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={isLoading ? "Loading applications..." : "Select candidate & job..."} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {applicationsWithDetails.map((app) => (
                                <SelectItem key={app.id} value={app.id}>
                                    {app.candidateName} - {app.jobTitle}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
                control={form.control}
                name="interviewerIds"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Assign Interviewers</FormLabel>
                     <Select onValueChange={(value) => field.onChange(value ? [value] : [])} defaultValue={field.value?.[0]} disabled>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select interviewers (feature coming soon)..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {/* User selection will be implemented here */}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an interview type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {['Phone Screen', 'Technical', 'Behavioral', 'Final Round'].map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date and Time</FormLabel>
                     <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                                )}
                            >
                                {field.value ? (
                                format(field.value, "PPP")
                                ) : (
                                <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date()
                                }
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
                control={form.control}
                name="locationOrLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location / Link</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Google Meet Link" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min={15} step={15} {...field} />
                    </FormControl>
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
                Schedule Interview
              </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
