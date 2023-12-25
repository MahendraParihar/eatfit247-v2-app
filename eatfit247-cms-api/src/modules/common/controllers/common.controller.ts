import { Body, Controller, Get, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../account/jwt-auth.guard';
import { CommonService } from '../common.service';
import { ServerResponseEnum } from '../../../enums/server-response-enum';
import { StringResource } from '../../../enums/string-resource';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaDto } from '../../../common-dto/media.dto';
import { promisify } from 'util';
import * as fs from 'fs';
import { IS_DEV } from '../../../constants/config-constants';
import { MediaFolderEnum } from '../../../enums/media-folder-enum';
import { FileHelper } from 'src/util/file-helper';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CommonFunctionsUtil } from '../../../util/common-functions-util';

const mv = promisify(fs.rename);

@Controller('common')
export class CommonController {
  constructor(private service: CommonService) {
  }

  private static async moveFile(currentPath: string, destinationPath: string) {
    const original = join(currentPath);
    const target = join(destinationPath);
    await mv(original, target);
  }

  @UseGuards(JwtAuthGuard)
  @Get('address-master')
  async addressMasterData(@Query() req) {
    const stateList = await this.service.getStateList();
    const countryList = await this.service.getCountryList();
    const addressTypeList = await this.service.getAddressTypeList();
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        state: stateList,
        country: countryList,
        addressType: addressTypeList,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('contact-number-master')
  async contactNumberMasterData(@Query() req) {
    const countryList = await this.service.getCountryCodeList();
    return {
      code: ServerResponseEnum.SUCCESS,
      message: StringResource.SUCCESS,
      data: {
        country: countryList,
      },
    };
  }

  @Post('media/upload-media')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          cb(null, `${CommonFunctionsUtil.getMediaFolderPath()}/${MediaFolderEnum.UPLOADS}`);
        },
        filename: FileHelper.customFileName,
      }),
    }),
  )
  async uploadFile(@Body() mediaDto: MediaDto, @UploadedFile() file: Express.Multer.File, a: MulterOptions) {
    try {
      const currentPath = `${file.destination}/${file.filename}`;
      const destinationFolderPath = `${CommonFunctionsUtil.getMediaFolderPath()}/${mediaDto.mediaFor}`;
      const destinationPath = `${destinationFolderPath}/${file.filename}`;

      //CREATE DIRECTORY IF NOT EXISTS
      if (!fs.existsSync(destinationFolderPath)) {
        fs.mkdirSync(destinationFolderPath, { recursive: true });
      }

      await CommonController.moveFile(currentPath, destinationPath);
      const res = {
        fieldName: file.fieldname,
        fileName: file.filename,
        originalName: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        size: file.size,
        webUrl: `${MediaFolderEnum.MEDIA_FOLDER}/${mediaDto.mediaFor}/${file.filename}`,
      };
      return {
        code: ServerResponseEnum.SUCCESS,
        message: StringResource.SUCCESS,
        data: res,
      };
    } catch (e) {
      console.log(e);
      return {
        code: ServerResponseEnum.ERROR,
        message: IS_DEV ? e['message'] : StringResource.SOMETHING_WENT_WRONG,
        data: null,
      };
    }
  }

  editFileName = (req: any, file: { originalname: string }, callback: (arg0: null, arg1: string) => void) => {
    const name = file.originalname.split('.')[0];
    const fileExtName = '.' + file.originalname.split('.')[1];
    const randomName = Array(4)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    callback(null, `${name}-${randomName}${fileExtName}`);
  };

  imageFileFilter = (
    req: any,
    file: { originalname: string },
    callback: (arg0: Error | null, arg1: boolean) => void,
  ) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return callback(new Error('Only image files are allowed!'), false);
    }
    callback(null, true);
  };
}
