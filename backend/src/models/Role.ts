import { getDB } from '../config/database';

export class RoleModel {
  public static async getAll(): Promise<any[]> {
    const db = await getDB();
    return await db.all(`SELECT * FROM roles ORDER BY id ASC`);
  }
}