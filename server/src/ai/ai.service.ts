import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const KEY = process.env.DASHSCOPE_API_KEY || '';
const QWEN_BASE = process.env.DASHSCOPE_QWEN_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const QWEN_MODEL = process.env.DASHSCOPE_QWEN_MODEL || 'qwen-plus';
const WANX_CREATE = process.env.DASHSCOPE_WANX_CREATE || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';
const WANX_TASK = process.env.DASHSCOPE_WANX_TASK || 'https://dashscope.aliyuncs.com/api/v1/tasks';
const WANX_MODEL = process.env.DASHSCOPE_WANX_MODEL || 'wanx2.1-t2i-turbo';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/zhixian-uploads';
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://app.emilano.net';

@Injectable()
export class AiService {
  hasKey(): boolean {
    return !!KEY;
  }
  private ensureKey() {
    if (!KEY) throw new BadRequestException('未配置 DASHSCOPE_API_KEY，请在服务器 .env 中设置后重启服务');
  }

  async generateDraft(topic: string, category?: string, city?: string) {
    this.ensureKey();
    const t = (topic || '').trim();
    if (!t) throw new BadRequestException('请输入主题或地点');
    const sys =
      '你是"知闲"App的内容编辑。为45-55岁、广州及周边的中老年户外爱好者（钓鱼/登山/郊游）撰写真实、实用的"干货"帖子。' +
      '要求：简体中文；语气亲切朴实；内容结构化，突出路况、交通与停车、门票或收费、适合人群、避坑提醒、最佳时间等实用信息；' +
      '不要编造具体电话或不确定的精确数字，用"大约/建议提前确认"等表述；不含任何联系方式或广告。只输出JSON。';
    const usr =
      `请围绕主题写一篇干货帖：「${t}」` +
      (city ? `（城市：${city}）` : '') +
      (category ? `（分类：${category}）` : '') +
      '。输出JSON对象，字段：title（不超过20字、吸引人的标题）、body（200-400字，可换行分段，结尾可含2-4个#话题标签）、tags（3-6个不带#的字符串标签）。只输出JSON。';
    const res = await fetch(`${QWEN_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: QWEN_MODEL,
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: usr },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new BadRequestException(`通义千问调用失败(${res.status})：${txt.slice(0, 200)}`);
    }
    const data: any = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          /* ignore */
        }
      }
    }
    const title = String(parsed.title || '').trim();
    const body = String(parsed.body || '').trim();
    let tags: string[] = Array.isArray(parsed.tags)
      ? parsed.tags.map((x: any) => String(x).replace(/^#/, '').trim()).filter(Boolean)
      : [];
    tags = tags.slice(0, 6);
    if (!title || !body) throw new BadRequestException('AI返回格式异常，请重试');
    return { title, body, tags };
  }

  async generateImage(prompt: string) {
    this.ensureKey();
    const p = (prompt || '').trim();
    if (!p) throw new BadRequestException('请输入配图描述');
    const cr = await fetch(WANX_CREATE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${KEY}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({ model: WANX_MODEL, input: { prompt: p }, parameters: { size: '1024*1024', n: 1 } }),
    });
    if (!cr.ok) {
      const txt = await cr.text();
      throw new BadRequestException(`通义万相创建任务失败(${cr.status})：${txt.slice(0, 200)}`);
    }
    const cj: any = await cr.json();
    const taskId = cj?.output?.task_id;
    if (!taskId) throw new BadRequestException('未获取到任务ID，请检查模型配置');
    let url = '';
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const q = await fetch(`${WANX_TASK}/${taskId}`, { headers: { Authorization: `Bearer ${KEY}` } });
      const qj: any = await q.json();
      const status = qj?.output?.task_status;
      if (status === 'SUCCEEDED') {
        url = qj?.output?.results?.[0]?.url || '';
        break;
      }
      if (status === 'FAILED') throw new BadRequestException('图片生成失败：' + (qj?.output?.message || ''));
    }
    if (!url) throw new BadRequestException('图片生成超时，请重试');
    const img = await fetch(url);
    if (!img.ok) throw new BadRequestException('下载生成图片失败');
    const buf = Buffer.from(await img.arrayBuffer());
    const fn = `ai-${Date.now()}-${randomUUID()}.png`;
    await writeFile(join(UPLOAD_DIR, fn), buf);
    return { url: `${PUBLIC_ORIGIN}/uploads/${fn}`, type: 'image' };
  }
}
