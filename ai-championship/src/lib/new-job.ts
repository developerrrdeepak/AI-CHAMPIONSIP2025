import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export const createJob = async (organizationId: string, jobData: any) => {
  if (!organizationId) {
    throw new Error('Organization ID is required to create a job.');
  }
  
  const { firestore } = initializeFirebase();

  const jobsRef = collection(firestore, `organizations/${organizationId}/jobs`);

  try {
    const docRef = await addDoc(jobsRef, {
      ...jobData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'open', // Default status
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating job:', error);
    throw new Error('Failed to create job in Firestore.');
  }
};
