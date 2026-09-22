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
  province: string;
  points: number;
  level: number;
  title: string;
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
            province: '广东',
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

  private async publicUser(u: any): Promise<PublicUser> {
    const lt = await this.prisma.levelTitle.findUnique({ where: { level: u.level ?? 1 } });
    return {
      id: u.id,
      username: u.username ?? null,
      email: u.email ?? null,
      nickname: u.nickname,
      city: u.city,
      province: u.province ?? '广东',
      points: u.points,
      level: u.level,
      title: lt?.name ?? '',
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

  async register(dto: { username: string; email: string; password: string; nickname?: string; province?: string; city?: string }) {
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
        city: dto.city?.trim() || '广州',
        province: dto.province?.trim() || '广东',
      },
    });
    await this.prisma.notification
      .create({
        data: {
          userId: user.id,
          type: 'welcome',
          title: '欢迎加入知闲',
          body: `欢迎，${user.nickname}！开始分享你的干货，赚积分、升等级吧。`,
        },
      })
      .catch(() => {});
    return { token: this.sign(user.id), user: await this.publicUser(user) };
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
    return { token: this.sign(user.id), user: await this.publicUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return await this.publicUser(user);
  }
}
