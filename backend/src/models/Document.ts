import { getDB } from '../config/database';
import { DocumentResource } from '../types';

export class DocumentModel {
  public static async findById(id: number): Promise<DocumentResource | null> {
    const db = await getDB();
    const query = `
      SELECT doc.id, doc.titulo, d.nombre AS departamento, doc.nivel_confidencialidad,
             doc.estado, doc.pais, doc.propietario_id
      FROM documentos doc
      JOIN departamentos d ON doc.id_departamento = d.id
      WHERE doc.id = ?
    `;
    const doc = await db.get(query, [id]);
    return doc || null;
  }

  public static async getAll(): Promise<DocumentResource[]> {
    const db = await getDB();
    const query = `
      SELECT doc.id, doc.titulo, d.nombre AS departamento, doc.nivel_confidencialidad,
             doc.estado, doc.pais, doc.propietario_id
      FROM documentos doc
      JOIN departamentos d ON doc.id_departamento = d.id
    `;
    return await db.all(query);
  }
}