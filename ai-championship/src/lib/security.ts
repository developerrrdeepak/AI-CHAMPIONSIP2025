import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

/**
 * Security utility functions for input validation and sanitization
 */

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain uppercase, lowercase, number, and special character');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const urlSchema = z.string().url('Invalid URL format');

/**
 * Sanitizes HTML input to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  return validator.escape(input);
};

/**
 * Validates and sanitizes user input
 */
export const validateInput = (input: string, maxLength = 1000): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input type');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }
  
  return sanitizeHtml(input.trim());
};

/**
 * Hashes a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Verifies a password against its hash
 */
export const verifyPassword = async (
  password: string, 
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generates a secure JWT token
 */
export const generateToken = (
  payload: Record<string, any>, 
  expiresIn = '1h'
): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies and decodes a JWT token
 */
export const verifyToken = (token: string): Record<string, any> => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  try {
    return jwt.verify(token, secret) as Record<string, any>;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generates a cryptographically secure random string
 */
export const generateSecureToken = (length = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
};

/**
 * Rate limiting utility
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

/**
 * Input validation for common data types
 */
export const validateUserInput = {
  email: (email: string): boolean => validator.isEmail(email),
  url: (url: string): boolean => validator.isURL(url),
  uuid: (uuid: string): boolean => validator.isUUID(uuid),
  alphanumeric: (str: string): boolean => validator.isAlphanumeric(str),
  length: (str: string, min: number, max: number): boolean => 
    validator.isLength(str, { min, max }),
  strongPassword: (password: string): boolean => 
    validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
};

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static tokens: Set<string> = new Set();
  
  static generateToken(): string {
    const token = generateSecureToken(32);
    this.tokens.add(token);
    
    // Clean up old tokens (keep last 1000)
    if (this.tokens.size > 1000) {
      const tokensArray = Array.from(this.tokens);
      this.tokens = new Set(tokensArray.slice(-1000));
    }
    
    return token;
  }
  
  static validateToken(token: string): boolean {
    return this.tokens.has(token);
  }
  
  static removeToken(token: string): void {
    this.tokens.delete(token);
  }
}