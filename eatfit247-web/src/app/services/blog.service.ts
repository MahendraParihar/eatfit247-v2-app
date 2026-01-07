import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { IPublicBlog, IPublicTableList } from 'eatfit247-shared-library';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  author: string;
  publishDate: Date;
  category: string;
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
  providedIn: 'root',
})
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Get all blog posts
   */
  getAllPosts(): Observable<BlogPost[]> {
    return this.getPaginatedPosts(0, 1000).pipe(
      map((result) => result.posts),
    );
  }

  /**
   * Get paginated blog posts
   */
  getPaginatedPosts(page: number, pageSize: number): Observable<{
    posts: BlogPost[];
    total: number;
    totalPages: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', pageSize.toString());

    const url = `${this.apiUrl}/public/blog/list`;
    return this.http.get<IPublicTableList<IPublicBlog>>(url, { params }).pipe(
      map((response) => {
        const posts = response.tableData.map((blog: IPublicBlog) => this.mapBlogToPost(blog));
        const total = response.count;
        const totalPages = Math.ceil(total / pageSize);
        return { posts, total, totalPages };
      }),
      catchError((error) => {
        console.error('Error fetching blog posts:', error);
        return of({ posts: [], total: 0, totalPages: 0 });
      }),
    );
  }

  /**
   * Get blog post by ID
   */
  getPostById(id: string): Observable<BlogPost | null> {
    const url = `${this.apiUrl}/public/blog/${id}`;
    return this.http.get<IPublicBlog>(url).pipe(
      map((blog) => this.mapBlogToPost(blog)),
      catchError((error) => {
        console.error('Error fetching blog post:', error);
        return of(null);
      }),
    );
  }

  /**
   * Get blog post by slug (URL)
   */
  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const url = `${this.apiUrl}/public/blog/by-url/${slug}`;
    return this.http.get<IPublicBlog>(url).pipe(
      map((blog) => this.mapBlogToPost(blog)),
      catchError((error) => {
        console.error('Error fetching blog post by slug:', error);
        return of(null);
      }),
    );
  }

  /**
   * Get recent posts (excluding current post)
   */
  getRecentPosts(excludeId?: string, limit: number = 5): Observable<BlogPost[]> {
    return this.getPaginatedPosts(0, limit + 1).pipe(
      map((result) => {
        let posts = result.posts;
        if (excludeId) {
          posts = posts.filter((post) => post.id !== excludeId);
        }
        return posts.slice(0, limit);
      }),
    );
  }

  /**
   * Get posts by category
   */
  getPostsByCategory(category: string): Observable<BlogPost[]> {
    const params = new HttpParams()
      .set('search', category)
      .set('limit', '1000');

    const url = `${this.apiUrl}/public/blog/list`;
    return this.http.get<IPublicTableList<IPublicBlog>>(url, { params }).pipe(
      map((response) => {
        return response.tableData
          .filter((blog: IPublicBlog) => blog.blogCategory?.toLowerCase() === category.toLowerCase())
          .map((blog: IPublicBlog) => this.mapBlogToPost(blog));
      }),
      catchError((error) => {
        console.error('Error fetching posts by category:', error);
        return of([]);
      }),
    );
  }

  /**
   * Get all categories
   */
  getAllCategories(): Observable<string[]> {
    return this.getAllPosts().pipe(
      map((posts) => {
        const categories = new Set(posts.map((post) => post.category));
        return Array.from(categories).sort();
      }),
    );
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
      imageUrl: imageUrl,
      imageAlt: blog.title,
      slug: blog.seo?.url || blog.title.toLowerCase().replace(/\s+/g, '-'),
      readTime: readTime,
      tags: blog.seo?.tags || [],
    };
  }
}
