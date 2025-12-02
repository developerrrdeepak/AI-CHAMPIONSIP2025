import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'healthy', // Add actual database check here
        memory: (() => {
          const mem = process.memoryUsage();
          return { used: mem.heapUsed, total: mem.heapTotal };
        })(),
      },
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Health check error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      },
      { status: 503 }
    );
  }
}