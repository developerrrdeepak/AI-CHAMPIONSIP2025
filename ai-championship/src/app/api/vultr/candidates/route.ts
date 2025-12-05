import { NextRequest, NextResponse } from 'next/server';
import { executeSmartSQL } from '@/lib/raindropSmartComponents';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId || typeof organizationId !== 'string') {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const sanitizedOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
    
    const queryString = `SELECT * FROM candidates WHERE organization_id = '${sanitizedOrgId}'`;
    const result = await executeSmartSQL(queryString);
    const candidates = result.rows || [];

    return NextResponse.json({ candidates });
  } catch (error: any) {
    console.error('Error fetching candidates:', {
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
