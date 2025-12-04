
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Next.js', 'Vue.js', 'Angular', 'Go', 'Rust'];
const locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA', 'Remote', 'London, UK', 'Berlin, Germany', 'Toronto, Canada', 'Singapore'];
const companies = ['TechCorp', 'InnovateLabs', 'DataDrive', 'CloudScale', 'AI Solutions', 'DevHub', 'CodeCraft', 'FutureTech', 'SmartSystems', 'DigitalWave'];
const departments = ['Engineering', 'Product', 'Design', 'Data Science', 'DevOps', 'Security', 'Mobile', 'Backend', 'Frontend', 'Full Stack'];
const jobTitles = ['Senior Software Engineer', 'Full Stack Developer', 'Frontend Developer', 'Backend Engineer', 'DevOps Engineer', 'Data Scientist', 'ML Engineer', 'Product Manager', 'UI/UX Designer', 'Security Engineer'];
const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'Rowan', 'Jamie', 'Drew', 'Cameron', 'Skylar', 'Reese'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

async function seedOrganizations() {
  console.log('Seeding organizations...');
  const orgIds: string[] = [];
  
  for (let i = 0; i < 10; i++) {
    const orgId = `org-${Date.now()}-${i}`;
    await setDoc(doc(db, 'organizations', orgId), {
      name: companies[i],
      logoUrl: `https://ui-avatars.com/api/?name=${companies[i]}&background=random`,
      about: `${companies[i]} is a leading technology company focused on innovation and excellence.`,
      websiteUrl: `https://${companies[i].toLowerCase()}.com`,
      linkedinUrl: `https://linkedin.com/company/${companies[i].toLowerCase()}`,
      primaryBrandColor: '243 45% 55%',
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
      updatedAt: new Date().toISOString(),
    });
    orgIds.push(orgId);
  }
  
  return orgIds;
}

async function seedUsers(orgIds: string[]) {
  console.log('Seeding users...');
  const userIds: string[] = [];
  
  for (let i = 0; i < 10; i++) {
    const userId = `user-employer-${Date.now()}-${i}`;
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    await setDoc(doc(db, 'users', userId), {
      email: `employer${i}@${companies[i].toLowerCase()}.com`,
      displayName: name,
      role: 'Employer',
      organizationId: orgIds[i],
      avatarUrl: `https://ui-avatars.com/api/?name=${name}`,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
    });
    userIds.push(userId);
  }
  
  for (let i = 0; i < 20; i++) {
    const userId = `user-candidate-${Date.now()}-${i}`;
    const name = `${randomItem(firstNames)} ${randomItem(lastNames)}`;
    const userSkills = randomItems(skills, Math.floor(Math.random() * 5) + 3);
    await setDoc(doc(db, 'users', userId), {
      email: `candidate${i}@example.com`,
      displayName: name,
      role: 'Candidate',
      avatarUrl: `https://ui-avatars.com/api/?name=${name}`,
      photoURL: `https://ui-avatars.com/api/?name=${name}`,
      profileVisibility: Math.random() > 0.3 ? 'public' : 'private',
      currentRole: randomItem(jobTitles),
      location: randomItem(locations),
      skills: userSkills,
      yearsOfExperience: Math.floor(Math.random() * 10) + 1,
      about: `Passionate ${randomItem(jobTitles).toLowerCase()} with ${Math.floor(Math.random() * 10) + 1} years of experience.`,
      resumeUrl: `https://example.com/resumes/${userId}.pdf`,
      linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
      githubUrl: `https://github.com/${name.toLowerCase().replace(' ', '')}`,
      portfolioUrl: `https://${name.toLowerCase().replace(' ', '')}.dev`,
      createdAt: randomDate(new Date(2023, 0, 1), new Date()),
    });
    userIds.push(userId);
  }
  
  return userIds;
}

