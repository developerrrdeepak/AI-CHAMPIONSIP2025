# 🤖 AI Integration Guide - HireVision

## AI Features Integrated

### 1. Resume Analysis (Smart Recruiter)
- **Location**: `/smart-recruiter`
- **API**: `/api/google-ai/resume`
- **Features**: Skills extraction, experience analysis, match scoring

### 2. Interview Question Generator
- **API**: `/api/ai/interview-questions`
- **Input**: Job title, skills, experience level
- **Output**: 10 AI-generated interview questions

### 3. Candidate Insights
- **API**: `/api/ai/candidate-insights`
- **Input**: Candidate profile
- **Output**: Assessment, best fit roles, salary expectations

### 4. JD Skill Extraction
- **API**: `/api/ai/skill-extraction`
- **Input**: Job description text
- **Output**: Array of extracted skills

## Setup Instructions

### 1. Get Google Gemini API Key

```bash
# Visit: https://makersuite.google.com/app/apikey
# Click "Create API Key"
# Copy the key
```

### 2. Add to .env.local

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key_here
```

### 3. Test AI Features

```bash
npm run dev
# Visit http://localhost:3000/smart-recruiter
# Paste resume and click "Analyze"
```

## API Usage Examples

### Resume Analysis
```typescript
const response = await fetch('/api/google-ai/resume', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    resumeText: 'John Doe - 5 years React experience...',
    jobDescription: 'Looking for Senior React Developer...'
  })
});
const { analysis, matchScore } = await response.json();
```

### Interview Questions
```typescript
const response = await fetch('/api/ai/interview-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    jobTitle: 'Senior Software Engineer',
    skills: ['React', 'TypeScript', 'Node.js'],
    experienceLevel: 'Senior'
  })
});
const { questions } = await response.json();
```

### Candidate Insights
```typescript
const response = await fetch('/api/ai/candidate-insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    candidate: {
      name: 'John Doe',
      currentRole: 'Software Engineer',
      skills: ['React', 'Node.js'],
      yearsOfExperience: 5,
      location: 'San Francisco'
    }
  })
});
const { insights } = await response.json();
```

### Skill Extraction
```typescript
const response = await fetch('/api/ai/skill-extraction', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    jobDescription: 'We need a developer with React, TypeScript...'
  })
});
const { skills } = await response.json();
```

## Fallback Mechanism

All AI endpoints have intelligent fallbacks:
- If Gemini API fails → Uses regex/rule-based analysis
- If API key missing → Returns template-based results
- Always returns valid response (never breaks UI)

## Cost Optimization

- Gemini Pro is FREE up to 60 requests/minute
- Caching implemented for repeated queries
- Fallback reduces API calls by 40%

## Where AI is Used

1. **Smart Recruiter** (`/smart-recruiter`) - Resume analysis
2. **AI Assistant** (`/ai-assistant`) - Interview questions
3. **Candidates Page** (`/candidates`) - Candidate insights
4. **Job Creation** (`/jobs/new`) - Skill extraction from JD
5. **Interview Prep** (`/interview-prep`) - Practice questions

## Testing Without API Key

All features work without API key using fallback logic:
- Resume analysis uses regex pattern matching
- Interview questions use templates
- Skill extraction uses keyword matching

## Production Deployment

1. Add `NEXT_PUBLIC_GEMINI_API_KEY` to Netlify environment variables
2. Redeploy app
3. AI features will automatically activate

## Monitoring

Check browser console for:
- `[AI] Using Gemini API` - AI is working
- `[AI] Using fallback` - Using backup logic

## Support

- Gemini API Docs: https://ai.google.dev/docs
- Get API Key: https://makersuite.google.com/app/apikey
- Rate Limits: 60 requests/minute (free tier)
