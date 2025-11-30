
'use client';

import { useState, useMemo } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Notification } from '@/lib/definitions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/card';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useUserContext } from '@/app/(app)/layout';

function NotificationItem({ notification }: { notification: Notification }) {
    const { firestore } = useFirebase();
    const { user } = useUserContext();
    const { toast } = useToast();

    const handleMarkAsRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!firestore || !user) return;
        const notifRef = doc(firestore, `users/${user.id}/notifications`, notification.id);
        try {
            await updateDoc(notifRef, { isRead: true });
        } catch (error) {
            console.error("Failed to mark notification as read", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update notification.' });
        }
    };

    return (
        <Link href={notification.link || '#'} passHref>
            <div className={cn(
                "block p-3 -m-3 rounded-lg hover:bg-muted/50 transition-colors",
                !notification.isRead && "bg-primary/10 hover:bg-primary/20"
            )}>
                <div className="flex justify-between items-start">
                    <div className='max-w-[90%]'>
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    {!notification.isRead && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full shrink-0"
                            onClick={handleMarkAsRead}
                            aria-label="Mark as read"
                        >
                            <span className="h-2 w-2 rounded-full bg-primary" />
                        </Button>
                    )}
                </div>
            </div>
        </Link>
    );
}

export function Notifications() {
    const { firestore } = useFirebase();
    const { user } = useUserContext();
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const notificationsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, `users/${user.id}/notifications`),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, user]);

    const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

    const hasUnread = useMemo(() => {
        return notifications?.some(n => !n.isRead);
    }, [notifications]);

    const handleMarkAllRead = async () => {
        if (!firestore || !user || !notifications) return;
        const unreadNotifs = notifications.filter(n => !n.isRead);
        if (unreadNotifs.length === 0) return;

        const batch = writeBatch(firestore);
        unreadNotifs.forEach(notif => {
            const notifRef = doc(firestore, `users/${user.id}/notifications`, notif.id);
            batch.update(notifRef, { isRead: true });
        });

        try {
            await batch.commit();
            toast({ title: 'Notifications marked as read' });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update notifications.' });
        }
    };
    
    const handleClearAll = async () => {
        if (!firestore || !user || !notifications || notifications.length === 0) return;
        
        const batch = writeBatch(firestore);
        notifications.forEach(notif => {
            const notifRef = doc(firestore, `users/${user.id}/notifications`, notif.id);
            batch.delete(notifRef);
        });

        try {
            await batch.commit();
            toast({ title: 'All notifications cleared' });
        } catch (error) {
            console.error("Error clearing notifications:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not clear notifications.' });
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    {hasUnread ? <BellRing className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5" />}
                    {hasUnread && (
                        <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Card className="border-none shadow-none">
                    <CardHeader className="p-3 border-b flex-row items-center justify-between">
                        <CardTitle className="text-base">Notifications</CardTitle>
                        {notifications && notifications.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={!hasUnread}>Mark all as read</Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-3 pt-0 max-h-96 overflow-y-auto space-y-2">
                        {isLoading && <p className="text-sm text-muted-foreground text-center">Loading...</p>}
                        {!isLoading && (!notifications || notifications.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
                        )}
                        {notifications?.map(notif => (
                            <NotificationItem key={notif.id} notification={notif} />
                        ))}
                    </CardContent>
                    {notifications && notifications.length > 0 && (
                        <CardFooter className="p-2 border-t">
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleClearAll}>
                                <Trash2 className="mr-2 h-4 w-4"/>
                                Clear all
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}
