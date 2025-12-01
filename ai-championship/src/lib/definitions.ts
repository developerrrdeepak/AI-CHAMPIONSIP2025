

export type UserRole = 'Owner' | 'Recruiter' | 'Hiring Manager' | 'Interviewer' | 'Candidate';

export type User = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId: string;
};

export type Notification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
    createdAt: string;
};

export type Organization = {
    id: string;
    name: string;
    logoUrl?: string;
    primaryBrandColor?: string;
    ownerId: string;
    about?: string;
    websiteUrl?: string;
    linkedinUrl?: string;
    createdAt: string;
    updatedAt: string;
};

export type JobStatus = 'open' | 'paused' | 'closed';

export type Job = {
  id: string;
  organizationId: string;
  createdBy: string;
  hiringManagerId?: string;
  title: string;
  department: string;
  locationCity: string;
  locationCountry: string;
  isRemote: boolean;
  employmentType: string;
  seniorityLevel: string;
  numberOfOpenings: number;
  jobDescription: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  minimumExperience?: number;
  maximumExperience?: number;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  salaryCurrency?: string;
  status: JobStatus;
  visibility?: 'public' | 'internal' | 'link-only' | 'closed';
  externalApplyUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Candidate = {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone?: string;
  currentRole?: string;
  location?: string;
  timezone?: string;
  source?: string;
  summary?: string; // AI-generated
  experience?: Experience[];
  education?: Education[];
  skills?: string[];
  projects?: Project[];
  links?: Link[];
  rawResumeText?: string;
  aiProfileJson?: string;
  experienceLevel?: 'Student' | 'Fresher' | '0-2 years' | '3-5 years' | '5+ years';
  preferredLocation?: 'Remote' | 'Hybrid' | 'Onsite';
  expectedSalary?: number;
  yearsOfExperience?: number;
  isShortlisted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Experience = {
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description?: string;
};

export type Education = {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: string;
    endYear?: string;
};

export type Project = {
    name: string;
    description: string;
    url?: string;
};

export type Link = {
    name: string; // e.g., "LinkedIn", "GitHub", "Portfolio"
    url: string;
};


export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'rejected' | 'offer' | 'hired';
export type ApplicationStage = 'Applied' | 'Screening' | 'Technical Interview' | 'HR Interview' | 'Offer' | 'Hired' | 'Rejected';

export type Application = {
  id: string;
  organizationId: string;
  jobId: string;
  candidateId: string;
  status: ApplicationStatus;
  stage: ApplicationStage;
  fitScore: number;
  cultureFitSummary?: string; // New field for CultureFit AI
  aiRecommendedDecision?: 'advance' | 'hold' | 'reject';
  aiScoreMetadata?: string;
  notes?: string;
  starredBy?: string[]; // Array of user IDs who starred this application
  createdAt: string;
  updatedAt: string;
};

export type InterviewType = 'Phone Screen' | 'Technical' | 'Behavioral' | 'Final Round';
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export type InterviewerFeedback = {
    interviewerId: string;
    interviewerName: string;
    submittedAt: string;
    rating: number; // 1-5
    pros: string;
    cons: string;
    verdict: 'Strong Hire' | 'Hire' | 'No Hire' | 'Strong No Hire';
};

export type Interview = {
  id: string;
  applicationId: string;
  organizationId: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  locationOrLink: string;
  status: InterviewStatus;
  interviewerIds: string[]; // Array of User IDs
  interviewerFeedback?: InterviewerFeedback[];
  createdAt: string;
  updatedAt: string;
};

export type ChallengeType = 'Hackathon' | 'Case Study' | 'Quiz' | 'Coding Challenge';

export type Challenge = {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    type: ChallengeType;
    reward: string;
    deadline: string;
    createdAt: string;
    updatedAt: string;
};

export type EmailType = 'invite' | 'rejection' | 'followup' | 'offer';
export type EmailStatus = 'queued' | 'sent' | 'failed' | 'opened';

export type Email = {
  id: string;
  candidateId: string;
  applicationId?: string;
  type: EmailType;
  subject: string;
  body: string;
  status: EmailStatus;
  sentAt?: string;
  createdAt: string;
};

export type ActivityLogAction = 
    | 'job_created' | 'job_updated' | 'job_closed'
    | 'candidate_added' | 'candidate_applied'
    | 'application_shortlisted' | 'application_rejected' | 'application_hired' | 'application_stage_changed'
    | 'interview_scheduled' | 'challenge_created';

export type ActivityLog = {
  id: string;
  organizationId: string;
  timestamp: string;
  actor: { id: string, name: string }; // User who performed the action
  action: ActivityLogAction;
  target: {
    type: 'job' | 'candidate' | 'application' | 'interview' | 'challenge';
    id: string;
    name: string; // e.g., Job title or Candidate name
  };
  context?: Record<string, any>; // e.g., { fromStage: 'Screen', toStage: 'Interview' }
};

export type EmailTemplateType = 'Invitation' | 'Rejection' | 'Follow-up' | 'Offer' | 'General';

export type EmailTemplate = {
  id: string;
  organizationId: string;
  name: string;
  subject: string;
  body: string;
  type: EmailTemplateType;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
};


// Types for Founder Console
export type PipelineHealth = {
  score: number;
  trend: 'up' | 'down' | 'stable';
};

export type HiringVelocity = {
  days: number;
  trend: 'up' | 'down' | 'stable';
};

export type TimeToHire = {
  avgDays: number;
  perRole: { role: string; days: number }[];
};

export type CostPerHire = {
  amount: number;
  currency: 'USD';
  trend: 'up' | 'down' | 'stable';
};

export type FunnelDataPoint = {
  stage: string;
  count: number;
};

export type FounderDashboardData = {
  openRoles: number;
  criticalRoles: { title: string; id: string }[];
  pipelineHealth: PipelineHealth;
  hiringVelocity: HiringVelocity;
  timeToHire: TimeToHire;
  costPerHire: CostPerHire;
  funnelData: FunnelDataPoint[];
  bottleneckRoles: { title: string; id: string; stage: string }[];
};

export type Course = {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
};

export type MessageType = 'text' | 'voice' | 'attachment';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  type: MessageType;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  voiceUrl?: string;
  voiceDuration?: number;
  isRead: boolean;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participants: {
    id: string;
    name: string;
    role: UserRole;
    avatarUrl?: string;
  }[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: { [userId: string]: number };
  createdAt: string;
  updatedAt: string;
};

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export type Connection = {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
};

export type PostType = 'achievement' | 'project' | 'job' | 'article';

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  type: PostType;
  title: string;
  content: string;
  imageUrl?: string;
  jobId?: string;
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
};
