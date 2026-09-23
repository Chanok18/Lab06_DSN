import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getDB } from '../config/database';

export const getDocumentos = async (req: AuthenticatedRequest, res: Response) => {
  const documentos = (req as any).documentosPermitidos || [];
  return res.status(200).json({
    message: 'Acceso AUTORIZADO por ABAC',
    usuario: req.user?.nombre,
    departamento: req.user?.departamento,
    total_permitidos: documentos.length,
    documentos
  });
};

export const getDocumentoById = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const db = await getDB();
    const documento = await db.get(`
      SELECT d.*, dep.nombre AS departamento
      FROM documentos d
      JOIN departamentos dep ON d.id_departamento = dep.id
      WHERE d.id = ?
    `, [id]);

    if (!documento) {
      return res.status(404).json({ message: 'Documento no encontrado' });
    }

    return res.status(200).json({ documento });
  } catch (error) {
    return res.status(500).json({ message: 'Error al consultar documento', error });
  }
};

export const crearDocumento = async (req: AuthenticatedRequest, res: Response) => {
  const { titulo, descripcion, id_departamento, nivel_confidencialidad, pais, estado } = req.body;

  if (!titulo || !id_departamento || !nivel_confidencialidad || !pais) {
    return res.status(400).json({ message: 'Faltan campos requeridos para crear documento' });
  }

  try {
    const db = await getDB();
    const result = await db.run(
      `INSERT INTO documentos (titulo, descripcion, id_departamento, nivel_confidencialidad, estado, pais, propietario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion || null, id_departamento, nivel_confidencialidad, estado || 'PENDIENTE', pais, req.user?.id]
    );
    return res.status(201).json({ message: 'Documento creado exitosamente', id: result.lastID });
  } catch (error) {
    return res.status(500).json({ message: 'Error al crear documento', error });
  }
};

export const modificarDocumento = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { titulo, descripcion, nivel_confidencialidad, estado, pais } = req.body;

  try {
    const db = await getDB();
    await db.run(
      `UPDATE documentos
       SET titulo = COALESCE(?, titulo),
           descripcion = COALESCE(?, descripcion),
           nivel_confidencialidad = COALESCE(?, nivel_confidencialidad),
           estado = COALESCE(?, estado),
           pais = COALESCE(?, pais)
       WHERE id = ?`,
      [titulo, descripcion, nivel_confidencialidad, estado, pais, id]
    );
    return res.json({ message: 'Documento actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar documento', error });
  }
};

export const eliminarDocumento = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const db = await getDB();
    await db.run(`DELETE FROM documentos WHERE id = ?`, [id]);
    return res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al eliminar documento', error });
  }
};

export const aprobarDocumento = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const db = await getDB();
    await db.run(`UPDATE documentos SET estado = 'PUBLICADO' WHERE id = ?`, [id]);
    return res.json({ message: 'Documento APROBADO y PUBLICADO con éxito' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al aprobar documento', error });
  }
};