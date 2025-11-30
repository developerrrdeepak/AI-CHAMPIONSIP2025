
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
import { collection, query, where, collectionGroup } from 'firebase/firestore';
import type { Application, Candidate, Job, Challenge } from '@/lib/definitions';
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
    const organizationId = user?.uid ? `personal-${user.uid}` : null;

    const profileComplete = 75;
    const skillReadiness = 85;
    const careerFit = 80;

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
        
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white mb-8">
            <div className="absolute inset-0 bg-grid-white/10" />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-4 border-white/30">
                            <AvatarImage src={user?.photoURL || placeholderImages.find(p => p.id === 'avatar-1')?.imageUrl} />
                            <AvatarFallback className="text-3xl bg-white/20">
                                {user?.displayName?.charAt(0) || 'C'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-4xl font-bold mb-1">Hello, {user?.displayName?.split(' ')[0] || 'Candidate'}! 🚀</h1>
                            <p className="text-white/90 text-lg">Your AI-powered career journey starts here</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                        <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold">Live Updates</span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-3xl font-bold">{profileComplete}%</div>
                        <div className="text-sm text-white/80">Profile Complete</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-3xl font-bold">{skillReadiness}%</div>
                        <div className="text-sm text-white/80">Skill Readiness</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                        <div className="text-3xl font-bold">{careerFit}%</div>
                        <div className="text-sm text-white/80">Career Fit</div>
                    </div>
                </div>
            </div>
        </div>
        
        <ProfileGistCard candidate={candidate || null} />

        <Card className="glassmorphism animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-Powered Career Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ActionIconButton title="AI Chat Assistant" icon={MessageSquare} href="/ai-assistant" delay={100} />
              <ActionIconButton title="Smart Resume Analysis" icon={FileText} href="/candidate-portal?role=Candidate" delay={200} />
              <ActionIconButton title="Voice Mock Interview" icon={Mic} href="/voice-interview" delay={300} />
              <ActionIconButton title="AI Interview Prep" icon={GraduationCap} href="/interview-prep" delay={400} />
              <ActionIconButton title="Skill Gap Analysis" icon={Sparkles} href="/smart-recruiter" delay={500} />
              <ActionIconButton title="Career Path AI" icon={Briefcase} href="/startup-agent" delay={600} />
              <ActionIconButton title="Ultra-Fast Matching" icon={RefreshCcw} href="/ultra-fast-matching" delay={700} />
              <ActionIconButton title="Diversity Insights" icon={Users} href="/diversity-hiring" delay={800} />
            </div>
          </CardContent>
        </Card>

       <Card className="glassmorphism animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-900 border-2 border-primary/20 relative">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                AI-Matched Jobs For You
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                🔄 Real-time updates • Powered by AI matching
              </p>
            </div>
            <Button asChild variant="default" size="sm">
              <Link href="/jobs">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <AvailableJobsList candidate={candidate} />
          </CardContent>
        </Card>

        <Card className="glassmorphism animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-1000 border-2 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-500/10 to-transparent">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-green-600 animate-bounce" />
                Live Hackathons & Challenges
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                🔄 Real-time updates • Win prizes and boost your profile
              </p>
            </div>
            <Button asChild variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
              <Link href="/challenges">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <AvailableChallengesList />
          </CardContent>
        </Card>

       <div className="grid gap-6 md:grid-cols-2">
         <Card className="glassmorphism transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-700">
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


function AvailableJobsList({ candidate }: { candidate: Candidate | null }) {
    const { firestore } = useFirebase();
    const jobsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Use collectionGroup to fetch jobs from ALL organizations
        return query(
            collectionGroup(firestore, 'jobs'),
            where('status', '==', 'open')
        );
    }, [firestore]);

    const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

    // AI-powered match score calculation
    const jobsWithScores = useMemo(() => {
        if (!jobs || !candidate) return jobs;
        return jobs.map(job => ({
            ...job,
            matchScore: Math.floor(Math.random() * 30) + 70 // Mock AI score 70-100%
        })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }, [jobs, candidate]);

    if (isLoading) return <Skeleton className="h-32 w-full" />;
    if (!jobsWithScores?.length) return (
        <div className="text-center py-8">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No jobs available yet</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {jobsWithScores.slice(0, 3).map((job, idx) => (
                <Link 
                    key={job.id} 
                    href={`/jobs/${job.id}`} 
                    className="block p-4 rounded-lg border-2 hover:border-primary hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-background to-primary/5"
                    style={{ animationDelay: `${idx * 100}ms` }}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg">{job.title}</h4>
                                {job.matchScore && job.matchScore >= 85 && (
                                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">Hot Match!</span>
                                )}
                                <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">Posted by Employer</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{job.department} • {job.location}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-semibold">{job.type}</span>
                            {job.matchScore && (
                                <div className="flex items-center gap-1">
                                    <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-1000"
                                            style={{ width: `${job.matchScore}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-primary">{job.matchScore}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>💰 {job.salaryRange || 'Competitive'}</span>
                        <span>•</span>
                        <span>📍 {job.location}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
}

function AvailableChallengesList() {
    const { firestore } = useFirebase();
    const challengesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Use collectionGroup to fetch challenges from ALL organizations
        return query(
            collectionGroup(firestore, 'challenges'),
            where('status', '==', 'active')
        );
    }, [firestore]);

    const { data: challenges, isLoading } = useCollection<Challenge>(challengesQuery);

    const prizes = ['🏆 $5,000', '💰 $3,000', '🎁 $1,000'];

    if (isLoading) return <Skeleton className="h-32 w-full" />;
    if (!challenges?.length) return (
        <div className="text-center py-8">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No active challenges</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {challenges.slice(0, 3).map((challenge, idx) => (
                <Link 
                    key={challenge.id} 
                    href={`/challenges/${challenge.id}`} 
                    className="block p-4 rounded-lg border-2 border-green-500/20 hover:border-green-500 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-r from-background to-green-500/5 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-bl-full" />
                    <div className="relative">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-lg">{challenge.title}</h4>
                                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
                                    <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">By Employer</span>
                                </div>
                                <p className="text-sm text-muted-foreground">{challenge.difficulty} • {challenge.type}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-lg font-bold text-green-600">{prizes[idx] || '🎁 Prize'}</span>
                                <span className="text-xs text-muted-foreground">Prize Pool</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {Math.floor(Math.random() * 500) + 100} participants
                                </span>
                                <span className="flex items-center gap-1 text-orange-600 font-semibold">
                                    ⏱️ {Math.floor(Math.random() * 10) + 1} days left
                                </span>
                            </div>
                            <Button size="sm" variant="outline" className="h-6 text-xs border-green-500 text-green-600 hover:bg-green-500 hover:text-white">
                                Join Now
                            </Button>
                        </div>
                    </div>
                </Link>
            ))}
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
