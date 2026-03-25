const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = {
      id: payload.id,
      username: payload.username
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.id, username: payload.username };
  } catch {
    req.user = null;
  }

  return next();
}

module.exports = {
  authMiddleware,
  optionalAuth
};
