'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, UserCheck, Users, Check, X } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, updateDoc, doc, arrayUnion, or } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { useUserContext } from '../layout';
import type { Connection } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { placeholderImages } from '@/lib/placeholder-images';

export default function ConnectionsPage() {
  const { firestore } = useFirebase();
  const { userId, displayName, role } = useUserContext();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const connectionsQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(
      collection(firestore, 'connections'),
      or(
        where('requesterId', '==', userId),
        where('receiverId', '==', userId)
      ),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, userId]);

  const { data: connections } = useCollection<Connection>(connectionsQuery);

  const acceptedConnections = useMemo(() => {
    return connections?.filter(c => c.status === 'accepted') || [];
  }, [connections]);

  const pendingRequests = useMemo(() => {
    return connections?.filter(c => c.status === 'pending' && c.receiverId === userId) || [];
  }, [connections, userId]);

  const sentRequests = useMemo(() => {
    return connections?.filter(c => c.status === 'pending' && c.requesterId === userId) || [];
  }, [connections, userId]);

  const followers = useMemo(() => {
    return acceptedConnections.filter(c => c.receiverId === userId);
  }, [acceptedConnections, userId]);

  const following = useMemo(() => {
    return acceptedConnections.filter(c => c.requesterId === userId);
  }, [acceptedConnections, userId]);

  const mutualConnections = useMemo(() => {
    const followerIds = new Set(followers.map(f => f.requesterId));
    return following.filter(f => followerIds.has(f.receiverId));
  }, [followers, following]);

  const handleAcceptRequest = async (connectionId: string, requesterId: string, requesterName: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'connections', connectionId), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });

      await updateDoc(doc(firestore, 'users', requesterId), {
        notifications: arrayUnion({
          id: `conn-${Date.now()}`,
          type: 'connection_accepted',
          message: `${displayName} accepted your connection request`,
          timestamp: new Date().toISOString(),
          read: false,
        })
      });

      toast({
        title: 'Connection accepted',
        description: `You are now connected with ${requesterName}`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept connection.',
      });
    }
  };

  const handleRejectRequest = async (connectionId: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'connections', connectionId), {
        status: 'rejected',
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Request rejected',
        description: 'Connection request has been rejected.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject connection.',
      });
    }
  };

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <PageHeader
        title="Connections"
        description="Manage your professional network."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedConnections.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mutual Connections</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mutualConnections.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Connections ({acceptedConnections.length})</TabsTrigger>
          <TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({following.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {acceptedConnections.map((conn) => {
              const isRequester = conn.requesterId === userId;
              const otherUser = {
                id: isRequester ? conn.receiverId : conn.requesterId,
                name: isRequester ? conn.receiverName : conn.requesterName,
                role: isRequester ? conn.receiverRole : conn.requesterRole,
              };
              return (
                <Card key={conn.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={placeholderImages[0].imageUrl} />
                        <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{otherUser.name}</p>
                        <Badge variant="secondary" className="text-xs">{otherUser.role}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {acceptedConnections.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No connections yet</p>
          )}
        </TabsContent>

        <TabsContent value="followers" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followers.map((conn) => (
              <Card key={conn.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={placeholderImages[0].imageUrl} />
                      <AvatarFallback>{conn.requesterName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{conn.requesterName}</p>
                      <Badge variant="secondary" className="text-xs">{conn.requesterRole}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {followers.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No followers yet</p>
          )}
        </TabsContent>

        <TabsContent value="following" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {following.map((conn) => (
              <Card key={conn.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={placeholderImages[0].imageUrl} />
                      <AvatarFallback>{conn.receiverName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{conn.receiverName}</p>
                      <Badge variant="secondary" className="text-xs">{conn.receiverRole}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {following.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Not following anyone yet</p>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {pendingRequests.map((conn) => (
              <Card key={conn.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={placeholderImages[0].imageUrl} />
                        <AvatarFallback>{conn.requesterName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{conn.requesterName}</p>
                        <Badge variant="secondary" className="text-xs">{conn.requesterRole}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(conn.id, conn.requesterId, conn.requesterName)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(conn.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {pendingRequests.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No pending requests</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
