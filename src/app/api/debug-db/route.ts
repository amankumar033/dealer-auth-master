import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    
    // Get database info
    const [rows] = await connection.execute('SELECT DATABASE() as current_db, USER() as current_user');
    
    connection.release();
    
    return NextResponse.json({
      message: 'Database Debug Info',
      environment_variables: {
        DB_HOST: process.env.DB_HOST || 'NOT_SET',
        DB_USER: process.env.DB_USER || 'NOT_SET',
        DB_NAME: process.env.DB_NAME || 'NOT_SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
        DB_PORT: process.env.DB_PORT || 'NOT_SET'
      },
      database_info: (rows as any[])[0],
      is_remote_db: process.env.DB_HOST === '82.29.162.35',
      env_file_loaded: process.env.DB_HOST === '82.29.162.35' ? 'YES' : 'NO'
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      environment_variables: {
        DB_HOST: process.env.DB_HOST || 'NOT_SET',
        DB_USER: process.env.DB_USER || 'NOT_SET',
        DB_NAME: process.env.DB_NAME || 'NOT_SET',
        DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
        DB_PORT: process.env.DB_PORT || 'NOT_SET'
      }
    }, { status: 500 });
  }
}


