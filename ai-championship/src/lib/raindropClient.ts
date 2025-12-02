// Raindrop MCP HTTP client (replaces mock-raindrop-sdk usage)

const apiKey = process.env.RAINDROP_API_KEY;
const baseUrl = process.env.RAINDROP_MCP_BASE_URL || 'https://api.liquidmetal.ai/v1';

if (!apiKey) {
  console.warn('RAINDROP_API_KEY environment variable not set. Raindrop integration will not work.');
}

async function mcpFetch<T>(path: string, options: RequestInit & { json?: unknown } = {}): Promise<T> {
  if (!apiKey) {
    throw new Error('RAINDROP_API_KEY is required but not configured');
  }
  
  // Validate path to prevent SSRF
  if (!path.startsWith('/')) {
    throw new Error('Invalid path: must start with /');
  }
  
  // Validate baseUrl is from allowed domain
  const allowedDomain = 'api.liquidmetal.ai';
  try {
    const baseUrlObj = new URL(baseUrl);
    if (!baseUrlObj.hostname.endsWith(allowedDomain)) {
      throw new Error('Invalid base URL domain');
    }
  } catch (error) {
    throw new Error('Invalid base URL format');
  }
  
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    // Next.js runtime supports fetch on both server and edge; ensure cache disabled for writes
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`MCP request failed ${res.status}: ${text}`);
  }

  // Try json first; fall back to arrayBuffer for binary
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.arrayBuffer()) as unknown as T;
}

interface SmartSQLResponse {
  rows?: unknown[];
  [key: string]: unknown;
}

/**
 * Executes a SQL query using Raindrop's SmartSQL via MCP server.
 */
export async function smartSQLQuery(queryString: string, params?: unknown[]): Promise<SmartSQLResponse> {
  try {
    return await mcpFetch<SmartSQLResponse>(`/smartsql/query`, {
      method: 'POST',
      json: { query: queryString, params: params ?? [] },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SmartSQL query error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/** Saves data to Raindrop's SmartMemory via MCP server. */
export async function smartMemoryWrite(key: string, data: unknown, userId?: string): Promise<unknown> {
  try {
    return await mcpFetch<unknown>(`/smartmemory/save`, {
      method: 'POST',
      json: { key, userId, data },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SmartMemory write error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/** Reads data from Raindrop's SmartMemory via MCP server. */
export async function smartMemoryRead(key: string, userId?: string): Promise<unknown> {
  try {
    return await mcpFetch<unknown>(`/smartmemory/read`, {
      method: 'POST',
      json: { key, userId },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SmartMemory read error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/** Invokes an AI model using Raindrop's SmartInference via MCP server. */
export async function smartInferenceInvoke(model: string, prompt: string | unknown): Promise<unknown> {
  try {
    const messages = typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : [{ role: 'user', content: JSON.stringify(prompt) }];
    return await mcpFetch<unknown>(`/smartinference/chat`, {
      method: 'POST',
      json: { model, messages },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SmartInference invoke error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/** Uploads an object to a Raindrop SmartBucket via MCP server. */
export async function smartBucketsUpload(bucket: string, key: string, body: Buffer | string): Promise<unknown> {
  try {
    let content: string;
    let isBase64 = false;
    if (typeof body === 'string') {
      content = body;
    } else {
      content = body.toString('base64');
      isBase64 = true;
    }
    return await mcpFetch<unknown>(`/smartbuckets/putObject`, {
      method: 'POST',
      json: { bucket, key, content, isBase64 },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SmartBuckets upload error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/** Downloads an object from a Raindrop SmartBucket via MCP server. */
export async function smartBucketsDownload(bucket: string, key: string): Promise<unknown> {
  try {
    return await mcpFetch<unknown>(`/smartbuckets/getObject?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`, {
      method: 'GET',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('SmartBuckets download error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

export async function aiCodeAssistant(prompt: string) {
  // Optional helper; not part of MCP
  console.log('aiCodeAssistant called with prompt:', prompt);
  return 'This is a placeholder response from the AI Code Assistant.';
}

