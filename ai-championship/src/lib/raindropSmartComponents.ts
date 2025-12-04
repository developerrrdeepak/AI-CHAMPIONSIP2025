import {
  smartSQLQuery,
  smartMemoryRead,
  smartMemoryWrite,
  smartInferenceInvoke,
  smartBucketsUpload,
  smartBucketsDownload,
} from './raindropClient';

export async function executeSmartSQL(queryString: string, params?: any[]) {
  try {
    const result = await smartSQLQuery(queryString, params);
    return result;
  } catch (error) {
    console.error('SmartSQL query error:', error);
    // In a real app, you might want more sophisticated error handling or fallbacks
    return { rows: [] };
  }
}

export async function storeUserPreferences(userId: string, preferences: any) {
  try {
    const key = `user_preferences_${userId}`;
    await smartMemoryWrite(key, preferences, userId);
    return { success: true, message: 'Preferences stored' };
  } catch (error) {
    console.error('Error storing user preferences:', error);
    throw error;
  }
}

export async function retrieveUserPreferences(userId: string) {
  try {
    const key = `user_preferences_${userId}`;
    const preferences = await smartMemoryRead(key, userId);
    return preferences;
  } catch (error) {
    console.error('Error retrieving user preferences:', error);
    throw error;
  }
}

export async function storeInterviewFeedback(interviewId: string, feedback: any) {
  try {
    const key = `interview_feedback_${interviewId}`;
    await smartMemoryWrite(key, feedback);
    return { success: true, message: 'Interview feedback stored' };
  } catch (error) {
    console.error('Error storing interview feedback:', error);
    throw error;
  }
}

export async function retrieveInterviewFeedback(interviewId: string) {
  try {
    const key = `interview_feedback_${interviewId}`;
    const feedback = await smartMemoryRead(key);
    return feedback;
  } catch (error) {
    console.error('Error retrieving interview feedback:', error);
    throw error;
  }
}

export async function runCandidateMatchingInference(input: {
  jobDescription: string;
  candidateProfile: string;
  preferences?: any;
}) {
  try {
    const result = await smartInferenceInvoke('candidate-matcher', input);
    return result;
  } catch (error) {
    console.error('Error running candidate matching inference:', error);
    throw error;
  }
}

export async function runCandidateAnalysisInference(input: {
  resume: string;
  jobDescription: string;
}) {
  try {
    const result = await smartInferenceInvoke('candidate-analyzer', input);
    return result;
  } catch (error) {
    console.error('Error running candidate analysis inference:', error);
    throw error;
  }
}

export async function runGPUAcceleratedResumeAnalysis(input: {
  resume: string;
}) {
  try {
    // This will invoke a model deployed on a Vultr GPU instance
    const result = await smartInferenceInvoke('resume-analyzer-gpu', input);
    return result;
  } catch (error) {
    console.error('Error running GPU accelerated resume analysis:', error);
    throw error;
  }
}

export async function uploadResumeToStorage(resumeKey: string, resumeContent: any) {
  try {
    const result = await smartBucketsUpload('resumes', resumeKey, resumeContent);
    return result;
  } catch (error) {
    console.error('Error uploading resume:', error);
    throw error;
  }
}

export async function downloadResumeFromStorage(resumeKey: string) {
  try {
    const result = await smartBucketsDownload('resumes', resumeKey);
    return result;
  } catch (error) {
    console.error('Error downloading resume:', error);
    throw error;
  }
}

export async function storeApplicationData(applicationId: string, data: any) {
  try {
    const key = `application_${applicationId}`;
    await smartMemoryWrite(key, data);
    return { success: true, message: 'Application data stored' };
  } catch (error) {
    console.error('Error storing application data:', error);
    throw error;
  }
}

export async function retrieveApplicationData(applicationId: string) {
  try {
    const key = `application_${applicationId}`;
    const data = await smartMemoryRead(key);
    return data;
  } catch (error) {
    console.error('Error retrieving application data:', error);
    throw error;
  }
}
