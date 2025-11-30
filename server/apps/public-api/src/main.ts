import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { ValidationFilter, ValidationException } from '@server/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});
  app.setGlobalPrefix('api/v2');
  app.useGlobalFilters(new ValidationFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => ({
          error: `${error.property} has wrong value ${error.value}.`,
          message: '',
        }));
        return new ValidationException(messages);
      },
    }),
  );
  app.enableShutdownHooks();
  app.set('trust proxy', true); // This is crucial behind Nginx or any proxy
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const port = process.env.PUBLIC_API_PORT || 3000;
  await app.listen(port);
  console.log(`Public API is running on: http://localhost:${port}/api/v1`);
}
bootstrap();

