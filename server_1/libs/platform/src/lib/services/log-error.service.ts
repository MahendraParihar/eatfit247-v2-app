import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LogErrorModel } from '../database/models/log-error.model';

@Injectable()
export class LogErrorService {
  private readonly logger = new Logger(LogErrorService.name);

  constructor(@InjectModel(LogErrorModel) private logErrorModel: typeof LogErrorModel) {}

  /**
   * Log error to database
   * @param error - Error object or error message
   * @param context - Context information (controller, method, etc.)
   */
  async logError(
    error: Error | string,
    context?: {
      controller?: string;
      methodName?: string;
      environment?: string;
      browser?: string;
      hostUrl?: string;
      serverName?: string;
    },
  ): Promise<void> {
    try {
      this.logger.error(error instanceof Error ? error.message : String(error), {
        stack: error instanceof Error ? error.stack : undefined,
      });
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      await this.logErrorModel.create({
        environment: context?.environment || process.env['NODE_ENV'] || 'development',
        browser: context?.browser || null,
        hostUrl: context?.hostUrl || null,
        serverName: context?.serverName || null,
        controller: context?.controller || null,
        methodName: context?.methodName || null,
        exceptionMessage: errorMessage,
        exceptionType: error instanceof Error ? error.constructor.name : 'Error',
        exceptionStacktrace: errorStack || null,
      } as any);
    } catch (logError) {
      // Swallow secondary logging failures but record in application logger
      this.logger.error('Failed to log error to database', {
        logError,
        originalError: error,
      });
    }
  }

  /**
   * Log warning/info message to database
   * @param message - Warning or info message
   * @param context - Context information
   */
  async logWarning(
    message: string,
    context?: {
      controller?: string;
      methodName?: string;
      environment?: string;
    },
  ): Promise<void> {
    try {
      await this.logErrorModel.create({
        environment: context?.environment || process.env['NODE_ENV'] || 'development',
        controller: context?.controller || null,
        methodName: context?.methodName || null,
        exceptionMessage: message,
        exceptionType: 'Warning',
      } as any);
    } catch (logError) {
      // Swallow secondary logging failures but record in application logger
      this.logger.warn('Failed to log warning to database', {
        logError,
        message,
      });
    }
  }

  load() {}

  getById() {}

  loadDetailById() {}

  manage() {}

  updateStatus() {}
}

