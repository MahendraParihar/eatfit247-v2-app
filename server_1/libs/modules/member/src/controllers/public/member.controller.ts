import { Controller, Get, Query } from '@nestjs/common';
import { MemberService } from '../../services';
import { IMember, ITableList } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/member')
export class PublicMemberController {
  constructor(private readonly service: MemberService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMember>> {
    return await this.service.findAll(req);
  }
}

