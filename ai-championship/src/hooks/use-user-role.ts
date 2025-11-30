
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole } from '@/lib/definitions';

export function useUserRole() {
  const { user, isUserLoading, firestore } = useFirebase();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This hook should purely rely on the Firebase auth state and Firestore.
    // We remove the localStorage check to ensure we always get the authoritative role.
    
    if (isUserLoading) {
      setIsLoading(true);
      return;
    }
    
    if (!user || !firestore) {
      // If there's no user or firestore, we're not logged in.
      setRole(null);
      setIsLoading(false);
      localStorage.removeItem('demoRole');
      return;
    };

    const fetchRole = async () => {
      setIsLoading(true);
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const userRole = docSnap.data().role as UserRole;
          setRole(userRole);
          // We can still cache it for other parts of the app, but this hook won't read from it.
          localStorage.setItem('demoRole', userRole); 
        } else {
          console.warn(`User document not found for UID: ${user.uid}`);
          setRole(null);
          localStorage.removeItem('demoRole');
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRole();

  }, [user, isUserLoading, firestore]);

  return { role, isLoading };
}
