'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { subscribeToAllChallenges } from '@/lib/firestore-service';
import { mockChallenges } from '@/lib/mock-challenges';

export function useChallenges() {
  const { firestore } = useFirebase();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      // Return mock data when firestore is not available
      setChallenges(mockChallenges);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const subscription = subscribeToAllChallenges(
      firestore,
      (updatedChallenges) => {
        // If no real challenges, use mock data
        setChallenges(updatedChallenges.length > 0 ? updatedChallenges : mockChallenges);
        setIsLoading(false);
      },
      (err) => {
        // On error, fallback to mock data
        setChallenges(mockChallenges);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [firestore]);

  return { challenges, isLoading, error };
}
