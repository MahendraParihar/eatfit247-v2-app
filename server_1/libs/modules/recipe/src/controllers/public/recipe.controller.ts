import { Controller, Get, Query } from '@nestjs/common';
import { RecipeService } from '../../services';
import { ITableList, IRecipe } from '@eatfit247-shared-lib';
import { BasicSearchDto } from '@server_1/shared-dto';

@Controller('public/recipe')
export class PublicRecipeController {
  constructor(private readonly service: RecipeService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<IRecipe>> {
    return await this.service.findAll(req);
  }
}

