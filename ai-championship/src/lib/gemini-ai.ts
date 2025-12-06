// Google Gemini AI Integration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || 'AIzaSyA9PodAFCpB3EkqsvYPHd0i4ExG9-QPZX4';

export async function analyzeResumeWithAI(resumeText: string, jobDescription?: string) {
  try {
    const prompt = jobDescription 
      ? `Analyze this resume against the job description and provide detailed insights:\n\nRESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nProvide: 1) Match score (0-100), 2) Key strengths, 3) Gaps, 4) Recommendations`
      : `Analyze this resume and provide detailed insights:\n\n${resumeText}\n\nProvide: 1) Skills identified, 2) Experience level, 3) Strengths, 4) Improvement areas`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    });

    if (!response.ok) throw new Error('AI analysis failed');
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || 'Analysis unavailable';
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
}

export async function generateInterviewQuestions(jobTitle: string, skills: string[], experienceLevel: string) {
  try {
    const prompt = `Generate 10 technical interview questions for a ${jobTitle} position with ${experienceLevel} experience level. Required skills: ${skills.join(', ')}. Include a mix of technical, behavioral, and problem-solving questions.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
      })
    });

    if (!response.ok) throw new Error('Question generation failed');
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || null;
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
}

export async function extractSkillsFromJD(jobDescription: string) {
  try {
    const prompt = `Extract all technical skills, soft skills, and qualifications from this job description. Return as a JSON array:\n\n${jobDescription}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });

    if (!response.ok) throw new Error('Skill extraction failed');
    
    const data = await response.json();
    const text = data.candidates[0]?.content?.parts[0]?.text || '[]';
    
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    } catch {
      return text.split('\n').filter((s: any) => s.trim()).map((s: any) => s.replace(/^[-*]\s*/, ''));
    }
  } catch (error) {
    console.error('Gemini AI error:', error);
    return [];
  }
}

export async function generateCandidateInsights(candidateProfile: any) {
  try {
    const prompt = `Analyze this candidate profile and provide hiring insights:\n\nName: ${candidateProfile.name}\nRole: ${candidateProfile.currentRole}\nSkills: ${candidateProfile.skills?.join(', ')}\nExperience: ${candidateProfile.yearsOfExperience} years\nLocation: ${candidateProfile.location}\n\nProvide: 1) Overall assessment, 2) Best fit roles, 3) Salary expectations, 4) Red flags if any`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    });

    if (!response.ok) throw new Error('Insights generation failed');
    
    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || null;
  } catch (error) {
    console.error('Gemini AI error:', error);
    return null;
  }
}
