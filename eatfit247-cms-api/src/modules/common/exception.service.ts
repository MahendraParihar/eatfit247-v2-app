import { Injectable } from '@nestjs/common';
import { IS_DEV } from '../../constants/config-constants';
import { LogError } from '../../core/database/models/log-error.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ExceptionService {
  constructor(@InjectModel(LogError) private readonly logErrorRepository: typeof LogError) {}

  public async logException(e: any) {
    if (IS_DEV) {
      console.log(e);
    }
  }

  public async logError(error: any, method: string = null, controller: string = null, ): Promise<boolean> {
    if (IS_DEV) {
      console.log(error);
      return true;
    }
    try {
      // Convert error to string - handle different error types
      let stacktrace = '';
      if (error) {
        if (typeof error === 'string') {
          stacktrace = error;
        } else if (error.stack) {
          stacktrace = error.stack;
        } else if (error.message) {
          stacktrace = error.message;
        } else {
          stacktrace = JSON.stringify(error);
        }
      }

      this.logErrorRepository.create({
        environment: '',
        hostUrl: '',
        controller: controller,
        methodName: method,
        exceptionMessage: error?.message || '',
        exceptionMessageSQL: '',
        exceptionSource: '',
        exceptionType: error?.name || '',
        serverName:'',
        browser:'',
        exceptionStacktrace: stacktrace,
      });
    } catch (e) {
      console.log(e);
    }
    return true;
  }
}
