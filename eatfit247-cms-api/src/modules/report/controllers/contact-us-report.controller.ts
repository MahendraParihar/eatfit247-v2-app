import { Body, Controller, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { BasicSearchDto, UpdateActiveDto } from '../../../common-dto/basic-input.dto';
import { ContactUsReportService } from '../contact-us-report.service';
import { CreateContactUsDto, SendResponseDto } from '../dto/contact-us.dto';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';

@Controller('contact-us-report')
export class ContactUsReportController {
  constructor(private readonly service: ContactUsReportService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async list(@Query() req: BasicSearchDto) {
    return await this.service.findAll(req);
  }

  @UseGuards(JwtAuthGuard)
  @Get('manage/:id')
  async getById(@Param('id') id: number) {
    return await this.service.fetchById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('manage')
  async create(@Req() req, @Body() body: CreateContactUsDto) {
    return await this.service.create(body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('manage/:id')
  async update(@Param('id') id: number, @Req() req: any, @Body() body: CreateContactUsDto) {
    return await this.service.update(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('send-response/:id')
  async sendResponse(@Param('id') id: number, @Body() body: SendResponseDto, @Req() req: any) {
    return await this.service.sendResponse(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update-status/:id')
  async changeStatus(@Param('id') id: number, @Body() body: UpdateActiveDto, @Req() req: any) {
    return await this.service.changeStatus(id, body, req.ip, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('send-mail/:id')
  async sendResponseMail(@Param('id') id: number, @Req() req: any) {
    await this.service.sendEmail(id, req.user.userId);
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS_MAIL_SENT,
      data: null,
    };
  }
}
