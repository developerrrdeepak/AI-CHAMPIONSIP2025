// Mock implementation of @vultr/vultr-node

export class VultrClient {
  objectStorage: {
    putObject: (params: any) => Promise<any>;
    getObject: (params: any) => Promise<any>;
  };

  constructor(config: { apiKey: string }) {
    this.objectStorage = {
      putObject: async (params: any) => {
        console.log('Mock Vultr putObject:', params);
        return { success: true };
      },
      getObject: async (params: any) => {
        console.log('Mock Vultr getObject:', params);
        return { Body: 'Mock file content' };
      },
    };
  }
}
