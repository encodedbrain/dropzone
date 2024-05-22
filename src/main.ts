/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';

// const port = process.env.PORT || 3000;
const port = 8000;
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.use(express.json({ limit: '100mb' }));
  await app.listen(port);
  app.enableCors();
}
bootstrap().then((r) => r);
