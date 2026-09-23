import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { getDB } from '../config/database';
import { ABACEngine } from '../policies/abacEngine';
import { EnvironmentContext, DocumentResource } from '../types';

const normalizeDispositivo = (value?: string): 'CORPORATIVO' | 'PERSONAL' => {
  return value === 'CORPORATIVO' ? 'CORPORATIVO' : 'PERSONAL';
};

const buildEnvironmentContext = (req: AuthenticatedRequest): EnvironmentContext => {
  const hora =
    (req.body && req.body.hora) ||
    (req.headers['x-time'] as string) ||
    new Date().toTimeString().slice(0, 5);

  const direccion_ip =
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress || '127.0.0.1';

  const pais =
    (req.body && req.body.pais) ||
    (req.headers['x-country'] as string) ||
    req.user?.pais || 'PERU';

  const dispositivo = normalizeDispositivo(
    (req.body && req.body.dispositivo) || (req.headers['x-device'] as string)
  );

  return {
    hora,
    direccion_ip: direccion_ip.toString(),
    pais,
    dispositivo
  };
};

export const checkABAC = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Usuario no autenticado' });
  }

  if (user.estado !== 'ACTIVO') {
    return res.status(403).json({
      message: 'Acceso DENEGADO por ABAC',
      motivo: 'El usuario no está ACTIVO.'
    });
  }

  const env = buildEnvironmentContext(req);
  const action = req.path.includes('/aprobar')
    ? 'APPROVE'
    : req.method === 'GET'
      ? 'READ'
      : req.method === 'POST'
        ? 'CREATE'
        : req.method === 'PUT'
          ? 'UPDATE'
          : req.method === 'DELETE'
            ? 'DELETE'
            : 'READ';

  try {
    const db = await getDB();

    if (req.params.id) {
      const documentoRow = await db.get(`
        SELECT d.*, dep.nombre AS departamento
        FROM documentos d
        JOIN departamentos dep ON d.id_departamento = dep.id
        WHERE d.id = ?
      `, [req.params.id]);

      if (!documentoRow) {
        return res.status(404).json({ message: 'Documento no encontrado' });
      }

      const documento: DocumentResource = {
        id: documentoRow.id,
        titulo: documentoRow.titulo,
        departamento: documentoRow.departamento,
        nivel_confidencialidad: documentoRow.nivel_confidencialidad,
        estado: documentoRow.estado,
        pais: documentoRow.pais,
        propietario_id: documentoRow.propietario_id
      };

      const resultado = ABACEngine.evaluate(user, documento, env, action);

      if (!resultado.permitted) {
        res.locals.authorization = { layer: 'ABAC', permitted: false, reason: resultado.reason };
        return res.status(403).json({
          message: 'Acceso DENEGADO por ABAC',
          motivo: resultado.reason,
          evaluacion: {
            usuario: user.nombre,
            departamento_usuario: user.departamento,
            nivel_seguridad_usuario: user.nivel_seguridad,
            documento: documento.titulo,
            accion: action,
            politica: 'DENEGADO'
          }
        });
      }

      res.locals.authorization = { layer: 'ABAC', permitted: true, reason: resultado.reason };
      (req as any).documentoActual = documento;
      return next();
    }

    if (action === 'CREATE') {
      const departamento = await db.get(
        'SELECT nombre FROM departamentos WHERE id = ?',
        [req.body?.id_departamento]
      );

      if (!departamento) {
        return res.status(400).json({ message: 'Departamento de documento inválido' });
      }

      const documentoNuevo: DocumentResource = {
        id: 0,
        titulo: req.body.titulo || '',
        departamento: departamento.nombre,
        nivel_confidencialidad: Number(req.body.nivel_confidencialidad),
        estado: req.body.estado || 'PENDIENTE',
        pais: req.body.pais,
        propietario_id: user.id
      };
      const resultado = ABACEngine.evaluate(user, documentoNuevo, env, action);

      if (!resultado.permitted) {
        res.locals.authorization = { layer: 'ABAC', permitted: false, reason: resultado.reason };
        return res.status(403).json({ message: 'Acceso DENEGADO por ABAC', motivo: resultado.reason });
      }

      res.locals.authorization = { layer: 'ABAC', permitted: true, reason: resultado.reason };
      return next();
    }

    const documentos = await db.all(`
      SELECT d.*, dep.nombre AS departamento
      FROM documentos d
      JOIN departamentos dep ON d.id_departamento = dep.id
    `);

    const documentosPermitidos = documentos.filter((doc) => {
      const documento: DocumentResource = {
        id: doc.id,
        titulo: doc.titulo,
        departamento: doc.departamento,
        nivel_confidencialidad: doc.nivel_confidencialidad,
        estado: doc.estado,
        pais: doc.pais,
        propietario_id: doc.propietario_id
      };
      return ABACEngine.evaluate(user, documento, env, 'READ').permitted;
    });

    res.locals.authorization = { layer: 'ABAC', permitted: true, reason: 'Documentos filtrados por políticas ABAC' };
    (req as any).documentosPermitidos = documentosPermitidos;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error en la evaluación ABAC', error });
  }
};