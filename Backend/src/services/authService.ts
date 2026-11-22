import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/userRepository.ts';
import { AuditRepository } from '../repositories/auditRepository.ts';
import { AppError } from '../errors/AppError.ts';
import { signToken, type AuthPayload, type Role } from '../utils/jwt.ts';
import type { RequestMeta } from '../utils/requestMeta.ts';

const BCRYPT_ROUNDS = 10;

type UserRow = NonNullable<Awaited<ReturnType<UserRepository['findById']>>>;

// Data user yang aman dikirim ke klien (tanpa passwordHash).
const toPublicUser = (row: UserRow) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
});

export class AuthService {
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor(
    userRepository: UserRepository = new UserRepository(),
    auditRepository: AuditRepository = new AuditRepository(),
  ) {
    this.userRepository = userRepository;
    this.auditRepository = auditRepository;
  }

  // Best-effort: kegagalan menulis audit tidak boleh menggagalkan autentikasi.
  // Tidak menyimpan password, token, atau isi cookie.
  private async recordAuthAudit(
    action: 'LOGIN' | 'LOGOUT',
    userId: number,
    role: Role,
    result: 'success' | 'failed',
    meta: RequestMeta,
  ) {
    try {
      await this.auditRepository.create({
        userId,
        action,
        targetTable: 'USERS',
        targetId: userId,
        metadata: {
          role,
          ip_address: meta.ipAddress,
          user_agent: meta.userAgent,
          result,
        },
      });
    } catch (error) {
      console.error(`[audit] Gagal menulis audit ${action} untuk user ${userId}:`, error);
    }
  }

  async register(input: { name: string; email: string; password: string }) {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) throw new AppError(409, 'Email sudah terdaftar');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'customer',
    });
    if (!user) throw new AppError(500, 'Gagal membuat akun');
    return toPublicUser(user);
  }

  async login(input: { email: string; password: string }, meta: RequestMeta) {
    const user = await this.userRepository.findByEmail(input.email);
    const passwordMatch = user ? await bcrypt.compare(input.password, user.passwordHash) : false;

    if (!user || !passwordMatch) {
      // user_id wajib terisi (NOT NULL + FK), jadi percobaan dengan email yang
      // tidak terdaftar tidak bisa dicatat; password salah pada akun nyata dicatat.
      if (user) await this.recordAuthAudit('LOGIN', user.id, user.role, 'failed', meta);
      // Pesan sama untuk email salah maupun password salah.
      throw new AppError(401, 'Email atau password salah');
    }

    const token = signToken({ id: user.id, role: user.role });
    await this.recordAuthAudit('LOGIN', user.id, user.role, 'success', meta);
    return { token, user: toPublicUser(user) };
  }

  // JWT stateless: logout tidak membatalkan token, hanya mencatat audit.
  // Klien bertugas membuang token.
  async logout(user: AuthPayload, meta: RequestMeta) {
    await this.recordAuthAudit('LOGOUT', user.id, user.role, 'success', meta);
  }

  async getProfile(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new AppError(401, 'Akun tidak ditemukan');
    return toPublicUser(user);
  }
}