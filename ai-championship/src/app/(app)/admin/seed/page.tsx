'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useFirebase } from '@/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes'];
const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Remote'];
const companies = ['TechCorp', 'InnovateLabs', 'DataDrive', 'CloudScale', 'AI Solutions', 'DevHub', 'CodeCraft', 'FutureTech', 'SmartSystems', 'DigitalWave'];
const jobTitles = ['Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Engineer', 'DevOps Engineer'];
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'Rowan'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomItems = <T,>(arr: T[], count: number): T[] => [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
const randomDate = (start: Date, end: Date): string => 
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();

export default function SeedPage() {
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const seedData = async () => {
    if (!firestore) return;
    setLoading(true);
    setLog([]);

    try {
      addLog('Creating 10 organizations...');
      const orgIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        const orgId = `org-${Date.now()}-${i}`;
        await setDoc(doc(firestore, 'organizations', orgId), {
          name: companies[i],
          logoUrl: `https://ui-avatars.com/api/?name=${companies[i]}&background=random`,
          about: `${companies[i]} is a leading tech company.`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        orgIds.push(orgId);
      }
      addLog('✅ Organizations created');

      addLog('Creating 30 users...');
      const userIds: string[] = [];
      
      for (let i = 0; i < 10; i++) {
        const userId = `user-employer-${Date.now()}-${i}`;
        const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
        await setDoc(doc(firestore, 'users', userId), {
          email: `employer${i}@${companies[i].toLowerCase()}.com`,
          displayName: name,
          role: 'Employer',
          organizationId: orgIds[i],
          avatarUrl: `https://ui-avatars.com/api/?name=${name}`,
          createdAt: new Date().toISOString(),
        });
        userIds.push(userId);
      }

      for (let i = 0; i < 20; i++) {
        const userId = `user-candidate-${Date.now()}-${i}`;
        const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
        await setDoc(doc(firestore, 'users', userId), {
          email: `candidate${i}@example.com`,
          displayName: name,
          role: 'Candidate',
          avatarUrl: `https://ui-avatars.com/api/?name=${name}`,
          profileVisibility: Math.random() > 0.3 ? 'public' : 'private',
          currentRole: randomItem(jobTitles),
          location: randomItem(locations),
          skills: randomItems(skills, 4),
          yearsOfExperience: Math.floor(Math.random() * 10) + 1,
          createdAt: new Date().toISOString(),
        });
        userIds.push(userId);
      }
      addLog('✅ Users created');

      addLog('Creating 30 jobs...');
      for (const orgId of orgIds) {
        for (let i = 0; i < 3; i++) {
          await addDoc(collection(firestore, 'organizations', orgId, 'jobs'), {
            title: randomItem(jobTitles),
            department: 'Engineering',
            location: randomItem(locations),
            employmentType: 'Full-time',
            experienceLevel: randomItem(['Mid', 'Senior']),
            salaryMin: 100000,
            salaryMax: 180000,
            description: 'Join our team!',
            requirements: randomItems(skills, 4),
            status: 'open',
            createdAt: randomDate(new Date(2024, 0, 1), new Date()),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      addLog('✅ Jobs created');

      addLog('Creating 15 posts...');
      const postTitles = ['Just landed my dream job!', 'AWS Certification', 'Built my first app', 'Interview tips', 'My tech journey'];
      for (let i = 0; i < 15; i++) {
        await addDoc(collection(firestore, 'posts'), {
          authorId: randomItem(userIds),
          authorName: `User ${i}`,
          authorRole: 'Candidate',
          type: randomItem(['achievement', 'project', 'article']),
          title: randomItem(postTitles),
          content: 'Sharing my experience with the community.',
          likes: [],
          comments: [],
          createdAt: randomDate(new Date(2024, 0, 1), new Date()),
          updatedAt: new Date().toISOString(),
        });
      }
      addLog('✅ Posts created');

      addLog('🎉 All done! Refresh your app.');
    } catch (error) { 
      addLog(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Seed Mock Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Click to populate database with mock data.
          </p>
          
          <Button onClick={seedData} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Database'
            )}
          </Button>

          {log.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Progress:</h3>
              <div className="space-y-1 font-mono text-sm">
                {log.map((msg, i) => (
                  <div key={i}>{msg}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
