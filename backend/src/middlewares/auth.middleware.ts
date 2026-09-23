import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwt';
import { UserSubject } from '../types';
import { UserModel } from '../models/User';

const revokedTokens = new Set<string>();

export const revokeToken = (token: string) => revokedTokens.add(token);

export interface AuthenticatedRequest extends Request {
  user?: UserSubject;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso no proporcionado' });
  }

  if (revokedTokens.has(token)) {
    return res.status(401).json({ message: 'Sesión cerrada. Inicie sesión nuevamente.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as UserSubject;
    const currentUser = await UserModel.findById(payload.id);

    if (!currentUser || currentUser.estado !== 'ACTIVO') {
      res.locals.authorization = {
        layer: 'ABAC',
        permitted: false,
        reason: 'El usuario no está ACTIVO'
      };
      return res.status(403).json({ message: 'Usuario INACTIVO. Acceso denegado.' });
    }

    req.user = currentUser;
    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};