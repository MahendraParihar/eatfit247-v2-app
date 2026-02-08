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
import helmet from 'helmet';
import compression from 'compression';
import * as Sentry from '@sentry/nestjs';

const logger = new Logger('Bootstrap');

// Global error handlers - MUST be at top level, before bootstrap()
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // In production, send to error tracking service (Sentry)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
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
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  // Exit process after logging
  process.exit(1);
});

async function bootstrap() {
  // Initialize Sentry if DSN is provided
  // Note: HTTP and Express integrations are automatically included in @sentry/nestjs v10
  if (process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {});

  // Security headers with Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.razorpay.com"],
        frameSrc: ["'self'", "https://checkout.razorpay.com"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false, // Allow Razorpay iframes
  }));

  // Compression middleware
  app.use(compression());

  // CORS configuration - restrict origins in production
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://eatfit24by7.com',
        'https://www.eatfit24by7.com',
        // Add other production domains here
        ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      ]
    : true; // Allow all origins in development

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-razorpay-signature'],
    credentials: false, // Set to true only if needed for cookies
  });

  app.setGlobalPrefix('api/v2/public');
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
  // Note: This path matches the global prefix + controller route: /api/v2/public/razorpay/webhook
  app.use('/api/v2/public/razorpay/webhook', (req, res, next) => {
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
  
  const startupMessage = `🚀 Public API is running on: http://localhost:${port}/api/v2`;
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

