import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { TxnBlog, MstBlogAuthor, MstBlogCategory } from './models';
import { BlogService, BlogCategoryService, BlogAuthorService } from './services';
import {
  BlogController,
  BlogCategoryController,
  BlogAuthorController,
  BlogCommentsController,
  PublicBlogController,
} from './controllers';

// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
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

