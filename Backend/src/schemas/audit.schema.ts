import { z } from 'zod';

const INT32_MAX = 2147483647;
// Batas page menjaga OFFSET ((page - 1) * pageSize) tetap dalam rentang int32.
const MAX_PAGE = 1_000_000;

const integerParam = (field: string, min: number, max: number, rangeMessage?: string) =>
  z
    .string({ error: `${field} harus berupa bilangan bulat` })
    .regex(/^-?\d+$/, `${field} harus berupa bilangan bulat`)
    .transform(Number)
    .pipe(
      z
        .number()
        .min(min, rangeMessage ?? `${field} minimal ${min}`)
        .max(max, rangeMessage ?? `${field} maksimal ${max}`),
    );

const textParam = (field: string, max: number) =>
  z
    .string({ error: `${field} harus berupa string` })
    .min(1, `${field} tidak boleh kosong`)
    .max(max, `${field} maksimal ${max} karakter`);

const isRealDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const dateParam = (field: string) =>
  z
    .string({ error: `${field} harus berformat YYYY-MM-DD` })
    .refine(isRealDate, `${field} harus tanggal valid berformat YYYY-MM-DD`);

export const auditIdParams = z.strictObject({
  id: integerParam('id', 1, INT32_MAX, 'id harus bilangan bulat positif'),
});

export const listAuditLogsQuery = z
  .strictObject(
    {
      page: integerParam('page', 1, MAX_PAGE).default(1),
      pageSize: integerParam('pageSize', 1, 100).default(20),
      action: textParam('action', 50).optional(),
      targetTable: textParam('targetTable', 50).optional(),
      targetId: integerParam('targetId', 1, INT32_MAX, 'targetId harus bilangan bulat positif').optional(),
      userId: integerParam('userId', 1, INT32_MAX, 'userId harus bilangan bulat positif').optional(),
      from: dateParam('from').optional(),
      to: dateParam('to').optional(),
    },
    {
      error: (iss) =>
        iss.code === 'unrecognized_keys'
          ? `Parameter tidak dikenal: ${(iss.keys ?? []).join(', ')}`
          : undefined,
    },
  )
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: 'from tidak boleh lebih besar dari to',
    path: ['from'],
  });

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuery>;