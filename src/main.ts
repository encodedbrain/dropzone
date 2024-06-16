/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as process from 'process';
import * as express from 'express';

const port = process.env.PORT || 3000;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
  });
  app.use(express.json({ limit: '100mb' }));
  app.setViewEngine('ejs');
  await app.listen(port);
  app.enableCors();
}
bootstrap().then((r) => r);
