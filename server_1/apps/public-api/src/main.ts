/**
 * Public API Server
 * This is the public-facing API endpoint
 */
import { ModuleRef, NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { ValidationFilter } from '@server_1/core';
import { NestExpressApplication } from '@nestjs/platform-express';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});
  app.setGlobalPrefix('api/v2');
  const moduleRef = app.get(ModuleRef);
  app.useGlobalFilters(new ValidationFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      forbidUnknownValues: false,
    }),
  );
  app.enableShutdownHooks();
  app.set('trust proxy', true); // This is crucial behind Nginx or any proxy
  
  // Middleware to preserve raw body for webhook signature verification
  // Must be before json() middleware
  app.use('/api/v2/razorpay/webhook', (req, res, next) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      (req as any).rawBody = data;
      next();
    });
  });
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const port = process.env.PUBLIC_API_PORT || 3000;
  app.enableCors();
  await app.listen(port);
  
  const startupMessage = `🚀 Public API is running on: http://localhost:${port}/api/v2`;
  logger.log(startupMessage);
}

bootstrap();

