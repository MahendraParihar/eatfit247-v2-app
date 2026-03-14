/**
 * Public API Server
 * This is the public-facing API endpoint
 */
import { ModuleRef, NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded, raw } from 'express';
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
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.razorpay.com'],
          frameSrc: ["'self'", 'https://checkout.razorpay.com'],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      crossOriginEmbedderPolicy: false, // Allow Razorpay iframes
    }),
  );

  // Compression middleware
  app.use(compression());

  // CORS configuration - restrict origins in production
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'x-razorpay-signature',
      'X-Recaptcha-Token',
    ],
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
      forbidUnknownValues: true,
    }),
  );
  app.enableShutdownHooks();
  app.set('trust proxy', 1); // trust only 1 hop (your Nginx proxy)

  // Use raw body parser for webhook route to preserve raw body for signature verification
  // This must be before the json() middleware
  // Note: This path matches the global prefix + controller route: /api/v2/public/razorpay/webhook
  app.use(
    '/api/v2/public/razorpay/webhook',
    raw({ type: 'application/json', limit: '64kb' }),
    (req, res, next) => {
      try {
        // Store raw body as string for signature verification
        const rawBody =
          req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body || '');
        (req as any).rawBody = rawBody;

        // Parse and set body for ValidationPipe to use
        if (rawBody) {
          try {
            req.body = JSON.parse(rawBody);
          } catch (parseError) {
            logger.warn('Failed to parse webhook body as JSON', {
              error: parseError instanceof Error ? parseError.message : String(parseError),
            });
            // If JSON parsing fails, set empty object and let ValidationPipe handle it
            req.body = {};
          }
        } else {
          req.body = {};
        }

        next();
      } catch (error) {
        logger.error('Error processing webhook request', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(400).json({ status: 'error', message: 'Failed to process request' });
      }
    },
  );

  // Apply json() middleware to all other routes
  // Skip for webhook route since we've already parsed it with raw() middleware
  app.use((req, res, next) => {
    // Skip json() middleware for webhook route since we've already parsed it
    // Check both path and URL to handle global prefix correctly
    const isWebhookRoute =
      req.path === '/razorpay/webhook' ||
      req.url === '/razorpay/webhook' ||
      req.path === '/api/v2/public/razorpay/webhook' ||
      req.url.startsWith('/api/v2/public/razorpay/webhook');

    if (isWebhookRoute) {
      return next();
    }
    return json({ limit: '1mb' })(req, res, next);
  });

  app.use(urlencoded({ extended: true, limit: '1mb' }));

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

