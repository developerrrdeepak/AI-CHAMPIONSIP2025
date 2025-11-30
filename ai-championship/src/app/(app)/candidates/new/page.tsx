
'use client';

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, writeBatch, doc, updateDoc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { aiEnrichProfile } from "@/ai/flows/ai-enrich-profile";
import { aiAnalyzeCandidate } from "@/ai/flows/ai-analyze-candidate";
import { aiCandidateRanking } from "@/ai/flows/ai-candidate-ranking";
import { aiCultureFit } from "@/ai/flows/ai-culture-fit";
import type { Job } from "@/lib/definitions";

const candidateFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  currentRole: z.string().optional(),
  rawResumeText: z.string().optional(),
  resumeFile: z.any().optional(),
});

export default function NewCandidatePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { firestore, user } = useFirebase();

    const form = useForm<z.infer<typeof candidateFormSchema>>({
        resolver: zodResolver(candidateFormSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            currentRole: "",
            rawResumeText: "",
        },
    });

    const triggerAIEnrichment = async (candidateId: string, rawText: string, organizationId: string) => {
        try {
            // Run both AI flows in parallel
            const [enrichedData, analysisData] = await Promise.all([
                aiEnrichProfile({ rawText }),
                aiAnalyzeCandidate({ resumeText: rawText })
            ]);

            const candidateRef = doc(firestore!, `organizations/${organizationId}/candidates`, candidateId);
            await updateDoc(candidateRef, {
                ...enrichedData,
                aiProfileJson: JSON.stringify(analysisData),
                updatedAt: new Date().toISOString(),
            });

            toast({
                title: "AI Enrichment Complete",
                description: "Candidate profile has been automatically populated and analyzed.",
            });
        } catch (e) {
            console.error("AI enrichment failed:", e);
            toast({
                variant: 'destructive',
                title: "AI Enrichment Failed",
                description: "Could not automatically parse and analyze the resume.",
            });
        }
    };
    
    const createApplication = async (candidateId: string, organizationId: string, jobId: string) => {
        if (!firestore) return;
        const jobsCol = collection(firestore, `organizations/${organizationId}/jobs`);
        const jobDocRef = doc(jobsCol, jobId);

        // This needs to be an awaited call as we need job data for ranking.
        const jobSnap = await getDoc(jobDocRef);
        
        if (!jobSnap.exists()) {
             toast({ variant: 'destructive', title: "Error", description: "Could not find the specified job to apply to." });
             return;
        }
        
        const jobData = jobSnap.data() as Job;
        const resumeText = form.getValues('rawResumeText') || '';

        const applicationData = {
            organizationId,
            jobId,
            candidateId,
            status: 'applied',
            stage: 'Applied',
            fitScore: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }

        const appRef = await addDocumentNonBlocking(collection(firestore, `organizations/${organizationId}/applications`), applicationData);

        // Rank candidate and analyze culture fit in the background if resume text is available
        if (resumeText && appRef) {
            toast({ title: "AI Analysis Started", description: "Calculating fit score and culture summary." });
            try {
                // Run both in parallel
                const [ranking, cultureFit] = await Promise.all([
                     aiCandidateRanking({
                        jobDescription: jobData.jobDescription,
                        candidateResume: resumeText
                    }),
                    aiCultureFit({
                        jobDescription: jobData.jobDescription,
                        candidateResume: resumeText
                    })
                ]);
                
                await updateDoc(appRef, { 
                    fitScore: ranking.fitScore,
                    cultureFitSummary: cultureFit.cultureFitSummary
                });

                toast({ title: "AI Analysis Complete", description: `Fit score of ${ranking.fitScore} assigned.` });
            } catch (e) {
                console.error("AI analysis failed:", e);
                toast({
                    variant: 'destructive',
                    title: "AI Analysis Failed",
                    description: "Could not calculate fit score or culture summary.",
                });
            }
        }
    }

    async function onSubmit(values: z.infer<typeof candidateFormSchema>) {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Error", description: "Could not add candidate. User not authenticated." });
            return;
        }
        
        const isCandidateApplying = searchParams.get('role') === 'Candidate';
        const organizationId = isCandidateApplying ? 'org-demo-owner-id' : `org-${user.uid}`;
        const candidatesCol = collection(firestore, `organizations/${organizationId}/candidates`);
        
        const { resumeFile, ...candidateData } = values;
        
        const newCandidateData = {
            ...candidateData,
            organizationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newDocRef = await addDocumentNonBlocking(candidatesCol, newCandidateData);
        
        if (!newDocRef) {
             toast({ variant: "destructive", title: "Error", description: "Failed to create candidate document." });
             return;
        }

        toast({
            title: isCandidateApplying ? "Application Submitted" : "Candidate Added",
            description: isCandidateApplying ? `Your application has been received.` : `${values.name} has been added to your pipeline.`,
        });

        if (resumeFile && resumeFile.length > 0) {
            const file = resumeFile[0];
            const formData = new FormData();
            formData.append("file", file);
            formData.append("candidateId", newDocRef.id);
            formData.append("fileName", file.name);

            try {
                const response = await fetch('/api/vultr/storage', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const result = await response.json();
                    const candidateRef = doc(firestore, `organizations/${organizationId}/candidates`, newDocRef.id);
                    await updateDoc(candidateRef, {
                        resumeKey: result.data.resumeKey,
                        updatedAt: new Date().toISOString(),
                    });
                    toast({ title: "Resume Uploaded", description: "The resume file has been saved." });
                } else {
                    toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload the resume file." });
                }
            } catch (error) {
                console.error("Resume upload failed:", error);
                toast({ variant: "destructive", title: "Upload Failed", description: "An error occurred during resume upload." });
            }
        }
        
        if (values.rawResumeText) {
            toast({
                title: "AI Enrichment Started",
                description: "Parsing resume to build candidate profile...",
            });
            triggerAIEnrichment(newDocRef.id, values.rawResumeText, organizationId);
        }

        const jobId = searchParams.get('jobId');
        if (jobId) {
            createApplication(newDocRef.id, organizationId, jobId);
        }
        
        router.push(isCandidateApplying ? `/jobs?role=Candidate` : "/candidates");
    }

  return (
    <>
      <PageHeader title="Add New Candidate" description="Manually enter details or paste a resume to have our AI parse it." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. jane.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1 555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Software Engineer at TechCorp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="resumeFile"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Upload Resume</FormLabel>
                                <FormControl>
                                    <Input type="file" {...form.register("resumeFile")} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground text-center">OR</p>
                </div>
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="rawResumeText"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Paste Resume Text</FormLabel>
                            <FormControl>
                            <Textarea
                                placeholder="Paste the candidate's resume text here and our AI will analyze it upon submission."
                                className="min-h-[200px] font-code"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {searchParams.get('jobId') ? 'Submit Application' : 'Add Candidate'}
              </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
