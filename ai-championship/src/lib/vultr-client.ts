'use client';

import { VultrNode } from '@vultr/vultr-node';

// Vultr Client for compute and storage
export class VultrService {
  private client: any;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.VULTR_API_KEY || '';
    if (this.apiKey) {
      this.client = VultrNode.initialize({ apiKey: this.apiKey });
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
    } catch (error) {
      console.error('Vultr deployment error:', error);
      return { success: false, error };
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
    } catch (error) {
      console.error('Vultr storage error:', error);
      return { success: false };
    }
  }

  // Get instance status
  async getInstanceStatus(instanceId: string) {
    if (!this.client) return null;

    try {
      const instance = await this.client.instances.getInstance({ 'instance-id': instanceId });
      return instance;
    } catch (error) {
      console.error('Vultr status error:', error);
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
    } catch (error) {
      console.error('Vultr database error:', error);
      return { success: false, error };
    }
  }
}

export const vultrService = new VultrService();
