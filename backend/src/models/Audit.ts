import { getDB } from '../config/database';
import { AuditLog } from '../types';

export class AuditModel {
  public static async getAll(): Promise<AuditLog[]> {
    const db = await getDB();
    const query = `SELECT * FROM auditoria ORDER BY fecha DESC`;
    return await db.all(query);
  }
}