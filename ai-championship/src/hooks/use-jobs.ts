'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { subscribeToAllJobs, subscribeToOrgJobs } from '@/lib/firestore-service';

export function useJobs(role?: string, organizationId?: string) {
  const { firestore } = useFirebase();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Candidates see all jobs across organizations
    if (role === 'Candidate') {
      const subscription = subscribeToAllJobs(
        firestore,
        (updatedJobs) => {
          setJobs(updatedJobs);
          setIsLoading(false);
        },
        (err) => {
          setError(err);
          setIsLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }

    // Employers see only their organization's jobs
    if (organizationId) {
      const subscription = subscribeToOrgJobs(
        firestore,
        organizationId,
        (updatedJobs) => {
          setJobs(updatedJobs);
          setIsLoading(false);
        },
        (err) => {
          setError(err);
          setIsLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    }

    setIsLoading(false);
  }, [firestore, role, organizationId]);

  // Fallback to mock data if no jobs
  const finalJobs = jobs.length > 0 ? jobs : (await import('@/lib/mock-data')).mockJobs;
  
  return { jobs: finalJobs, isLoading, error };
}
