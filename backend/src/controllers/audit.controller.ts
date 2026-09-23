import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuditModel } from '../models/Audit';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const logs = await AuditModel.getAll();
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener logs de auditoría', error });
  }
};