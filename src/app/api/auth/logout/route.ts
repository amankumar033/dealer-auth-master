import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create a response that clears the session
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear any cookies if they exist
    response.cookies.delete('auth-token');
    response.cookies.delete('dealer-session');

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 