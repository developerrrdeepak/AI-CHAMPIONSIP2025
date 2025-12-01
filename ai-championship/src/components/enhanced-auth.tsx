'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { GoogleLogo, HireVisionLogo } from '@/components/icons';
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Users, Briefcase } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface EnhancedAuthProps {
  mode: 'login' | 'signup';
  userType: 'candidate' | 'employer';
  onSuccess?: () => void;
}

export function EnhancedAuth({ mode, userType, onSuccess }: EnhancedAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { auth, firestore } = useFirebase();
  const router = useRouter();

  const handleGoogleAuth = async () => {
    if (!auth || !firestore) {
      setError('Firebase not initialized');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });
      
      // Ensure popup is allowed
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        provider.setCustomParameters({
          ...provider.customParameters,
          hd: undefined // Remove hosted domain restriction for localhost
        });
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user
        const organizationId = userType === 'employer' ? `org-${user.uid}` : `personal-${user.uid}`;
        const batch = writeBatch(firestore);

        // Create user document
        batch.set(userDocRef, {
          id: user.uid,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.photoURL,
          role: userType === 'employer' ? 'Owner' : 'Candidate',
          organizationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          onboardingComplete: false,
          authProvider: 'google'
        });

        // Create organization
        const orgDocRef = doc(firestore, 'organizations', organizationId);
        batch.set(orgDocRef, {
          id: organizationId,
          name: userType === 'employer' ? `${user.displayName}'s Company` : `${user.displayName}'s Profile`,
          ownerId: user.uid,
          type: userType === 'employer' ? 'company' : 'personal',
          primaryBrandColor: '207 90% 54%',
          logoUrl: user.photoURL || '',
          about: `Welcome to ${user.displayName}'s ${userType === 'employer' ? 'organization' : 'profile'}.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await batch.commit();

        // Set custom claims
        await fetch('/api/auth/set-custom-claims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            uid: user.uid, 
            claims: { 
              role: userType === 'employer' ? 'Owner' : 'Candidate', 
              organizationId 
            } 
          }),
        });

        await user.getIdToken(true);
        localStorage.setItem('userOrgId', organizationId);

        toast({
          title: '🎉 Welcome to HireVision!',
          description: `Your ${userType} account has been created successfully.`
        });
      } else {
        const userData = userDoc.data();
        localStorage.setItem('userOrgId', userData.organizationId);
        toast({
          title: `Welcome back, ${user.displayName}!`,
          description: 'You have been signed in successfully.'
        });
      }

      onSuccess?.();
      const redirectPath = userType === 'employer' ? '/dashboard' : '/candidate/dashboard';
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Google auth error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      
      let errorMessage = 'Authentication failed';
      if (error.code === 'auth/internal-error') {
        errorMessage = 'Internal error. Check Firebase configuration and authorized domains.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    setIsLoading(true);
    setError('');

    try {
      let userCredential;
      
      if (mode === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user profile for new signup
        const user = userCredential.user;
        const organizationId = userType === 'employer' ? `org-${user.uid}` : `personal-${user.uid}`;
        const batch = writeBatch(firestore);

        batch.set(doc(firestore, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          displayName: name,
          role: userType === 'employer' ? 'Owner' : 'Candidate',
          organizationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          onboardingComplete: false,
          authProvider: 'email'
        });

        batch.set(doc(firestore, 'organizations', organizationId), {
          id: organizationId,
          name: userType === 'employer' ? (company || `${name}'s Company`) : `${name}'s Profile`,
          ownerId: user.uid,
          type: userType === 'employer' ? 'company' : 'personal',
          primaryBrandColor: '207 90% 54%',
          about: `Welcome to ${name}'s ${userType === 'employer' ? 'organization' : 'profile'}.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        await batch.commit();
        localStorage.setItem('userOrgId', organizationId);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          localStorage.setItem('userOrgId', userDoc.data().organizationId);
        }
      }

      toast({
        title: mode === 'signup' ? '🎉 Account Created!' : '✅ Welcome Back!',
        description: mode === 'signup' ? 'Your account has been created successfully.' : 'You have been signed in.'
      });

      onSuccess?.();
      const redirectPath = userType === 'employer' ? '/dashboard' : '/candidate/dashboard';
      router.push(redirectPath);
    } catch (error: any) {
      setError(error.message);
      toast({
        variant: 'destructive',
        title: mode === 'signup' ? 'Signup Failed' : 'Login Failed',
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HireVisionLogo className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">
          {mode === 'signup' ? 'Join HireVision' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          {mode === 'signup' 
            ? `Create your ${userType} account to get started`
            : `Sign in to your ${userType} account`
          }
        </CardDescription>
        <div className="flex justify-center">
          <Badge variant="outline" className="flex items-center gap-1">
            {userType === 'employer' ? <Briefcase className="h-3 w-3" /> : <Users className="h-3 w-3" />}
            {userType === 'employer' ? 'Employer' : 'Candidate'} Account
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google Authentication */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={handleGoogleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <GoogleLogo className="mr-2 h-4 w-4" />
          )}
          Continue with Google
          <Badge variant="secondary" className="ml-2 text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Recommended
          </Badge>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email Authentication Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              {userType === 'employer' && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === 'signup' ? (
            <>Already have an account? <button className="underline hover:text-primary">Sign in</button></>
          ) : (
            <>Don't have an account? <button className="underline hover:text-primary">Sign up</button></>
          )}
        </div>
      </CardContent>
    </Card>
  );
}