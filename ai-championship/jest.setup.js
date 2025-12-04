import '@testing-library/jest-dom'
import { initializeApp, getApps, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Test Firebase configuration
const testFirebaseConfig = {
  apiKey: "test-api-key",
  authDomain: "test-project.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:test"
}

// Global test setup
beforeAll(async () => {
  // Initialize Firebase for testing
  if (!getApps().length) {
    const app = initializeApp(testFirebaseConfig, 'test-app')
    const auth = getAuth(app)
    const firestore = getFirestore(app)
    const storage = getStorage(app)

    // Connect to emulators
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      connectFirestoreEmulator(firestore, 'localhost', 8080)
      connectStorageEmulator(storage, 'localhost', 9199)
    } catch (error) {
      console.warn('Emulator connection failed:', error)
    }

    // Make Firebase instances available globally for tests
    global.testFirebaseApp = app
    global.testAuth = auth
    global.testFirestore = firestore
    global.testStorage = storage
  }
})

// Cleanup after all tests
afterAll(async () => {
  const apps = getApps()
  await Promise.all(apps.map(app => deleteApp(app)))
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Suppress console warnings in tests
const originalConsoleWarn = console.warn
beforeEach(() => {
  console.warn = (...args) => {
    if (args[0]?.includes?.('Firebase') || args[0]?.includes?.('emulator')) {
      return
    }
    originalConsoleWarn(...args)
  }
})

afterEach(() => {
  console.warn = originalConsoleWarn
})
