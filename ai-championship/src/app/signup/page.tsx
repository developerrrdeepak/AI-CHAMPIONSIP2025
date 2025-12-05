'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HireVisionLogo, GoogleLogo } from "@/components/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirebase, FirebaseClientProvider } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from "firebase/auth";
import { workosClient } from "@/lib/workos-client";
import { useState } from "react";
import { doc, setDoc, writeBatch, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import { UserRole } from "@/lib/definitions";
import { cn } from "@/lib/utils";
import { validatePasswordStrength, getEmailErrorMessage, validateEmail, getPasswordStrengthColor, getPasswordStrengthLabel } from "@/lib/auth-utils";

async function handleGoogleSignIn(role: UserRole, { auth, firestore, toast, router }: { auth: any, firestore: any, toast: any, router: any }) {
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Firebase is not ready." });
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo(result);
        
        toast({ title: "Signing in with Google...", description: "Just a moment..."});

        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (additionalInfo?.isNewUser || !userDoc.exists()) {
            let organizationId: string;
            
            if (role === 'Owner') {
                organizationId = `org-${user.uid}`;
            } else {
                organizationId = `personal-${user.uid}`;
            }

            const batch = writeBatch(firestore);

            const newUser = {
                id: user.uid,
                organizationId: organizationId,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.photoURL,
                role: role,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                onboardingComplete: false,
            };
            batch.set(userDocRef, newUser);

            const orgDocRef = doc(firestore, "organizations", organizationId);
            batch.set(orgDocRef, {
                id: organizationId,
                name: role === 'Owner' ? `${user.displayName}'s Organization` : `${user.displayName}'s Profile`,
                ownerId: user.uid,
                type: role === 'Owner' ? 'company' : 'personal',
                primaryBrandColor: '207 90% 54%',
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
                    body: JSON.stringify({ uid: user.uid, claims: { role: role, organizationId: organizationId } }),
                }).catch(() => {});
                await user.getIdToken(true);
            } catch (e) {
                console.warn('Custom claims skipped');
            }
            
            toast({ title: `Welcome, ${user.displayName}!`, description: "Your account has been created." });
            localStorage.setItem('userOrgId', organizationId);
        } else {
            const existingData = userDoc.data();
            localStorage.setItem('userOrgId', existingData.organizationId);
            toast({ title: `Welcome back, ${user.displayName}!` });
        }
        
        const redirectPath = role === 'Owner' ? '/dashboard' : '/candidate-portal/dashboard';
        router.push(redirectPath);

    } catch (error: any) {
        console.error("Google Sign-In failed:", error);
        toast({
            variant: "destructive",
            title: "Google Sign-In Failed",
            description: getEmailErrorMessage(error),
        });
    }
}

