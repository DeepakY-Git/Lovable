import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get problem requests based on user role
    const problems = await database.getProblemRequests(payload.userId, payload.role);

    return NextResponse.json({ problems });

  } catch (error) {
    console.error('Get problems error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Only operators can create problem requests
    if (payload.role !== 'operator') {
      return NextResponse.json(
        { error: 'Only operators can create problem requests' },
        { status: 403 }
      );
    }

    const { title, description, priority } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    const requestData = {
      title,
      description,
      priority: priority || 'medium',
      operator_id: payload.userId,
    };

    const result = await database.createProblemRequest(requestData);

    // Get available technicians and create notifications
    const technicians = await database.getTechnicians();
    
    for (const technician of technicians) {
      await database.createNotification({
        user_id: technician.id,
        problem_request_id: result.lastID,
        message: `New problem request: ${title}`,
      });
    }

    return NextResponse.json({
      message: 'Problem request created successfully',
      id: result.lastID,
    });

  } catch (error) {
    console.error('Create problem error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}