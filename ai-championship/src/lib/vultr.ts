import { Vultr } from '@vultr/vultr-node';

const api_key = process.env.VULTR_API_KEY;

if (!api_key) {
  throw new Error('VULTR_API_KEY is not defined in the environment variables.');
}

const vultr = Vultr.initialize({
  apiKey: api_key,
});

export const listInstances = async () => {
  try {
    const instances = await vultr.instances.listInstances({});
    return instances;
  } catch (error) {
    console.error('Error listing Vultr instances:', error);
    throw error;
  }
};

export const createInstance = async (plan: string, region: string, os_id: number) => {
  try {
    const instance = await vultr.instances.createInstance({
      plan,
      region,
      os_id,
    });
    return instance;
  } catch (error) {
    console.error('Error creating Vultr instance:', error);
    throw error;
  }
};
