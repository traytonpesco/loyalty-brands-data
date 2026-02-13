import express from 'express';
import passport from '../auth/passport';
import { issueAccessToken, issueRefreshToken, rotateRefreshToken } from '../auth/jwt';
import models from '../models';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { sendPasswordReset } from '../services/email';
import crypto from 'crypto';
import { addMs } from '../auth/ttl';

const router = express.Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err: any, user: any, info: any) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
    const roles = await user.getRoles().then((rs: any[]) => rs.map((r: any) => r.name));
    // collect permissions from roles
    const roleInstances = await user.getRoles();
    const permsNested = await Promise.all(roleInstances.map((r: any) => r.getPermissions()));
    const permissions = Array.from(new Set(permsNested.flat().map((p: any) => p.name)));
    const accessToken = await issueAccessToken(user, roles, permissions);
    const { refreshToken, jti, expiresAt } = await issueRefreshToken(user);
    res.json({ accessToken, refreshToken, jti, expiresAt });
  })(req, res, next);
});

router.post('/refresh', async (req, res) => {
  const { userId, refreshToken } = req.body || {};
  if (!userId || !refreshToken) return res.status(400).json({ error: 'Missing params' });
  const rotated = await rotateRefreshToken(userId, refreshToken);
  if (!rotated) return res.status(401).json({ error: 'Invalid refresh token' });
  const user = await models.User.findByPk(userId);
  if (!user) return res.status(401).json({ error: 'Invalid user' });
  const roles = await (user as any).getRoles().then((rs: any[]) => rs.map(r => r.name));
  const accessToken = await issueAccessToken(user, roles);
  res.json({ accessToken, refreshToken: rotated.refreshToken, jti: rotated.jti, expiresAt: rotated.expiresAt });
});

router.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
  res.json({ user: (req as any).user });
});

// Password reset: request
const requestResetSchema = z.object({ email: z.string().email() });
router.post('/request-reset', validate(requestResetSchema), async (req, res) => {
  const { email } = req.body as { email: string };
  const user = await models.User.findOne({ where: { email } });
  if (!user) return res.status(200).json({ ok: true }); // do not reveal
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + addMs('1h'));
  await models.PasswordResetToken.create({ userId: (user as any).id, tokenHash, expiresAt });
  await sendPasswordReset(email, rawToken, (user as any).id);
  return res.json({ ok: true });
});

// Password reset: consume
const resetSchema = z.object({ userId: z.string().uuid(), token: z.string(), password: z.string().min(8) });
router.post('/reset', validate(resetSchema), async (req, res) => {
  const { userId, token, password } = req.body as { userId: string; token: string; password: string };
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const rec: any = await models.PasswordResetToken.findOne({ where: { userId, tokenHash, usedAt: null } });
  if (!rec || rec.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: 'Invalid or expired token' });
  const user: any = await models.User.findByPk(userId);
  if (!user) return res.status(400).json({ error: 'Invalid user' });
  const bcrypt = require('bcrypt');
  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();
  rec.usedAt = new Date();
  await rec.save();
  return res.json({ ok: true });
});

export default router;
