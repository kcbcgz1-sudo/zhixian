import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';
import { AutogenService } from './autogen.service.js';
import { AutogenController } from './autogen.controller.js';

@Module({
  imports: [AuthModule, AiModule],
  controllers: [AutogenController],
  providers: [AutogenService],
})
export class AutogenModule {}
