import { NextRequest, NextResponse } from 'next/server';
import { generateCandidateInsights } from '@/lib/gemini-ai';

export async function POST(request: NextRequest) {
  try {
    const { candidate } = await request.json();

    const insights = await generateCandidateInsights(candidate);

    if (!insights) {
      const fallback = `**Candidate Assessment:**\n\n✅ **Overall:** ${candidate.yearsOfExperience}+ years experienced ${candidate.currentRole}\n\n💼 **Best Fit:** ${candidate.currentRole}, Senior roles in ${candidate.skills?.[0]}\n\n💰 **Salary Range:** $${80000 + (candidate.yearsOfExperience * 15000)} - $${120000 + (candidate.yearsOfExperience * 20000)}\n\n📍 **Location:** ${candidate.location}\n\n⭐ **Strengths:** Strong technical background, ${candidate.skills?.length || 0} skills identified`;
      
      return NextResponse.json({ success: true, insights: fallback, source: 'fallback' });
    }

    return NextResponse.json({ success: true, insights, source: 'ai' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
