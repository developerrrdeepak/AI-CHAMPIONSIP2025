import { NextRequest, NextResponse } from 'next/server';
import { executeSmartSQL } from '@/lib/raindropSmartComponents';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 });
    }

    const queryString = `SELECT * FROM jobs WHERE organization_id = '${organizationId}'`;
    const result = await executeSmartSQL(queryString);
    const jobs = result.rows || [];

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
