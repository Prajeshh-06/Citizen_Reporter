

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;


export async function verifyToken(request) {
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return new Response(JSON.stringify({ error: 'Server misconfigured: JWT_SECRET missing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Authorization header missing or malformed' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.slice(7).trim(); 

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    request.user = {
      id:         decoded.id,
      email:      decoded.email,
      name:       decoded.name,
      role:       decoded.role,
      wardNumber: decoded.wardNumber ?? null,
    };
    return null; 
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
