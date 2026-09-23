import bcrypt from 'bcrypt';
import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getDB } from '../config/database';

export const listarUsuarios = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = await getDB();
    const usuarios = await db.all(`
      SELECT u.id, u.nombre, u.email, r.nombre AS rol, d.nombre AS departamento,
             u.nivel_seguridad, u.pais, u.tipo_contrato, u.estado
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id
      JOIN departamentos d ON u.id_departamento = d.id
      ORDER BY u.id ASC
    `);

    return res.status(200).json({ usuarios });
  } catch (error) {
    return res.status(500).json({ message: 'Error al listar usuarios', error });
  }
};

export const obtenerUsuarioPorId = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const db = await getDB();
    const usuario = await db.get(`
      SELECT u.id, u.nombre, u.email, r.nombre AS rol, d.nombre AS departamento,
             u.nivel_seguridad, u.pais, u.tipo_contrato, u.estado
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id
      JOIN departamentos d ON u.id_departamento = d.id
      WHERE u.id = ?
    `, [id]);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.status(200).json({ usuario });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener usuario', error });
  }
};

export const registrarUsuario = async (req: AuthenticatedRequest, res: Response) => {
  const { nombre, email, password, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato } = req.body;

  if (!nombre || !email || !password || !id_rol || !id_departamento || !nivel_seguridad || !pais) {
    return res.status(400).json({ message: 'Faltan datos para registrar usuario' });
  }

  try {
    const db = await getDB();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      `INSERT INTO usuarios (nombre, email, password_hash, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO')`,
      [nombre, email, passwordHash, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato || 'INTERNO']
    );
    return res.status(201).json({ message: 'Usuario registrado con éxito', id: result.lastID });
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar usuario', error });
  }
};

export const modificarUsuario = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { nombre, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato, estado } = req.body;

  try {
    const db = await getDB();
    await db.run(
      `UPDATE usuarios
       SET nombre = COALESCE(?, nombre),
           id_rol = COALESCE(?, id_rol),
           id_departamento = COALESCE(?, id_departamento),
           nivel_seguridad = COALESCE(?, nivel_seguridad),
           pais = COALESCE(?, pais),
           tipo_contrato = COALESCE(?, tipo_contrato),
           estado = COALESCE(?, estado)
       WHERE id = ?`,
      [nombre, id_rol, id_departamento, nivel_seguridad, pais, tipo_contrato, estado, id]
    );
    return res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar usuario', error });
  }
};

export const cambiarEstadoUsuario = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado || !['ACTIVO', 'INACTIVO'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido. Use ACTIVO o INACTIVO.' });
  }

  try {
    const db = await getDB();
    await db.run(`UPDATE usuarios SET estado = ? WHERE id = ?`, [estado, id]);
    return res.json({ message: `Estado del usuario actualizado a ${estado}` });
  } catch (error) {
    return res.status(500).json({ message: 'Error al cambiar estado', error });
  }
};