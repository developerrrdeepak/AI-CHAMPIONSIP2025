import { NextRequest, NextResponse } from 'next/server';
import { smartInferenceInvoke, smartMemoryWrite, smartMemoryRead, smartBucketsUpload } from '@/lib/raindropClient';
import { vultrService } from '@/lib/vultr-client';

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'analyze-resume':
        const analysis = await smartInferenceInvoke('gemini-2.0-flash-exp', 
          `Analyze this resume: ${data.resumeText}`
        );
        
        await smartMemoryWrite(`resume-${data.userId}`, analysis, data.userId);
        
        return NextResponse.json({ 
          success: true, 
          analysis,
          message: 'Resume analyzed using Raindrop SmartInference and stored in SmartMemory'
        });

      case 'store-candidate-data':
        await smartMemoryWrite(`candidate-${data.candidateId}`, data.profile, data.candidateId);
        
        return NextResponse.json({ 
          success: true,
          message: 'Candidate data stored in Raindrop SmartMemory'
        });

      case 'get-candidate-data':
        const candidateData = await smartMemoryRead(`candidate-${data.candidateId}`, data.candidateId);
        
        return NextResponse.json({ 
          success: true, 
          data: candidateData,
          message: 'Retrieved from Raindrop SmartMemory'
        });

      case 'upload-resume-vultr':
        const vultrResult = await vultrService.uploadToObjectStorage(
          data.file, 
          `resumes/${data.userId}/${Date.now()}.pdf`
        );
        
        if (vultrResult.success) {
          await smartMemoryWrite(`resume-url-${data.userId}`, { url: vultrResult.url }, data.userId);
        }
        
        return NextResponse.json({ 
          success: vultrResult.success,
          url: vultrResult.url,
          message: 'Resume uploaded to Vultr Object Storage and URL stored in Raindrop SmartMemory'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Raindrop-Vultr integration error:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Integration failed', details: errorMessage },
      { status: 500 }
    );
  }
}
