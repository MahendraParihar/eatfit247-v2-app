import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { ValidationFilter, ValidationException, LogErrorService } from '@server/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ModuleRef } from '@nestjs/core';

const cookieParser = require('cookie-parser');
const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});
  
  // Enable cookie parser for HttpOnly cookies
  app.use(cookieParser());
  
  // Enable CORS with proper configuration for HttpOnly cookies
  app.enableCors({
    origin: true, // Allow all origins in development (configure specific origins in production)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true, // Required for HttpOnly cookies
  });
  
  app.setGlobalPrefix('api/v2/admin');
  const moduleRef = app.get(ModuleRef);
  app.useGlobalFilters(new ValidationFilter(moduleRef));
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

  const port = process.env.ADMIN_API_PORT || 3001;
  await app.listen(port);

  const startupMessage = `Admin API is running on: http://localhost:${port}/api/v2/admin`;
  logger.log(startupMessage);
  
  // Also log to database if LogErrorService is available
  try {
    const logErrorService = app.get(LogErrorService);
    await logErrorService.logWarning(startupMessage, {
      controller: 'Bootstrap',
      methodName: 'bootstrap',
    });
  } catch (error) {
    // Ignore if LogErrorService is not available
  }
}
bootstrap();

