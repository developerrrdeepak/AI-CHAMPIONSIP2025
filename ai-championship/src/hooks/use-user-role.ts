
'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserRole } from '@/lib/definitions';
import { useUserContext } from '@/app/(app)/layout';

export function useUserRole() {
  const { role, isUserLoading } = useUserContext();

  return { role, isLoading: isUserLoading };
}
