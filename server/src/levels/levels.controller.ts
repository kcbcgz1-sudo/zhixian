import { Controller, Get } from '@nestjs/common';
import { LevelsService } from './levels.service.js';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levels: LevelsService) {}

  @Get()
  list() {
    return this.levels.list();
  }
}
