import { Controller, Get, Query } from '@nestjs/common';
import { CallTypeService } from '../../services';
import { ITableList, ICallType } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/call-type')
export class PublicCallTypeController {
  constructor(private readonly service: CallTypeService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ICallType>> {
    return await this.service.findAll(req);
  }
}

