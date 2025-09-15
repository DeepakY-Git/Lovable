import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await database.getUser(username);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is verified
    if (!user.is_verified) {
      return NextResponse.json(
        { error: 'Account not verified. Please contact administrator.' },
        { status: 401 }
      );
    }

    // Compare password
    const isValidPassword = await comparePassword(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data (without password) and token
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      employee_id: user.employee_id,
      full_name: user.full_name,
    };

    return NextResponse.json({
      user: userData,
      token,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}