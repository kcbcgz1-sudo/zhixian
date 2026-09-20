import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service.js';

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
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

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
    };
  }

  private sign(userId: string): string {
    return jwt.sign({ sub: userId }, SECRET, { expiresIn: '30d' });
  }

  // 토큰(문자열 또는 "Bearer xxx")에서 userId 추출, 실패 시 null
  verifyToken(token?: string): string | null {
    if (!token) return null;
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    try {
      const p = jwt.verify(raw, SECRET) as { sub?: string };
      return p.sub ?? null;
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
    return { token: this.sign(user.id), user: this.publicUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.publicUser(user);
  }
}
