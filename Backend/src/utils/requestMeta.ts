import type { Request } from 'express';

export interface RequestMeta {
  ipAddress: string | null;
  userAgent: string | null;
}

const MAX_USER_AGENT_LENGTH = 255;

// IP dan user-agent selalu diambil dari HTTP request, bukan dari body.
export const getRequestMeta = (req: Request): RequestMeta => ({
  ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
  userAgent: req.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
});