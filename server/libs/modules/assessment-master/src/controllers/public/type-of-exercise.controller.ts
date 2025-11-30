import { Controller, Get, Query } from '@nestjs/common';
import { TypeOfExerciseService } from '../../services';
import { ITableList, ITypeOfExercise } from 'eatfit247-shared-lib';
import { BasicSearchDto } from '@server/common';

@Controller('public/type-of-exercise')
export class PublicTypeOfExerciseController {
  constructor(private readonly service: TypeOfExerciseService) {}

  @Get('list')
  async list(@Query() req: BasicSearchDto): Promise<ITableList<ITypeOfExercise>> {
    return await this.service.findAll(req);
  }
}

