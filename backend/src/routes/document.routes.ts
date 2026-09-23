import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { checkRBAC } from '../middlewares/rbac.middleware';
import { checkABAC } from '../middlewares/abac.middleware';
import { auditLogger } from '../middlewares/audit.middleware';
import {
  getDocumentos,
  getDocumentoById,
  crearDocumento,
  modificarDocumento,
  eliminarDocumento,
  aprobarDocumento
} from '../controllers/document.controller';

const router = Router();

router.use(auditLogger);
router.use(authenticateToken);

router.get('/', checkRBAC('DOC_READ'), checkABAC, getDocumentos);
router.get('/:id', checkRBAC('DOC_READ'), checkABAC, getDocumentoById);

router.post('/', checkRBAC('DOC_CREATE'), checkABAC, crearDocumento);
router.put('/:id', checkRBAC('DOC_UPDATE'), checkABAC, modificarDocumento);
router.delete('/:id', checkRBAC('DOC_DELETE'), checkABAC, eliminarDocumento);
router.post('/:id/aprobar', checkRBAC('DOC_APPROVE'), checkABAC, aprobarDocumento);
router.patch('/:id/aprobar', checkRBAC('DOC_APPROVE'), checkABAC, aprobarDocumento);

export default router;