import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { getDB } from '../config/database';

export const auditLogger = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const recurso = req.originalUrl;
  const accion = req.path.includes('/aprobar')
    ? 'APPROVE'
    : req.method === 'GET'
      ? 'READ'
      : req.method === 'POST'
        ? 'CREATE'
        : req.method === 'PUT'
          ? 'UPDATE'
          : req.method === 'DELETE'
            ? 'DELETE'
            : req.method;

  res.on('finish', async () => {
    try {
      const db = await getDB();
      const usuario = req.user ? req.user.nombre : 'ANONIMO';
      const resultado = res.statusCode < 400 ? 'PERMITIDO' : 'DENEGADO';
      const authorization = res.locals.authorization;
      const motivo = authorization?.reason ||
        (authorization?.permitted === false
          ? `Denegado por ${authorization.layer}`
          : `Respuesta con status code ${res.statusCode}`);

      await db.run(
        `INSERT INTO auditoria (usuario, recurso, accion, resultado, motivo) VALUES (?, ?, ?, ?, ?)`,
        [usuario, recurso, accion, resultado, motivo]
      );
    } catch (err) {
      console.error('Error guardando registro de auditoria:', err);
    }
  });

  next();
};