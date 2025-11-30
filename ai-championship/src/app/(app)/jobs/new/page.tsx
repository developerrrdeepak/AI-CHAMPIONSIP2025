
'use client';

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().min(1, "Department is required"),
  locationCity: z.string().optional(),
  locationCountry: z.string().optional(),
  isRemote: z.boolean().default(true),
  employmentType: z.string().min(1, "Employment type is required"),
  seniorityLevel: z.string().min(1, "Seniority level is required"),
  numberOfOpenings: z.coerce.number().min(1, "At least one opening is required"),
  jobDescription: z.string().min(10, "Description must be at least 10 characters"),
  requiredSkills: z.array(z.string()).optional(),
  niceToHaveSkills: z.array(z.string()).optional(),
  minimumExperience: z.coerce.number().optional(),
  maximumExperience: z.coerce.number().optional(),
  salaryRangeMin: z.coerce.number().optional(),
  salaryRangeMax: z.coerce.number().optional(),
  salaryCurrency: z.string().optional(),
  status: z.enum(["open", "paused", "closed"]).default("open"),
});

function SkillsInput({ value = [], onChange, placeholder }: { value: string[], onChange: (skills: string[]) => void, placeholder: string }) {
    const [inputValue, setInputValue] = useState('');

    const addSkill = () => {
        const trimmedInput = inputValue.trim();
        if (trimmedInput && !value.includes(trimmedInput)) {
            onChange([...value, trimmedInput]);
        }
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    };

    const removeSkill = (skillToRemove: string) => {
        onChange(value.filter(skill => skill !== skillToRemove));
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {value.map(skill => (
                    <Badge key={skill} variant="secondary">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="ml-2 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={addSkill}
                placeholder={placeholder}
            />
        </div>
    );
}

export default function NewJobPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { firestore, user } = useFirebase();

    const form = useForm<z.infer<typeof jobFormSchema>>({
        resolver: zodResolver(jobFormSchema),
        defaultValues: {
            title: "",
            department: "",
            locationCity: "",
            locationCountry: "",
            isRemote: true,
            employmentType: "Full-time",
            seniorityLevel: "Mid-level",
            numberOfOpenings: 1,
            jobDescription: "",
            status: "open",
            salaryCurrency: "USD",
            requiredSkills: [],
            niceToHaveSkills: [],
        },
    });

    async function onSubmit(values: z.infer<typeof jobFormSchema>) {
        if (!firestore || !user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to create a job." });
            return;
        }

        const organizationId = `org-${user.uid}`;
        const jobsCol = collection(firestore, `organizations/${organizationId}/jobs`);
        
        const newJobData = {
            ...values,
            locationCity: values.isRemote ? "Remote" : values.locationCity,
            locationCountry: values.isRemote ? "" : values.locationCountry,
            organizationId,
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addDocumentNonBlocking(jobsCol, newJobData);

        toast({
            title: "Job Created",
            description: `The job "${values.title}" has been successfully created.`,
        });
        router.push("/jobs");
    }

  return (
    <>
      <PageHeader title="Create New Job" description="Fill out the details for the new position." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Provide the main information about the job.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Senior Frontend Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="md:col-span-2 flex items-center space-x-2">
                <FormField
                    control={form.control}
                    name="isRemote"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full">
                        <div className="space-y-0.5">
                            <FormLabel>Remote Position</FormLabel>
                            <FormMessage />
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                    )}
                />
            </div>
             {!form.watch('isRemote') && (
                <>
                     <FormField
                        control={form.control}
                        name="locationCity"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. New York" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="locationCountry"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g. USA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </>
             )}


              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a job type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {["Full-time", "Part-time", "Contract", "Temporary", "Internship"].map((type) => (
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
                name="seniorityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seniority Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a seniority level" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {["Internship", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Manager"].map((level) => (
                                <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="numberOfOpenings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Openings</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div />
               <div className="md:col-span-2 grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="minimumExperience"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Minimum Experience (Years)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 3" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="maximumExperience"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Maximum Experience (Years)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 7" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
             <div className="md:col-span-2 grid grid-cols-3 gap-4">
                 <FormField
                    control={form.control}
                    name="salaryRangeMin"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Minimum Salary</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 80000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="salaryRangeMax"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Maximum Salary</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 120000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="salaryCurrency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Currency</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {["USD", "EUR", "GBP", "CAD", "AUD", "INR"].map((currency) => (
                                    <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
              <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="requiredSkills"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Required Skills</FormLabel>
                        <FormControl>
                           <SkillsInput {...field} placeholder="Type skill and press Enter..." />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
               <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="niceToHaveSkills"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nice-to-have Skills</FormLabel>
                        <FormControl>
                           <SkillsInput {...field} placeholder="Type skill and press Enter..." />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Describe the role, responsibilities, and qualifications."
                            className="min-h-[200px]"
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
                Create Job
                </Button>
          </div>
        </form>
      </Form>
    </>
  );
}

    
