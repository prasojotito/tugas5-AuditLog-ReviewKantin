import { AuditRepository } from '../repositories/auditRepository.ts';
import type { ListAuditLogsQuery } from '../schemas/audit.schema.ts';
import { AppError } from '../errors/AppError.ts';

export class AuditService {
  private auditRepository: AuditRepository;

  constructor(auditRepository: AuditRepository = new AuditRepository()) {
    this.auditRepository = auditRepository;
  }

  async list(query: ListAuditLogsQuery) {
    const { items, total } = await this.auditRepository.list(query);
    return {
      items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async getById(id: number) {
    const item = await this.auditRepository.findById(id);
    if (!item) throw new AppError(404, 'Catatan audit tidak ditemukan');
    return item;
  }
}