function CandidateSignupForm({ onBack }: { onBack: () => void }) {
    const router = useRouter();
    const { toast } = useToast();
    const { auth, firestore } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(''));

    const onGoogleClick = async () => {
        setIsLoading(true);
        await handleGoogleSignIn('Candidate', { auth, firestore, toast, router });
        setIsLoading(false);
    }

    const onWorkOSClick = () => {
        const authUrl = workosClient.getAuthorizationUrl('google');
        window.location.href = authUrl;
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError(null);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordStrength(validatePasswordStrength(value));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!name.trim()) {
            setError('Please enter your name');
            setIsLoading(false);
            return;
        }

        if (!email.trim()) {
            setError('Please enter your email');
            setIsLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            setError('Invalid email address');
            setIsLoading(false);
            return;
        }

        if (!passwordStrength.isStrong) {
            setError('Password is not strong enough. ' + (passwordStrength.feedback[0] || 'Use a stronger password'));
            setIsLoading(false);
            return;
        }

        if (!auth || !firestore) {
            const errText = "Firebase is not ready. Please try again in a moment.";
            setError(errText);
            toast({ variant: "destructive", title: "Error", description: errText });
            setIsLoading(false);
            return;
        }
        
        toast({ title: "Creating your account...", description: "Setting up your candidate profile."});

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            let photoURL = '';
            if (photoFile) {
                const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
                const { getStorage } = await import('firebase/storage');
                const storage = getStorage();
                const photoRef = storageRef(storage, `profiles/${user.uid}/photo`);
                await uploadBytes(photoRef, photoFile);
                photoURL = await getDownloadURL(photoRef);
            }
            
            await updateProfile(user, { displayName: name, photoURL: photoURL || undefined });
            
            const organizationId = `personal-${user.uid}`;
            
            const batch = writeBatch(firestore);
            
            const userDocRef = doc(firestore, "users", user.uid);
            batch.set(userDocRef, {
                id: user.uid,
                organizationId: organizationId,
                email: user.email,
                displayName: name,
                photoURL: photoURL,
                role: 'Candidate' as UserRole,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                onboardingComplete: false,
            });

            const orgDocRef = doc(firestore, "organizations", organizationId);
            batch.set(orgDocRef, {
                id: organizationId,
                name: `${name}'s Profile`,
                ownerId: user.uid,
                type: 'personal',
                primaryBrandColor: '207 90% 54%',
                logoUrl: '',
                about: `${name}'s candidate profile.`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            
            await batch.commit();

            await fetch('/api/auth/set-custom-claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, claims: { role: 'Candidate', organizationId: organizationId } }),
            });
            await user.getIdToken(true);
            
            toast({
                title: "Account Created",
                description: "Welcome to HireVision! Redirecting you to your dashboard.",
            });

            localStorage.setItem('userOrgId', organizationId);
            setTimeout(() => router.push('/candidate-portal/dashboard'), 500);
            
        } catch (err: any) {
            const errorMessage = getEmailErrorMessage(err);
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Signup Failed",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <CardHeader className="p-0 space-y-2 text-left mb-6">
                <CardTitle className="text-2xl">Create Candidate Account</CardTitle>
                <CardDescription>
                    Start your job search journey with HireVision.
                </CardDescription>
            </CardHeader>

            <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={onWorkOSClick} disabled={isLoading}>
                    Continue with WorkOS SSO
                </Button>
                <Button variant="outline" className="w-full" onClick={onGoogleClick} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleLogo className="mr-2 h-4 w-4" />}
                    Continue with Google
                </Button>
            </div>
            

            
            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700 mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignup} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="photo">Profile Photo (Optional)</Label>
                <Input id="photo" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} disabled={isLoading} />
                <p className="text-xs text-muted-foreground">You can skip this and add it later</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  value={email} 
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="6+ characters, numbers, and uppercase" 
                  value={password} 
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  className={passwordStrength.score < 2 && password ? 'border-yellow-500' : ''}
                />
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getPasswordStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{getPasswordStrengthLabel(passwordStrength.score)}</span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        {passwordStrength.feedback.map((msg, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {msg}
                          </li>
                        ))}
                      </ul>
                    )}
                    {passwordStrength.isStrong && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Strong password
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" className="w-full" onClick={onBack} disabled={isLoading}>Back</Button>
                <Button type="submit" className="w-full" disabled={isLoading || !passwordStrength.isStrong}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-primary">
                Sign in
              </Link>
            </div>
        </div>
    )
}

