import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { hashPassword, validateEmployeeId, validateEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role, employee_id, full_name } = await request.json();

    // Validate required fields
    if (!username || !email || !password || !role || !employee_id || !full_name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['operator', 'technician', 'management'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Validate employee ID format
    if (!validateEmployeeId(employee_id)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format. Must be in format EMP followed by 3-6 digits.' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await database.getUser(username);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const existingEmail = await database.getUser(email, true);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userData = {
      username,
      email,
      password: hashedPassword,
      role,
      employee_id,
      full_name,
    };

    await database.createUser(userData);

    return NextResponse.json({
      message: 'Registration successful. Please wait for administrator verification.',
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle unique constraint violations
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      if (error.message.includes('employee_id')) {
        return NextResponse.json(
          { error: 'Employee ID already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}