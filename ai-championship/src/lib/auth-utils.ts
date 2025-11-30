import { FirebaseError } from 'firebase/app'

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  feedback: string[]
  isStrong: boolean
}

export function validatePasswordStrength(password: string): PasswordStrength {
  let score: 0 | 1 | 2 | 3 | 4 = 0
  const feedback: string[] = []

  if (password.length < 6) {
    feedback.push('Password must be at least 6 characters long')
    return { score: 0, feedback, isStrong: false }
  }

  if (password.length >= 6) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[!@#$%^&*]/.test(password)) score++

  if (score < 2) {
    feedback.push('Use a mix of uppercase, lowercase, and numbers')
  }
  if (!/[0-9]/.test(password)) {
    feedback.push('Add at least one number')
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push('Add at least one uppercase letter')
  }

  const isStrong = score >= 2

  return {
    score: Math.min(4, score) as 0 | 1 | 2 | 3 | 4,
    feedback: feedback.slice(0, 2),
    isStrong,
  }
}

export function getEmailErrorMessage(error: any): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/user-not-found':
        return 'No account found with this email address.'
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.'
      case 'auth/too-many-requests':
        return 'Too many failed login attempts. Please try again later.'
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is not enabled.'
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters with numbers and letters.'
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed. Please try again.'
      case 'auth/cancelled-popup-request':
        return 'Sign-in cancelled. Please try again.'
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked. Please allow popups and try again.'
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.'
      default:
        return error.message || 'An authentication error occurred. Please try again.'
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0:
      return 'bg-red-500'
    case 1:
      return 'bg-orange-500'
    case 2:
      return 'bg-yellow-500'
    case 3:
      return 'bg-lime-500'
    case 4:
      return 'bg-green-500'
    default:
      return 'bg-gray-300'
  }
}

export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0:
      return 'Very Weak'
    case 1:
      return 'Weak'
    case 2:
      return 'Fair'
    case 3:
      return 'Good'
    case 4:
      return 'Strong'
    default:
      return 'Unknown'
  }
}
