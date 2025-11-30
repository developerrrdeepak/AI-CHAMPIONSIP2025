import { signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from "firebase/auth";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import type { UserRole } from "./definitions";

export const loginWithGoogle = async (
  role: UserRole,
  auth: any,
  firestore: any
) => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);

    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (additionalInfo?.isNewUser || !userDoc.exists()) {
      const organizationId = role === 'Owner' ? `org-${user.uid}` : `personal-${user.uid}`;
      const batch = writeBatch(firestore);

      batch.set(userDocRef, {
        id: user.uid,
        organizationId,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.photoURL,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        onboardingComplete: false,
      });

      batch.set(doc(firestore, "organizations", organizationId), {
        id: organizationId,
        name: role === 'Owner' ? `${user.displayName}'s Organization` : `${user.displayName}'s Profile`,
        ownerId: user.uid,
        type: role === 'Owner' ? 'company' : 'personal',
        primaryBrandColor: '262 83% 58%',
        logoUrl: user.photoURL || '',
        about: role === 'Owner' 
          ? `Welcome to ${user.displayName}'s Organization.`
          : `${user.displayName}'s candidate profile.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();

      try {
        await fetch('/api/auth/set-custom-claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, claims: { role, organizationId } }),
        });
        await user.getIdToken(true);
      } catch (e) {
        console.warn('Custom claims failed:', e);
      }

      localStorage.setItem('userOrgId', organizationId);
      return { success: true, user, isNewUser: true };
    }

    const existingData = userDoc.data();
    localStorage.setItem('userOrgId', existingData.organizationId);
    return { success: true, user, isNewUser: false };
  } catch (error: any) {
    console.error("Google Sign-In error:", error);
    return { success: false, error: error.message };
  }
};