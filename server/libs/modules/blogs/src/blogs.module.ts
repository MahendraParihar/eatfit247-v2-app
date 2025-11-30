import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnBlog, MstBlogAuthor, MstBlogCategory } from './models';
import { MstAdminUser } from '@server/common';
import { BlogService, BlogCategoryService, BlogAuthorService } from './services';
import {
  BlogController,
  BlogCategoryController,
  BlogAuthorController,
  BlogCommentsController,
  PublicBlogController,
} from './controllers';

@Module({
  imports: [
    SequelizeModule.forFeature([TxnBlog, MstBlogAuthor, MstBlogCategory, MstAdminUser]),
  ],
  controllers: [
    BlogController,
    BlogCategoryController,
    BlogAuthorController,
    BlogCommentsController,
    PublicBlogController,
  ],
  providers: [
    BlogService,
    BlogCategoryService,
    BlogAuthorService,
  ],
  exports: [
    BlogService,
    BlogCategoryService,
    BlogAuthorService,
    SequelizeModule,
  ],
})
export class BlogsModule {
}

