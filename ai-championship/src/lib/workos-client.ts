
'use client';

// WorkOS Authentication Client
export class WorkOSClient {
  private clientId: string;
  private apiKey: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID || '';
    this.apiKey = process.env.WORKOS_API_KEY || '';
    this.redirectUri = process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI || 'http://localhost:9002/auth/callback';
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

  async getProfile(accessToken: string) {
    try {
      const response = await fetch('https://api.workos.com/user_management/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to get profile');
      return await response.json();
    } catch (error) {
      console.error('WorkOS profile error:', error);
      return null;
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
