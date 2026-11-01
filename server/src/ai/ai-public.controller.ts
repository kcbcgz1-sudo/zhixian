import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { AiService } from './ai.service.js';

// 회원용 AI (로그인만 필요, 관리자 아님)
@Controller('ai')
export class AiPublicController {
  constructor(
    private readonly ai: AiService,
    private readonly auth: AuthService,
  ) {}

  @Post('assist')
  async assist(
    @Body() b: { input?: string; category?: string; city?: string; images?: string[] },
    @Req() req: Request,
  ) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new ForbiddenException('请先登录');
    return this.ai.assist(uid, b?.input || '', b?.category, b?.city, b?.images);
  }

  // 음성 입력: 오디오 파일 업로드 → 텍스트
  @Post('asr')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } }),
  )
  async asr(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const uid = this.auth.verifyToken(req.headers['authorization']);
    if (!uid) throw new ForbiddenException('请先登录');
    if (!file?.buffer) throw new BadRequestException('未收到音频，请重试');
    return this.ai.transcribe(uid, file.buffer, file.mimetype);
  }
}
