import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ValidationFilter } from './filters/validation.filter';
import { ValidationException } from './filters/validation.exception';
import { Env } from './util/env.values';
import { json } from 'express';
import { AxiosExceptionFilter } from './filters/axios.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new AllExceptionsFilter());
  // Static assets are handled by ServeStaticModule in AppModule
  app.setViewEngine('hbs');
  // custom-validation
  app.useGlobalFilters(new ValidationFilter(), new AxiosExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      // Make sure that there's no unexpected data
      skipMissingProperties: false,
      skipNullProperties: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map((error) => {
          return {
            error: `${error.property} has wrong value ${error.value}.`,
            message: '',
          };
        });
        return new ValidationException(messages);
      },
    }),
  );
  const port = Env.apiPort || 3000;
  app.enableShutdownHooks();
  app.set('trust proxy', true); // This is crucial behind Nginx or any proxy
  app.use(json({ limit: '50mb' }));
  await app.listen(port).then();
  console.log(`Application is running on: http://localhost:${port}/api/v1`, 'bootstrap');
}
bootstrap();
