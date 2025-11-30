# HireVision - Quick Start Guide

## 30-Second Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local

# 3. Add your credentials to .env.local
# - RAINDROP_API_KEY
# - VULTR_* variables
# - Firebase config
# - GOOGLE_GENAI_API_KEY

# 4. Run dev server
npm run dev

# 5. In another terminal, run Genkit
npm run genkit:dev

# 6. Open http://localhost:9002
```

## Demo the Raindrop Integration

1. **Log in** with your Firebase credentials
2. **Navigate** to `/raindrop-showcase`
3. **Click buttons** to test each Smart Component:
   - SmartSQL - Database queries
   - SmartMemory - User preferences
   - SmartInference - AI candidate matching
   - Vultr Storage - Resume storage

## Key Features

- 🎯 **Smart Candidate Matching** - AI compares candidates to job requirements
- 💾 **SmartSQL** - Query database for candidates and jobs
- 🧠 **SmartMemory** - Stores user preferences and interview feedback
- 📦 **Vultr Storage** - Resume and document management
- 🤖 **15+ AI Flows** - Candidate ranking, prep, interview prep, etc.

## API Endpoints

```
# Test candidate matching
POST /api/raindrop/candidate-match
Body: { jobDescription: "...", candidateProfile: "..." }

# Get/Set user preferences
GET  /api/raindrop/preferences?userId=candidate-123
POST /api/raindrop/preferences
Body: { userId: "...", preferences: {...} }

# Query database
GET /api/raindrop/database?operation=getCandidates&organizationId=org-123

# Upload/Download resumes
POST /api/vultr/storage (multipart/form-data)
GET  /api/vultr/storage?resumeKey=resumes/candidate-123/resume.pdf
```

## File Structure

```
src/
├── app/(app)/raindrop-showcase/page.tsx  ← Demo page
├── api/raindrop/                        ← API endpoints
│   ├── candidate-match/route.ts         ← SmartInference
│   ├── preferences/route.ts             ← SmartMemory
│   └── database/route.ts                ← SmartSQL
├── api/vultr/
│   └── storage/route.ts                 ← Object Storage
├── ai/flows/
│   └── ai-raindrop-candidate-matcher.ts ← Matching AI
└── lib/
    ├── raindropClient.ts                ← Client setup
    ├── raindropSmartComponents.ts       ← Smart Components
    ├── smartSQL.ts                      ← Database queries
    └── vultrPostgresClient.ts           ← DB connection
```

## Troubleshooting

### Dev server not starting?
```bash
npm cache clean --force
npm install
npm run dev
```

### Can't access /raindrop-showcase?
- Make sure you're logged in
- Check that your environment variables are set
- Look at dev server logs for errors

### API returning 500 error?
- Check `.env.local` has all required variables
- Verify Raindrop API key is correct
- Check console logs for specific error

## For Competition Submission

1. **Record a video** showing:
   - Navigation to `/raindrop-showcase`
   - Testing each Smart Component
   - Showing the AI matching results

2. **Show the code**:
   - `src/lib/raindropSmartComponents.ts` - All 4 components
   - `src/ai/flows/ai-raindrop-candidate-matcher.ts` - AI flow
   - `src/app/api/raindrop/candidate-match/route.ts` - API route

3. **Read the docs**:
   - `RAINDROP_VULTR_INTEGRATION.md` - Full technical details
   - `COMPETITION_SUBMISSION_GUIDE.md` - Submission checklist

## Next: Add Vultr Credentials

When you have Vultr credentials:
1. Update `.env.local` with:
   - `VULTR_API_KEY`
   - `VULTR_OBJECT_STORAGE_BUCKET`
   - `VULTR_POSTGRES_CONNECTION_STRING`

2. Storage API will then connect to real Vultr Object Storage

## Questions?

- Check `RAINDROP_VULTR_INTEGRATION.md` for detailed docs
- Look at API endpoint comments for usage examples
- Review `src/app/(app)/raindrop-showcase/page.tsx` for demo code
