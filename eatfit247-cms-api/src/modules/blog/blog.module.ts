import { Module } from '@nestjs/common';
import { BlogController } from './controllers/blog.controller';
import { BlogCommentsController } from './controllers/blog-comments.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ModelList } from '../../core/database/db.model-list';
import { ExceptionService } from '../common/exception.service';
import { CommonService } from '../common/common.service';
import { BlogService } from './blog.service';
import { BlogCategoryService } from '../lov/services/blog-category.service';
import { BlogAuthorService } from '../lov/services/blog-author.service';

@Module({
  imports: [SequelizeModule.forFeature(ModelList)],
  providers: [ExceptionService, BlogService, CommonService, BlogCategoryService, BlogAuthorService],
  controllers: [BlogController, BlogCommentsController],
})
export class BlogModule {}
