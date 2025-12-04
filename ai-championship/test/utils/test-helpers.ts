import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, setDoc, deleteDoc } from 'firebase/firestore'

export class TestUserManager {
  private createdUsers: string[] = []

  async createTestUser(email: string, password: string, userData?: any) {
    const userCredential = await createUserWithEmailAndPassword(global.testAuth, email, password)
    const user = userCredential.user
    
    this.createdUsers.push(user.uid)

    if (userData) {
      await setDoc(doc(global.testFirestore, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    }

    return user
  }

  async cleanup() {
    if (global.testAuth.currentUser) {
      await signOut(global.testAuth)
    }

    for (const uid of this.createdUsers) {
      try {
        await deleteDoc(doc(global.testFirestore, 'users', uid))
        await deleteDoc(doc(global.testFirestore, 'organizations', `org-${uid}`))
      } catch (error) {
        console.warn(`Cleanup failed for ${uid}:`, error)
      }
    }

    this.createdUsers = []
  }
}

export const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
