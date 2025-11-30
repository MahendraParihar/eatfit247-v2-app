import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LogErrorModel } from '../models/log-error.model';

@Injectable()
export class LogErrorService {
  constructor(@InjectModel(LogErrorModel) private logErrorModel: typeof LogErrorModel) {}

  load() {}

  getById() {}

  loadDetailById() {}

  manage() {}

  updateStatus() {}
}

