
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { HireVisionLogo, GoogleLogo } from "@/components/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFirebase, FirebaseClientProvider } from "@/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, getAdditionalUserInfo } from "firebase/auth";
import { workosClient } from "@/lib/workos-client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Briefcase, GraduationCap, AlertCircle } from "lucide-react";
import { getEmailErrorMessage } from "@/lib/auth-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { UserRole } from "@/lib/definitions";

const loginFormSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

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
            
            await fetch('/api/auth/set-custom-claims', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, claims: { role: role, organizationId: organizationId } }),
            });
            await user.getIdToken(true);

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


function LoginForm({ userType, onBack }: { userType: 'candidate' | 'employer', onBack: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { auth, firestore } = useFirebase();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof loginFormSchema>>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: { email: '', password: '' },
    });

    const handleLogin = async (values: z.infer<typeof loginFormSchema>) => {
        if (!auth) {
            const errMsg = 'Authentication service is not available.';
            setError(errMsg);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: errMsg
            });
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            const userDocRef = doc(firestore, "users", userCredential.user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                localStorage.setItem('userOrgId', userDoc.data().organizationId);
            }
            toast({ title: 'Success', description: 'Logging you in...' });
            const userRole = userDoc.data()?.role;
            const redirectPath = userRole === 'Owner' ? '/dashboard' : '/candidate-portal/dashboard';
            router.push(redirectPath);
        } catch (error: any) {
            console.error("Sign-in failed:", error);
            const description = getEmailErrorMessage(error);
            setError(description);
            toast({ variant: 'destructive', title: 'Login Failed', description });
        } finally {
            setIsLoading(false);
        }
    };
    
    const onGoogleClick = async () => {
        setIsLoading(true);
        await handleGoogleSignIn(userType === 'employer' ? 'Owner' : 'Candidate', { auth, firestore, toast, router });
        setIsLoading(false);
    }

    const onWorkOSClick = () => {
        const authUrl = workosClient.getAuthorizationUrl('google');
        window.location.href = authUrl;
    }

    const title = userType === 'employer' ? 'Employer Sign In' : 'Candidate Sign In';
    const description = userType === 'employer' ? "Access your employer dashboard." : "Access your candidate portal.";

    return (
        <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <CardHeader className="p-0 space-y-2 text-left mb-6">
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
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

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="name@example.com" {...field} type="email" disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input placeholder="••••••••" {...field} type="password" disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="flex gap-2 mt-2">
                        <Button type="button" variant="outline" className="w-full" onClick={onBack} disabled={isLoading}>Back</Button>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                        </Button>
                    </div>
                </form>
            </Form>
             <p className="mt-6 text-center text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline hover:text-primary">
                    Register here
                </Link>
                .
            </p>
        </div>
    );
}

function LoginPageContent() {
    const [view, setView] = useState<'selection' | 'candidate' | 'employer'>('selection');

    return (
        <div className="p-8 md:p-12 min-h-[480px]">
            <div className={cn("transition-opacity duration-300", view === 'selection' ? 'animate-in fade-in-0' : 'opacity-0 h-0 overflow-hidden pointer-events-none')}>
                <CardHeader className="text-center p-0">
                    <Link href="/" className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <HireVisionLogo className="h-8 w-8" />
                    </Link>
                    <CardTitle className="text-2xl">Sign In to HireVision</CardTitle>
                    <CardDescription>
                        Please select your role to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 mt-8 p-0">
                    <Button variant="outline" size="lg" className="w-full justify-start h-auto p-4" onClick={() => setView('candidate')}>
                        <GraduationCap className="w-6 h-6 mr-4" />
                        <div className="text-left">
                            <p className="font-semibold">I'm a Candidate</p>
                            <p className="text-xs text-muted-foreground">Access your job applications and career tools.</p>
                        </div>
                    </Button>
                    <Button variant="outline" size="lg" className="w-full justify-start h-auto p-4" onClick={() => setView('employer')}>
                        <Briefcase className="w-6 h-6 mr-4" />
                        <div className="text-left">
                            <p className="font-semibold">I'm an Employer</p>
                            <p className="text-xs text-muted-foreground">Manage jobs, candidates, and your hiring team.</p>
                        </div>
                    </Button>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="underline hover:text-primary">
                            Register
                        </Link>
                    </div>
                </CardContent>
            </div>

             <div className={cn(view !== 'selection' ? 'block' : 'hidden')}>
                {view === 'candidate' && <LoginForm userType="candidate" onBack={() => setView('selection')} />}
                {view === 'employer' && <LoginForm userType="employer" onBack={() => setView('selection')} />}
             </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <FirebaseClientProvider>
            <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/20 dark:from-primary/10 dark:via-purple-900/20 dark:to-pink-900/10"></div>
                <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <Card className="w-full max-w-md glassmorphism relative z-10 hover-lift">
                    <LoginPageContent />
                </Card>
            </div>
        </FirebaseClientProvider>
    )
}
