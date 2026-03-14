import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { Env } from '@server_1/core';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaDto } from './dto/media-for.dto';
import 'multer';
import { MediaForEnum } from '@eatfit247-shared-lib';

@Controller('media')
export class FileUploadController {
  rootFolderPath = `${Env.persistentStorageAssetPath}`;

  @Post('upload-media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body() mediaDto: MediaDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 50 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
  ) {
    const ALLOWED_MEDIA_DIRS = Object.values(MediaForEnum);
    if (!ALLOWED_MEDIA_DIRS.includes(mediaDto.mediaFor as MediaForEnum)) {
      throw new BadRequestException('Invalid media category');
    }

    const fileName = file.originalname.replace(/[/\\?%*:|"<>]/g, '-');
    const destinationFolderPath = `${this.rootFolderPath}/${mediaDto.mediaFor}`;
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    try {
      await fs.access(destinationFolderPath);
    } catch {
      await fs.mkdir(destinationFolderPath, { recursive: true });
    }
    await fs.writeFile(destinationPath, file.buffer as Uint8Array);
    return {
      fieldName: file.fieldname,
      fileName: fileName,
      originalName: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      webUrl: `media-files/${mediaDto.mediaFor}/${fileName}`,
    };
  }
}