function EmployerSignupForm({ onBack }: { onBack: () => void }) {
    const router = useRouter();
    const { toast } = useToast();
    const { auth, firestore } = useFirebase();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(''));

    const onGoogleClick = async () => {
        setIsLoading(true);
        await handleGoogleSignIn('Owner', { auth, firestore, toast, router });
        setIsLoading(false);
    }

    const onWorkOSClick = () => {
        const authUrl = workosClient.getAuthorizationUrl('google');
        window.location.href = authUrl;
    }

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        
        if (value && !validateEmail(value)) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError(null);
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordStrength(validatePasswordStrength(value));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        if (!name.trim()) {
            setError('Please enter your name');
            setIsLoading(false);
            return;
        }

        if (!organizationName.trim()) {
            setError('Please enter your organization name');
            setIsLoading(false);
            return;
        }

        if (!email.trim()) {
            setError('Please enter your email');
            setIsLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            setError('Invalid email address');
            setIsLoading(false);
            return;
        }

        if (!passwordStrength.isStrong) {
            setError('Password is not strong enough. ' + (passwordStrength.feedback[0] || 'Use a stronger password'));
            setIsLoading(false);
            return;
        }

        if (!auth || !firestore) {
            const errText = "Firebase is not ready. Please try again in a moment.";
            setError(errText);
            toast({ variant: "destructive", title: "Error", description: errText });
            setIsLoading(false);
            return;
        }
        
        toast({ title: "Creating your account...", description: "Setting up your new organization."});

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, { displayName: name });
            
            const organizationId = `org-${user.uid}`;
            
            const batch = writeBatch(firestore);
            
            const userDocRef = doc(firestore, "users", user.uid);
            batch.set(userDocRef, {
                id: user.uid,
                organizationId: organizationId,
                email: user.email,
                displayName: name,
                role: 'Owner' as UserRole,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                onboardingComplete: false,
            });

            const orgDocRef = doc(firestore, "organizations", organizationId);
            batch.set(orgDocRef, {
                id: organizationId,
                name: organizationName,
                ownerId: user.uid,
                type: 'company',
                primaryBrandColor: '207 90% 54%',
                logoUrl: '',
                about: `Welcome to ${organizationName}, a dynamic and innovative company.`,
                websiteUrl: '',
                linkedinUrl: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
            
            await batch.commit();

            await fetch('/api/auth/set-custom-claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, claims: { role: 'Owner', organizationId: organizationId } }),
            });
            await user.getIdToken(true);
            
            toast({
                title: "Organization Created",
                description: "Welcome to HireVision! Redirecting you to the dashboard.",
            });

            localStorage.setItem('userOrgId', organizationId);
            setTimeout(() => router.push('/dashboard'), 500);
            
        } catch (err: any) {
            const errorMessage = getEmailErrorMessage(err);
            setError(errorMessage);
            toast({
                variant: "destructive",
                title: "Signup Failed",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <CardHeader className="p-0 space-y-2 text-left mb-6">
                <CardTitle className="text-2xl">Create Your Organization</CardTitle>
                <CardDescription>
                    Get started with HireVision by creating your company's workspace.
                </CardDescription>
            </CardHeader>

            <div className="space-y-2">
                <Button variant="outline" className="w-full" onClick={onWorkOSClick} disabled={isLoading}>
                    Continue with WorkOS SSO
                </Button>
                <Button variant="outline" className="w-full" onClick={onGoogleClick} disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleLogo className="mr-2 h-4 w-4" />}
                    Continue with Google
                </Button>
            </div>
            
            
            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="mx-4 text-xs uppercase text-muted-foreground">Or</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700 mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSignup} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="organizationName">Organization Name</Label>
                <Input id="organizationName" type="text" placeholder="Your Company Inc." required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Your Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" required value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Your Work Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@company.com" 
                  required 
                  value={email} 
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  className={emailError ? 'border-red-500' : ''}
                />
                {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="6+ characters, numbers, and uppercase" 
                  value={password} 
                  onChange={handlePasswordChange}
                  disabled={isLoading}
                  className={passwordStrength.score < 2 && password ? 'border-yellow-500' : ''}
                />
                {password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${getPasswordStrengthColor(passwordStrength.score)}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{getPasswordStrengthLabel(passwordStrength.score)}</span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-xs text-gray-600 space-y-1">
                        {passwordStrength.feedback.map((msg, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {msg}
                          </li>
                        ))}
                      </ul>
                    )}
                    {passwordStrength.isStrong && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Strong password
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" className="w-full" onClick={onBack} disabled={isLoading}>Back</Button>
                <Button type="submit" className="w-full" disabled={isLoading || !passwordStrength.isStrong}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Organization
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-primary">
                Sign in
              </Link>
            </div>
        </div>
    )
}

