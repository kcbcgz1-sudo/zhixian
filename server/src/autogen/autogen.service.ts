import { Injectable, OnModuleInit } from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { AiService } from '../ai/ai.service.js';

const DAILY_PER_CATEGORY = 3; // 하루 카테고리당 생성 개수
const PENDING_CAP = 20; // 카테고리당 대기(待上架) 누적 상한
const EDITOR_USERNAME = 'zhixian_editor';
const EDITOR_NICK = '知闲小编';

@Injectable()
export class AutogenService implements OnModuleInit {
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  onModuleInit() {
    // 30분마다 체크 → 上海 새벽 3시 이후 하루 1회 자동 실행
    setInterval(() => this.tick().catch(() => {}), 30 * 60 * 1000);
  }

  private shanghai() {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return { day: `${get('year')}-${get('month')}-${get('day')}`, hour: parseInt(get('hour') || '0', 10) };
  }

  private async getSetting(key: string): Promise<string | null> {
    const r = await this.prisma.appSetting.findUnique({ where: { key } });
    return r?.value ?? null;
  }
  private async setSetting(key: string, value: string) {
    await this.prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async isEnabled(): Promise<boolean> {
    return (await this.getSetting('autogen_enabled')) === '1';
  }
  async setEnabled(on: boolean): Promise<boolean> {
    await this.setSetting('autogen_enabled', on ? '1' : '0');
    return on;
  }

  private async tick() {
    if (!(await this.isEnabled()) || !this.ai.hasKey()) return;
    const { day, hour } = this.shanghai();
    if (hour < 3) return;
    if ((await this.getSetting('autogen_last_run')) === day) return;
    await this.setSetting('autogen_last_run', day); // 먼저 찍어 하루 중복 방지
    await this.runOnce().catch(() => {});
  }

  async getEditor() {
    let u = await this.prisma.user.findUnique({ where: { username: EDITOR_USERNAME } });
    if (!u) {
      u = await this.prisma.user.create({
        data: { username: EDITOR_USERNAME, nickname: EDITOR_NICK, role: 'user', city: '广州', province: '广东' },
      });
    }
    return u;
  }

  async status() {
    const editor = await this.getEditor();
    const enabled = await this.isEnabled();
    const cats = await this.prisma.category.findMany({ where: { active: true }, orderBy: { sort: 'asc' } });
    const perCategory = await Promise.all(
      cats.map(async (c) => ({
        code: c.code,
        name: c.name,
        pending: await this.prisma.post.count({
          where: { authorId: editor.id, category: c.code, status: PostStatus.reviewing },
        }),
      })),
    );
    const pendingTotal = perCategory.reduce((s, x) => s + x.pending, 0);
    return {
      enabled,
      hasKey: this.ai.hasKey(),
      dailyPerCategory: DAILY_PER_CATEGORY,
      pendingCap: PENDING_CAP,
      editor: { id: editor.id, nickname: editor.nickname },
      lastRun: await this.getSetting('autogen_last_run'),
      pendingTotal,
      perCategory,
    };
  }

  async runOnce() {
    if (this.running) return { created: 0, note: 'busy' };
    this.running = true;
    try {
      const editor = await this.getEditor();
      const cats = await this.prisma.category.findMany({ where: { active: true }, orderBy: { sort: 'asc' } });
      let created = 0;
      const perCategory: Array<{ code: string; made: number; skipped?: string }> = [];
      for (const c of cats) {
        const pending = await this.prisma.post.count({
          where: { authorId: editor.id, category: c.code, status: PostStatus.reviewing },
        });
        const room = PENDING_CAP - pending;
        const toMake = Math.max(0, Math.min(DAILY_PER_CATEGORY, room));
        if (toMake <= 0) {
          perCategory.push({ code: c.code, made: 0, skipped: 'cap' });
          continue;
        }
        const recent = await this.prisma.post.findMany({
          where: { authorId: editor.id, category: c.code },
          orderBy: { createdAt: 'desc' },
          take: 15,
          select: { title: true },
        });
        const avoid = recent.map((r) => r.title);
        let made = 0;
        for (let i = 0; i < toMake; i++) {
          try {
            const topic =
              `${c.name}（广州及周边户外，面向70后80后（退休/半退休）中老年）。换一个新颖又实用的角度，` +
              `避免与这些近期标题重复：${avoid.join('、') || '（暂无）'}`;
            const draft = await this.ai.generateDraft(topic, c.code, '广州');
            if (!draft.title || avoid.includes(draft.title)) continue;
            const post = await this.prisma.post.create({
              data: {
                authorId: editor.id,
                category: c.code,
                title: draft.title,
                body: draft.body,
                province: '广东',
                city: '广州',
                attributes: { tags: draft.tags ?? [], media: [], cover: null, authorTitle: '', aiImage: false, autoGen: true },
                isQuality: false,
                qualityScore: 0,
                trustScore: 100,
                status: PostStatus.reviewing,
                publishedAt: null,
              },
            });
            avoid.unshift(post.title);
            made++;
            created++;
          } catch {
            /* 한 건 실패는 건너뜀 */
          }
        }
        perCategory.push({ code: c.code, made });
      }
      return { created, perCategory };
    } finally {
      this.running = false;
    }
  }

  async listPending() {
    const rows = await this.prisma.post.findMany({
      where: { status: PostStatus.reviewing },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { author: true },
    });
    return rows.map((p) => {
      const a = (p.attributes ?? {}) as Record<string, any>;
      return {
        id: p.id,
        category: p.category,
        title: p.title,
        body: p.body,
        tags: Array.isArray(a.tags) ? a.tags : [],
        author: p.author?.nickname ?? '',
        city: p.city ?? '',
        createdAt: p.createdAt.toISOString().slice(0, 16).replace('T', ' '),
        autoGen: a.autoGen === true,
      };
    });
  }

  async publish(id: string) {
    const p = await this.prisma.post.findUnique({ where: { id } });
    if (!p) return { ok: false };
    await this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.published, publishedAt: new Date() },
    });
    return { ok: true };
  }

  async discard(id: string) {
    await this.prisma.post.deleteMany({ where: { id, status: PostStatus.reviewing } });
    return { ok: true };
  }
}
