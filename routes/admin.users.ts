import express from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import models from '../models';
import { requirePermission } from '../middleware/rbac';
import { sendPasswordReset } from '../services/email';

const router = express.Router();

// List users with optional search and pagination
router.get('/', requirePermission(['users.read']), async (req, res) => {
  const q = (req.query.q as string) || '';
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = parseInt((req.query.pageSize as string) || '10', 10);
  const offset = (page - 1) * pageSize;
  const where: any = q
    ? { email: { [require('sequelize').Op.like]: `%${q}%` } }
    : {};
  const { rows, count } = await (models as any).User.findAndCountAll({ where, limit: pageSize, offset, order: [['createdAt', 'DESC']] });
  res.json({ items: rows, total: count, page, pageSize });
});

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(8),
  roles: z.array(z.string()).default(['user'])
});

router.post('/', requirePermission(['users.write']), validate(createSchema), async (req, res) => {
  const { email, firstName, lastName, password, roles } = req.body;
  const existing = await (models as any).User.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already exists' });
  const bcrypt = require('bcrypt');
  const user = await (models as any).User.create({ email, firstName, lastName, passwordHash: await bcrypt.hash(password, 12) });
  if (roles?.length) {
    const roleModels = await (models as any).Role.findAll({ where: { name: roles } });
    await (user as any).setRoles(roleModels);
  }
  res.status(201).json(user);
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  password: z.string().min(8).optional(),
  roles: z.array(z.string()).optional()
});

router.put('/:id', requirePermission(['users.write']), validate(updateSchema), async (req, res) => {
  const { id } = req.params as any;
  const { email, firstName, lastName, password, roles } = req.body;
  const user: any = await (models as any).User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  if (email) user.email = email;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (password) {
    const bcrypt = require('bcrypt');
    user.passwordHash = await bcrypt.hash(password, 12);
  }
  await user.save();
  if (roles) {
    const roleModels = await (models as any).Role.findAll({ where: { name: roles } });
    await user.setRoles(roleModels);
  }
  res.json(user);
});

const statusSchema = z.object({ isActive: z.boolean() });
router.patch('/:id/status', requirePermission(['users.write']), validate(statusSchema), async (req, res) => {
  const { id } = req.params as any;
  const { isActive } = req.body as any;
  const user: any = await (models as any).User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  user.isActive = isActive;
  await user.save();
  res.json(user);
});

router.delete('/:id', requirePermission(['users.write']), async (req, res) => {
  const { id } = req.params as any;
  const user: any = await (models as any).User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  await user.destroy();
  res.json({ ok: true });
});

router.post('/:id/reset', requirePermission(['users.write']), async (req, res) => {
  const { id } = req.params as any;
  const user: any = await (models as any).User.findByPk(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const crypto = require('crypto');
  const { addMs } = require('../auth/ttl');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + addMs('1h'));
  await (models as any).PasswordResetToken.create({ userId: user.id, tokenHash, expiresAt });
  await sendPasswordReset(user.email, rawToken, user.id);
  res.json({ ok: true });
});

// Get user's roles
router.get('/:id/roles', requirePermission(['users.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = await (models as any).User.findByPk(id, {
      include: [
        {
          model: (models as any).Role,
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user.Roles || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
