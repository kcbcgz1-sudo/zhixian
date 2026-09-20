import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// 전역 모듈로 등록 → 어디서든 PrismaService 주입 가능
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
