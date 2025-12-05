# AI Features - HireVision

## ✅ Working AI Features

### 1. Resume Analysis
**Endpoint:** `/api/ai/smarter-resume-analysis`
**Method:** POST
**Input:**
```json
{
  "resumeText": "Full resume text..."
}
```
**Output:**
```json
{
  "skills": ["React", "TypeScript", "Node.js"],
  "experience": [{"skill": "React", "years": 3}],
  "education": [{"institution": "MIT", "degree": "BS CS", "year": 2020}],
  "workHistory": [{"company": "Google", "position": "SWE", "duration": "2020-2023"}]
}
```

### 2. Candidate Ranking
**Function:** `aiCandidateRanking()`
**Input:**
```typescript
{
  jobDescription: string,
  candidateResume: string
}
```
**Output:**
```typescript
{
  fitScore: number (0-100),
  reasoning: string
}
```

### 3. Job Description Improvement
**Function:** `aiImproveJobDescription()`
**Input:**
```typescript
{
  jobDescription: string
}
```
**Output:**
```typescript
{
  improvedJobDescription: string
}
```

### 4. Interview Questions Generator
**Function:** `aiSuggestInterviewQuestions()`
**Input:**
```typescript
{
  jobTitle: string,
  jobDescription: string
}
```
**Output:**
```typescript
{
  questions: string[]
}
```

## 🔧 How to Use

### Resume Analysis
```typescript
const response = await fetch('/api/ai/smarter-resume-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ resumeText: 'Your resume text here...' })
});
const data = await response.json();
```

### Candidate Ranking
```typescript
import { aiCandidateRanking } from '@/ai/flows/ai-candidate-ranking';

const result = await aiCandidateRanking({
  jobDescription: 'Senior React Developer...',
  candidateResume: 'John Doe resume...'
});
```

### Job Description Improvement
```typescript
import { aiImproveJobDescription } from '@/ai/flows/ai-improve-job-description';

const result = await aiImproveJobDescription({
  jobDescription: 'We need a developer...'
});
```

### Interview Questions
```typescript
import { aiSuggestInterviewQuestions } from '@/ai/flows/ai-suggest-interview-questions';

const result = await aiSuggestInterviewQuestions({
  jobTitle: 'Senior Frontend Engineer',
  jobDescription: 'Looking for experienced React developer...'
});
```

## 🎯 Integration Points

### In Job Creation
- AI improves job description before posting
- Suggests required skills automatically

### In Candidate Review
- Automatically analyzes uploaded resumes
- Ranks candidates against job requirements
- Provides fit score and reasoning

### In Interview Scheduling
- Generates relevant interview questions
- Customized based on job and candidate profile

## 🔑 Required Environment Variables

```bash
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```

## 📊 AI Model Used

- **Model:** Google Gemini 1.5 Pro
- **Provider:** Google Generative AI
- **Features:** 
  - Natural language understanding
  - Structured output generation
  - Context-aware responses

## 🚀 Performance

- Average response time: 2-5 seconds
- Accuracy: High (based on Gemini 1.5 Pro capabilities)
- Fallback: Graceful degradation with default responses

## 🛠️ Troubleshooting

### Issue: AI not responding
**Solution:** Check GOOGLE_GENAI_API_KEY is set correctly

### Issue: Invalid JSON response
**Solution:** AI responses are cleaned and parsed automatically with fallbacks

### Issue: Slow responses
**Solution:** Normal for AI processing, consider adding loading states in UI
