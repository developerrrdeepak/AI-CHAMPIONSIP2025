import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { initializeFirebase } from '@/firebase'

describe('Firebase Authentication Integration Tests', () => {
  let auth: any
  let firestore: any
  let testUser: any
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'

  beforeAll(() => {
    const { auth: testAuth, firestore: testFirestore } = initializeFirebase()
    auth = testAuth
    firestore = testFirestore
  })

  afterEach(async () => {
    if (testUser) {
      try {
        await signOut(auth)
        await deleteDoc(doc(firestore, 'users', testUser.uid))
        await deleteDoc(doc(firestore, 'organizations', `org-${testUser.uid}`))
      } catch (error) {
        console.warn('Cleanup failed:', error)
      }
      testUser = null
    }
  })

  describe('User Registration', () => {
    it('should create new user with email and password', async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      testUser = userCredential.user

      expect(testUser).toBeDefined()
      expect(testUser.email).toBe(testEmail)
      expect(testUser.uid).toBeDefined()
    })

    it('should create user document in Firestore', async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      testUser = userCredential.user

      const userData = {
        id: testUser.uid,
        email: testUser.email,
        displayName: 'Test User',
        role: 'Candidate',
        organizationId: `personal-${testUser.uid}`,
        createdAt: new Date().toISOString(),
        isActive: true,
        authProvider: 'email'
      }

      await setDoc(doc(firestore, 'users', testUser.uid), userData)

      const userDoc = await getDoc(doc(firestore, 'users', testUser.uid))
      expect(userDoc.exists()).toBe(true)
      expect(userDoc.data()?.email).toBe(testEmail)
    })
  })

  describe('User Sign In', () => {
    beforeEach(async () => {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword)
      testUser = userCredential.user
      await signOut(auth)
    })

    it('should sign in with correct credentials', async () => {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword)
      
      expect(userCredential.user.email).toBe(testEmail)
      expect(auth.currentUser).toBeDefined()
    })

    it('should reject wrong password', async () => {
      await expect(
        signInWithEmailAndPassword(auth, testEmail, 'wrongpassword')
      ).rejects.toThrow()
    })
  })
})
