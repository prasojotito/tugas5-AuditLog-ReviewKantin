import { Router } from 'express';
import { AuditController } from '../controllers/auditController.ts';
import { authenticate } from '../middlewares/authenticate.ts';
import { authorize } from '../middlewares/authorize.ts';
import { validate } from '../middlewares/validate.ts';
import { auditIdParams, listAuditLogsQuery } from '../schemas/audit.schema.ts';

const auditRouter = Router();
const auditController = new AuditController();

// Seluruh endpoint audit hanya untuk admin.
auditRouter.use(authenticate, authorize('admin'));

auditRouter.get('/', validate({ query: listAuditLogsQuery }), (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['page'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['pageSize'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['action'] = { in: 'query', type: 'string' }
  // #swagger.parameters['targetTable'] = { in: 'query', type: 'string' }
  // #swagger.parameters['targetId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['userId'] = { in: 'query', type: 'integer' }
  // #swagger.parameters['from'] = { in: 'query', type: 'string', description: 'YYYY-MM-DD, inklusif' }
  // #swagger.parameters['to'] = { in: 'query', type: 'string', description: 'YYYY-MM-DD, inklusif' }
  // #swagger.responses[200] = { description: 'Daftar audit log + pagination' }
  // #swagger.responses[400] = { description: 'Validasi query gagal' }
  // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin' }
  return auditController.list(req, res);
});

auditRouter.get('/:id', validate({ params: auditIdParams }), (req, res) => {
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail satu catatan audit' }
  // #swagger.responses[400] = { description: 'Validasi gagal' }
  // #swagger.responses[401] = { description: 'Belum login atau token tidak valid' }
  // #swagger.responses[403] = { description: 'Hanya admin' }
  // #swagger.responses[404] = { description: 'Catatan audit tidak ditemukan' }
  return auditController.getById(req, res);
});

export { auditRouter };