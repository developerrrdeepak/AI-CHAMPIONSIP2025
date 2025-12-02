import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration
const mockCandidates = [
      {
        id: 'cand-1',
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['React', 'TypeScript'],
        experienceYears: 5,
        currentRole: 'Senior Developer'
      },
      {
        id: 'cand-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        skills: ['Python', 'Data Science'],
        experienceYears: 7,
        currentRole: 'Data Engineer'
      }
    ];

const mockJobs = [
      {
        id: 'job-1',
        title: 'Senior React Developer',
        description: 'Looking for experienced React developer',
        requiredSkills: ['React', 'TypeScript', 'Node.js'],
        seniorityLevel: 'Senior',
        department: 'Engineering'
      },
      {
        id: 'job-2',
        title: 'Data Scientist',
        description: 'Build ML models for our platform',
        requiredSkills: ['Python', 'ML', 'Statistics'],
        seniorityLevel: 'Mid-level',
        department: 'Data'
      }
    ];

export async function GET(request: NextRequest) {
  try {
    const operation = request.nextUrl.searchParams.get('operation');
    const organizationId = request.nextUrl.searchParams.get('organizationId');

    if (!operation) {
      return NextResponse.json(
        { error: 'Missing parameter: operation' },
        { status: 400 }
      );
    }

    let result;

    switch (operation) {
      case 'getCandidates':
        result = mockCandidates;
        break;

      case 'getJobs':
        result = mockJobs;
        break;

      case 'searchBySkills':
        const skills = request.nextUrl.searchParams.get('skills');
        if (!skills) {
          return NextResponse.json(
            { error: 'Missing parameter: skills' },
            { status: 400 }
          );
        }
        const skillsArray = skills.split(',').map(s => s.trim());
        result = mockCandidates.filter(c =>
          skillsArray.some(skill => c.skills.includes(skill))
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Operation '${operation}' completed successfully`,
    });
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
