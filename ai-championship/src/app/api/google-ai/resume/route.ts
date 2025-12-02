import { NextRequest, NextResponse } from 'next/server';

function analyzeResumeText(resumeText: string, jobDescription?: string): string {
  const lines = resumeText.split('\n').filter(l => l.trim());
  const skills = resumeText.match(/\b(React|TypeScript|Node\.js|Python|Java|AWS|Docker|Kubernetes|JavaScript|Vue|Angular|MongoDB|PostgreSQL|GraphQL|Go|Rust)\b/gi) || [];
  const uniqueSkills = [...new Set(skills.map(s => s.toLowerCase()))];
  const yearsMatch = resumeText.match(/(\d+)\+?\s*years?/i);
  const years = yearsMatch ? parseInt(yearsMatch[1]) : 0;
  
  let analysis = `**Resume Analysis:**\n\n`;
  analysis += `✅ **Skills Identified:** ${uniqueSkills.length} technical skills found\n`;
  analysis += `• ${uniqueSkills.slice(0, 5).join(', ')}${uniqueSkills.length > 5 ? ` and ${uniqueSkills.length - 5} more` : ''}\n\n`;
  
  if (years > 0) {
    analysis += `💼 **Experience:** ${years}+ years of professional experience\n\n`;
  }
  
  analysis += `📊 **Strengths:**\n`;
  if (uniqueSkills.length >= 5) analysis += `• Strong technical skill set\n`;
  if (years >= 3) analysis += `• Solid professional experience\n`;
  if (resumeText.toLowerCase().includes('lead') || resumeText.toLowerCase().includes('senior')) {
    analysis += `• Leadership experience\n`;
  }
  
  if (jobDescription) {
    const jobSkills = jobDescription.match(/\b(React|TypeScript|Node\.js|Python|Java|AWS|Docker|Kubernetes|JavaScript|Vue|Angular|MongoDB|PostgreSQL|GraphQL|Go|Rust)\b/gi) || [];
    const matchingSkills = uniqueSkills.filter(s => jobSkills.some(js => js.toLowerCase() === s));
    const matchPercent = jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;
    
    analysis += `\n🎯 **Job Match:** ${matchPercent}% skill match\n`;
    analysis += `• Matching skills: ${matchingSkills.join(', ') || 'None'}\n`;
  }
  
  analysis += `\n✨ **Recommendation:** ${uniqueSkills.length >= 5 && years >= 3 ? 'Strong candidate - Proceed to interview' : 'Review for specific role requirements'}`;
  
  return analysis;
}

export async function POST(request: NextRequest) {
  try {
    const { resumeText, jobDescription } = await request.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    const analysis = analyzeResumeText(resumeText, jobDescription);
    const skills = resumeText.match(/\b(React|TypeScript|Node\.js|Python|Java|AWS|Docker|Kubernetes|JavaScript|Vue|Angular|MongoDB|PostgreSQL|GraphQL|Go|Rust)\b/gi) || [];
    const matchScore = Math.min(95, 60 + (skills.length * 5));

    return NextResponse.json({
      success: true,
      analysis,
      matchScore,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Resume analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}