import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Environment Variables Test',
    db_host: process.env.DB_HOST,
    db_user: process.env.DB_USER,
    db_name: process.env.DB_NAME,
    email_host: process.env.EMAIL_HOST,
    email_user: process.env.EMAIL_USER,
    has_email_pass: !!process.env.EMAIL_PASS,
    env_file_loaded: process.env.DB_HOST === '82.29.162.35' ? 'YES' : 'NO'
  });
}


