import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (use SmartMemory in production)
const preferencesStore = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const preferences = preferencesStore.get(userId) || null;

    return NextResponse.json({
      success: true,
      data: preferences,
      message: 'User preferences retrieved successfully',
    });
  } catch (error) {
    console.error('Error retrieving preferences:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, preferences' },
        { status: 400 }
      );
    }

    preferencesStore.set(userId, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'User preferences saved successfully',
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      {
        error: 'Failed to save preferences',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
