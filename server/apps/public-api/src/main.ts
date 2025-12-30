import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { ValidationFilter, ValidationException, LogErrorService } from '@server/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ModuleRef } from '@nestjs/core';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});
  app.setGlobalPrefix('api/v2');
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
  await app.listen(port);
  
  const startupMessage = `Public API is running on: http://localhost:${port}/api/v1`;
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

