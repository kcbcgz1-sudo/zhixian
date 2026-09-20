import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 앱(RN)에서 호출 허용
  app.setGlobalPrefix('api'); // 모든 라우트 앞에 /api
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 知闲 API on http://localhost:${port}/api`);
}
await bootstrap();
