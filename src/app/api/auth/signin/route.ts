import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Get dealer from database
    const dealer = await executeQuery(
      'SELECT * FROM dealers WHERE email = ?',
      [email]
    ) as any[];

    if (dealer.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const dealerData = dealer[0];
    
    // Verify password
    const isValidPassword = await verifyPassword(password, dealerData.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Remove sensitive data before returning
    const { password_hash, ...safeUser } = dealerData;

    return NextResponse.json(
      {
        message: 'Login successful',
        user: safeUser
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}