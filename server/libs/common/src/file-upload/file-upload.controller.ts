import {
  Body,
  Controller,
  Get,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  SequelizeHealthIndicator
} from "@nestjs/terminus";
import fs from "fs";
import { Env } from '@server/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaDto } from './dto/media-for.dto';

@Controller("media")
export class FileUploadController {
  rootFolderPath = `${Env.persistentStorageAssetPath}`;

  @Post("upload-media")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@Body() mediaDto: MediaDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY })
    ) file: File) {
    const fileName = file["originalname"].replace(/[/\\?%*:|"<>]/g, "-");
    const destinationFolderPath = `${this.rootFolderPath}/${mediaDto.mediaFor}`;
    const destinationPath = `${destinationFolderPath}/${fileName}`;
    //CREATE DIRECTORY IF NOT EXISTS
    if (!fs.existsSync(destinationFolderPath)) {
      fs.mkdirSync(destinationFolderPath, { recursive: true });
    }
    //Write File
    await fs.writeFileSync(destinationPath, file["buffer"]);
    return {
      fieldName: file["fieldname"],
      fileName: fileName,
      originalName: file["originalname"],
      encoding: file["encoding"],
      mimetype: file["mimetype"],
      size: file["size"],
      webUrl: `media-files/${mediaDto.mediaFor}/${fileName}`
    };
  }
}

