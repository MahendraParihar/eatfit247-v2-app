import { Injectable } from '@nestjs/common';
import { IS_DEV } from '../../constants/config-constants';
import { LogError } from '../../core/database/models/log-error.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ExceptionService {
  constructor(@InjectModel(LogError) private readonly logErrorRepository: typeof LogError) {}

  public async logException(e: any) {
    if (IS_DEV) {

    }
  }

  public async logError(method: string, controller: string, error: any): Promise<boolean> {
    if (IS_DEV) {
    }
    return true;
    /*try {
      const addressObj = await this.logErrorRepository.create({
        environment: '',
        hosturl: '',
        controllers: controllers,
        methodname: method,
        exceptionMessage: '',
        exceptionMessageSQL: '',
        exceptionCode: '',
        exceptionType: '',
        exceptionStacktrace: error,
      });
    } catch (e) {
      return null;
    }*/
  }
}
