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
    PublicBlogController, // Register a public controller first to avoid route conflicts
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
export class BlogModule {
}

