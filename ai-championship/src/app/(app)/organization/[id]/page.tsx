
'use client';

import { notFound, useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Globe, Linkedin, Building } from "lucide-react";
import Link from "next/link";
import { useFirebase, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Organization, Job } from "@/lib/definitions";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function OrgProfileSkeleton() {
    return (
        <div className="flex flex-col animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 md:py-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-md" />
                    <div className="grid gap-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>
             <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                        <CardContent className="space-y-4">
                           <Skeleton className="h-12 w-full" />
                           <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                </div>
                 <div className="space-y-6">
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                        <CardContent className="space-y-3">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function OrganizationProfilePage() {
    const params = useParams();
    const id = params.id as string;
    const { firestore } = useFirebase();
    const router = useRouter();

    const orgRef = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return doc(firestore, `organizations`, id);
    }, [firestore, id]);

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !id) return null;
        return query(
            collection(firestore, `organizations/${id}/jobs`),
            where('status', '==', 'open')
        );
    }, [firestore, id]);

    const { data: organization, isLoading: isOrgLoading } = useDoc<Organization>(orgRef);
    const { data: openJobs, isLoading: areJobsLoading } = useCollection<Job>(jobsQuery);

    if (isOrgLoading || areJobsLoading) {
        return <OrgProfileSkeleton />;
    }

    if (!organization) {
        notFound();
    }

    return (
        <div className="flex flex-col animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 md:py-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 rounded-md">
                        <AvatarImage src={organization.logoUrl} data-ai-hint="company logo" asChild>
                            <Image src={organization.logoUrl || ''} alt={`${organization.name} Logo`} width={80} height={80} className="object-contain" />
                        </AvatarImage>
                        <AvatarFallback className="text-2xl rounded-md"><Building /></AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                        <h1 className="text-2xl font-bold md:text-3xl">{organization.name}</h1>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>About</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground whitespace-pre-wrap">{organization.about || 'No description provided.'}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Open Positions ({openJobs?.length || 0})</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {openJobs?.map(job => (
                                <div key={job.id} className="flex items-center justify-between p-3 -m-3 rounded-lg hover:bg-muted/50">
                                    <div>
                                        <h4 className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => router.push(`/jobs/${job.id}?role=Candidate`)}>{job.title}</h4>
                                        <p className="text-sm text-muted-foreground">{job.department} &middot; {job.isRemote ? 'Remote' : `${job.locationCity}`}</p>
                                    </div>
                                    <Button asChild>
                                        <Link href={`/jobs/${job.id}?role=Candidate`}>View</Link>
                                    </Button>
                                </div>
                            ))}
                            {openJobs?.length === 0 && <p className="text-muted-foreground text-center py-6">No open positions at this time.</p>}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Links</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                           {organization.websiteUrl && (
                             <a href={organization.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                <Globe className="h-4 w-4" />
                                Website
                            </a>
                           )}
                           {organization.linkedinUrl && (
                             <a href={organization.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                            </a>
                           )}
                           {(!organization.websiteUrl && !organization.linkedinUrl) && (
                               <p className="text-sm text-muted-foreground">No links provided.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