async function seedJobs(orgIds: string[]) {
  console.log('Seeding jobs...');
  
  for (const orgId of orgIds) {
    for (let i = 0; i < 3; i++) {
      await addDoc(collection(db, 'organizations', orgId, 'jobs'), {
        title: randomItem(jobTitles),
        department: randomItem(departments),
        location: randomItem(locations),
        employmentType: randomItem(['Full-time', 'Part-time', 'Contract']),
        experienceLevel: randomItem(['Entry', 'Mid', 'Senior', 'Lead']),
        salaryMin: 80000 + Math.floor(Math.random() * 50000),
        salaryMax: 150000 + Math.floor(Math.random() * 100000),
        description: 'We are looking for a talented professional to join our team.',
        requirements: randomItems(skills, 5),
        responsibilities: ['Build scalable applications', 'Collaborate with team', 'Write clean code'],
        benefits: ['Health insurance', '401k', 'Remote work', 'Unlimited PTO'],
        status: randomItem(['open', 'open', 'open', 'closed']),
        postedBy: `user-employer-${Date.now()}-${orgIds.indexOf(orgId)}`,
        createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

async function seedApplications(orgIds: string[], userIds: string[]) {
  console.log('Seeding applications...');
  const candidateIds = userIds.filter(id => id.includes('candidate'));
  
  for (const orgId of orgIds) {
    const jobsSnapshot = await getDocs(collection(db, 'organizations', orgId, 'jobs'));
    
    for (const jobDoc of jobsSnapshot.docs) {
      const numApplicants = Math.floor(Math.random() * 8) + 3;
      const applicants = randomItems(candidateIds, numApplicants);
      
      for (const candidateId of applicants) {
        await addDoc(collection(db, 'organizations', orgId, 'applications'), {
          jobId: jobDoc.id,
          candidateId,
          status: randomItem(['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted']),
          resumeUrl: `https://example.com/resumes/${candidateId}.pdf`,
          coverLetter: 'I am excited to apply for this position.',
          appliedAt: randomDate(new Date(2024, 0, 1), new Date()),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }
}

async function seedInterviews(orgIds: string[], userIds: string[]) {
  console.log('Seeding interviews...');
  const candidateIds = userIds.filter(id => id.includes('candidate')).slice(0, 15);
  
  for (const orgId of orgIds.slice(0, 5)) {
    for (let i = 0; i < 3; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      
      await addDoc(collection(db, 'organizations', orgId, 'interviews'), {
        candidateId: randomItem(candidateIds),
        jobId: `job-${Math.random()}`,
        type: randomItem(['phone', 'video', 'onsite', 'technical']),
        scheduledAt: futureDate.toISOString(),
        duration: randomItem([30, 45, 60, 90]),
        location: randomItem(['Zoom', 'Google Meet', 'Office', 'Phone']),
        interviewerName: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
        status: randomItem(['scheduled', 'completed', 'cancelled']),
        notes: 'Looking forward to the interview.',
        createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      });
    }
  }
}

async function seedChallenges(orgIds: string[]) {
  console.log('Seeding challenges...');
  
  const challengeTitles = [
    'Build a Real-time Chat App', 'AI-Powered Resume Parser', 'E-commerce Platform Challenge',
    'Data Visualization Dashboard', 'Mobile App Design Sprint', 'API Design Challenge',
    'System Design Challenge', 'Frontend Performance', 'Security Audit', 'DevOps Pipeline'
  ];
  
  for (let i = 0; i < 10; i++) {
    const orgId = randomItem(orgIds);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + Math.floor(Math.random() * 60) + 10);
    
    await addDoc(collection(db, 'organizations', orgId, 'challenges'), {
      title: challengeTitles[i],
      type: randomItem(['hackathon', 'coding', 'design', 'case-study']),
      description: `Join us for an exciting challenge! Test your skills and win prizes.`,
      requirements: randomItems(skills, 4),
      reward: `$${(Math.floor(Math.random() * 5) + 1) * 1000}`,
      deadline: deadline.toISOString(),
      status: deadline > new Date() ? 'active' : 'expired',
      organizationId: orgId,
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    });
  }
}

async function seedPosts(userIds: string[]) {
  console.log('Seeding posts...');
  
  const postTitles = [
    'Just landed my dream job!', 'Completed AWS Certification', 'Built my first full-stack app',
    'Tips for technical interviews', 'My journey into tech', 'Open source milestone',
    'Launched my side project', 'Learning React in 2024', 'Remote work tips',
    'Career transition story', 'Bootcamp experience', 'Freelancing tips',
    'Building in public', 'Tech stack recommendations', 'Interview prep guide'
  ];
  
  for (let i = 0; i < 15; i++) {
    const author = randomItem(userIds);
    await addDoc(collection(db, 'posts'), {
      authorId: author,
      authorName: `User ${author.slice(-5)}`,
      authorRole: author.includes('employer') ? 'Employer' : 'Candidate',
      type: randomItem(['achievement', 'project', 'job', 'article']),
      title: postTitles[i],
      content: `Sharing my experience about ${postTitles[i].toLowerCase()}.`,
      likes: randomItems(userIds, Math.floor(Math.random() * 10)),
      comments: [],
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
      updatedAt: new Date().toISOString(),
    });
  }
}

async function seedConnections(userIds: string[]) {
  console.log('Seeding connections...');
  const candidateIds = userIds.filter(id => id.includes('candidate'));
  
  for (let i = 0; i < 20; i++) {
    const [user1, user2] = randomItems(candidateIds, 2);
    await addDoc(collection(db, 'connections'), {
      requesterId: user1,
      receiverId: user2,
      status: randomItem(['pending', 'accepted', 'rejected']),
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    });
  }
}

async function seedConversations(userIds: string[]) {
  console.log('Seeding conversations...');
  
  for (let i = 0; i < 10; i++) {
    const [user1, user2] = randomItems(userIds, 2);
    const convRef = await addDoc(collection(db, 'conversations'), {
      participants: [user1, user2],
      lastMessage: 'Hey, how are you?',
      lastMessageAt: randomDate(new Date(2024, 0, 1), new Date()),
      createdAt: randomDate(new Date(2024, 0, 1), new Date()),
    });
    
    for (let j = 0; j < 5; j++) {
      await addDoc(collection(db, 'conversations', convRef.id, 'messages'), {
        senderId: j % 2 === 0 ? user1 : user2,
        text: `Message ${j + 1}`,
        createdAt: randomDate(new Date(2024, 0, 1), new Date()),
        read: Math.random() > 0.3,
      });
    }
  }
}

async function main() {
  console.log('🌱 Starting mock data seeding...\n');
  
  try {
    const orgIds = await seedOrganizations();
    const userIds = await seedUsers(orgIds);
    await seedJobs(orgIds);
    await seedApplications(orgIds, userIds);
    await seedInterviews(orgIds, userIds);
    await seedChallenges(orgIds);
    await seedPosts(userIds);
    await seedConnections(userIds);
    await seedConversations(userIds);
    
    console.log('\n✅ Seeding completed!');
    console.log(`\n📊 Summary:`);
    console.log(`- Organizations: 10`);
    console.log(`- Users: 30 (10 employers + 20 candidates)`);
    console.log(`- Jobs: 30`);
    console.log(`- Applications: ~150`);
    console.log(`- Interviews: 15`);
    console.log(`- Challenges: 10`);
    console.log(`- Posts: 15`);
    console.log(`- Connections: 20`);
    console.log(`- Conversations: 10`);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();
