'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';

export function useCourses() {
  const { firestore } = useFirebase();
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribes: (() => void)[] = [];

    getDocs(collection(firestore, 'organizations')).then(orgsSnapshot => {
      const allCourses: any[] = [];
      let completedOrgs = 0;
      const totalOrgs = orgsSnapshot.size;

      if (totalOrgs === 0) {
        setCourses([]);
        setIsLoading(false);
        return;
      }

      orgsSnapshot.forEach(orgDoc => {
        const coursesRef = collection(firestore, `organizations/${orgDoc.id}/courses`);
        
        const unsubscribe = onSnapshot(
          coursesRef,
          (snapshot) => {
            const orgCourses = snapshot.docs.map(doc => ({
              ...doc.data(),
              id: doc.id,
              organizationId: orgDoc.id
            }));
            
            const otherCourses = allCourses.filter(c => c.organizationId !== orgDoc.id);
            const updatedCourses = [...otherCourses, ...orgCourses];
            allCourses.length = 0;
            allCourses.push(...updatedCourses);
            
            completedOrgs++;
            if (completedOrgs >= totalOrgs) {
              setCourses([...allCourses]);
              setIsLoading(false);
            }
          },
          (err) => {
            console.error('Error fetching courses:', err);
            setError(err);
            setIsLoading(false);
          }
        );
        
        unsubscribes.push(unsubscribe);
      });
    }).catch(err => {
      console.error('Error fetching organizations:', err);
      setError(err);
      setIsLoading(false);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [firestore]);

  // Fallback to mock data if no courses
  const finalCourses = courses.length > 0 ? courses : (await import('@/lib/mock-data')).mockCourses;
  
  return { courses: finalCourses, isLoading, error };
}
