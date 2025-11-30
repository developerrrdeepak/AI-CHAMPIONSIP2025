
'use client';

import { useUserRole } from '@/hooks/use-user-role';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AppRootPage() {
  const { role, isLoading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (role) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [role, isLoading, router]);

  return (
    <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
    </div>
  );
}