import {
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

@Controller("media")
export class FileUploadController {
  rootFolderPath = `${Env.persistentStorageAssetPath}`;

  @Post("upload-media")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@Body() mediaDto: MediaDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 50 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    ) file: Express.Multer.File) {
    const fileName = file.originalname.replace(/[/\\?%*:|"<>]/g, "-");
    const destinationFolderPath = `${this.rootFolderPath}/${mediaDto.mediaFor}`;
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    //CREATE DIRECTORY IF NOT EXISTS (async)
    try {
      await fs.access(destinationFolderPath);
    } catch {
      await fs.mkdir(destinationFolderPath, { recursive: true });
    }
    //Write File (async)
    await fs.writeFile(destinationPath, file.buffer as Uint8Array);
    return {
      fieldName: file.fieldname,
      fileName: fileName,
      originalName: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      webUrl: `media-files/${mediaDto.mediaFor}/${fileName}`
    };
  }
}

