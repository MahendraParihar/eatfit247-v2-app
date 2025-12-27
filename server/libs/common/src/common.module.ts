import { DynamicModule } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './db-config';
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
import { LabelModel } from './models';
import { LogErrorService } from './services';
import { LogErrorModel } from './models';
import { GoogleService } from './third-party-services';
import {
  MstAdminUser,
  TxnAdminLastLoginDetail,
  TxnAdminRefreshToken,
  TxnAdminPasswordResetToken,
} from './models';
import { MstAdminRole } from './models';
import { MstFranchise } from './models';
import { AdminUserService } from './auth/admin-user.service';
import * as jwt from 'jsonwebtoken';
import { MstEmailTemplate } from './models';
import { EmailNotificationService } from './services';
import { modelRegistry } from './models/model-registry';
import { FileUploadController } from './file-upload';
import { MstCurrencyModel } from './models';
import { CurrencyService } from './services';
import { StateService } from './services';
import { CountryService } from './services';
import { AddressService } from './services';
import { AddressTypeService } from './services';
import {
  MstCountry,
  MstState,
  MstAddressType,
  TxnAddress,
  MstPocketGuide,
  MstHealthIssue,
  MstIssueStatus,
  MstIssueCategory,
  MstGender,
  MstBloodSugar,
  MstEatingHabit,
  MstLifestyle,
  MstMaritalStatus,
  MstReligion,
  MstSleepingPattern,
  MstTypeOfExercise,
  MstUrineOutput,
  MstHealthParameter,
  MstHealthParameterUnit,
  MstRecipe,
  MstRecipeCategory,
  MstRecipeCuisine,
  MstRecipeType,
  MstRecipeNutritive,
  MstRecipeCategoryMapping,
  MstRecipeCuisineMapping,
  MstProgram,
  MstProgramCategory,
  MstProgramPlan,
  MstProgramPlanType,
  MstProgramPlanFees,
  MstCallType,
  MstCallPurpose,
  MstCallLogStatus,
  MstBlogCategory,
  MstBlogAuthor,
  MstFaqCategory,
  MstReferrer,
  MstAdminRolePermission,
} from './models';

export class CommonModule {
  static forRoot(configModules: string[] = []): DynamicModule {
    const modulesNeededForCommon = ['Common', 'Email'];
    // Common models that belong to @server/common
    const commonModelsList = [
      AppConfigModel,
      LabelModel,
      LogErrorModel,
      MstAdminUser,
      MstAdminRole, // Used in MstAdminRolePermission scopes
      MstFranchise,
      MstEmailTemplate,
      MstCountry,
      MstState,
      MstAddressType,
      MstPocketGuide,
      MstHealthIssue,
      MstIssueStatus,
      MstIssueCategory,
      // Assessment master models
      MstGender,
      MstBloodSugar,
      MstEatingHabit,
      MstLifestyle,
      MstMaritalStatus,
      MstReligion,
      MstSleepingPattern,
      MstTypeOfExercise,
      MstUrineOutput,
      MstHealthParameter,
      MstHealthParameterUnit,
      // Recipe models
      MstRecipe,
      MstRecipeCategory,
      MstRecipeCuisine,
      MstRecipeType,
      MstRecipeNutritive,
      MstRecipeCategoryMapping,
      MstRecipeCuisineMapping,
      // Program-plan models
      MstProgram,
      MstProgramCategory,
      MstProgramPlan,
      MstProgramPlanType,
      MstProgramPlanFees,
      // Call-logs models
      MstCallType,
      MstCallPurpose,
      MstCallLogStatus,
      // Blog models
      MstBlogCategory,
      MstBlogAuthor,
      // FAQ models
      MstFaqCategory,
      MstReferrer,
      MstAdminRolePermission,
      // Transactional models from @server/common used by AuthService and other common services
      TxnAdminLastLoginDetail,
      TxnAdminRefreshToken,
      TxnAdminPasswordResetToken,
      MstCurrencyModel,
      TxnAddress,
    ];
    // Get models registered by lib modules via modelRegistry
    // Each lib module registers its own models during module initialization
    const libModelsList = modelRegistry.getAllModels();
    // Combine common models with models from lib modules
    // Models with @Scopes decorator MUST be registered in the initial Sequelize connection
    const allModelsList = [...commonModelsList, ...libModelsList];
    const modulesList = [...configModules, ...modulesNeededForCommon]; // add modules needed for common
    return {
      module: CommonModule,
      global: true,
      controllers: [
        HealthController,
        FileUploadController,
      ],
      imports: [
        // Initialize database connection with all models (common + lib modules)
        // Models with @Scopes decorator MUST be registered here for scopes to work
        // Each lib module also uses SequelizeModule.forFeature() for dependency injection
        SequelizeModule.forRoot({ ...databaseConfig, models: allModelsList }),
        ConfigModule.forRoot({ isGlobal: true }),
        AppConfigModule.asyncRegister(modulesList),
        LabelModule.asyncRegister(['admin']),
        SequelizeModule.forFeature(allModelsList),
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
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
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
        EmailNotificationService,
        CurrencyService,
        StateService,
        CountryService,
        AddressService,
        AddressTypeService,
      ],
    };
  }
}

