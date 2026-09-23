import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { checkRBAC } from '../middlewares/rbac.middleware';
import { auditLogger } from '../middlewares/audit.middleware';
import {
  listarUsuarios,
  obtenerUsuarioPorId,
  registrarUsuario,
  modificarUsuario,
  cambiarEstadoUsuario
} from '../controllers/user.controller';

const router = Router();

router.use(auditLogger);
router.use(authenticateToken);

router.get('/', checkRBAC('USER_READ'), listarUsuarios);
router.get('/:id', checkRBAC('USER_READ'), obtenerUsuarioPorId);
router.post('/', checkRBAC('USER_CREATE'), registrarUsuario);
router.put('/:id', checkRBAC('USER_UPDATE'), modificarUsuario);
router.patch('/:id/estado', checkRBAC('USER_UPDATE'), cambiarEstadoUsuario);

export default router;