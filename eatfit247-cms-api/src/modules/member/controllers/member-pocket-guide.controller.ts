import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { MemberPocketGuideService } from '../services/member-pocket-guide.service';
import { CreateMemberPocketGuideDto } from '../dto/member-pocket-guide.dto';

@Controller('member-pocket-guide')
export class MemberPocketGuideController {
  constructor(private readonly service: MemberPocketGuideService) {
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async getMemberPocketGuideById(@Param('id') id: number) {
    return await this.service.fetchMemberPocketGuide(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async createOrUpdate(@Param('id') id: number, @Req() req, @Body() body: CreateMemberPocketGuideDto) {
    return await this.service.createOrUpdate(id, body, req.ip, req.user.userId);
  }
}
