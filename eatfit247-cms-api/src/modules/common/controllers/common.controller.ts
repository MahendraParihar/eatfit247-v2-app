import {
  Body,
  Controller,
  Get, HttpStatus,
  ParseFilePipeBuilder,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { CommonService } from '../common.service';
import { IAddressMaster } from 'shared-lib';
import { StringResource } from 'shared-lib';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaDto } from '../../../common-dto/media.dto';
import { promisify } from 'util';
import * as fs from 'fs';
import { IS_DEV } from '../../../constants/config-constants';
import { Env } from '../../../util/env.values';

const mv = promisify(fs.rename);

@Controller('common')
export class CommonController {
  rootFolderPath = `${Env.persistentStorageAssetPath}`;

  constructor(private service: CommonService) {
  }

  @UseGuards(JwtAuthGuard)
  @Get('address-master')
  async addressMasterData(@Query() req) {
    const stateList = await this.service.getStateList();
    const countryList = await this.service.getCountryList();
    const addressTypeList = await this.service.getAddressTypeList();
    return <IAddressMaster>{
      state: stateList,
      country: countryList,
      addressType: addressTypeList,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('contact-number-master')
  async contactNumberMasterData(@Query() req) {
    return await this.service.getCountryCodeList();
  }

  @Post('media/upload-media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@Body() mediaDto: MediaDto, @UploadedFile(
    new ParseFilePipeBuilder()
      .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
      .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
  ) file: File) {
    try {
      const fileName = file['originalname'].replace(/[/\\?%*:|"<>]/g, '-');
      const destinationFolderPath = `${this.rootFolderPath}/${mediaDto.mediaFor}`;
      const destinationPath = `${destinationFolderPath}/${fileName}`;
      //CREATE DIRECTORY IF NOT EXISTS
      if (!fs.existsSync(destinationFolderPath)) {
        fs.mkdirSync(destinationFolderPath, { recursive: true });
      }
      await fs.writeFileSync(destinationPath, file['buffer']);
      return {
        fieldName: file['fieldname'],
        fileName: fileName,
        originalName: file['originalname'],
        encoding: file['encoding'],
        mimetype: file['mimetype'],
        size: file['size'],
        webUrl: `media-files/${mediaDto.mediaFor}/${fileName}`,
      };
    } catch (e) {
      throw e;
    }
  }
}
