import { NextRequest, NextResponse } from 'next/server';
import { executeSmartSQL } from '@/lib/raindropSmartComponents';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const queryString = `SELECT * FROM candidates WHERE organization_id = '${organizationId}'`;
    const result = await executeSmartSQL(queryString);
    const candidates = result.rows || [];

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
