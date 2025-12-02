import { NextRequest, NextResponse } from 'next/server';
import { executeSmartSQL } from '@/lib/raindropSmartComponents';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const sanitizedOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    if (!sanitizedOrgId) {
      return NextResponse.json({ error: 'Invalid organizationId format' }, { status: 400 });
    }

    const queryString = `SELECT * FROM jobs WHERE organization_id = '${sanitizedOrgId}'`;
    const result = await executeSmartSQL(queryString);
    const jobs = result.rows || [];

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('Error fetching jobs:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Internal Server Error', details: error?.message },
      { status: 500 }
    );
  }
}
