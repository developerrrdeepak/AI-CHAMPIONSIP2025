
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection } from 'firebase/firestore';
import { generateEmailFromBrief } from '@/ai/flows/generate-email-from-brief';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';
import type { EmailTemplateType } from '@/lib/definitions';
import { Label } from '@/components/ui/label';

const templateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required.'),
  type: z.enum(['Invitation', 'Rejection', 'Follow-up', 'Offer', 'General']),
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string().min(10, 'Email body must be at least 10 characters.'),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

function AIGenerateModal({ isOpen, onOpenChange, onGenerate }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onGenerate: (subject: string, body: string) => void }) {
    const [brief, setBrief] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!brief) return;
        setIsLoading(true);
        try {
            const result = await generateEmailFromBrief({ brief });
            onGenerate(result.subject, result.body);
            onOpenChange(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate email.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate with AI</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="brief">Prompt</Label>
                    <Textarea 
                        id="brief"
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        placeholder="e.g., 'An invitation to a final round interview for a Senior Engineer named Jane Doe'"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={isLoading || !brief}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function NewEmailTemplatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
        name: '',
        type: 'General',
        subject: '',
        body: '',
    },
  });
  
  async function onSubmit(values: TemplateFormData) {
    if (!firestore || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create template. User not authenticated.'});
        return;
    }

    const organizationId = `org-${user.uid}`;
    const templatesCol = collection(firestore, `organizations/${organizationId}/email_templates`);

    const newTemplateData = {
        ...values,
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(templatesCol, newTemplateData);

    toast({
      title: 'Template Created',
      description: `The template "${values.name}" has been saved.`,
    });
    router.push('/emails');
  }

  const handleAIModalGenerate = (subject: string, body: string) => {
    form.setValue('subject', subject);
    form.setValue('body', body);
  };

  return (
    <>
      <PageHeader
        title="Create Email Template"
        description="Design a reusable email template for your candidate communications."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Template Content</CardTitle>
                        <CardDescription>Use placeholders like `{{candidateName}}` or `{{jobTitle}}`.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsAIModalOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'Initial Rejection - Not a fit'" {...field} />
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
                    <FormLabel>Template Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {['Invitation', 'Rejection', 'Follow-up', 'Offer', 'General'].map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                 <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., An update on your application to HireVision" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Body</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dear {{candidateName}},..."
                          className="min-h-[250px] font-mono text-sm"
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
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Template
            </Button>
          </div>
        </form>
      </Form>
      <AIGenerateModal isOpen={isAIModalOpen} onOpenChange={setIsAIModalOpen} onGenerate={handleAIModalGenerate} />
    </>
  );
}
    