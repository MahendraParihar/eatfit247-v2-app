import { Controller, Get } from '@nestjs/common';
import { FaqCategoryService } from '../../services';
import { IPublicFaqCategory } from '@eatfit247-shared-lib';
import { Public } from '@server_1/core';

@Public()
@Controller('faq-category')
export class PublicFaqCategoryController {
  constructor(private readonly service: FaqCategoryService) {}

  @Get('list')
  async list(): Promise<IPublicFaqCategory[]> {
    return await this.service.findAllPublic();
  }
}

