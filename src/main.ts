import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  //bật trên toán bộ  app
  app.useGlobalPipes(new ValidationPipe({whitelist: true}));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
