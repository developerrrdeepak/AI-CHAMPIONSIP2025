
'use client';

// WorkOS Authentication Client
export class WorkOSClient {
  private clientId: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || 'client_01KBHRHN28PMCCDP8YR4EH5XPH';
    this.redirectUri = process.env.WORKOS_REDIRECT_URI || 'http://localhost:9002/api/auth/workos/callback';
  }

  getAuthorizationUrl(provider: 'google' | 'microsoft' | 'github' = 'google') {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      provider,
      state: Math.random().toString(36).substring(7)
    });

    return `https://api.workos.com/sso/authorize?${params.toString()}`;
  }

  async authenticateWithCode(code: string) {
    try {
      const response = await fetch('/api/auth/workos/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!response.ok) throw new Error('WorkOS authentication failed');
      return await response.json();
    } catch (error) {
      console.error('WorkOS auth error:', error);
      return { success: false, error };
    }
  }

  async createOrganization(name: string, domains: string[]) {
    try {
      const response = await fetch('/api/auth/workos/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, domains })
      });

      if (!response.ok) throw new Error('Failed to create organization');
      return await response.json();
    } catch (error) {
      console.error('WorkOS org error:', error);
      return { success: false, error };
    }
  }
}

export const workosClient = new WorkOSClient();
