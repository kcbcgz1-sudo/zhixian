import { BadRequestException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import * as bcryptImport from 'bcryptjs';
import * as jwtImport from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service.js';

// ESM/CJS 인터롭 안전 처리
const bcrypt: any = (bcryptImport as any).default ?? bcryptImport;
const jwt: any = (jwtImport as any).default ?? jwtImport;

const SECRET = process.env.JWT_SECRET || 'zhixian-dev-secret-change-me';

export type PublicUser = {
  id: string;
  username: string | null;
  email: string | null;
  nickname: string;
  city: string;
  points: number;
  level: number;
  avatar: string | null;
  role: string;
};

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  // 서버 시작 시 관리자 계정 보장 (admin / 1234)
  async onModuleInit() {
    try {
      const admin = await this.prisma.user.findFirst({ where: { username: 'admin' } });
      if (!admin) {
        await this.prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@zhixian.local',
            passwordHash: bcrypt.hashSync('1234', 10),
            nickname: '管理员',
            city: '广州',
            role: 'admin',
          },
        });
      } else if ((admin as any).role !== 'admin') {
        await this.prisma.user.update({ where: { id: admin.id }, data: { role: 'admin' } });
      }
    } catch {
      // 부트스트랩 실패는 무시(앱 기동 우선)
    }
  }

  private publicUser(u: any): PublicUser {
    return {
      id: u.id,
      username: u.username ?? null,
      email: u.email ?? null,
      nickname: u.nickname,
      city: u.city,
      points: u.points,
      level: u.level,
      avatar: u.avatar ?? null,
      role: u.role ?? 'user',
    };
  }

  private sign(userId: string): string {
    return jwt.sign({ sub: userId }, SECRET, { expiresIn: '30d' });
  }

  verifyToken(token?: string): string | null {
    if (!token) return null;
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    try {
      const p = jwt.verify(raw, SECRET);
      if (typeof p === 'object' && p && 'sub' in p) return String((p as { sub?: unknown }).sub ?? '') || null;
      return null;
    } catch {
      return null;
    }
  }

  async register(dto: { username: string; email: string; password: string; nickname?: string }) {
    const username = dto.username?.trim();
    const email = dto.email?.trim().toLowerCase();
    if (!username || !email || !dto.password) throw new BadRequestException('缺少必填项');
    if (dto.password.length < 6) throw new BadRequestException('密码至少6位');
    const exists = await this.prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (exists) throw new BadRequestException('用户名或邮箱已被注册');
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash: bcrypt.hashSync(dto.password, 10),
        nickname: dto.nickname?.trim() || username,
        city: '广州',
      },
    });
    return { token: this.sign(user.id), user: this.publicUser(user) };
  }

  async login(dto: { account: string; password: string }) {
    const account = dto.account?.trim();
    if (!account || !dto.password) throw new BadRequestException('缺少账号或密码');
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ username: account }, { email: account.toLowerCase() }] },
    });
    if (!user || !user.passwordHash || !bcrypt.compareSync(dto.password, user.passwordHash))
      throw new UnauthorizedException('账号或密码错误');
    if (user.status === 'banned') throw new UnauthorizedException('账号已被封禁');
    return { token: this.sign(user.id), user: this.publicUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }
}
