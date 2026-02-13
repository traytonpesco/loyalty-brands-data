import express from 'express';
import models from '../models';
import { requirePermission } from '../middleware/rbac';
import {
  addScheduledExport,
  updateScheduledExport,
  removeScheduledExport,
  triggerScheduledExport,
} from '../services/scheduledExportService';
import cron from 'node-cron';

const router = express.Router();

// Helper to get user's tenant IDs
async function getUserTenantIds(user: any): Promise<string[]> {
  if (!user) return [];
  const roles = await user.getRoles();
  const isSuperAdmin = roles.some((r: any) => r.name === 'super_admin');
  if (isSuperAdmin) {
    const allTenants = await (models as any).Tenant.findAll({ attributes: ['id'] });
    return allTenants.map((t: any) => t.id);
  }
  const tenants = await user.getTenants();
  return tenants.map((t: any) => t.id);
}

/**
 * @swagger
 * /scheduled-exports:
 *   get:
 *     summary: Get all scheduled exports for authorized tenants
 *     tags: [Scheduled Exports]
 *     responses:
 *       200:
 *         description: List of scheduled exports
 */
router.get('/', requirePermission(['exports.read']), async (req, res) => {
  try {
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    if (tenantIds.length === 0) {
      return res.json([]);
    }

    const scheduledExports = await (models as any).ScheduledExport.findAll({
      where: { tenantId: tenantIds },
      include: [
        {
          model: (models as any).Tenant,
          attributes: ['id', 'name'],
        },
        {
          model: (models as any).User,
          as: 'Creator',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(scheduledExports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports/{id}:
 *   get:
 *     summary: Get a specific scheduled export by ID
 *     tags: [Scheduled Exports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scheduled export details
 *       404:
 *         description: Not found
 */
router.get('/:id', requirePermission(['exports.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const scheduledExport = await (models as any).ScheduledExport.findByPk(id, {
      include: [
        {
          model: (models as any).Tenant,
          attributes: ['id', 'name'],
        },
        {
          model: (models as any).User,
          as: 'Creator',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
    });

    if (!scheduledExport) {
      return res.status(404).json({ error: 'Scheduled export not found' });
    }

    if (!tenantIds.includes(scheduledExport.tenantId)) {
      return res.status(403).json({ error: 'Access denied to this scheduled export' });
    }

    res.json(scheduledExport);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports:
 *   post:
 *     summary: Create a new scheduled export
 *     tags: [Scheduled Exports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - name
 *               - exportType
 *               - format
 *               - schedule
 *               - recipients
 *             properties:
 *               tenantId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               exportType:
 *                 type: string
 *                 enum: [campaign, campaigns, aggregate]
 *               format:
 *                 type: string
 *                 enum: [csv, excel, json, xml]
 *               schedule:
 *                 type: string
 *                 description: Cron expression (e.g., "0 9 * * MON" for every Monday at 9 AM)
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *               filters:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Scheduled export created
 *       400:
 *         description: Invalid input
 */
router.post('/', requirePermission(['exports.write']), async (req, res) => {
  try {
    const { tenantId, name, description, exportType, format, schedule, recipients, filters, isActive } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }

    // Validate recipients
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'At least one recipient email is required' });
    }

    const newScheduledExport = await (models as any).ScheduledExport.create({
      tenantId,
      name,
      description,
      exportType: exportType || 'aggregate',
      format: format || 'excel',
      schedule,
      recipients,
      filters: filters || {},
      isActive: isActive !== undefined ? isActive : true,
      createdBy: user.id,
    });

    // Schedule the job
    addScheduledExport(newScheduledExport.get({ plain: true }));

    res.status(201).json(newScheduledExport);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports/{id}:
 *   put:
 *     summary: Update an existing scheduled export
 *     tags: [Scheduled Exports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Scheduled export updated
 *       404:
 *         description: Not found
 */
router.put('/:id', requirePermission(['exports.write']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, exportType, format, schedule, recipients, filters, isActive } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const scheduledExport = await (models as any).ScheduledExport.findByPk(id);

    if (!scheduledExport) {
      return res.status(404).json({ error: 'Scheduled export not found' });
    }

    if (!tenantIds.includes(scheduledExport.tenantId)) {
      return res.status(403).json({ error: 'Access denied to this scheduled export' });
    }

    // Validate cron expression if provided
    if (schedule && !cron.validate(schedule)) {
      return res.status(400).json({ error: 'Invalid cron expression' });
    }

    // Validate recipients if provided
    if (recipients && (!Array.isArray(recipients) || recipients.length === 0)) {
      return res.status(400).json({ error: 'At least one recipient email is required' });
    }

    await scheduledExport.update({
      name,
      description,
      exportType,
      format,
      schedule,
      recipients,
      filters,
      isActive,
    });

    // Update the scheduled job
    updateScheduledExport(scheduledExport.get({ plain: true }));

    res.json(scheduledExport);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports/{id}:
 *   delete:
 *     summary: Delete a scheduled export
 *     tags: [Scheduled Exports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scheduled export deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', requirePermission(['exports.write']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const scheduledExport = await (models as any).ScheduledExport.findByPk(id);

    if (!scheduledExport) {
      return res.status(404).json({ error: 'Scheduled export not found' });
    }

    if (!tenantIds.includes(scheduledExport.tenantId)) {
      return res.status(403).json({ error: 'Access denied to this scheduled export' });
    }

    // Remove the scheduled job
    removeScheduledExport(id);

    await scheduledExport.destroy();

    res.json({ message: 'Scheduled export deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports/{id}/trigger:
 *   post:
 *     summary: Manually trigger a scheduled export
 *     tags: [Scheduled Exports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export triggered successfully
 *       404:
 *         description: Not found
 */
router.post('/:id/trigger', requirePermission(['exports.write']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const scheduledExport = await (models as any).ScheduledExport.findByPk(id);

    if (!scheduledExport) {
      return res.status(404).json({ error: 'Scheduled export not found' });
    }

    if (!tenantIds.includes(scheduledExport.tenantId)) {
      return res.status(403).json({ error: 'Access denied to this scheduled export' });
    }

    // Trigger the export asynchronously
    triggerScheduledExport(id).catch(error => {
      console.error(`Failed to trigger scheduled export ${id}:`, error);
    });

    res.json({ message: 'Export triggered successfully. You will receive an email when complete.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports/{id}/history:
 *   get:
 *     summary: Get export history for a scheduled export
 *     tags: [Scheduled Exports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export history
 *       404:
 *         description: Not found
 */
router.get('/:id/history', requirePermission(['exports.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const scheduledExport = await (models as any).ScheduledExport.findByPk(id);

    if (!scheduledExport) {
      return res.status(404).json({ error: 'Scheduled export not found' });
    }

    if (!tenantIds.includes(scheduledExport.tenantId)) {
      return res.status(403).json({ error: 'Access denied to this scheduled export' });
    }

    const history = await (models as any).ExportHistory.findAll({
      where: { scheduledExportId: id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /scheduled-exports/validate-cron:
 *   post:
 *     summary: Validate a cron expression
 *     tags: [Scheduled Exports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - expression
 *             properties:
 *               expression:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result
 */
router.post('/validate-cron', requirePermission(['exports.read']), async (req, res) => {
  try {
    const { expression } = req.body;
    
    const isValid = cron.validate(expression);
    
    res.json({
      valid: isValid,
      expression,
      message: isValid ? 'Valid cron expression' : 'Invalid cron expression',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

