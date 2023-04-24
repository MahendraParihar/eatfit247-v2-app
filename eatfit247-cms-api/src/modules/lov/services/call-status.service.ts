import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ExceptionService } from '../../common/exception.service';
import { DropdownListInterface } from '../../../response-interface/dropdown-list.interface';
import { MstCallLogStatus } from '../../../core/database/models/mst-call-log-status.model';

@Injectable()
export class CallStatusService {
  constructor(
    @InjectModel(MstCallLogStatus) private readonly callStatusRepository: typeof MstCallLogStatus,
    private exceptionService: ExceptionService,
  ) {}

  public async getCallLogStatusList(): Promise<DropdownListInterface[]> {
    const tempList = await this.callStatusRepository.findAll<MstCallLogStatus>({
      where: {
        active: true,
      },
    });
    const list: DropdownListInterface[] = [];
    for (const t of tempList) {
      list.push({
        id: t.callLogStatusId,
        name: t.callLogStatus,
        selected: false,
      });
    }
    return list;
  }
}
