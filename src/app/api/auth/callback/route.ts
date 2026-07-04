import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const clientId = process.env.SWIGGY_CLIENT_ID;
  
  if (!clientId || code === 'mock_auth_code_12345') {
    // Mock token exchange for local dev
    const cookieStore = await cookies();
    cookieStore.set('swiggy_access_token', 'mock_access_token_67890', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  } else {
    // Real token exchange
    const tokenRes = await fetch('https://mcp.swiggy.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`
        // PKCE code_verifier would be sent here
      })
    });
    
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      const cookieStore = await cookies();
      cookieStore.set('swiggy_access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    } else {
      return NextResponse.json({ error: 'Token exchange failed' }, { status: 500 });
    }
  }

  // Redirect back to home
  return NextResponse.redirect(new URL('/', request.url));
}
