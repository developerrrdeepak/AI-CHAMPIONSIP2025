
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import type { User as UserType } from '@/lib/definitions';
import { collection, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { placeholderImages } from '@/lib/placeholder-images';
import { useUserContext } from '../../layout';

export default function TeamSettingsPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { organizationId, isUserLoading } = useUserContext();

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId) return null;
    return query(collection(firestore, 'users'), where('organizationId', '==', organizationId));
  }, [firestore, organizationId]);

  const { data: teamMembers, isLoading: areMembersLoading } = useCollection<UserType>(usersQuery);
  const isLoading = isUserLoading || areMembersLoading;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your organization and account settings."
      />
      
      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
            <TabsTrigger value="organization" onClick={() => router.push('/settings')}>Organization</TabsTrigger>
            <TabsTrigger value="team" onClick={() => router.push('/settings/team')}>Team</TabsTrigger>
        </TabsList>
        <TabsContent value="team">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                            Manage who can access your organization's workspace.
                        </CardDescription>
                    </div>
                    <Button disabled>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Invite Member
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 p-2">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-6 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : teamMembers && teamMembers.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Member</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={member.avatarUrl || placeholderImages.find(p => p.id === 'avatar-1')?.imageUrl} data-ai-hint="person face" />
                                                <AvatarFallback>{member.displayName?.charAt(0) || member.email?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{member.displayName}</div>
                                                <div className="text-sm text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{member.role}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">No team members found.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="organization">
            {/* This content will be handled by the main settings page, but the tab needs to exist for navigation */}
        </TabsContent>
      </Tabs>
    </>
  );
}
