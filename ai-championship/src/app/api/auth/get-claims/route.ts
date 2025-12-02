import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

let adminInitialized = false;
try {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    adminInitialized = true;
  } else if (getApps().length) {
    adminInitialized = true;
  }
} catch (error: any) {
  console.error('Firebase Admin initialization failed:', error?.message || error);
  adminInitialized = false;
}

export async function GET(request: NextRequest) {
  try {
    if (!adminInitialized) {
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const auth = getAuth()
    const decodedToken = await auth.verifyIdToken(token)
    const uid = decodedToken.uid

    const firestore = getFirestore()
    const userDoc = await firestore.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    const orgId = userData?.organizationId

    let orgData = null
    if (orgId) {
      const orgDoc = await firestore.collection('organizations').doc(orgId).get()
      orgData = orgDoc.exists ? orgDoc.data() : null
    }

    return NextResponse.json({
      user: {
        uid,
        email: userData?.email,
        displayName: userData?.displayName,
        role: userData?.role,
        organizationId: orgId,
        avatarUrl: userData?.avatarUrl,
        onboardingComplete: userData?.onboardingComplete || false,
      },
      organization: orgData ? {
        id: orgId,
        name: orgData.name,
        type: orgData.type,
        owner: orgData.ownerId,
      } : null,
      claims: {
        role: userData?.role,
        orgId: orgId,
        owner: userData?.role === 'Owner',
      },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting claims:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Invalid or expired token', details: errorMessage },
      { status: 401 }
    );
  }
}
