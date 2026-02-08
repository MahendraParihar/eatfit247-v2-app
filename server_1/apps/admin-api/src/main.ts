import 'tsconfig-paths/register';
import * as dotenv from 'dotenv';
import { ModuleRef, NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { ValidationException, ValidationFilter } from '@server_1/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';

dotenv.config();
const cookieParser = require('cookie-parser');
const logger = new Logger('Bootstrap');

// Global error handlers - MUST be at top level, before bootstrap()
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // In production, send to error tracking service (Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry/error tracking service
    // Sentry.captureException(reason);
  }
  // Exit process after logging to prevent undefined state
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to Sentry/error tracking service
    // Sentry.captureException(error);
  }
  // Exit process after logging
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});
  
  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Compression middleware
  app.use(compression());
  
  // Enable cookie parser for HttpOnly cookies
  app.use(cookieParser());
  
  // CORS configuration - restrict origins in production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://eatfit24by7.com',
        'https://www.eatfit24by7.com',
        // Add admin panel domain here
        ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      ]
    : true; // Allow all origins in development

  // Enable CORS with proper configuration for HttpOnly cookies
  app.enableCors({
    origin: allowedOrigins,
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
      skipMissingProperties: false,
      forbidUnknownValues: false,
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

  // Log route information for debugging
  logger.log('Checking for Google Calendar routes...');
  const adapter = app.getHttpAdapter();
  if (adapter && (adapter as any).getInstance) {
    const instance = (adapter as any).getInstance();
    if (instance && instance._router && instance._router.stack) {
      const googleCalendarRoutes: string[] = [];
      const checkRoutes = (stack: any[], prefix = '') => {
        stack.forEach((layer: any) => {
          if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            const fullPath = `${prefix}${layer.route.path}`;
            if (fullPath.includes('google-calendar')) {
              googleCalendarRoutes.push(`${methods} ${fullPath}`);
            }
          } else if (layer.name === 'router' && layer.regexp) {
            const basePath = layer.regexp.source
              .replace(/\\\//g, '/')
              .replace(/[\^$?]/g, '')
              .replace(/\\/g, '');
            if (layer.handle && layer.handle.stack) {
              checkRoutes(layer.handle.stack, basePath);
            }
          }
        });
      };
      checkRoutes(instance._router.stack, '/api/v2/admin');
      
      if (googleCalendarRoutes.length > 0) {
        logger.log(`✅ Google Calendar routes registered: ${googleCalendarRoutes.join(', ')}`);
      } else {
        logger.warn('⚠️  No Google Calendar routes found in route stack. Module may not be properly registered.');
      }
    }
  }

  const startupMessage = `🚀 Admin API is running on: http://localhost:${port}/api/v2/admin`;
  logger.log(startupMessage);

  // Graceful shutdown handler
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully');
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start application:', error);
  process.exit(1);
});

