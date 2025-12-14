import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TxnBlog, MstBlogAuthor, MstBlogCategory } from './models';
import { MstAdminUser, modelRegistry } from '@server/common';
import { BlogService, BlogCategoryService, BlogAuthorService } from './services';
import {
  BlogController,
  BlogCategoryController,
  BlogAuthorController,
  BlogCommentsController,
  PublicBlogController,
} from './controllers';

// Register models with the model registry before module initialization
// This allows models with scopes to be included in the initial Sequelize connection
modelRegistry.register([TxnBlog, MstBlogAuthor, MstBlogCategory]);

@Module({
  imports: [
    SequelizeModule.forFeature([TxnBlog, MstBlogAuthor, MstBlogCategory]),
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

