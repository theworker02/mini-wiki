import { NextResponse } from 'next/server';

function unsupported() {
  return NextResponse.json(
    { error: 'This build uses the local /api/auth/session endpoints instead of Auth.js.' },
    { status: 404 }
  );
}

export { unsupported as GET, unsupported as POST };
