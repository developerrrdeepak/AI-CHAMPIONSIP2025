# HireVision: Raindrop + Vultr Integration

## Project Overview

HireVision is an AI-powered recruiting platform that leverages Raindrop Smart Components and Vultr infrastructure to provide intelligent candidate matching and hiring operations.

## Architecture

### Components Used

#### 1. **Raindrop SmartSQL** (Database Layer)
- **Purpose**: Database operations for candidates, jobs, and applications
- **Implementation**: `src/lib/smartSQL.ts`
- **API Endpoint**: `/api/raindrop/database`
- **Key Functions**:
  - `getCandidatesByOrganization()` - Retrieve candidates
  - `getJobsByOrganization()` - Retrieve job postings
  - `getApplicationsByCandidate()` - Track candidate applications
  - `searchCandidatesBySkills()` - Skill-based candidate search
  - `getMatchedCandidatesForJob()` - Find candidates for a specific job

**Usage Example**:
```typescript
// Query candidates by organization
const candidates = await getCandidatesByOrganization('org-123');

// Search candidates by skills
const skillMatches = await searchCandidatesBySkills('org-123', ['React', 'TypeScript', 'Node.js']);
```

#### 2. **Raindrop SmartMemory** (Persistent Storage)
- **Purpose**: Long-term AI memory, user preferences, and feedback storage
- **Implementation**: `src/lib/raindropSmartComponents.ts`
- **API Endpoint**: `/api/raindrop/preferences`
- **Key Functions**:
  - `storeUserPreferences()` - Save candidate preferences
  - `retrieveUserPreferences()` - Retrieve stored preferences
  - `storeInterviewFeedback()` - Store interview results
  - `storeApplicationData()` - Archive application data

**Usage Example**:
```typescript
// Store candidate preferences for AI context
await storeUserPreferences('candidate-123', {
  desiredRole: 'Senior Developer',
  minimumSalary: 100000,
  preferredLocation: 'Remote',
  workExperience: ['React', 'TypeScript']
});

// Retrieve preferences later
const prefs = await retrieveUserPreferences('candidate-123');
```

#### 3. **Raindrop SmartInference** (AI Engine)
- **Purpose**: Intelligent candidate-job matching and analysis
- **Implementation**: `src/ai/flows/ai-raindrop-candidate-matcher.ts`
- **API Endpoint**: `/api/raindrop/candidate-match`
- **AI Flow**: `aiRaindropCandidateMatcher()`

**Features**:
- Skill matching analysis
- Experience level assessment
- Culture fit scoring
- Recommendation generation
- Interview-ready next steps

**Usage Example**:
```typescript
const matchResult = await aiRaindropCandidateMatcher({
  jobDescription: 'Senior React Developer with 5+ years...',
  candidateProfile: 'Jane Doe, 6 years React experience...',
  preferences: {
    minimumExperience: 5,
    desiredSalaryRange: '100k-150k',
    preferredLocation: 'Remote'
  }
});

// Returns:
// {
//   matchScore: 85,
//   skillsMatch: { matched: [...], missing: [...] },
//   experienceMatch: { yearsRequired: 5, yearsProvided: 6 },
//   cultureFitScore: 78,
//   recommendation: 'strong_match',
//   reasoning: '...',
//   nextSteps: [...]
// }
```

#### 4. **Vultr Object Storage** (File Management)
- **Purpose**: Resume and document storage
- **Implementation**: `src/lib/raindropSmartComponents.ts` (SmartBuckets)
- **API Endpoint**: `/api/vultr/storage`
- **Key Functions**:
  - `uploadResumeToStorage()` - Upload candidate resumes
  - `downloadResumeFromStorage()` - Retrieve resumes
  - `smartBucketsUpload()` - Generic file upload
  - `smartBucketsDownload()` - Generic file download

**Usage Example**:
```typescript
// Upload a resume
await uploadResumeToStorage('candidate-123/resume.pdf', fileBuffer);

// Download for analysis
const resume = await downloadResumeFromStorage('candidate-123/resume.pdf');

// Used by SmartInference for document-based matching
```

## Integration Points

### API Routes

