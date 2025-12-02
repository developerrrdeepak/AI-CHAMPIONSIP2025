
'use client';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Star, Search, Bookmark, Mail, Sparkles, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { DataTable } from '@/components/data-table';
import type { Candidate, Application, Job } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { placeholderImages } from '@/lib/placeholder-images';
import { Badge } from '@/components/ui/badge';
import { useUserContext } from '../layout';
import { MOCK_CANDIDATES } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type CandidateWithAppInfo = Candidate & {
  jobTitle?: string;
  stage?: string;
  fitScore?: number;
  isShortlisted?: boolean;
};

const columns: {
  accessorKey: keyof CandidateWithAppInfo;
  header: string;
  cell?: ({ row }: { row: { original: CandidateWithAppInfo } }) => JSX.Element;
  enableSorting?: boolean;
}[] = [
  {
    accessorKey: 'name',
    header: 'Candidate',
    enableSorting: true,
    cell: ({ row }) => (
        <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
                <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-2')?.imageUrl} data-ai-hint="person face" />
                <AvatarFallback>{row.original.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <div className="font-semibold">{row.original.name}</div>
                <div className="text-sm text-muted-foreground">{row.original.email}</div>
            </div>
        </div>
    ),
  },
  {
    accessorKey: 'jobTitle',
    header: 'Applied For',
    enableSorting: true,
    cell: ({ row }) => row.original.jobTitle ? row.original.jobTitle : <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: 'stage',
    header: 'Current Stage',
    cell: ({ row }) => {
        if (!row.original.stage) return <span className="text-muted-foreground">-</span>;
        return <Badge variant="secondary">{row.original.stage}</Badge>;
    },
  },
  {
    accessorKey: 'fitScore',
    header: 'Fit Score',
    enableSorting: true,
    cell: ({ row }) => (row.original.fitScore ? <div className="flex items-center gap-1 font-semibold">{row.original.fitScore} <Star className="w-4 h-4 text-amber-400 fill-amber-400" /></div> : <span className="text-muted-foreground">-</span>),
  },
  {
      accessorKey: 'updatedAt',
      header: 'Last Updated',
      enableSorting: true,
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
  }
];

export default function CandidatesPage() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { organizationId, isUserLoading, userId, displayName, role } = useUserContext();
    const { toast } = useToast();

    const [mounted, setMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [searchTerm, setSearchTerm] = useState('');
    const [skillFilter, setSkillFilter] = useState('');
    const [experienceFilter, setExperienceFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [showShortlisted, setShowShortlisted] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithAppInfo | null>(null);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedJobForInvite, setSelectedJobForInvite] = useState('');
    
    useEffect(() => {
      const t = setTimeout(() => setMounted(true), 10);
      return () => clearTimeout(t);
    }, []);

    // Query all public candidate profiles from users collection
    const candidatesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'users'),
            where('role', '==', 'Candidate'),
            orderBy('updatedAt', 'desc')
        );
    }, [firestore]);

    const { data: allUsers, isLoading: isLoadingCandidates } = useCollection<any>(candidatesQuery);
    
    // Filter to only show public profiles, fallback to mock data
    const candidates = useMemo(() => {
        if (!allUsers || allUsers.length === 0) {
            // Use mock data if no real data
            return MOCK_CANDIDATES.map(c => ({
                ...c,
                displayName: c.name,
                profileVisibility: 'public',
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            }));
        }
        return allUsers.filter(user => user.profileVisibility === 'public' || !user.profileVisibility);
    }, [allUsers]);

    const [applicationsByCandidate, setApplicationsByCandidate] = useState<Map<string, Application>>(new Map());
    const [isLoadingApps, setIsLoadingApps] = useState(true);

     useEffect(() => {
        if (!firestore || !organizationId) {
            setIsLoadingApps(false);
            return;
        };

        const fetchApplications = async () => {
            setIsLoadingApps(true);
            const newAppMap = new Map<string, Application>();
            
            const appsQuery = query(
                collection(firestore, `organizations/${organizationId}/applications`)
            );

            try {
                const querySnapshot = await getDocs(appsQuery);
                querySnapshot.forEach(doc => {
                    const app = { ...doc.data(), id: doc.id } as Application;
                    const existingApp = newAppMap.get(app.candidateId);
                     if (!existingApp || new Date(app.updatedAt) > new Date(existingApp.updatedAt)) {
                        newAppMap.set(app.candidateId, app);
                    }
                });
            } catch (e) {
                console.error("Error fetching applications for candidates:", e);
            }
            
            setApplicationsByCandidate(newAppMap);
            setIsLoadingApps(false);
        };

        fetchApplications();

    }, [firestore, organizationId]);


    const jobsQuery = useMemoFirebase(() => {
        if (!organizationId || !firestore) return null;
        return query(collection(firestore, `organizations/${organizationId}/jobs`));
    }, [organizationId, firestore]);

    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
    
    const candidatesWithInfo: CandidateWithAppInfo[] = useMemo(() => {
        if (!candidates) return [];
        if (!jobs && isLoadingJobs) return candidates.map(c => ({ ...c, isShortlisted: false })); 

        const jobsMap = new Map(jobs?.map(job => [job.id, job]));

        return candidates.map(candidate => {
            const application = applicationsByCandidate.get(candidate.id);
            const job = application ? jobsMap.get(application.jobId) : undefined;
            return {
                ...candidate,
                name: candidate.displayName || candidate.name || 'Unknown',
                email: candidate.email || '',
                currentRole: candidate.currentRole || candidate.role || '',
                location: candidate.location || '',
                skills: candidate.skills || [],
                yearsOfExperience: candidate.yearsOfExperience || 0,
                jobTitle: job?.title,
                stage: application?.stage,
                fitScore: application?.fitScore,
                isShortlisted: candidate.isShortlisted || false,
                updatedAt: candidate.updatedAt || candidate.createdAt || new Date().toISOString(),
            };
        });
    }, [candidates, applicationsByCandidate, jobs, isLoadingJobs]);

    const filteredCandidates = useMemo(() => {
        return candidatesWithInfo.filter(candidate => {
            const matchesSearch = searchTerm.toLowerCase() 
                ? candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  candidate.currentRole?.toLowerCase().includes(searchTerm.toLowerCase())
                : true;
            
            const matchesSkill = skillFilter
                ? candidate.skills?.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()))
                : true;
            
            const matchesExperience = experienceFilter !== 'all'
                ? (() => {
                    const exp = candidate.yearsOfExperience || 0;
                    if (experienceFilter === '0-2') return exp <= 2;
                    if (experienceFilter === '3-5') return exp >= 3 && exp <= 5;
                    if (experienceFilter === '6-10') return exp >= 6 && exp <= 10;
                    if (experienceFilter === '10plus') return exp > 10;
                    return true;
                  })()
                : true;
            
            const matchesLocation = locationFilter !== 'all'
                ? candidate.location?.toLowerCase().includes(locationFilter.toLowerCase())
                : true;
            
            const matchesShortlist = showShortlisted ? candidate.isShortlisted : true;
            
            return matchesSearch && matchesSkill && matchesExperience && matchesLocation && matchesShortlist;
        });
    }, [candidatesWithInfo, searchTerm, skillFilter, experienceFilter, locationFilter, showShortlisted]);

    const topMatchedCandidates = useMemo(() => {
        return [...filteredCandidates]
            .filter(c => c.fitScore)
            .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
            .slice(0, 10);
    }, [filteredCandidates]);

    const allSkills = useMemo(() => {
        const skills = new Set<string>();
        candidates?.forEach(c => c.skills?.forEach(s => skills.add(s)));
        return Array.from(skills);
    }, [candidates]);

    const allLocations = useMemo(() => {
        const locations = new Set<string>();
        candidates?.forEach(c => c.location && locations.add(c.location));
        return Array.from(locations);
    }, [candidates]);

    const handleShortlist = async (candidateId: string, isCurrentlyShortlisted: boolean) => {
        if (!firestore) return;
        try {
            await updateDoc(doc(firestore, 'users', candidateId), {
                isShortlisted: !isCurrentlyShortlisted,
                updatedAt: new Date().toISOString(),
            });
            toast({
                title: isCurrentlyShortlisted ? "Removed from shortlist" : "Added to shortlist",
                description: isCurrentlyShortlisted ? "Candidate removed from your shortlist." : "Candidate added to your shortlist.",
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update shortlist.",
            });
        }
    };

    const handleInviteToApply = async () => {
        if (!firestore || !organizationId || !selectedCandidate || !selectedJobForInvite) return;
        try {
            // Add notification for candidate
            await updateDoc(doc(firestore, `users`, selectedCandidate.id), {
                notifications: arrayUnion({
                    id: `invite-${Date.now()}`,
                    type: 'job_invite',
                    message: `You've been invited to apply for ${jobs?.find(j => j.id === selectedJobForInvite)?.title}`,
                    jobId: selectedJobForInvite,
                    timestamp: new Date().toISOString(),
                    read: false,
                })
            });
            toast({
                title: "Invitation sent",
                description: `${selectedCandidate.name} has been invited to apply.`,
            });
            setInviteDialogOpen(false);
            setSelectedCandidate(null);
            setSelectedJobForInvite('');
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send invitation.",
            });
        }
    };

    const handleFindSimilar = (candidate: CandidateWithAppInfo) => {
        // Set filters based on candidate profile
        if (candidate.skills && candidate.skills.length > 0) {
            setSkillFilter(candidate.skills[0]);
        }
        if (candidate.yearsOfExperience) {
            const exp = candidate.yearsOfExperience;
            if (exp <= 2) setExperienceFilter('0-2');
            else if (exp <= 5) setExperienceFilter('3-5');
            else if (exp <= 10) setExperienceFilter('6-10');
            else setExperienceFilter('10+');
        }
        if (candidate.location) {
            setLocationFilter(candidate.location);
        }
        toast({
            title: "Filters applied",
            description: `Showing candidates similar to ${candidate.name}`,
        });
    };


    const handleRowClick = (row: CandidateWithAppInfo) => {
        router.push(`/candidates/${row.id}`);
    };
    
    const isLoading = isUserLoading || isLoadingCandidates || isLoadingApps || isLoadingJobs;

  return (
    <div className={`transform transition-all duration-300 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <PageHeader
        title="Search Candidates"
        description="Find and connect with top talent using AI-powered search."
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}>
            {viewMode === 'cards' ? 'Table View' : 'Card View'}
          </Button>
          <Button asChild>
            <Link href="/candidates/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-1/4 lg:min-w-[280px] space-y-4">
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Skills</Label>
                <Select value={skillFilter || 'all-skills'} onValueChange={(v) => setSkillFilter(v === 'all-skills' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Skills" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-skills">All Skills</SelectItem>
                    {allSkills.map(skill => <SelectItem key={skill} value={skill}>{skill}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Experience</Label>
                <Select value={experienceFilter || 'all'} onValueChange={setExperienceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Experience</SelectItem>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10plus">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Location</Label>
                <Select value={locationFilter || 'all'} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {allLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="shortlisted">Shortlisted Only</Label>
                <input
                  id="shortlisted"
                  type="checkbox"
                  checked={showShortlisted}
                  onChange={(e) => setShowShortlisted(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm('');
                  setSkillFilter('');
                  setExperienceFilter('all');
                  setLocationFilter('all');
                  setShowShortlisted(false);
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* Top 10 Matched */}
          <Card className="glassmorphism">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Top 10 Matches
              </CardTitle>
              <CardDescription>AI-ranked candidates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {topMatchedCandidates.slice(0, 5).map((candidate, idx) => (
                <div
                  key={candidate.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
                >
                  <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0">
                    {idx + 1}
                  </Badge>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-2')?.imageUrl} />
                    <AvatarFallback>{candidate.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{candidate.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{candidate.currentRole}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">{candidate.fitScore}</Badge>
                </div>
              ))}
              {topMatchedCandidates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No scored candidates yet</p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCandidates.map((candidate, i) => (
                <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={placeholderImages.find(p => p.id === 'avatar-2')?.imageUrl} />
                        <AvatarFallback>{candidate.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate cursor-pointer hover:text-primary" onClick={() => router.push(`/candidates/${candidate.id}`)}>
                          {candidate.name}
                        </CardTitle>
                        <CardDescription className="text-sm truncate">{candidate.currentRole}</CardDescription>
                      </div>
                      {candidate.fitScore && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {candidate.fitScore} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    {candidate.location && <p className="text-sm">📍 {candidate.location}</p>}
                    {candidate.yearsOfExperience && <p className="text-sm">💼 {candidate.yearsOfExperience} years exp</p>}
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {candidate.skills.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {candidate.skills.length > 3 && <Badge variant="outline" className="text-xs">+{candidate.skills.length - 3}</Badge>}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.push(`/public-profile/${candidate.id}`)}
                      title="View Profile"
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleShortlist(candidate.id, candidate.isShortlisted || false)}
                    >
                      <Bookmark className={`h-4 w-4 ${candidate.isShortlisted ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        if (!firestore || !userId) return;
                        try {
                          const convRef = await addDoc(collection(firestore, 'conversations'), {
                            participants: [
                              { id: userId, name: displayName, role: role },
                              { id: candidate.id, name: candidate.name, role: 'Candidate' }
                            ],
                            participantIds: [userId, candidate.id],
                            lastMessage: '',
                            lastMessageAt: new Date().toISOString(),
                            unreadCount: {},
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                          router.push(`/messages?convId=${convRef.id}`);
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      title="Send Message"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={async () => {
                        if (!firestore || !userId) return;
                        try {
                          await addDoc(collection(firestore, 'connections'), {
                            requesterId: userId,
                            requesterName: displayName,
                            requesterRole: role,
                            receiverId: candidate.id,
                            receiverName: candidate.name,
                            receiverRole: 'Candidate',
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          });
                          await updateDoc(doc(firestore, 'users', candidate.id), {
                            notifications: arrayUnion({
                              id: `conn-req-${Date.now()}`,
                              type: 'connection_request',
                              message: `${displayName} sent you a connection request`,
                              timestamp: new Date().toISOString(),
                              read: false,
                            })
                          });
                          toast({
                            title: 'Connection request sent',
                            description: `Request sent to ${candidate.name}`,
                          });
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      title="Connect"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
              <DataTable columns={columns} data={filteredCandidates} searchKey="name" onRowClick={handleRowClick} />
            </div>
          )}
          
          {filteredCandidates.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No candidates match your filters.</p>
              <Button variant="link" onClick={() => {
                setSearchTerm('');
                setSkillFilter('');
                setExperienceFilter('all');
                setLocationFilter('all');
                setShowShortlisted(false);
              }}>
                Clear all filters
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Invite to Apply Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite to Apply</DialogTitle>
            <DialogDescription>
              Invite {selectedCandidate?.name} to apply for a job opening.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Job</Label>
            <Select value={selectedJobForInvite} onValueChange={setSelectedJobForInvite}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs?.filter(j => j.status === 'open').map(job => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInviteToApply} disabled={!selectedJobForInvite}>
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
