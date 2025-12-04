'use client';

import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  Firestore,
  QueryConstraint,
  CollectionReference,
  DocumentData,
  getDoc
} from 'firebase/firestore';

export interface FirestoreSubscription {
  unsubscribe: () => void;
}

// Get all jobs across all organizations (for candidates)
export function subscribeToAllJobs(
  firestore: Firestore,
  onUpdate: (jobs: any[]) => void,
  onError?: (error: Error) => void
): FirestoreSubscription {
  const unsubscribes: (() => void)[] = [];
  
  const orgsRef = collection(firestore, 'organizations');
  
  const orgsSnapshotUnsubscribe = onSnapshot(orgsRef, (orgsSnapshot) => {
    // Clear previous job subscriptions
    unsubscribes.forEach(unsub => unsub());
    unsubscribes.length = 0; // Reset the array

    const allJobs: any[] = [];
    if (orgsSnapshot.empty) {
      onUpdate([]);
      return;
    }
    
    let processedOrgs = 0;

    orgsSnapshot.forEach(orgDoc => {
      const jobsRef = collection(firestore, `organizations/${orgDoc.id}/jobs`);
      const jobsQuery = query(jobsRef, where('status', '==', 'open'));
      
      const unsubscribe = onSnapshot(
        jobsQuery,
        (snapshot) => {
          const orgJobs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            organizationId: orgDoc.id
          }));
          
          // Replace jobs for this org
          const otherJobs = allJobs.filter(j => j.organizationId !== orgDoc.id);
          allJobs.length = 0;
          allJobs.push(...otherJobs, ...orgJobs);

          onUpdate([...allJobs]);
        },
        (error) => {
          console.error(`Error fetching jobs for org ${orgDoc.id}:`, error);
          onError?.(error);
        }
      );
      unsubscribes.push(unsubscribe);
    });
  }, (error) => {
    console.error('Error fetching organizations:', error);
    onError?.(error);
  });

  unsubscribes.push(orgsSnapshotUnsubscribe);

  return {
    unsubscribe: () => unsubscribes.forEach(unsub => unsub())
  };
}


// Get all challenges across all organizations
export function subscribeToAllChallenges(
  firestore: Firestore,
  onUpdate: (challenges: any[]) => void,
  onError?: (error: Error) => void
): FirestoreSubscription {
  const unsubscribes: (() => void)[] = [];
  const orgsRef = collection(firestore, 'organizations');
  
  const orgsSnapshotUnsubscribe = onSnapshot(orgsRef, (orgsSnapshot) => {
    unsubscribes.forEach(unsub => unsub());
    unsubscribes.length = 0;

    const allChallenges: any[] = [];
    if (orgsSnapshot.empty) {
      onUpdate([]);
      return;
    }

    orgsSnapshot.forEach(orgDoc => {
      const challengesRef = collection(firestore, `organizations/${orgDoc.id}/challenges`);
      
      const unsubscribe = onSnapshot(
        challengesRef,
        (snapshot) => {
           const orgChallenges = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            organizationId: orgDoc.id
          }));
          
          const otherChallenges = allChallenges.filter(c => c.organizationId !== orgDoc.id);
          allChallenges.length = 0;
          allChallenges.push(...otherChallenges, ...orgChallenges);

          onUpdate([...allChallenges]);
        },
        (error) => {
          console.error(`Error fetching challenges for org ${orgDoc.id}:`, error);
          onError?.(error);
        }
      );
      unsubscribes.push(unsubscribe);
    });
  }, (error) => {
    console.error('Error fetching organizations for challenges:', error);
    onError?.(error);
  });

  unsubscribes.push(orgsSnapshotUnsubscribe);

  return {
    unsubscribe: () => unsubscribes.forEach(unsub => unsub())
  };
}


// Get jobs for specific organization (for employers)
export function subscribeToOrgJobs(
  firestore: Firestore,
  organizationId: string,
  onUpdate: (jobs: any[]) => void,
  onError?: (error: Error) => void
): FirestoreSubscription {
  const jobsRef = collection(firestore, `organizations/${organizationId}/jobs`);
  
  const unsubscribe = onSnapshot(
    jobsRef,
    (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        organizationId
      }));
      onUpdate(jobs);
    },
    (error) => {
      console.error('Error fetching org jobs:', error);
      onError?.(error);
    }
  );

  return { unsubscribe };
}

// Get candidate profile
export function subscribeToCandidateProfile(
  firestore: Firestore,
  userId: string,
  onUpdate: (candidate: any | null) => void,
  onError?: (error: Error) => void
): FirestoreSubscription {
  const userRef = doc(firestore, `users/${userId}`);
  
  const unsubscribe = onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ ...snapshot.data(), id: snapshot.id });
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error fetching candidate profile:', error);
      onError?.(error);
    }
  );

  return { unsubscribe };
}

// Update user profile
export async function updateUserProfile(
  firestore: Firestore,
  userId: string,
  data: any
) {
  const userRef = doc(firestore, `users/${userId}`);
  await updateDoc(userRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

// Create user profile
export async function createUserProfile(
  firestore: Firestore,
  userId: string,
  data: any
) {
  const userRef = doc(firestore, `users/${userId}`);
  await setDoc(userRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
