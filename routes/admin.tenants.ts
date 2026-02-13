import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import models from '../models';
import { requirePermission } from '../middleware/rbac';
import csvParserService from '../services/csvParser';
import * as path from 'path';
import * as fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/csv/',
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'csv');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// List all tenants with optional search and pagination
router.get('/', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '20', 10);
    const offset = (page - 1) * pageSize;
    
    const where: any = q
      ? { name: { [require('sequelize').Op.like]: `%${q}%` } }
      : {};
    
    const { rows, count } = await (models as any).Tenant.findAndCountAll({
      where,
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ items: rows, total: count, page, pageSize });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single tenant by ID
router.get('/:id', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await (models as any).Tenant.findByPk(id, {
      include: [
        {
          model: (models as any).User,
          attributes: ['id', 'email', 'firstName', 'lastName'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create tenant
const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#78BE20'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#006633'),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#78BE20'),
  isActive: z.boolean().default(true)
});

router.post('/', requirePermission(['tenants.write']), validate(createTenantSchema), async (req, res) => {
  try {
    const tenantData = req.body;
    
    // Check if slug already exists
    const existing = await (models as any).Tenant.findOne({ where: { slug: tenantData.slug } });
    if (existing) {
      return res.status(409).json({ error: 'Slug already exists' });
    }
    
    const tenant = await (models as any).Tenant.create(tenantData);
    res.status(201).json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update tenant
const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  logoUrl: z.string().url().optional().nullable(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional()
});

router.put('/:id', requirePermission(['tenants.write']), validate(updateTenantSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const tenant: any = await (models as any).Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Check slug uniqueness if updating slug
    if (updates.slug && updates.slug !== tenant.slug) {
      const existing = await (models as any).Tenant.findOne({ where: { slug: updates.slug } });
      if (existing) {
        return res.status(409).json({ error: 'Slug already exists' });
      }
    }
    
    await tenant.update(updates);
    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete (soft delete) tenant
router.delete('/:id', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { id } = req.params;
    const tenant: any = await (models as any).Tenant.findByPk(id);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    await tenant.update({ isActive: false });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant users
router.get('/:id/users', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await (models as any).Tenant.findByPk(id, {
      include: [
        {
          model: (models as any).User,
          attributes: ['id', 'email', 'firstName', 'lastName', 'isActive'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(tenant.Users || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assign users to tenant
const assignUsersSchema = z.object({
  userIds: z.array(z.string().uuid())
});

router.post('/:id/users', requirePermission(['tenants.write']), validate(assignUsersSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    
    const tenant: any = await (models as any).Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const users = await (models as any).User.findAll({ where: { id: userIds } });
    await tenant.addUsers(users);
    
    res.json({ ok: true, assignedCount: users.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove user from tenant
router.delete('/:id/users/:userId', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { id, userId } = req.params;
    
    const tenant: any = await (models as any).Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const user = await (models as any).User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await tenant.removeUser(user);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload CSV for tenant
router.post('/:id/upload-csv', requirePermission(['campaigns.upload']), upload.single('csvFile'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const tenant = await (models as any).Tenant.findByPk(id);
    if (!tenant) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const user: any = (req as any).user;
    const campaignId = await csvParserService.parseCSVFile(file.path, id, user.id);
    
    // Clean up uploaded file after processing
    fs.unlinkSync(file.path);
    
    res.json({ 
      ok: true, 
      campaignId,
      message: 'CSV processed successfully' 
    });
  } catch (error: any) {
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Get tenant campaigns
router.get('/:id/campaigns', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await (models as any).Tenant.findByPk(id);
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const campaigns = await (models as any).Campaign.findAll({
      where: { tenantId: id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tenant CSV uploads history
router.get('/:id/csv-uploads', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const uploads = await (models as any).CSVUpload.findAll({
      where: { tenantId: id },
      include: [
        {
          model: (models as any).User,
          as: 'User',
          attributes: ['email', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(uploads);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

