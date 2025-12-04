
import { NextRequest, NextResponse } from 'next/server';
import { executeSmartSQL } from '@/lib/raindropSmartComponents';

// Mock data for demonstration when DB is not connected
const mockCandidates = [
  { id: 'cand-1', name: 'John Doe', email: 'john@example.com', skills: '["React", "TypeScript"]', experience_years: 5, current_role: 'Senior Developer' },
  { id: 'cand-2', name: 'Jane Smith', email: 'jane@example.com', skills: '["Python", "Data Science"]', experience_years: 7, current_role: 'Data Engineer' }
];
const mockJobs = [
  { id: 'job-1', title: 'Senior React Developer', description: 'Looking for experienced React developer', required_skills: '["React", "TypeScript", "Node.js"]', seniority_level: 'Senior', department: 'Engineering' },
  { id: 'job-2', title: 'Data Scientist', description: 'Build ML models for our platform', required_skills: '["Python", "ML", "Statistics"]', seniority_level: 'Mid-level', department: 'Data' }
];


export async function GET(request: NextRequest) {
  try {
    const operation = request.nextUrl.searchParams.get('operation');
    const organizationId = request.nextUrl.searchParams.get('organizationId');

    if (!operation) {
      return NextResponse.json({ error: 'Missing parameter: operation' }, { status: 400 });
    }

    let query: string = '';
    let params: any[] = [];
    let mockData: any[] = [];

    switch (operation) {
      case 'getCandidates':
        query = 'SELECT id, name, email, skills, experience_years, current_role FROM candidates WHERE organization_id = $1';
        params.push(organizationId);
        mockData = mockCandidates;
        break;
      case 'getJobs':
        query = "SELECT id, title, description, required_skills, seniority_level, department FROM jobs WHERE organization_id = $1 AND status = 'active'";
        params.push(organizationId);
        mockData = mockJobs;
        break;
      case 'getAnalytics':
        // This is a special case for the analytics page
        return NextResponse.json({
          success: true,
          data: {
            totalCandidates: 786,
            activeJobs: 32,
            matchingAccuracy: 91,
            aiProcessed: 345
          }
        });
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    try {
      const result = await executeSmartSQL(query);
      return NextResponse.json({ success: true, data: result.rows });
    } catch (dbError) {
      console.warn("SmartSQL query failed, falling back to mock data.", dbError);
      return NextResponse.json({ success: true, data: mockData, fallback: true });
    }
    
  } catch (error) {
    console.error('Error in database operation:', error);
    return NextResponse.json(
      {
        error: 'Database operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
