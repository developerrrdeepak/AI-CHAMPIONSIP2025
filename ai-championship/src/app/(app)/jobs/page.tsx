
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table';
import type { Job } from '@/lib/definitions';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useJobs } from '@/hooks/use-jobs';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, MapPin, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserContext } from '../layout';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useToast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

const getStatusPillClass = (status: string) => {
    switch (status) {
        case 'open':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'paused':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'closed':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        default:
            return 'bg-secondary text-secondary-foreground border-border';
    }
};

const columns: {
  accessorKey: keyof Job;
  header: string;
  cell?: ({ row }: { row: { original: Job } }) => JSX.Element;
  enableSorting?: boolean;
}[] = [
  {
    accessorKey: 'title',
    header: 'Title',
    enableSorting: true,
    cell: ({ row }) => <div className="font-semibold text-foreground">{row.original.title}</div>,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const pillClass = getStatusPillClass(row.original.status);
      return <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border capitalize ${pillClass}`}>{row.original.status}</div>;
    },
  },
  {
    accessorKey: 'numberOfOpenings',
    header: 'Openings',
    enableSorting: true,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created At',
    enableSorting: true,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
];

function JobCard({ job, delay, matchScore }: { job: Job, delay: number, matchScore?: number }) {
  const router = useRouter();
  const { role } = useUserContext();

  return (
    <Card 
        className={cn(
            "flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
            "animate-in fade-in-0 slide-in-from-top-4",
            role === 'Candidate' ? 'glassmorphism' : 'bg-background hover:border-border/80'
        )}
        style={{ animationDelay: `${delay}ms`}}
    >
      <CardHeader className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold hover:text-primary cursor-pointer" onClick={() => router.push(`/jobs/${job.id}?role=${role}&orgId=${job.organizationId}`)}>{job.title}</CardTitle>
            <CardDescription className="text-sm">{job.department}</CardDescription>
          </div>
          {matchScore && matchScore > 0 && (
            <Badge variant={matchScore >= 80 ? "default" : matchScore >= 60 ? "secondary" : "outline"} className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {matchScore}% Match
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 text-sm p-5 pt-0">
        <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>{job.employmentType} &middot; {job.seniorityLevel}</span>
        </div>
         <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{job.isRemote ? 'Remote' : `${job.locationCity}, ${job.locationCountry}`}</span>
        </div>
         <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>${job.salaryRangeMin ? job.salaryRangeMin / 1000 : 'N/A'}k - ${job.salaryRangeMax ? job.salaryRangeMax / 1000 : 'N/A'}k</span>
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Button className="w-full" asChild>
            <Link href={`/jobs/${job.id}?role=${role}&orgId=${job.organizationId}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

type FilterProps = {
    jobs: Job[];
    searchTerm: string;
    isRemote: boolean;
    location: string;
    employmentType: string;
    onSearchTermChange: (value: string) => void;
    onIsRemoteChange: (value: boolean) => void;
    onLocationChange: (value: string) => void;
    onEmploymentTypeChange: (value: string) => void;
}

function Filters({ 
    jobs,
    searchTerm,
    isRemote,
    location,
    employmentType,
    onSearchTermChange,
    onIsRemoteChange,
    onLocationChange,
    onEmploymentTypeChange
}: FilterProps) {

    const locations = useMemo(() => [...new Set(jobs.map(j => j.locationCity).filter(Boolean))], [jobs]);
    const employmentTypes = useMemo(() => [...new Set(jobs.map(j => j.employmentType).filter(Boolean))], [jobs]);

    return (
        <aside className="w-full lg:w-1/4 lg:min-w-[280px] space-y-6">
            <Card className="glassmorphism p-4">
                 <h3 className="text-lg font-semibold mb-4">Filters</h3>
                 <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search jobs..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="remote-only">Work from home</Label>
                        <Switch id="remote-only" checked={isRemote} onCheckedChange={onIsRemoteChange} />
                    </div>
                     <div>
                        <Label>Location</Label>
                        <Select value={location} onValueChange={onLocationChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-locations">All Locations</SelectItem>
                                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Employment Type</Label>
                        <Select value={employmentType} onValueChange={onEmploymentTypeChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-types">All Types</SelectItem>
                                {employmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
            </Card>
        </aside>
    )
}


export default function JobsPage() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { role, organizationId, isUserLoading, userId } = useUserContext();

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }, []);

    const isCandidate = role === 'Candidate';

    const { jobs, isLoading: areJobsLoading } = useJobs(role, organizationId || undefined);
    
    // State for filters is now in the parent component
    const [searchTerm, setSearchTerm] = useState('');
    const [isRemote, setIsRemote] = useState(false);
    const [location, setLocation] = useState('all-locations');
    const [employmentType, setEmploymentType] = useState('all-types');
    const [aiMatching, setAiMatching] = useState(false);
    const [matchScores, setMatchScores] = useState<Map<string, number>>(new Map());
    const { toast } = useToast();
    
    const filteredJobs = useMemo(() => {
        if (!jobs) return [];
        let filtered = jobs.filter(job => {
            const searchTermMatch = searchTerm.toLowerCase() 
                ? job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.department.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            const remoteMatch = isRemote ? job.isRemote === true : true;
            const locationMatch = location !== 'all-locations' ? job.locationCity === location : true;
            const typeMatch = employmentType !== 'all-types' ? job.employmentType === employmentType : true;
            
            return searchTermMatch && remoteMatch && locationMatch && typeMatch;
        });
        
        // Sort by AI match score if available
        if (matchScores.size > 0) {
            filtered = filtered.sort((a, b) => (matchScores.get(b.id) || 0) - (matchScores.get(a.id) || 0));
        }
        
        return filtered;
    }, [jobs, searchTerm, isRemote, location, employmentType, matchScores]);
    
    const handleAIMatch = async () => {
        if (!firestore || !userId) {
            toast({
                variant: "destructive",
                title: "Not logged in",
                description: "Please log in to use AI matching",
            });
            return;
        }
        
        setAiMatching(true);
        try {
            // Get user profile
            const userDoc = await getDocs(query(collection(firestore, 'users'), where('id', '==', userId)));
            if (userDoc.empty) throw new Error('User not found');
            
            const userProfile = userDoc.docs[0].data();
            const userSkills = userProfile.skills || [];
            const userExperience = userProfile.yearsOfExperience || 0;
            
            const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyDCKcyhybchP32b7ZMbowQ_tbFiTyUPHdw');
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            
            const scores = new Map<string, number>();
            
            for (const job of jobs || []) {
                const prompt = `Rate the match between this candidate and job from 0-100.
                
Candidate: Skills: ${userSkills.join(', ')}, Experience: ${userExperience} years
                Job: ${job.title}, Required Skills: ${job.requiredSkills?.join(', ') || 'Not specified'}, Experience: ${job.experienceRequired || 'Not specified'}
                
Return ONLY a number between 0-100, nothing else.`;
                
                try {
                    const result = await model.generateContent(prompt);
                    const score = parseInt(result.response.text().trim());
                    if (!isNaN(score)) {
                        scores.set(job.id, score);
                    }
                } catch (err) {
                    console.error('Error scoring job:', job.id, err);
                }
            }
            
            setMatchScores(scores);
            toast({
                title: "AI Matching Complete",
                description: `Analyzed ${scores.size} jobs and ranked them by fit`,
            });
        } catch (error) {
            console.error('AI matching error:', error);
            toast({
                variant: "destructive",
                title: "AI Matching Failed",
                description: "Could not analyze job matches. Try again.",
            });
        } finally {
            setAiMatching(false);
        }
    };

    const isLoading = isUserLoading || areJobsLoading;


    const handleRowClick = (row: Job) => {
        router.push(`/jobs/${row.id}?role=${role || ''}&orgId=${row.organizationId}`);
    };
    
    const pageTitle = isCandidate ? "Find Your Next Opportunity" : "Jobs";
    const pageDescription = isCandidate ? "Browse and filter open positions." : "Manage your company's job postings.";

  if (isCandidate) {
    return (
       <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <PageHeader
            title={pageTitle}
            description={pageDescription}
        >
          <Button onClick={handleAIMatch} disabled={aiMatching}>
            <Sparkles className="mr-2 h-4 w-4" />
            {aiMatching ? 'AI Analyzing...' : 'AI Match Jobs'}
          </Button>
        </PageHeader>
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
            <Filters 
                jobs={jobs || []}
                searchTerm={searchTerm}
                isRemote={isRemote}
                location={location}
                employmentType={employmentType}
                onSearchTermChange={setSearchTerm}
                onIsRemoteChange={setIsRemote}
                onLocationChange={setLocation}
                onEmploymentTypeChange={setEmploymentType}
            />
            <main className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoading && [...Array(6)].map((_, i) => <Skeleton key={i} className="h-60"/>)}
                    {filteredJobs?.map((job, i) => <JobCard key={job.id} job={job} delay={i * 50} matchScore={matchScores.get(job.id)} />)}
                </div>
                 {filteredJobs?.length === 0 && !isLoading && (
                    <div className="text-muted-foreground col-span-full text-center py-10">
                        No jobs match your current filters. Try broadening your search!
                    </div>
                )}
            </main>
        </div>
       </div>
    )
  }

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <PageHeader
        title={pageTitle}
        description={pageDescription}
      >
        <Button asChild>
          <Link href="/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Job
          </Link>
        </Button>
      </PageHeader>
      <div className="rounded-xl border bg-card text-card-foreground shadow-sm mt-6 animate-in fade-in-0 duration-500">
        <DataTable columns={columns} data={jobs || []} searchKey="title" onRowClick={handleRowClick} />
      </div>
    </div>
  );
}
