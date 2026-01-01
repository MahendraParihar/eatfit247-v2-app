import { DynamicModule } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import * as jwt from 'jsonwebtoken';
import { ModelCtor } from 'sequelize-typescript';

// Core imports - use relative imports to avoid circular dependency
import { databaseConfig } from './database/db-config';
import { JwtStrategy } from './guards/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GlobalExceptionsFilter } from './error-handler/global-exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { Env } from './config/env.values';
import { HealthController } from './health/health.controller';
import { AppConfigModule } from './config/app-config';
import { AdminUserService } from './auth/admin-user.service';

// Models moved to core - import from there
import { AppConfigModel } from './database/models';

// Admin models from core
import {
  MstAdminUser,
  TxnAdminLastLoginDetail,
  TxnAdminRefreshToken,
  TxnAdminPasswordResetToken,
  MstAdminRole,
  MstFranchise,
  MstAdminRolePermission,
} from './database/models';

// Feature models are registered via SequelizeModule.forFeature() in their respective modules
// Core must NEVER import or know about feature models to avoid circular dependencies

export class CommonModule {
  /**
   * Initialize CommonModule
   * @param configModules - List of configuration modules needed
   * @param platformModels - Platform models to register (from PlatformModule.getModels())
   */
  static forRoot(
    configModules: string[] = [],
    platformModels: ModelCtor[] = [],
  ): DynamicModule {
    const modulesNeededForCommon = ['Common'];
    // Core models only - feature models are registered via SequelizeModule.forFeature() in their respective modules
    // Core must NEVER know about feature models to avoid circular dependencies
    const coreModelsList = [
      AppConfigModel,
      MstAdminUser,
      MstAdminRole, // Used in MstAdminRolePermission scopes
      MstFranchise,
      MstAdminRolePermission,
      // Transactional admin models
      TxnAdminLastLoginDetail,
      TxnAdminRefreshToken,
      TxnAdminPasswordResetToken,
    ];
    // Combine core models and platform models only
    // Feature modules register their models using SequelizeModule.forFeature() which adds them to the connection
    const allModelsList = [...coreModelsList, ...platformModels];
    const modulesList = [...configModules, ...modulesNeededForCommon]; // add modules needed for common
    return {
      module: CommonModule,
      global: true,
      controllers: [
        HealthController,
      ],
      imports: [
        // Initialize database connection with core and platform models only
        // Feature modules register their models using SequelizeModule.forFeature() in their own modules
        SequelizeModule.forRoot({ ...databaseConfig, models: allModelsList }),
        ConfigModule.forRoot({ isGlobal: true }),
        AppConfigModule.asyncRegister(modulesList),
        SequelizeModule.forFeature(allModelsList),
        JwtModule.register({
          secret: Env.jwtSecret,
          signOptions: <jwt.SignOptions>{ expiresIn: Env.accessTokenTime },
        }),
        PassportModule,
        TerminusModule,
      ],
      providers: [
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
        AdminUserService,
      ],
    };
  }
}
