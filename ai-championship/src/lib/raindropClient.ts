// Raindrop MCP HTTP client (replaces mock-raindrop-sdk usage)

const apiKey = process.env.RAINDROP_API_KEY;
const baseUrl = process.env.RAINDROP_MCP_BASE_URL;

if (!apiKey) {
  console.warn('RAINDROP_API_KEY environment variable not set. Raindrop integration will not work.');
}
if (!baseUrl) {
  console.warn('RAINDROP_MCP_BASE_URL is not set. Configure it to point to your MCP server.');
}

async function mcpFetch<T>(path: string, options: RequestInit & { json?: any } = {}): Promise<T> {
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey ?? ''}`,
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
  // @ts-ignore - caller should handle binary if needed
  return (await res.arrayBuffer()) as T;
}

/**
 * Executes a SQL query using Raindrop's SmartSQL via MCP server.
 */
export async function smartSQLQuery(queryString: string, params?: any[]) {
  try {
    return await mcpFetch<any>(`/smartsql/query`, {
      method: 'POST',
      json: { query: queryString, params: params ?? [] },
    });
  } catch (error) {
    console.error('SmartSQL query error:', error);
    throw error;
  }
}

/** Saves data to Raindrop's SmartMemory via MCP server. */
export async function smartMemoryWrite(key: string, data: any, userId?: string) {
  try {
    return await mcpFetch<any>(`/smartmemory/save`, {
      method: 'POST',
      json: { key, userId, data },
    });
  } catch (error) {
    console.error('SmartMemory write error:', error);
    throw error;
  }
}

/** Reads data from Raindrop's SmartMemory via MCP server. */
export async function smartMemoryRead(key: string, userId?: string) {
  try {
    return await mcpFetch<any>(`/smartmemory/read`, {
      method: 'POST',
      json: { key, userId },
    });
  } catch (error) {
    console.error('SmartMemory read error:', error);
    throw error;
  }
}

/** Invokes an AI model using Raindrop's SmartInference via MCP server. */
export async function smartInferenceInvoke(model: string, prompt: any) {
  try {
    const messages = typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : [{ role: 'user', content: JSON.stringify(prompt) }];
    return await mcpFetch<any>(`/smartinference/chat`, {
      method: 'POST',
      json: { model, messages },
    });
  } catch (error) {
    console.error('SmartInference invoke error:', error);
    throw error;
  }
}

/** Uploads an object to a Raindrop SmartBucket via MCP server. */
export async function smartBucketsUpload(bucket: string, key: string, body: Buffer | string) {
  try {
    let content: string;
    let isBase64 = false;
    if (typeof body === 'string') {
      content = body;
    } else {
      // Node Buffer -> base64
      content = body.toString('base64');
      isBase64 = true;
    }
    return await mcpFetch<any>(`/smartbuckets/putObject`, {
      method: 'POST',
      json: { bucket, key, content, isBase64 },
    });
  } catch (error) {
    console.error('SmartBuckets upload error:', error);
    throw error;
  }
}

/** Downloads an object from a Raindrop SmartBucket via MCP server. */
export async function smartBucketsDownload(bucket: string, key: string) {
  try {
    return await mcpFetch<any>(`/smartbuckets/getObject?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error('SmartBuckets download error:', error);
    throw error;
  }
}

export async function aiCodeAssistant(prompt: string) {
  // Optional helper; not part of MCP
  console.log('aiCodeAssistant called with prompt:', prompt);
  return 'This is a placeholder response from the AI Code Assistant.';
}

