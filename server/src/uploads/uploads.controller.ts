import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';

// 업로드 저장 위치(서버 디스크, nginx가 /uploads 로 서비스). 없으면 기본값.
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/var/www/zhixian-uploads';

@Controller('uploads')
export class UploadsController {
  // POST /api/uploads  (multipart, field=file) → { url, type }
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) =>
          cb(null, `${Date.now()}-${randomUUID()}${extname(file.originalname) || ''}`),
      }),
      limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (동영상 대비)
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('no file');
    const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
    const host = req.headers['host'];
    const type = file.mimetype.startsWith('video') ? 'video' : 'image';
    return { url: `${proto}://${host}/uploads/${file.filename}`, type };
  }
}
