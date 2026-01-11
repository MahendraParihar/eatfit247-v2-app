import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { modelRegistry } from '@server_1/core';
import { MstBlogAuthor, MstBlogCategory, TxnBlog } from './models';
import { BlogAuthorService, BlogCategoryService, BlogService } from './services';
import {
  PublicBlogController,
  PublicBlogCategoryController,
} from './controllers';

// Register models with the model registry
// These models have @Scopes decorator, so they MUST be registered for scopes to work
modelRegistry.register([TxnBlog, MstBlogAuthor, MstBlogCategory]);

/**
 * Public-only Blog Module
 * Only includes the public controllers
 */
@Module({
  imports: [
    SequelizeModule.forFeature([TxnBlog, MstBlogAuthor, MstBlogCategory]),
  ],
  controllers: [
    PublicBlogController,
    PublicBlogCategoryController,
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
export class BlogPublicModule {
}

