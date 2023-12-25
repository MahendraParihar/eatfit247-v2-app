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
      this.logErrorRepository.create({
        environment: '',
        hostUrl: '',
        controller: controller,
        methodName: method,
        exceptionMessage: '',
        exceptionMessageSQL: '',
        exceptionSource: '',
        exceptionType: '',
        serverName:'',
        browser:'',
        exceptionStacktrace: error,
      });
    } catch (e) {
      console.log(e);
    }
    return true;
  }
}
