
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Google OAuth authentication is no longer supported.',
      message: 'Use POST /api/auth/register or POST /api/auth/login instead.',
    },
    { status: 410 } 
  );
}
