import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { getDB } from '../config/database';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMINISTRADOR: ['DOC_READ', 'DOC_CREATE', 'DOC_UPDATE', 'DOC_DELETE', 'DOC_APPROVE', 'USER_READ', 'USER_CREATE', 'USER_UPDATE', 'AUDIT_READ', 'ROLE_ASSIGN'],
  GERENTE: ['DOC_READ', 'DOC_CREATE', 'DOC_UPDATE', 'DOC_DELETE', 'DOC_APPROVE', 'AUDIT_READ'],
  SUPERVISOR: ['DOC_READ', 'DOC_CREATE', 'DOC_UPDATE', 'DOC_APPROVE'],
  EMPLEADO: ['DOC_READ', 'DOC_CREATE', 'DOC_UPDATE'],
  AUDITOR: ['DOC_READ', 'AUDIT_READ'],
  INVITADO: ['DOC_READ']
};

export const checkRBAC = (permisoRequerido: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const permiso = permisoRequerido.toUpperCase();
    const permisosRol = ROLE_PERMISSIONS[req.user.rol] ?? [];

    if (permisosRol.includes(permiso)) {
      res.locals.authorization = { layer: 'RBAC', permitted: true, permission: permiso };
      return next();
    }

    try {
      const db = await getDB();
      const query = `
        SELECT p.codigo
        FROM permisos p
        JOIN rol_permisos rp ON p.id = rp.id_permiso
        JOIN roles r ON r.id = rp.id_rol
        WHERE r.nombre = ? AND p.codigo = ?
      `;

      const result = await db.get(query, [req.user.rol, permiso]);

      if (result) {
        res.locals.authorization = { layer: 'RBAC', permitted: true, permission: permiso };
        return next();
      }

      res.locals.authorization = { layer: 'RBAC', permitted: false, permission: permiso };
      return res.status(403).json({
        message: 'Acceso denegado por RBAC',
        rol: req.user.rol,
        permisoRequerido: permiso
      });
    } catch (error) {
      return res.status(500).json({ message: 'Error en verificación RBAC', error });
    }
  };
};