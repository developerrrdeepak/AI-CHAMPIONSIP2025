import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole } from "./definitions";

/**
 * Combines class names using clsx and tailwind-merge
 * @param inputs - Class values to combine
 * @returns Combined class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Maps user roles to their respective dashboard paths
 */
const ROLE_REDIRECT_MAP: Record<UserRole, string> = {
  'Owner': '/founder/dashboard',
  'Recruiter': '/recruiter/dashboard',
  'Hiring Manager': '/hiring-manager/dashboard',
  'Interviewer': '/interviews',
  'Candidate': '/candidate-portal/dashboard',
} as const;

/**
 * Gets the redirect path for a given user role
 * @param role - User role or null
 * @returns Redirect path string
 */
export const getRedirectPathForRole = (role: UserRole | null): string => {
  if (!role || !(role in ROLE_REDIRECT_MAP)) {
    return '/login';
  }
  return ROLE_REDIRECT_MAP[role];
};

/**
 * Validates if a string is a valid user role
 * @param role - String to validate
 * @returns True if valid role
 */
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.keys(ROLE_REDIRECT_MAP).includes(role);
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entityMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entityMap[match] || match;
    })
    .trim();
};

/**
 * Validates email format
 * @param email - Email string to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formats file size in human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Creates a safe async wrapper that catches errors
 * @param asyncFn - Async function to wrap
 * @returns Wrapped function that returns [error, result]
 */
export const safeAsync = <T, E = Error>(
  asyncFn: () => Promise<T>
): Promise<[E | null, T | null]> => {
  return asyncFn()
    .then<[null, T]>((data: T) => [null, data])
    .catch<[E, null]>((error: E) => [error, null]);
};

/**
 * Generates a random string of specified length
 * @param length - Length of the string
 * @returns Random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};