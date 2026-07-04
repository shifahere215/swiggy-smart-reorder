import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Initiates OAuth 2.1 PKCE Flow
  const clientId = process.env.SWIGGY_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/callback`;
  
  if (!clientId) {
    console.warn("SWIGGY_CLIENT_ID is not set. Using mock auth flow for local development.");
    // Simulate successful auth by immediately redirecting to callback with a mock code
    return NextResponse.redirect(`${redirectUri}?code=mock_auth_code_12345`);
  }

  // Real OAuth flow
  const authUrl = new URL('https://mcp.swiggy.com/oauth/authorize');
  authUrl.searchParams.append('client_id', clientId);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'mcp:tools mcp:resources mcp:prompts');
  
  // Note: For full PKCE, we'd generate a code_challenge here and save the code_verifier in an httpOnly cookie
  
  return NextResponse.redirect(authUrl.toString());
}
