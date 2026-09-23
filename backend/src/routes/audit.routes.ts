import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware';
import { checkRBAC } from '../middlewares/rbac.middleware';
import { getAuditLogs } from '../controllers/audit.controller';
import { auditLogger } from '../middlewares/audit.middleware';

const router = Router();

router.get('/', auditLogger, authenticateToken, checkRBAC('AUDIT_READ'), getAuditLogs);

export default router;