import { NextRequest, NextResponse } from 'next/server';
import { VultrClient } from '@/lib/vultr-client-mock';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const candidateId = formData.get('candidateId') as string;
    const fileName = formData.get('fileName') as string;

    if (!file || !candidateId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, candidateId' },
        { status: 400 }
      );
    }

    if (!process.env.VULTR_API_KEY || !process.env.VULTR_OBJECT_STORAGE_CLUSTER_ID) {
      return NextResponse.json(
        { error: 'Vultr storage not configured' },
        { status: 503 }
      );
    }

    const sanitizedCandidateId = candidateId.replace(/[^a-zA-Z0-9_-]/g, '');
    const sanitizedFileName = (fileName || file.name).replace(/[^a-zA-Z0-9._-]/g, '');
    
    if (!sanitizedCandidateId || !sanitizedFileName) {
      return NextResponse.json(
        { error: 'Invalid candidateId or fileName format' },
        { status: 400 }
      );
    }

    const resumeKey = `resumes/${sanitizedCandidateId}/${sanitizedFileName}`;

    const vultr = new VultrClient({ apiKey: process.env.VULTR_API_KEY });
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // In a real app, the bucket name and cluster ID should come from environment variables
    await vultr.objectStorage.putObject({
        'object-storage-cluster-id': process.env.VULTR_OBJECT_STORAGE_CLUSTER_ID!,
        'bucket-name': 'hirevision-bucket',
        'object-name': resumeKey,
        'content': fileBuffer,
        'content-type': file.type
    });

    return NextResponse.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeKey,
        candidateId,
        fileName: fileName || file.name,
        size: file.size,
      },
    });
  } catch (error: any) {
    console.error('Error uploading resume:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: 'Failed to upload resume',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const resumeKey = request.nextUrl.searchParams.get('resumeKey');

    if (!resumeKey || typeof resumeKey !== 'string') {
      return NextResponse.json(
        { error: 'Missing parameter: resumeKey' },
        { status: 400 }
      );
    }

    if (!process.env.VULTR_API_KEY || !process.env.VULTR_OBJECT_STORAGE_CLUSTER_ID) {
      return NextResponse.json(
        { error: 'Vultr storage not configured' },
        { status: 503 }
      );
    }

    const sanitizedResumeKey = resumeKey.replace(/[^a-zA-Z0-9._/-]/g, '');
    
    if (!sanitizedResumeKey || sanitizedResumeKey.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid resumeKey format' },
        { status: 400 }
      );
    }

    const vultr = new VultrClient({ apiKey: process.env.VULTR_API_KEY });

    const fileObject = await vultr.objectStorage.getObject({
        'object-storage-cluster-id': process.env.VULTR_OBJECT_STORAGE_CLUSTER_ID!,
        'bucket-name': 'hirevision-bucket',
        'object-name': sanitizedResumeKey
    });

    if (!fileObject) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Assumes getObject returns a body that can be used in the response.
    // The actual return type might need to be handled differently based on the SDK's specifics.
    return new NextResponse(fileObject as any, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${resumeKey.split('/').pop()}"`,
      },
    });
  } catch (error: any) {
    console.error('Error downloading resume:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      {
        error: 'Failed to download resume',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
