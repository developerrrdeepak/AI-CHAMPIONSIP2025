// Mock implementation of @raindrop-ai/sdk

export class SmartSQL {
  constructor(config: { apiKey?: string }) {}

  async query(params: { query: string }) {
    console.log('Mock SmartSQL query:', params.query);
    return { rows: [], rowCount: 0 };
  }
}

export class SmartMemory {
  constructor(config: { apiKey?: string }) {}

  async save(key: string, userIdOrData: any, data?: any) {
    console.log('Mock SmartMemory save:', key, userIdOrData, data);
    return { success: true };
  }

  async read(key: string, userId?: string) {
    console.log('Mock SmartMemory read:', key, userId);
    return null;
  }
}

export class SmartInference {
  constructor(config: { apiKey?: string }) {}

  async chat(params: { model: string; messages: { role: string; content: string }[] }) {
    console.log('Mock SmartInference chat:', params);
    return {
      success: true,
      choices: [
        {
          message: {
            role: 'assistant',
            content: 'This is a mock response from SmartInference.',
          },
        },
      ],
      matchScore: 85,
      skillsMatch: { matched: ['React'], missing: [], proficiencyLevel: 'Senior' },
      experienceMatch: { yearsRequired: 5, yearsProvided: 6, isQualified: true },
      cultureFitScore: 90,
      recommendation: 'strong_match',
      reasoning: 'Mock reasoning',
      nextSteps: ['Interview'],
    };
  }
}

export class SmartBuckets {
  constructor(config: { apiKey?: string }) {}

  async putObject(params: { bucket: string; key: string; body: any }) {
    console.log('Mock SmartBuckets putObject:', params.bucket, params.key);
    return { success: true };
  }

  async getObject(params: { bucket: string; key: string }) {
    console.log('Mock SmartBuckets getObject:', params.bucket, params.key);
    return { Body: 'Mock file content' };
  }
}
