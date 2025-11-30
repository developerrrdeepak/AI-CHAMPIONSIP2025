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

    const resumeKey = `resumes/${candidateId}/${fileName || file.name}`;

    const vultr = new VultrClient({ apiKey: process.env.VULTR_API_KEY! });
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
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const resumeKey = request.nextUrl.searchParams.get('resumeKey');

    if (!resumeKey) {
      return NextResponse.json(
        { error: 'Missing parameter: resumeKey' },
        { status: 400 }
      );
    }

    const vultr = new VultrClient({ apiKey: process.env.VULTR_API_KEY! });

    const fileObject = await vultr.objectStorage.getObject({
        'object-storage-cluster-id': process.env.VULTR_OBJECT_STORAGE_CLUSTER_ID!,
        'bucket-name': 'hirevision-bucket',
        'object-name': resumeKey
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
  } catch (error) {
    console.error('Error downloading resume:', error);
    return NextResponse.json(
      {
        error: 'Failed to download resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
