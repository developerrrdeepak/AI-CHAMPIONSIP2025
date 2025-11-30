
'use client';

import { ActivityLog } from "@/lib/definitions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineTitle, TimelineIcon, TimelineDescription, TimelineContent } from "@/components/ui/timeline";
import { User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatTimelineDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type CandidateActivityTabProps = {
    activities: ActivityLog[];
    isLoading: boolean;
};

export function CandidateActivityTab({ activities, isLoading }: CandidateActivityTabProps) {
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Activity Feed</CardTitle>
                    <CardDescription>A timeline of all events related to this candidate.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Activity Feed</CardTitle>
                <CardDescription>A timeline of all events related to this candidate.</CardDescription>
            </CardHeader>
            <CardContent>
                    {activities.length > 0 ? (
                    <Timeline>
                        {activities.map(log => (
                            <TimelineItem key={log.id}>
                                <TimelineConnector />
                                <TimelineHeader>
                                    <div className="text-xs text-muted-foreground min-w-20 text-right">{formatTimelineDate(log.timestamp)}</div>
                                    <TimelineIcon><User className="h-4 w-4" /></TimelineIcon>
                                    <TimelineTitle>{log.action.replace(/_/g, ' ')}</TimelineTitle>
                                </TimelineHeader>
                                <TimelineContent>
                                    <TimelineDescription>
                                        by {log.actor.name}
                                        {log.context?.jobTitle && ` for job: ${log.context.jobTitle}`}
                                    </TimelineDescription>
                                </TimelineContent>
                            </TimelineItem>
                        ))}
                    </Timeline>
                    ) : (
                    <p className="text-muted-foreground text-center py-8">No activity recorded for this candidate yet.</p>
                    )}
            </CardContent>
        </Card>
    );
}
