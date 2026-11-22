import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { getDb } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';

export interface ListAuditLogsParams {
  page: number;
  pageSize: number;
  action?: string;
  targetTable?: string;
  targetId?: number;
  userId?: number;
  from?: string;
  to?: string;
}

const auditSelection = {
  id: auditLogs.id,
  userId: auditLogs.userId,
  userName: users.name,
  userEmail: users.email,
  action: auditLogs.action,
  targetTable: auditLogs.targetTable,
  targetId: auditLogs.targetId,
  metadata: auditLogs.metadata,
  createdAt: auditLogs.createdAt,
};

type AuditRow = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: string | null;
  createdAt: Date | string | null;
};

const parseMetadata = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const toAuditItem = (row: AuditRow) => ({
  id: row.id,
  userId: row.userId,
  userName: row.userName,
  userEmail: row.userEmail,
  action: row.action,
  targetTable: row.targetTable,
  targetId: row.targetId,
  metadata: parseMetadata(row.metadata),
  createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
});

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

  async list(params: ListAuditLogsParams) {
    const db = await getDb();

    const conditions: SQL[] = [];
    if (params.action !== undefined) conditions.push(eq(auditLogs.action, params.action));
    if (params.targetTable !== undefined) conditions.push(eq(auditLogs.targetTable, params.targetTable));
    if (params.targetId !== undefined) conditions.push(eq(auditLogs.targetId, params.targetId));
    if (params.userId !== undefined) conditions.push(eq(auditLogs.userId, params.userId));
    if (params.from !== undefined) {
      conditions.push(sql`CAST(${auditLogs.createdAt} AS date) >= CAST(${params.from} AS date)`);
    }
    if (params.to !== undefined) {
      conditions.push(sql`CAST(${auditLogs.createdAt} AS date) <= CAST(${params.to} AS date)`);
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const offset = (params.page - 1) * params.pageSize;

    const rows = await db
      .select(auditSelection)
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .offset(offset)
      .fetch(params.pageSize);

    const totals = await db.select({ total: count() }).from(auditLogs).where(where);

    return { items: rows.map(toAuditItem), total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select(auditSelection)
      .from(auditLogs)
      .innerJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.id, id));
    return rows[0] ? toAuditItem(rows[0]) : undefined;
  }
}