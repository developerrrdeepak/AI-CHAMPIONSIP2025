// Universal AI Chat Helper - Works for all user types
export async function sendAIMessage(message: string, context?: string): Promise<string> {
  try {
    const response = await fetch('/api/google-ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        context: context || 'general_assistant'
      })
    });

    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'AI service unavailable');
    }
    
    return data.response;
  } catch (error) {
    console.error('AI chat error:', error);
    throw error;
  }
}

export const AI_CONTEXTS = {
  RECRUITMENT: 'recruitment_assistant',
  CANDIDATE: 'candidate_assistant', 
  INTERVIEW: 'interview_assistant',
  GENERAL: 'general_assistant'
};
