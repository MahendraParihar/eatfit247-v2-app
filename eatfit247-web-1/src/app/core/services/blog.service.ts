import { inject, Injectable } from '@angular/core';
import { HttpService } from './http.service';
import {
  IBlogCategory,
  IPublicBlog,
  IPublicTableList,
} from '@eatfit247-shared-library/core';
import { ICardData } from '@shared-ui';
import { buildMediaUrl } from '../utils/media-url.util';

/**
 * BlogService
 *
 * Central place for all public blog API calls.
 * Components should depend on this service instead of using HttpService directly.
 */
@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly httpService = inject(HttpService);

  /**
   * Load paginated list of blogs.
   */
  async getBlogs(
    page: number,
    limit: number
  ): Promise<IPublicTableList<IPublicBlog> | null> {
    const res = await this.httpService.get<IPublicTableList<IPublicBlog>>(
      'blog/list',
      {
        params: {
          page: page.toString(),
          limit: limit.toString()
        }
      }
    );
    return res.data;
  }

  /**
   * Load a single blog by slug.
   */
  async getBlogBySlug(slug: string): Promise<IPublicBlog | null> {
    const encodedSlug = encodeURIComponent(slug);
    const res = await this.httpService.get<IPublicBlog>(
      `blog/by-url/${encodedSlug}`
    );
    return res.data;
  }

  /**
   * Load all active blog categories.
   */
  async getBlogCategories(): Promise<IBlogCategory[]> {
    const res = await this.httpService.get<IBlogCategory[]>(
      'blog-category/list',
    );
    return res.data ?? [];
  }

  /**
   * Load related blogs, optionally filtered by category,
   * excluding the current blog id.
   */
  async getRelatedBlogs(
    categoryId?: number,
    currentBlogId?: number,
    limit: number = 4
  ): Promise<IPublicBlog[]> {
    const params: Record<string, string> = {
      page: '0',
      limit: limit.toString()
    };
    if (categoryId) {
      params['blogCategoryId'] = categoryId.toString();
    }
    const response = await this.httpService.get<IPublicTableList<IPublicBlog>>(
      'blog/list',
      { params }
    );
    const tableData: IPublicBlog[] = response.data?.tableData ?? [];
    return tableData
      .filter((blog) => blog.blogId !== currentBlogId)
      .slice(0, limit);
  }

  mapBlogsToCards(blogs: IPublicBlog[]): ICardData[] {
    return blogs.map((blog) => this.mapBlogToCard(blog));
  }

  private mapBlogToCard(blog: IPublicBlog): ICardData {
    const firstImage =
      blog.imagePath && blog.imagePath.length > 0 ? blog.imagePath[0] : null;
    const imageUrl = buildMediaUrl(firstImage?.webUrl);
    const summary = blog.description
      ? blog.description
      .replace(/<[^>]*>/g, '')
      .substring(0, 150)
      .trim() + '...'
      : '';
    const wordCount = blog.description
      ? blog.description.replace(/<[^>]*>/g, '').split(/\s+/).length
      : 0;
    const readTime = Math.ceil(wordCount / 200);
    const blogUrl = blog.seo?.url
      ? `/blog/${blog.seo.url}`
      : `/blog/${blog.title.toLowerCase().replace(/\s+/g, '-')}`;
    return {
      id: blog.blogId,
      title: blog.title,
      summary,
      linkUrl: blogUrl,
      imageUrl,
      imageAlt: blog.title,
      category: blog.blogCategory
        ? blog.blogCategory.replace(/\\(['"])/g, '$1')
        : undefined,
      date: blog.writtenAt ? new Date(blog.writtenAt) : undefined,
      readTime: readTime > 0 ? readTime : undefined
    };
  }
}


