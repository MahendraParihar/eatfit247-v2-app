import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { CreateMemberHealthIssueDto } from '../dto/member-health-issue.dto';
import { MemberHealthIssueService } from '../services/member-health-issue.service';

@Controller('member-health-issue')
export class MemberHealthIssueController {
  constructor(private readonly service: MemberHealthIssueService) {}

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async getMemberPocketGuideById(@Param('id') id: number) {
    return await this.service.fetchMemberHealthIssues(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async createOrUpdate(@Param('id') id: number, @Req() req, @Body() body: CreateMemberHealthIssueDto) {
    return await this.service.createOrUpdate(id, body, req.ip, req.user.userId);
  }
}
