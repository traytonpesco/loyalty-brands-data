import express from 'express';
import models from '../models';
import { requirePermission } from '../middleware/rbac';

const router = express.Router();

// Get all roles
router.get('/', requirePermission(['users.read']), async (req, res) => {
  try {
    const roles = await (models as any).Role.findAll({
      order: [['name', 'ASC']]
    });
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single role by ID
router.get('/:id', requirePermission(['users.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const role = await (models as any).Role.findByPk(id, {
      include: [
        {
          model: (models as any).Permission,
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] }
        }
      ]
    });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    res.json(role);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

