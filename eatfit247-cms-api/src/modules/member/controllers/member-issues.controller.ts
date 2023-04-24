import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { BasicSearchDto } from 'src/common-dto/basic-input.dto';
import { JwtAuthGuard } from 'src/modules/account/jwt-auth.guard';
import { MemberIssueResponseDto, MemberIssueStatusDto } from '../dto/member-issue-response.dto';
import { MemberIssuesService } from '../services/member-issues.service';

@Controller('member-issue')
export class MemberIssuesController {
  constructor(private readonly service: MemberIssuesService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list/:id')
  async list(@Param('id') id: number, @Query() req: BasicSearchDto) {
    return await this.service.findAll(id, req);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage')
  async updateResponse(@Req() req, @Body() body: MemberIssueResponseDto) {
    return await this.service.update(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') memberIssueId: number, @Body() body: MemberIssueStatusDto, @Req() req) {
    return await this.service.changeStatus(memberIssueId, body, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteIssue(@Param('id') memberIssueId: number, @Req() req) {
    return await this.service.deleteIssue(memberIssueId, req.user.userId);
  }
}
