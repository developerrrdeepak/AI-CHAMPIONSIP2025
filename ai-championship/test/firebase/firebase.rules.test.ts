import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

describe('Firestore Security Rules', () => {
  let testEnv: RulesTestEnvironment

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: `
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /users/{userId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
              
              match /organizations/{orgId} {
                allow read: if request.auth != null;
                allow write: if request.auth != null && 
                  (resource == null || resource.data.ownerId == request.auth.uid);
              }
            }
          }
        `
      }
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
  })

  describe('Users Collection', () => {
    it('should allow user to read their own document', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const userDoc = doc(alice.firestore(), 'users/alice')
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/alice'), { name: 'Alice' })
      })

      await expect(getDoc(userDoc)).resolves.toBeDefined()
    })

    it('should deny user reading another user document', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const bobDoc = doc(alice.firestore(), 'users/bob')
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'users/bob'), { name: 'Bob' })
      })

      await expect(getDoc(bobDoc)).rejects.toThrow()
    })

    it('should deny unauthenticated access', async () => {
      const unauth = testEnv.unauthenticatedContext()
      const userDoc = doc(unauth.firestore(), 'users/alice')

      await expect(getDoc(userDoc)).rejects.toThrow()
    })
  })

  describe('Organizations Collection', () => {
    it('should allow authenticated users to read organizations', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const orgDoc = doc(alice.firestore(), 'organizations/org-123')
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'organizations/org-123'), { 
          name: 'Test Org',
          ownerId: 'bob'
        })
      })

      await expect(getDoc(orgDoc)).resolves.toBeDefined()
    })

    it('should allow owner to write to organization', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const orgDoc = doc(alice.firestore(), 'organizations/org-alice')

      await expect(setDoc(orgDoc, {
        name: 'Alice Org',
        ownerId: 'alice'
      })).resolves.toBeDefined()
    })

    it('should deny non-owner writing to organization', async () => {
      const alice = testEnv.authenticatedContext('alice')
      const orgDoc = doc(alice.firestore(), 'organizations/org-bob')
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'organizations/org-bob'), { 
          ownerId: 'bob'
        })
      })

      await expect(setDoc(orgDoc, {
        name: 'Hacked Org'
      })).rejects.toThrow()
    })
  })
})
