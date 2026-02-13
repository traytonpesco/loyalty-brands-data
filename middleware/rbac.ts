import { Request, Response, NextFunction } from 'express';
import models from '../models';

async function getUserRoles(req: Request): Promise<string[]> {
  const u: any = (req as any).user;
  if (!u) return [];
  if (Array.isArray(u.roles) && u.roles.length) return u.roles as string[];
  if (typeof u.getRoles === 'function') {
    const rs = await u.getRoles();
    return rs.map((r: any) => r.name);
  }
  return [];
}

async function getUserPermissions(req: Request): Promise<string[]> {
  const u: any = (req as any).user;
  if (!u) return [];
  if (Array.isArray(u.permissions) && u.permissions.length) return u.permissions as string[];
  // Session user (Sequelize instance): compute via roles → permissions
  if (typeof u.getRoles === 'function') {
    const roles = await u.getRoles();
    const permsNested = await Promise.all(roles.map((r: any) => r.getPermissions()));
    const perms = Array.from(new Set(permsNested.flat().map((p: any) => p.name)));
    return perms;
  }
  return [];
}

export function requireRole(required: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const roles = await getUserRoles(req);
    if (!required.some(r => roles.includes(r))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export function requirePermission(required: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const perms = await getUserPermissions(req);
    if (!required.some(p => perms.includes(p))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const roles = await getUserRoles(req);
    if (!roles.includes('super_admin')) {
      return res.status(403).json({ error: 'Super admin access required' });
    }
    next();
  };
}

export function requireTenantAccess(tenantIdParam: string = 'tenantId') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = req.params[tenantIdParam] || req.query[tenantIdParam] || req.body[tenantIdParam];
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }
    
    const u: any = (req as any).user;
    if (!u) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if user is super admin
    const roles = await getUserRoles(req);
    if (roles.includes('super_admin')) {
      return next();
    }
    
    // Check if user has access to this tenant
    const tenants = await u.getTenants();
    const hasAccess = tenants.some((t: any) => t.id === tenantId);
    
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }
    
    next();
  };
}

export async function isSuperAdmin(req: Request): Promise<boolean> {
  const roles = await getUserRoles(req);
  return roles.includes('super_admin');
}

export async function getUserTenantIds(req: Request): Promise<string[]> {
  const u: any = (req as any).user;
  if (!u) return [];
  
  // Check if super admin
  const roles = await getUserRoles(req);
  if (roles.includes('super_admin')) {
    // Return all tenant IDs
    const allTenants = await models.Tenant.findAll({ attributes: ['id'] });
    return allTenants.map((t: any) => t.id);
  }
  
  // Return user's assigned tenants
  const tenants = await u.getTenants();
  return tenants.map((t: any) => t.id);
}
