
'use client';

import { 
  FileText,
  MessageSquare,
  Users,
  User,
  Settings,
  Briefcase,
  Mic,
  GraduationCap,
  Sparkles,
  RefreshCcw,
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import Link from "next/link";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from 'firebase/firestore';
import type { Application, Candidate, Job } from '@/lib/definitions';
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { placeholderImages } from '@/lib/placeholder-images';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart";

function CircularProgress({ value, label }: { value: number; label: string }) {
    const circumference = 2 * Math.PI * 45; // 2 * pi * radius
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative h-28 w-28">
                <svg className="h-full w-full" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        className="stroke-current text-background/30"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                    />
                    {/* Progress circle */}
                    <circle
                        className="stroke-current text-primary"
                        strokeWidth="10"
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                    />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                    {value}%
                </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
    );
}


function ProfileGistCard({ candidate }: { candidate: Candidate | null }) {
    const profileComplete = useMemo(() => {
        if (!candidate) return 10;
        let score = 20; // Base score for existing
        if (candidate.currentRole) score += 20;
        if (candidate.phone) score += 20;
        if (candidate.rawResumeText) score += 40;
        return score;
    }, [candidate]);
    
    const skillReadiness = useMemo(() => {
        if (!candidate?.skills) return 10;
        try {
            // Example logic: score based on number of skills identified
            return Math.min(90, 10 + (candidate.skills?.length || 0) * 8);
        } catch {
            return 10;
        }
    }, [candidate]);

    const careerFit = useMemo(() => {
        // This is a placeholder as we don't have applications data here yet
        // In a real scenario, you'd pass applications to this component
        if (!candidate) return 15;
        // Mocking an average fit score
        return 75;
    }, [candidate]);


    return (
        <Card className="glassmorphism animate-in fade-in-0 slide-in-from-top-4 duration-500">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Just the Gist</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/50">
                            <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-1')?.imageUrl} data-ai-hint="person face" />
                            <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                                {candidate?.name?.charAt(0) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xl font-semibold">{candidate?.name || 'Candidate'}</p>
                        </div>
                    </div>
                     <Button asChild variant="outline">
                        <Link href={`/candidates/${candidate?.id}?role=Candidate`}>
                            View Profile
                        </Link>
                    </Button>
                </div>
                 <div className="flex items-center justify-around mt-6">
                    <CircularProgress value={profileComplete} label="Profile Complete" />
                    <CircularProgress value={skillReadiness} label="Skill Readiness" />
                    <CircularProgress value={careerFit} label="Career Fit" />
                 </div>
            </CardContent>
        </Card>
    );
}

function ActionIconButton({ title, icon: Icon, href, disabled = false, delay }: { title: string, icon: React.ElementType, href: string, disabled?: boolean, delay: number }) {
    const content = (
        <div className="flex flex-col items-center gap-2 text-center text-muted-foreground hover:text-foreground transition-colors duration-200">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20">
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <span className="text-xs font-semibold">{title}</span>
        </div>
    );
    
    const wrapperClasses = `animate-in fade-in-0 zoom-in-50 duration-500`;

    if (disabled) {
        return <div className={`${wrapperClasses} cursor-not-allowed opacity-50`} style={{animationDelay: `${delay}ms`}}>{content}</div>
    }

    return (
        <Link href={href} passHref className={wrapperClasses} style={{animationDelay: `${delay}ms`}}>
           {content}
        </Link>
    );
}


export default function CandidateDashboardPage() {
    const { firestore, user, isUserLoading } = useFirebase();
    const candidateEmail = user?.email;
    
    // In a real multi-tenant app, org ID would come from user profile. For demo, it's hardcoded.
    const organizationId = 'org-demo-owner-id';

    const candidateQuery = useMemoFirebase(() => {
        if (!firestore || !candidateEmail || isUserLoading) return null;
        return query(
            collection(firestore, `organizations/${organizationId}/candidates`),
            where('email', '==', candidateEmail)
        );
    }, [firestore, candidateEmail, isUserLoading, organizationId]);

    const { data: candidateData, isLoading: isLoadingCandidate } = useCollection<Candidate>(candidateQuery);
    const candidate = useMemo(() => candidateData?.[0], [candidateData]);
    
    const isLoading = isUserLoading || isLoadingCandidate;
    
    const jobTrendsData = [
      { name: 'Jan', value: 45 },
      { name: 'Feb', value: 60 },
      { name: 'Mar', value: 75 },
      { name: 'Apr', value: 70 },
      { name: 'May', value: 85 },
      { name: 'Jun', value: 95 },
    ];

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
    <div className="space-y-8">
        
        <PageHeader
            title={`Hello, ${user?.displayName?.split(' ')[0] || 'Candidate'}!`}
            description="Welcome to your personal career portal."
        />
        
        <ProfileGistCard candidate={candidate || null} />

        <div className="flex items-center justify-around">
            <ActionIconButton title="Chat" icon={MessageSquare} href="/emails?role=Candidate" delay={100} />
            <ActionIconButton title="TorchMyResume" icon={FileText} href="/candidate-portal?role=Candidate" delay={200} />
            <ActionIconButton title="Mock Interview" icon={GraduationCap} href="/interviews?role=Candidate" delay={300} />
            <ActionIconButton title="Skill-set Finder" icon={Sparkles} href="#" disabled delay={400} />
        </div>

       <div className="grid gap-6 md:grid-cols-2">
         <Card className="glassmorphism transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-500">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Trending News</CardTitle>
            <RefreshCcw className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <img src={placeholderImages.find(p => p.id === 'news-1')?.imageUrl} alt="News" className="w-24 h-24 rounded-lg object-cover" data-ai-hint="news article"/>
                    <div>
                        <h4 className="font-semibold">Implementation of labour codes, a watershed</h4>
                        <p className="text-xs text-muted-foreground">The new set of labour codes will likely be implemented in the next few months...</p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glassmorphism transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-600">
          <CardHeader>
            <CardTitle>Job Trends</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="font-semibold">Software Engineer</p>
             <div className="h-[120px] w-full mt-2">
                <ChartContainer config={{}} className="h-full w-full">
                    <BarChart data={jobTrendsData} margin={{ top: 5, right: 0, left: -20, bottom: -10 }}>
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ChartContainer>
             </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="space-y-8">
        <Skeleton className="h-64 w-full" />
        <div className="flex items-center justify-around">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>
            ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
    </div>
  )
}
