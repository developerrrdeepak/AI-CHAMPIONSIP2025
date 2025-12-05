"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeftIcon, MagicWandIcon } from "@radix-ui/react-icons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/firebase/client-provider";
import { createJob } from "@/lib/firestore-service";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  company: z.string().min(2, {
    message: "Company must be at least 2 characters.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  salaryRange: z.string().optional(),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  skills: z.string().optional(),
});

type JobFormValues = z.infer<typeof formSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      company: "",
      location: "",
      salaryRange: "",
      description: "",
      requirements: "",
      responsibilities: "",
      skills: "",
    },
  });

  async function onSubmit(values: JobFormValues) {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a job.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createJob(user.uid, values);
      toast({
        title: "Job Created",
        description: "Your new job has been successfully posted!",
      });
      router.push("/jobs");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating job:", error);
    }
  }

  async function improveJobDescriptionWithAI() {
    setIsLoadingAI(true);
    try {
      const currentDescription = form.getValues("description");
      if (!currentDescription) {
        toast({
          title: "Input Required",
          description: "Please enter a description to improve.",
          variant: "destructive",
        });
        setIsLoadingAI(false);
        return;
      }

      const response = await fetch("/api/ai/improve-job-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobDescription: currentDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to improve job description with AI.");
      }

      const data = await response.json();
      if (data.success && data.improvedDescription) {
        form.setValue("description", data.improvedDescription);
        toast({
          title: "Description Improved",
          description: "AI suggestions have been applied.",
        });
      } else {
        toast({
          title: "AI Improvement Failed",
          description: data.error || "No improvements returned by AI.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error improving job description:", error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAI(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </Button>
      <h1 className="text-3xl font-bold mb-6">Create New Job Posting</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Software Engineer" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Google" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Remote, New York, CA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Salary Range (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., $100,000 - $150,000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the role, responsibilities, and qualifications..."
                    {...field}
                    rows={8}
                  />
                </FormControl>
                <FormMessage />
                <Button
                  type="button"
                  onClick={improveJobDescriptionWithAI}
                  disabled={isLoadingAI}
                  className="mt-2"
                >
                  {isLoadingAI ? (
                    "Improving..."
                  ) : (
                    <>
                      <MagicWandIcon className="mr-2 h-4 w-4" /> Improve with AI
                    </>
                  )}
                </Button>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Requirements (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List required skills and experience..."
                    {...field}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
                {/* AI Suggest button for requirements could go here */}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsibilities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsibilities (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Outline key duties and tasks..."
                    {...field}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
                {/* AI Suggest button for responsibilities could go here */}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Skills (Comma-separated, Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., JavaScript, React, Node.js, Firebase"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {/* AI Suggest button for skills could go here */}
              </FormItem>
            )}
          />

          <Button type="submit">Create Job</Button>
        </form>
      </Form>
    </div>
  );
}
