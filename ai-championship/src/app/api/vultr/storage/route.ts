
import { NextRequest, NextResponse } from 'next/server';
import { vultrService } from '@/lib/vultr-client';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const candidateId = formData.get('candidateId') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !candidateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await vultrService.uploadToObjectStorage(file, `resumes/${candidateId}/${fileName}`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Resume uploaded successfully',
        data: { resumeKey: `resumes/${candidateId}/${fileName}` }
      });
    } else {
      throw new Error(result.error || 'Vultr upload failed');
    }
  } catch (error: any) {
    console.error('Error uploading resume:', error);
    return NextResponse.json({ error: 'Upload failed', details: error.message }, { status: 500 });
  }
}
