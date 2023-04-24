import { Body, Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Post } from '@nestjs/common/decorators';
import { JwtAuthGuard } from '../account/jwt-auth.guard';
import { ConfigParameterService } from './config-parameter.service';
import { ConfigParamDto } from './dto/config-parameter.dto';

@Controller('config-parameter')
export class ConfigParameterController {
  constructor(private readonly configParameterService: ConfigParameterService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async list() {
    return await this.configParameterService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post('update')
  async update(@Req() req: any, @Body() body: ConfigParamDto[]) {
    return await this.configParameterService.update(body, req.ip, req.user.userId);
  }
}
