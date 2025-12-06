import { NextRequest, NextResponse } from 'next/server';
import { smarterResumeAnalysis } from '@/ai/flows/ai-smarter-resume-analysis';
import * as pdf from 'pdf-parse';

// Helper to fetch file from a URL, needed for server-side fetch
async function fetchFileAsBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumePath } = body;

    if (!resumePath || typeof resumePath !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: resumePath' },
        { status: 400 }
      );
    }

    // In a real app, you'd fetch this from your storage. For now, we assume it's a public URL or a local path.
    // If it's a local path in production, you'd need to adjust how you read it.
    // For Vercel, it's best to fetch from a URL (e.g., your object storage).
    
    // Assuming resumePath is a URL to the file
    const resumeBuffer = await fetchFileAsBuffer(resumePath);
    
    // Extract text from the PDF
    const pdfData = await pdf(resumeBuffer);
    const resumeText = pdfData.text;

    const analysisResult = await smarterResumeAnalysis(resumeText);

    return NextResponse.json({
      success: true,
      data: analysisResult,
      message: 'Resume analysis completed successfully',
    });
  } catch (error) {
    console.error('Error in resume analysis endpoint:', error);
    return NextResponse.json(
      {
        error: 'Failed to process resume analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
