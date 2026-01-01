import { Controller, Get, Query } from '@nestjs/common';
import { MemberService } from '../../services';
import { ITableList, IMember } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/member')
export class PublicMemberController {
  constructor(private readonly service: MemberService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IMember>> {
    return await this.service.findAll(req);
  }
}

