import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IDropdownItem } from 'shared-lib';
import { MstCallLogStatus } from '../../../core/database/models/mst-call-log-status.model';

@Injectable()
export class CallStatusService {
  constructor(
    @InjectModel(MstCallLogStatus) private readonly callStatusRepository: typeof MstCallLogStatus,
  ) {}

  public async getCallLogStatusList(): Promise<IDropdownItem[]> {
    const tempList = await this.callStatusRepository.findAll<MstCallLogStatus>({
      where: {
        active: true,
      },
    });
    const list: IDropdownItem[] = [];
    for (const t of tempList) {
      list.push({
        id: t.callLogStatusId,
        label: t.callLogStatus,
        selected: false,
      });
    }
    return list;
  }
}
