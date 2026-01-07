import { Injectable, inject } from '@angular/core';
import { HttpService } from './http.service';
import { IPublicBlog, IPublicTableList, IBlogCategory } from 'eatfit247-shared-library';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  publishDate: Date;
  category: string;
  categoryId?: number;
  imageUrl?: string;
  imageAlt?: string;
  slug: string;
  readTime?: number; // in minutes
  tags?: string[];
}

/**
 * Service to manage blog data
 * Fetches blog posts from the public API
 */
@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private readonly httpService = inject(HttpService);

  /**
   * Get all blog posts
   */
  async getAllPosts(): Promise<BlogPost[]> {
    const result = await this.getPaginatedPosts(0, 1000);
    return result.posts;
  }

  /**
   * Get paginated blog posts
   */
  async getPaginatedPosts(page: number, pageSize: number, categoryId?: number): Promise<{
    posts: BlogPost[];
    total: number;
    totalPages: number;
  }> {
    try {
      const params: any = {
        page: page.toString(),
        limit: pageSize.toString(),
      };

      if (categoryId) {
        params.blogCategoryId = categoryId.toString();
      }

      const data = await this.httpService.get<IPublicTableList<IPublicBlog>>(
        'public/blog/list',
        params
      );

      if (data) {
        const posts = data.tableData.map((blog: IPublicBlog) => this.mapBlogToPost(blog));
        const total = data.count;
        const totalPages = Math.ceil(total / pageSize);
        return { posts, total, totalPages };
      } else {
        return { posts: [], total: 0, totalPages: 0 };
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return { posts: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Get blog post by ID
   */
  async getPostById(id: string): Promise<BlogPost | null> {
    try {
      const blog = await this.httpService.get<IPublicBlog>(`public/blog/${id}`);
      return blog ? this.mapBlogToPost(blog) : null;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }
  }

  /**
   * Get blog post by slug (URL)
   */
  async getPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
      // Encode the slug for the URL path to handle special characters
      const encodedSlug = encodeURIComponent(slug);
      const blog = await this.httpService.get<IPublicBlog>(`public/blog/by-url/${encodedSlug}`);
      return blog ? this.mapBlogToPost(blog) : null;
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      return null;
    }
  }

  /**
   * Get recent posts (excluding current post)
   */
  async getRecentPosts(excludeId?: string, limit: number = 5): Promise<BlogPost[]> {
    const result = await this.getPaginatedPosts(0, limit + 1);
    let posts = result.posts;
    if (excludeId) {
      posts = posts.filter((post) => post.id !== excludeId);
    }
    return posts.slice(0, limit);
  }

  /**
   * Get posts by category ID
   */
  async getPostsByCategory(categoryId: number): Promise<BlogPost[]> {
    try {
      const data = await this.httpService.get<IPublicTableList<IPublicBlog>>(
        'public/blog/list',
        {
          blogCategoryId: categoryId.toString(),
          limit: '1000',
        }
      );

      if (data) {
        return data.tableData.map((blog: IPublicBlog) => this.mapBlogToPost(blog));
      }
      return [];
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      return [];
    }
  }

  /**
   * Get all categories from API
   */
  async getAllCategories(): Promise<IBlogCategory[]> {
    try {
      const categories = await this.httpService.get<IBlogCategory[]>('public/blog-category/list');
      if (categories && Array.isArray(categories)) {
        return categories.sort((a, b) => (a.blogCategory || '').localeCompare(b.blogCategory || ''));
      }
      return [];
    } catch (error) {
      console.error('Error fetching blog categories:', error);
      return [];
    }
  }

  /**
   * Map IPublicBlog from API to BlogPost
   */
  private mapBlogToPost(blog: IPublicBlog): BlogPost {
    // Get the first image from imagePath array
    const firstImage = blog.imagePath && blog.imagePath.length > 0
      ? blog.imagePath[0]
      : null;
    const imageUrl = firstImage?.webUrl || '';
    // Extract excerpt from description (first 200 characters)
    const excerpt = blog.description
      ? blog.description.substring(0, 200).replace(/<[^>]*>/g, '') + '...'
      : '';
    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = blog.description ? blog.description.replace(/<[^>]*>/g, '').split(/\s+/).length : 0;
    const readTime = Math.ceil(wordCount / 200);
    return {
      id: blog.blogId.toString(),
      title: blog.title,
      excerpt: excerpt,
      content: blog.description,
      author: blog.blogAuthor || 'eatfit247',
      publishDate: blog.writtenAt ? new Date(blog.writtenAt) : new Date(),
      category: blog.blogCategory || 'Uncategorized',
      categoryId: blog.blogCategoryId,
      imageUrl: imageUrl,
      imageAlt: blog.title,
      slug: blog.seo?.url || blog.title.toLowerCase().replace(/\s+/g, '-'),
      readTime: readTime,
      tags: blog.seo?.tags || []
    };
  }
}
