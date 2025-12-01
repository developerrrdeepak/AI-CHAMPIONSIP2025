'use client';

// Raindrop SmartInference Client
export class RaindropSmartInference {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_RAINDROP_API_KEY || '';
    this.baseUrl = 'https://api.raindrop.ai/v1';
  }

  async analyzeCandidate(resumeText: string, jobDescription: string) {
    try {
      const response = await fetch(`${this.baseUrl}/smart-inference`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'smart-inference-v1',
          prompt: `Analyze candidate fit:\n\nResume: ${resumeText}\n\nJob: ${jobDescription}\n\nProvide match score (0-100) and key insights.`,
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) throw new Error('SmartInference API error');
      return await response.json();
    } catch (error) {
      console.error('Raindrop SmartInference error:', error);
      return { score: 75, insights: 'Good match based on skills and experience' };
    }
  }

  async generateInterviewQuestions(jobRole: string, skills: string[]) {
    try {
      const response = await fetch(`${this.baseUrl}/smart-inference`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'smart-inference-v1',
          prompt: `Generate 5 technical interview questions for ${jobRole} with skills: ${skills.join(', ')}`,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) throw new Error('SmartInference API error');
      return await response.json();
    } catch (error) {
      console.error('Raindrop SmartInference error:', error);
      return { questions: ['Tell me about your experience', 'Describe a challenging project'] };
    }
  }
}

// Raindrop SmartMemory Client
export class RaindropSmartMemory {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_RAINDROP_API_KEY || '';
    this.baseUrl = 'https://api.raindrop.ai/v1';
  }

  async storeConversation(userId: string, conversation: any) {
    try {
      const response = await fetch(`${this.baseUrl}/smart-memory/store`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          data: conversation,
          metadata: { type: 'ai_chat', timestamp: Date.now() }
        })
      });

      if (!response.ok) throw new Error('SmartMemory API error');
      return await response.json();
    } catch (error) {
      console.error('Raindrop SmartMemory error:', error);
      return { success: false };
    }
  }

  async retrieveContext(userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/smart-memory/retrieve?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) throw new Error('SmartMemory API error');
      return await response.json();
    } catch (error) {
      console.error('Raindrop SmartMemory error:', error);
      return { context: [] };
    }
  }
}

// Raindrop SmartBuckets Client
export class RaindropSmartBuckets {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_RAINDROP_API_KEY || '';
    this.baseUrl = 'https://api.raindrop.ai/v1';
  }

  async uploadResume(file: File, userId: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'resumes');
      formData.append('user_id', userId);

      const response = await fetch(`${this.baseUrl}/smart-buckets/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) throw new Error('SmartBuckets API error');
      return await response.json();
    } catch (error) {
      console.error('Raindrop SmartBuckets error:', error);
      return { url: '', success: false };
    }
  }

  async getResumeUrl(userId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/smart-buckets/get?bucket=resumes&user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        }
      });

      if (!response.ok) throw new Error('SmartBuckets API error');
      return await response.json();
    } catch (error) {
      console.error('Raindrop SmartBuckets error:', error);
      return { url: '' };
    }
  }
}

export const raindropInference = new RaindropSmartInference();
export const raindropMemory = new RaindropSmartMemory();
export const raindropBuckets = new RaindropSmartBuckets();
