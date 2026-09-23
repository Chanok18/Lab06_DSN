import { getDB } from '../config/database';
import { UserSubject } from '../types';

export class UserModel {
  public static async findByEmail(email: string): Promise<(UserSubject & { password_hash: string }) | null> {
    const db = await getDB();
    const query = `
      SELECT u.id, u.nombre, u.email, u.password_hash, r.nombre AS rol, d.nombre AS departamento, 
             u.nivel_seguridad, u.pais, u.tipo_contrato, u.estado
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id
      JOIN departamentos d ON u.id_departamento = d.id
      WHERE u.email = ?
    `;
    const user = await db.get(query, [email]);
    return user || null;
  }

  public static async findById(id: number): Promise<UserSubject | null> {
    const db = await getDB();
    const query = `
      SELECT u.id, u.nombre, r.nombre AS rol, d.nombre AS departamento, 
             u.nivel_seguridad, u.pais, u.tipo_contrato, u.estado
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id
      JOIN departamentos d ON u.id_departamento = d.id
      WHERE u.id = ?
    `;
    const user = await db.get(query, [id]);
    return user || null;
  }
}