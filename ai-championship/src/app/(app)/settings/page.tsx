
'use client'

import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFirebase, useDoc, useMemoFirebase } from "@/firebase";
import type { Organization } from "@/lib/definitions";
import { doc, updateDoc } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { useUserContext } from "../layout";

const settingsFormSchema = z.object({
    name: z.string().min(1, "Organization name is required"),
    logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    about: z.string().optional(),
    websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    primaryBrandColor: z.string().regex(/^\d{1,3} \d{1,3}% \d{1,3}%$/, "Invalid HSL format. Use 'H S% L%' e.g., '243 45% 55%'").optional().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

function OrganizationSettingsForm({ organization, isOrgLoading }: { organization: Organization | null, isOrgLoading: boolean }) {
    const { firestore } = useFirebase();
    const { organizationId } = useUserContext();
    const { toast } = useToast();

    const orgRef = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return doc(firestore, 'organizations', organizationId);
    }, [firestore, organizationId]);

    const form = useForm<SettingsFormData>({
        resolver: zodResolver(settingsFormSchema),
        defaultValues: { name: "", logoUrl: "", primaryBrandColor: "", about: "", websiteUrl: "", linkedinUrl: "" }
    });

    useEffect(() => {
        if (organization) {
            form.reset({
                name: organization.name,
                logoUrl: organization.logoUrl || "",
                primaryBrandColor: organization.primaryBrandColor || "",
                about: organization.about || "",
                websiteUrl: organization.websiteUrl || "",
                linkedinUrl: organization.linkedinUrl || "",
            });
        }
    }, [organization, form]);

    async function onSubmit(values: SettingsFormData) {
        if (!orgRef) return;
        try {
            await updateDoc(orgRef, {
                ...values,
                updatedAt: new Date().toISOString(),
            });
             if (values.primaryBrandColor) {
                document.documentElement.style.setProperty('--primary', values.primaryBrandColor);
            }
            toast({
                title: "Settings Saved",
                description: "Your organization details have been updated."
            });
        } catch (error) {
            console.error("Error saving settings: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not save settings. Please try again."
            });
        }
    }

    if (isOrgLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Organization</CardTitle>
                    <CardDescription>Update your organization's details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                       <Skeleton className="h-4 w-24" />
                       <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Profile</CardTitle>
                        <CardDescription>Update your company's public information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Your Company Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="logoUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Logo URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/logo.png" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="about"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>About</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your organization..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="websiteUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Website URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://yourcompany.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="linkedinUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>LinkedIn URL</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://linkedin.com/company/yourcompany" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Customize the look and feel of the app.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="primaryBrandColor"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Primary Brand Color (HSL)</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. 243 45% 55%" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Theme</Label>
                                <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </Form>
    )
}

function AccountSettings() {
    const { user, auth } = useFirebase() as any;
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handlePasswordReset = async () => {
        if (!auth || !user?.email) return;
        setIsResetting(true);
        try {
            const { sendPasswordResetEmail } = await import('firebase/auth');
            await sendPasswordResetEmail(auth, user.email);
            toast({ title: 'Password Reset Email Sent', description: 'Check your inbox for reset instructions.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to send reset email.' });
        } finally {
            setIsResetting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user || !auth) return;
        const confirmed = confirm('Are you sure? This action cannot be undone. All your data will be permanently deleted.');
        if (!confirmed) return;
        
        setIsDeleting(true);
        try {
            const { deleteUser } = await import('firebase/auth');
            await deleteUser(auth.currentUser!);
            toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted.' });
            router.push('/');
        } catch (error: any) {
            if (error.code === 'auth/requires-recent-login') {
                toast({ variant: 'destructive', title: 'Re-authentication Required', description: 'Please log out and log back in, then try again.' });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete account.' });
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Password</CardTitle>
                    <CardDescription>Reset your account password</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handlePasswordReset} disabled={isResetting} variant="outline">
                        {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Password Reset Email
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Permanently delete your account and all data</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleDeleteAccount} disabled={isDeleting} variant="destructive">
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function SettingsPage() {
    const { firestore } = useFirebase();
    const { organizationId, isUserLoading } = useUserContext();
    const router = useRouter();

    const orgRef = useMemoFirebase(() => {
        if (!firestore || !organizationId) return null;
        return doc(firestore, 'organizations', organizationId);
    }, [firestore, organizationId]);

    const { data: organization, isLoading: isOrgLoading } = useDoc<Organization>(orgRef);
    
    return (
        <>
            <PageHeader title="Settings" description="Manage your organization and account settings." />
            
            <Tabs defaultValue="organization" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="organization">Company Info</TabsTrigger>
                    <TabsTrigger value="team" onClick={() => router.push('/settings/team')}>Team</TabsTrigger>
                    <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>
                <TabsContent value="organization">
                    <OrganizationSettingsForm organization={organization} isOrgLoading={isUserLoading || isOrgLoading} />
                </TabsContent>
                <TabsContent value="team">
                    {/* This content will be handled by the team page */}
                </TabsContent>
                <TabsContent value="account">
                    <AccountSettings />
                </TabsContent>
            </Tabs>
        </>
    )
}