1. **SmartSQL Database Operations**
   ```
   GET /api/raindrop/database?operation=getCandidates&organizationId=org-123
   GET /api/raindrop/database?operation=getJobs&organizationId=org-123
   GET /api/raindrop/database?operation=searchBySkills&organizationId=org-123&skills=React,TypeScript
   ```

2. **SmartMemory User Preferences**
   ```
   GET /api/raindrop/preferences?userId=candidate-123
   POST /api/raindrop/preferences
   Body: { userId: 'candidate-123', preferences: {...} }
   ```

3. **SmartInference Candidate Matching**
   ```
   POST /api/raindrop/candidate-match
   Body: {
     jobDescription: '...',
     candidateProfile: '...',
     candidateId: 'candidate-123' (optional),
     preferences: {...} (optional)
   }
   ```

4. **Vultr Object Storage**
   ```
   POST /api/vultr/storage (file upload)
   GET /api/vultr/storage?resumeKey=resumes/candidate-123/resume.pdf
   ```

## Showcase Page

Navigate to `/raindrop-showcase` to see an interactive demonstration of all four Raindrop Smart Components:
- **SmartSQL** - Query candidates and jobs
- **SmartMemory** - Store and retrieve preferences
- **SmartInference** - Run candidate matching
- **Vultr Storage** - Upload and manage resumes

## Environment Configuration

Required environment variables:
```
RAINDROP_API_KEY=your_raindrop_api_key
VULTR_POSTGRES_CONNECTION_STRING=postgresql://...
VULTR_API_KEY=your_vultr_api_key
VULTR_OBJECT_STORAGE_BUCKET=bucket_name
```

## Competition Requirements Met

✅ **Raindrop Platform Usage**
- Uses SmartSQL for database operations
- Uses SmartMemory for long-term AI memory
- Uses SmartInference for AI candidate matching
- Uses SmartBuckets for file storage (integrated with Vultr)

✅ **AI Coding Assistant Compatible**
- Code structure supports Gemini CLI and Claude Code
- All AI flows use Genkit framework compatible with AI assistants
- Clean API contracts for AI-generated code integration

✅ **Vultr Integration**
- Object Storage for resume management
- PostgreSQL database (via connection string)
- Prepared for Vultr GPU/VM integration for worker tasks

✅ **Intelligent Features**
- Candidate-job matching with SmartInference
- Skill-based search using SmartSQL
- User preference persistence with SmartMemory
- Document-based analysis capabilities

## Workflow Example

```
1. Recruiter posts a job
   → Stored in SmartSQL database

2. Candidate uploads resume
   → Stored in Vultr Object Storage
   → Added to SmartMemory

3. System runs matching analysis
   → Retrieves candidate preferences from SmartMemory
   → Analyzes resume from Object Storage
   → Uses SmartInference AI to match job requirements
   → Returns match score and recommendations

4. Interview process stored
   → Feedback stored in SmartMemory
   → Improves future AI matching recommendations
   → Data persists for candidate journey tracking
```

## Next Steps for Deployment

1. Connect to actual Raindrop MCP Server with valid credentials
2. Configure Vultr Object Storage bucket and credentials
3. Set up Vultr PostgreSQL database (or connect existing)
4. Deploy Raindrop functions to handle backend AI workflows
5. Optional: Integrate Vultr GPU for resume analysis acceleration
6. Optional: Add ElevenLabs for voice-based candidate interviews

## Files Changed

- `src/lib/raindropClient.ts` - Enhanced Raindrop client
- `src/lib/raindropSmartComponents.ts` - Smart Components wrapper
- `src/lib/smartSQL.ts` - Database query functions
- `src/ai/flows/ai-raindrop-candidate-matcher.ts` - New AI flow
- `src/app/api/raindrop/candidate-match/route.ts` - Matching API
- `src/app/api/raindrop/preferences/route.ts` - Preferences API
- `src/app/api/raindrop/database/route.ts` - Database API
- `src/app/api/vultr/storage/route.ts` - Storage API
- `src/app/(app)/raindrop-showcase/page.tsx` - Demo page
- `src/components/nav.tsx` - Navigation updates
