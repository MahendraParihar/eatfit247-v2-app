import { DynamicModule, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './db-config';
import { ModelCtor } from 'sequelize-typescript';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './auth/jwt.strategy';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { GlobalExceptionsFilter } from './error-handler/global-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { Env } from './utils/env.values';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health/health.controller';
import { AppConfigModule } from './app-config';
import { AppConfigModel } from './models/app-config.model';
import { LabelModule } from './label';
import { LabelModel } from './models/label.model';
import { LogErrorService } from './common/log-error.service';
import { LogErrorModel } from './models/log-error.model';
import { GoogleService } from './third-party-services';
import { MstAdminUser } from './models/admin';
import { MstFranchise } from './models/mst-franchise.model';
import { AdminUserService } from './auth/admin-user.service';
import * as jwt from 'jsonwebtoken';

export class CommonModule {
  static forRoot(models: ModelCtor[] = [], configModules: string[] = []): DynamicModule {
    const modulesNeededForCommon = ['core'];
    const modelsList = [AppConfigModel, LabelModel, LogErrorModel, MstAdminUser, MstFranchise, ...models];
    const modulesList = [...configModules, ...modulesNeededForCommon]; // add modules needed for common
    return {
      module: CommonModule,
      controllers: [
        HealthController,
      ],
      imports: [
        SequelizeModule.forRoot({ ...databaseConfig, models: modelsList }),
        ConfigModule.forRoot({ isGlobal: true }),
        AppConfigModule.asyncRegister(modulesList),
        LabelModule.asyncRegister(['admin']),
        SequelizeModule.forFeature(modelsList),
        JwtModule.register({
          secret: Env.jwtSecret,
          signOptions: <jwt.SignOptions>{ expiresIn: Env.accessTokenTime },
        }),
        PassportModule,
        TerminusModule,
      ],
      providers: [
        LogErrorService,
        GoogleService,
        {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
        },
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionsFilter,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: TransformInterceptor,
        },
        JwtStrategy,
        AdminUserService,
      ],
      exports: [
        SequelizeModule,
        JwtModule,
        PassportModule,
        AppConfigModule,
        LabelModule,
        LogErrorService,
        GoogleService,
        AdminUserService,
      ],
    };
  }
}

