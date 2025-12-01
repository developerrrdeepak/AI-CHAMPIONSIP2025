'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { user, firestore } = useFirebase() as any;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [organizationId, setOrganizationId] = useState('');

  useEffect(() => {
    if (!firestore || !jobId) return;

    const loadJob = async () => {
      try {
        const orgId = searchParams.get('orgId');
        if (orgId) {
          setOrganizationId(orgId);
          const jobDoc = await getDoc(doc(firestore, `organizations/${orgId}/jobs`, jobId));
          if (jobDoc.exists()) {
            setJobTitle(jobDoc.data().title);
          }
        }
      } catch (error) {
        console.error('Error loading job:', error);
      }
    };

    loadJob();
  }, [firestore, jobId, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !jobId || !organizationId) return;

    setLoading(true);
    try {
      const applicationId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const applicationRef = doc(firestore, `organizations/${organizationId}/applications`, applicationId);

      await setDoc(applicationRef, {
        id: applicationId,
        jobId,
        candidateId: user.uid,
        candidateName: user.displayName || 'Candidate',
        candidateEmail: user.email,
        coverLetter,
        stage: 'Applied',
        fitScore: Math.floor(Math.random() * 30) + 70, // Mock score
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your application has been sent to the employer.',
      });

      setTimeout(() => {
        router.push('/candidate-portal/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Application error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <PageHeader
        title="Apply for Job"
        description={jobTitle || 'Submit your application'}
      />

      <Card>
        <CardHeader>
          <CardTitle>Application Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Cover Letter</Label>
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us why you're a great fit for this role..."
                rows={8}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
