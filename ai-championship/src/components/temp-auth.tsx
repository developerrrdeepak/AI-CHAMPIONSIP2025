'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export function TempAuth() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const { auth } = useFirebase();

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    }
  };

  return (
    <div className="p-4 space-y-2">
      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      <Button onClick={signIn}>Sign In/Up</Button>
    </div>
  );
}