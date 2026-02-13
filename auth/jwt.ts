import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { addMs } from './ttl';
import models from '../models';

export async function issueAccessToken(user: any, roles: string[], permissions: string[] = []) {
  const secret: Secret = (process.env.JWT_SECRET as string) || 'change-me';
  const ttl = (process.env.JWT_ACCESS_TTL as string) || '15m';
  
  // Check if user is super admin
  const isSuperAdmin = roles.includes('super_admin');
  
  // Get user's tenant IDs
  let tenantIds: string[] = [];
  if (typeof user.getTenants === 'function') {
    const tenants = await user.getTenants();
    tenantIds = tenants.map((t: any) => t.id);
  }
  
  const payload = { 
    sub: user.id, 
    roles, 
    permissions,
    tenantIds,
    isSuperAdmin
  };
  const options: SignOptions = { expiresIn: ttl as any };
  return jwt.sign(payload, secret, options);
}

export async function issueRefreshToken(user: any) {
  const randomToken = crypto.randomBytes(48).toString('hex');
  const jti = crypto.randomUUID();
  const tokenHash = crypto.createHash('sha256').update(randomToken).digest('hex');
  const ttl = (process.env.JWT_REFRESH_TTL as string) || '7d';
  const expiresAt = new Date(Date.now() + addMs(ttl));
  await models.RefreshToken.create({ userId: user.id, tokenHash, jti, expiresAt });
  return { refreshToken: randomToken, jti, expiresAt };
}

export async function rotateRefreshToken(userId: string, presentedToken: string) {
  const tokenHash = crypto.createHash('sha256').update(presentedToken).digest('hex');
  const record: any = await models.RefreshToken.findOne({ where: { userId, tokenHash, revokedAt: null } });
  if (!record) return null;
  if (record.expiresAt.getTime() < Date.now()) return null;
  record.revokedAt = new Date();
  await record.save();
  return issueRefreshToken({ id: userId });
}

export function verifyAccessToken(token: string) {
  const secret: Secret = (process.env.JWT_SECRET as string) || 'change-me';
  return jwt.verify(token, secret);
}
