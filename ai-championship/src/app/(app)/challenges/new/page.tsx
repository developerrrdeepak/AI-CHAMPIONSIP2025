
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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const challengeFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  description: z.string().min(10, "Description is required."),
  type: z.enum(["Hackathon", "Case Study", "Quiz", "Coding Challenge"], { required_error: "Please select a challenge type."}),
  reward: z.string().optional(),
  deadline: z.date({ required_error: "A deadline is required." }),
});

type ChallengeFormData = z.infer<typeof challengeFormSchema>;

export default function NewChallengePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { firestore, user } = useFirebase();

    const form = useForm<ChallengeFormData>({
        resolver: zodResolver(challengeFormSchema),
        defaultValues: {
            title: "",
            description: "",
            reward: "Certificate of Achievement + Recognition",
        },
    });

    async function onSubmit(values: ChallengeFormData) {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a challenge." });
            return;
        }

        const organizationId = `org-${user.uid}`;
        const challengesCol = collection(firestore, `organizations/${organizationId}/challenges`);
        
        const newChallengeData = {
            ...values,
            deadline: values.deadline.toISOString(),
            organizationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addDocumentNonBlocking(challengesCol, newChallengeData);

        toast({
            title: "Challenge Created",
            description: `The challenge "${values.title}" has been successfully created.`,
        });
        router.push("/challenges");
    }

  return (
    <>
      <PageHeader title="Create New Challenge" description="Set up a new competition for candidates." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Challenge Details</CardTitle>
              <CardDescription>Provide the main information about the competition.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Challenge Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q1 Frontend Hackathon" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a challenge type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {['Hackathon', 'Case Study', 'Quiz', 'Coding Challenge'].map((type) => (
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
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Submission Deadline</FormLabel>
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
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Describe the challenge, rules, and evaluation criteria."
                            className="min-h-[150px]"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

               <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="reward"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Prize / Reward</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., $1000 cash prize, internship interview" {...field} />
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
                Create Challenge
              </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
    