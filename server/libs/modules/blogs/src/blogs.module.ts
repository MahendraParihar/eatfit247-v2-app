import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MstBlogAuthor, MstBlogCategory, MstAdminUser, modelRegistry } from '@server/common';
import { TxnBlog } from './models';
import { BlogService, BlogCategoryService, BlogAuthorService } from './services';
import {
  BlogController,
  BlogCategoryController,
  BlogAuthorController,
  BlogCommentsController,
  PublicBlogController,
} from './controllers';

// Register TxnBlog with model registry (Mst models are registered in @server/common)
modelRegistry.register([TxnBlog]);

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

