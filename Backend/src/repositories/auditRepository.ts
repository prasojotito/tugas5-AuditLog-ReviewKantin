import { getDb } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export class AuditRepository {
  async create(input: {
    userId: number;
    action: string;
    targetTable: string;
    targetId: number;
    metadata?: Record<string, unknown> | null;
  }) {
    const db = await getDb();
    await db.insert(auditLogs).output().values({
      userId: input.userId,
      action: input.action,
      targetTable: input.targetTable,
      targetId: input.targetId,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
  }
}