import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { HttpService } from '../../core/services';
import { IPublicBlog, IPublicTableList } from '@eatfit247-shared-library/core';
import { ICardData } from '../../core/types/card.interface';
import { CardComponent } from '../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { buildMediaUrl } from '../../core/utils/media-url.util';

@Component({
  standalone: true,
  selector: 'app-blog',
  imports: [CommonModule, MatPaginatorModule, CardComponent, EmptyStateComponent],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit {
  private readonly httpService = inject(HttpService);

  blogs: ICardData[] = [];
  loading = false;
  totalBlogs = 0;
  pageSize = 12;
  currentPage = 0;

  ngOnInit(): void {
    this.loadBlogs();
  }

  /**
   * Load blogs from API
   */
  async loadBlogs(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.httpService.get<IPublicTableList<IPublicBlog>>(
        'public/blog/list',
        {
          params: {
            page: this.currentPage.toString(),
            limit: this.pageSize.toString(),
          },
        }
      );

      if (response) {
        this.totalBlogs = response.count;
        this.blogs = response.tableData.map((blog) => this.mapBlogToCard(blog));
      } else {
        this.blogs = [];
        this.totalBlogs = 0;
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      this.blogs = [];
      this.totalBlogs = 0;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Map IPublicBlog to ICardData
   */
  private mapBlogToCard(blog: IPublicBlog): ICardData {
    // Get the first image from imagePath array
    const firstImage = blog.imagePath && blog.imagePath.length > 0
      ? blog.imagePath[0]
      : null;
    
    // Handle image URL using media URL utility (uses /media-files proxy)
    const imageUrl = buildMediaUrl(firstImage?.webUrl);

    // Extract summary from description (strip HTML tags, first 150 characters)
    const summary = blog.description
      ? blog.description.replace(/<[^>]*>/g, '').substring(0, 150).trim() + '...'
      : '';

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = blog.description
      ? blog.description.replace(/<[^>]*>/g, '').split(/\s+/).length
      : 0;
    const readTime = Math.ceil(wordCount / 200);

    // Build blog URL from SEO URL or generate from title
    const blogUrl = blog.seo?.url
      ? `/blog/${blog.seo.url}`
      : `/blog/${blog.title.toLowerCase().replace(/\s+/g, '-')}`;

    return {
      id: blog.blogId,
      title: blog.title,
      summary: summary,
      linkUrl: blogUrl,
      imageUrl: imageUrl,
      imageAlt: blog.title,
      category: blog.blogCategory || undefined,
      date: blog.writtenAt ? new Date(blog.writtenAt) : undefined,
      readTime: readTime > 0 ? readTime : undefined,
    };
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadBlogs();
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


