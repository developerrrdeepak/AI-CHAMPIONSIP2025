
'use client';

import { AppShell } from '@/components/layout/app-shell';
import { Nav } from '@/components/nav';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import type { Organization } from '@/lib/definitions';
import { doc } from 'firebase/firestore';
import { useMemo, useEffect, createContext, useContext, useState, Suspense } from 'react';
import type { UserRole as UserRoleType, User } from '@/lib/definitions';
import { getDoc } from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { PageLoader } from '@/components/page-loader';

// --- User Context ---
interface UserContextType {
  user: User | null;
  role: UserRoleType | null;
  organizationId: string | null;
  isUserLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

// A wrapper to access searchParams since the provider is outside the page
function UserProviderWrapper({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const roleFromQuery = searchParams.get('role') as UserRoleType | null;

  return <UserProvider roleFromQuery={roleFromQuery}>{children}</UserProvider>
}


function UserProvider({ children, roleFromQuery }: { children: React.ReactNode, roleFromQuery: UserRoleType | null }) {
  const { user: authUser, isUserLoading: isAuthLoading, firestore } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRoleType | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    if (isAuthLoading) {
      setIsUserLoading(true);
      return;
    }

    if (!authUser || !firestore) {
      setUser(null);
      setRole(roleFromQuery); // Keep role from query if no user
      setOrganizationId(roleFromQuery === 'Candidate' ? 'org-demo-owner-id' : null);
      setIsUserLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setIsUserLoading(true);
      const userDocRef = doc(firestore, 'users', authUser.uid);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data() as User;
          setUser(userData);
          setRole(userData.role);
          setOrganizationId(userData.organizationId);
           if (typeof window !== 'undefined') {
            localStorage.setItem('userOrgId', userData.organizationId);
          }
        } else {
           // This user is likely a candidate who doesn't have a user doc.
           // They might have just signed up via a public job posting.
           setRole('Candidate');
           setOrganizationId('org-demo-owner-id');
           setUser({
              id: authUser.uid,
              displayName: authUser.displayName || 'Candidate',
              email: authUser.email || '',
              role: 'Candidate',
              organizationId: 'org-demo-owner-id',
           } as User);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setUser(null);
        setRole(null);
        setOrganizationId(null);
      } finally {
        setIsUserLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, isAuthLoading, firestore, roleFromQuery]);

  const value = { user, role, organizationId, isUserLoading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
// --- End User Context ---


function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const { role, organizationId, isUserLoading } = useUserContext();
  const { firestore } = useFirebase();

  const orgRef = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return doc(firestore, 'organizations', organizationId);
  }, [firestore, organizationId]);

  const { data: organization, isLoading: isOrgLoading } = useDoc<Organization>(orgRef);

  const homePath = `/?role=${role}`;

  if (isUserLoading || (organizationId && isOrgLoading)) {
      return (
           <AppShell
              homePath={homePath}
              organization={null}
              nav={<Nav role={role} />}
          >
              <main className="flex-1 p-4 sm:px-6 sm:py-8">
                  <div className="max-w-7xl mx-auto w-full">
                    {children}
                  </div>
              </main>
          </AppShell>
      )
  }

  return (
    <AppShell
        homePath={homePath}
        organization={organization}
        nav={<Nav role={role} />}
    >
        <main className="flex-1 p-4 sm:px-6 sm:py-8">
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
        </main>
    </AppShell>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<PageLoader />}>
      <UserProviderWrapper>
        <AppLayoutContent>{children}</AppLayoutContent>
      </UserProviderWrapper>
    </Suspense>
  );
}