function SignupPageContent() {
  const [view, setView] = useState<'selection' | 'candidate' | 'employer' | 'onboarding'>('selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null); // To store the role selected for onboarding
  const [aiOnboardingContent, setAiOnboardingContent] = useState<{ welcomeMessage: string; suggestedActions: string[]; encouragement: string; } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toast } = useToast();

  const handleRoleSelection = async (role: UserRole) => {
    setSelectedRole(role);
    setAiLoading(true);
    setView('onboarding'); // Immediately switch to onboarding view to show loading

    try {
      const response = await fetch('/api/ai/onboarding-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userRole: role === 'Owner' ? 'recruiter' : 'candidate' }), // Map 'Owner' to 'recruiter' for AI
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setAiOnboardingContent(data);
      } else {
        console.error('Failed to fetch AI onboarding suggestions:', data.error);
        toast({
          variant: "destructive",
          title: "Onboarding Failed",
          description: "Could not load personalized suggestions. Please try again.",
        });
        // Fallback to direct form if AI fails
        setView(role === 'Candidate' ? 'candidate' : 'employer');
      }
    } catch (error) {
      console.error('Error fetching AI onboarding suggestions:', error);
      toast({
        variant: "destructive",
        title: "Onboarding Error",
        description: "An unexpected error occurred during AI onboarding. Please try again.",
      });
      // Fallback to direct form if API call fails
      setView(role === 'Candidate' ? 'candidate' : 'employer');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-[580px]">
      {view === 'selection' && (
        <div className={cn("transition-opacity duration-300", 'animate-in fade-in-0')}>
          <CardHeader className="text-center p-0">
              <Link href="/" className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HireVisionLogo className="h-8 w-8" />
              </Link>
              <CardTitle className="text-2xl">Join HireVision</CardTitle>
              <CardDescription>
                  Are you looking for your next opportunity or hiring your next star?
              </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 mt-8 p-0">
              <Button variant="outline" size="lg" className="w-full justify-start h-auto p-4" onClick={() => handleRoleSelection('Candidate')} disabled={aiLoading}>
                  <GraduationCap className="w-6 h-6 mr-4" />
                  <div className="text-left">
                      <p className="font-semibold">I'm a Candidate</p>
                      <p className="text-xs text-muted-foreground">Find your dream job and grow your career.</p>
                  </div>
              </Button>
              <Button variant="outline" size="lg" className="w-full justify-start h-auto p-4" onClick={() => handleRoleSelection('Owner')} disabled={aiLoading}>
                  <Briefcase className="w-6 h-6 mr-4" />
                  <div className="text-left">
                      <p className="font-semibold">I'm an Employer</p>
                      <p className="text-xs text-muted-foreground">Post jobs and manage candidates.</p>
                  </div>
              </Button>
              <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline hover:text-primary">
                      Sign In
                  </Link>
              </div>
          </CardContent>
        </div>
      )}

      {view === 'onboarding' && (
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500 text-center">
          <CardHeader className="p-0 space-y-2 text-left mb-6 text-center">
            <Link href="/" className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HireVisionLogo className="h-8 w-8" />
            </Link>
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <CardTitle className="text-2xl">Generating your personalized experience...</CardTitle>
                <CardDescription>One moment while our AI tailors your journey.</CardDescription>
              </div>
            ) : aiOnboardingContent ? (
              <>
                <CardTitle className="text-2xl">{aiOnboardingContent.welcomeMessage}</CardTitle>
                <CardDescription className="mt-4 text-left">
                  <p className="font-semibold mb-2">Here are some suggested next steps:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {aiOnboardingContent.suggestedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                  <p className="mt-4">{aiOnboardingContent.encouragement}</p>
                </CardDescription>
                <Button 
                    className="w-full mt-8" 
                    onClick={() => setView(selectedRole === 'Candidate' ? 'candidate' : 'employer')}
                >
                    Continue to {selectedRole === 'Candidate' ? 'Candidate Signup' : 'Employer Signup'}
                </Button>
              </>
            ) : (
                // Fallback if AI content couldn't be loaded and didn't redirect earlier
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <CardTitle className="text-2xl">Oops! Something went wrong.</CardTitle>
                    <CardDescription>We couldn't load your personalized onboarding. Please proceed manually.</CardDescription>
                    <Button 
                        className="w-full mt-4" 
                        onClick={() => setView(selectedRole === 'Candidate' ? 'candidate' : 'employer')}
                    >
                        Continue to {selectedRole === 'Candidate' ? 'Candidate Signup' : 'Employer Signup'}
                    </Button>
                </div>
            )}
          </CardHeader>
        </div>
      )}

      {(view === 'candidate' || view === 'employer') && (
        <div className={cn(view !== 'selection' && view !== 'onboarding' ? 'block' : 'hidden')}>
            {view === 'candidate' && <CandidateSignupForm onBack={() => setView('selection')} />}
            {view === 'employer' && <EmployerSignupForm onBack={() => setView('selection')} />}
        </div>
      )}
    </div>
  );
}

export default function SignupPage() {
    return (
        <FirebaseClientProvider>
            <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-primary/10 to-pink-500/20 dark:from-purple-900/20 dark:via-primary/10 dark:to-pink-900/10"></div>
                <div className="absolute top-10 right-10 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-700"></div>
                <Card className="w-full max-w-md glassmorphism relative z-10 hover-lift">
                    <SignupPageContent />
                </Card>
            </div>
        </FirebaseClientProvider>
    )
}