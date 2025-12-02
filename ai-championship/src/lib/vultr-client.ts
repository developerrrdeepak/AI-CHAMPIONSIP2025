// @ts-ignore - Vultr SDK types
import VultrNode from '@vultr/vultr-node';

// Vultr Client for compute and storage
export class VultrService {
  private client: any | null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.VULTR_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Vultr API key not configured');
      this.client = null;
      return;
    }
    try {
      this.client = VultrNode.initialize({ apiKey: this.apiKey });
    } catch (error: any) {
      console.error('Vultr client initialization failed:', {
        message: error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      this.client = null;
    }
  }

  // Deploy application to Vultr compute instance
  async deployApp() {
    if (!this.client) return { success: false, message: 'Vultr not configured' };

    try {
      const instance = await this.client.instances.createInstance({
        region: 'ewr',
        plan: 'vc2-1c-1gb',
        os_id: 387, // Ubuntu 22.04
        label: 'hirevision-app',
        hostname: 'hirevision',
        enable_ipv6: true,
        backups: 'enabled',
        ddos_protection: true,
        activation_email: false,
        tags: ['production', 'hirevision']
      });

      return { success: true, instance };
    } catch (error: any) {
      console.error('Vultr deployment error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: error?.message || 'Deployment failed' };
    }
  }

  // Store files in Vultr Object Storage
  async uploadToObjectStorage(file: File, path: string) {
    try {
      // Vultr Object Storage S3-compatible API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`https://ewr1.vultrobjects.com/hirevision/${path}`, {
        method: 'PUT',
        headers: {
          'x-amz-acl': 'private',
        },
        body: file
      });

      if (!response.ok) throw new Error('Vultr storage error');
      return { success: true, url: `https://ewr1.vultrobjects.com/hirevision/${path}` };
    } catch (error: any) {
      console.error('Vultr storage error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: error?.message || 'Upload failed' };
    }
  }

  // Get instance status
  async getInstanceStatus(instanceId: string) {
    if (!this.client) return null;

    try {
      const instance = await this.client.instances.getInstance({ 'instance-id': instanceId });
      return instance;
    } catch (error: any) {
      console.error('Vultr status error:', {
        message: error?.message || 'Unknown error',
        instanceId,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
  }

  // Create database instance
  async createDatabase() {
    if (!this.client) return { success: false };

    try {
      const database = await this.client.databases.createDatabase({
        database_engine: 'pg',
        database_engine_version: '15',
        region: 'ewr',
        plan: 'vultr-dbaas-startup-cc-1-55-2',
        label: 'hirevision-db',
        tag: 'production'
      });

      return { success: true, database };
    } catch (error: any) {
      console.error('Vultr database error:', {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      });
      return { success: false, error: error?.message || 'Database creation failed' };
    }
  }
}

export const vultrService = new VultrService();
