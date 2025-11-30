import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Custom error classes for better error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  code?: string;
  details?: any;
  timestamp: string;
  path?: string;
}

/**
 * Formats error for API response
 */
export const formatErrorResponse = (
  error: Error,
  path?: string
): ErrorResponse => {
  const timestamp = new Date().toISOString();
  
  if (error instanceof AppError) {
    return {
      error: error.name,
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      timestamp,
      path,
    };
  }
  
  if (error instanceof ZodError) {
    return {
      error: 'ValidationError',
      message: 'Invalid input data',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
      timestamp,
      path,
    };
  }
  
  // Handle specific error types
  if (error.name === 'JsonWebTokenError') {
    return {
      error: 'AuthenticationError',
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN',
      timestamp,
      path,
    };
  }
  
  if (error.name === 'TokenExpiredError') {
    return {
      error: 'AuthenticationError',
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
      timestamp,
      path,
    };
  }
  
  // Default error response (don't expose internal errors in production)
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    error: 'InternalServerError',
    message: isProduction ? 'Internal server error' : error.message,
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    timestamp,
    path,
  };
};

/**
 * Global error handler for API routes
 */
export const handleApiError = (
  error: Error,
  path?: string
): NextResponse => {
  const errorResponse = formatErrorResponse(error, path);
  
  // Log error for monitoring
  console.error('API Error:', {
    ...errorResponse,
    stack: error.stack,
  });
  
  return NextResponse.json(errorResponse, {
    status: errorResponse.statusCode,
  });
};

/**
 * Async wrapper for API route handlers
 */
export const asyncHandler = (
  handler: (request: Request, context?: any) => Promise<NextResponse>
) => {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(
        error instanceof Error ? error : new Error('Unknown error'),
        new URL(request.url).pathname
      );
    }
  };
};

/**
 * Validation wrapper for request data
 */
export const validateRequest = async <T>(
  request: Request,
  schema: any
): Promise<T> => {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON format');
    }
    throw error;
  }
};

/**
 * Logger utility for structured logging
 */
export class Logger {
  private static log(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };
    
    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }
  
  static info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }
  
  static warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }
  
  static error(message: string, error?: Error, meta?: any): void {
    this.log('error', message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }
  
  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, meta);
    }
  }
}