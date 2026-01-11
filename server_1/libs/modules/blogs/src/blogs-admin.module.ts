import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstBlogAuthor, MstBlogCategory, TxnBlog } from './models';
import { BlogAuthorService, BlogCategoryService, BlogService } from './services';
import {
  BlogAuthorController,
  BlogCategoryController,
  BlogCommentsController,
  BlogController,
} from './controllers';

// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([TxnBlog, MstBlogAuthor, MstBlogCategory]);

/**
 * Admin-only Blog Module
 * Only includes the admin controllers
 */
@Module({
  imports: [
    SequelizeModule.forFeature([TxnBlog, MstBlogAuthor, MstBlogCategory]),
  ],
  controllers: [
    BlogController,
    BlogCategoryController,
    BlogAuthorController,
    BlogCommentsController,
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
export class BlogAdminModule {
}

