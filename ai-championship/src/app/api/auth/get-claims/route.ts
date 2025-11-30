import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp()
}

export async function GET(request: NextRequest) {
  try {
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
  } catch (error: any) {
    console.error('Error getting claims:', error)
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    )
  }
}
