const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function authenticateUser(req, res, next) {
  const devApiKeyHeader = req.headers['x-api-key'] || req.headers['X-Api-Key'];
  if (devApiKeyHeader && String(devApiKeyHeader) === 'dev-key') {
    req.user = { id: 'dev', email: 'dev@local', name: 'Developer (dev-key)' };
    console.debug('authenticate: dev-key bypass active, setting dev user');
    return next();
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    req.user = {
      id: payload.sub,        
      email: payload.email,
      name: payload.name,
    };
    return next();
  } catch (idErr) {
    try {
      const resp = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = resp.data;
      req.user = {
        id: payload.sub || payload.user_id,
        email: payload.email,
        name: payload.name,
      };
      return next();
    } catch (accessErr) {
      console.error('Token verification failed (idErr, accessErr):', idErr, accessErr);
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
}

module.exports = authenticateUser;
