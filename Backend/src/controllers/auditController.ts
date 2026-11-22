import type { Request, Response } from 'express';
import { AuditService } from '../services/auditService.ts';
import type { ListAuditLogsQuery } from '../schemas/audit.schema.ts';

export class AuditController {
  private auditService: AuditService;

  constructor(auditService: AuditService = new AuditService()) {
    this.auditService = auditService;
  }

  // req.query sudah divalidasi dan di-parse oleh middleware validate.
  list = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.auditService.list(req.query as unknown as ListAuditLogsQuery);
    return res.status(200).json({ status: 'success', data });
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const data = await this.auditService.getById(Number(req.params.id));
    return res.status(200).json({ status: 'success', data });
  };
}