import jwt from 'jsonwebtoken';

const isProduction = process.env.NODE_ENV === 'production';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (isProduction) {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('⚠️  JWT_SECRET not set — using an insecure development fallback. Set JWT_SECRET before deploying.');
}

// Only reached in non-production when JWT_SECRET is missing
const devSecret = JWT_SECRET || 'assetorbit-super-secret-jwt-key-2026';
const ACTIVE_SECRET = JWT_SECRET || devSecret;

export interface TokenPayload {
  userId: string;
  orgId: string;
  orgName: string;
  email: string;
  name: string;
  role: string;
  department: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACTIVE_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, ACTIVE_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
}