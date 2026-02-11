import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BlogService, BannerService } from '../../core/services';
import { CardComponent, EmptyStateComponent, ICardData, LoaderComponent, BannerComponent } from '@shared-ui';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-blog',
  imports: [
    CommonModule,
    MatPaginatorModule,
    CardComponent,
    EmptyStateComponent,
    LoaderComponent,
    BannerComponent
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly bannerService = inject(BannerService);
  readonly blogs = signal<ICardData[]>([]);
  readonly loading = signal(false);
  readonly totalBlogs = signal(0);
  readonly pageSize = signal(12);
  readonly currentPage = signal(0);
  readonly banners = signal<IMediaUpload[]>([]);

  ngOnInit(): void {
    void this.loadBannerData();
    void this.loadBlogs();
  }

  /**
   * Load blogs from API
   */
  async loadBlogs(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.blogService.getBlogs(
        this.currentPage(),
        this.pageSize()
      );
      if (response) {
        this.totalBlogs.set(response.count);
        this.blogs.set(this.blogService.mapBlogsToCards(response.tableData));
      } else {
        this.blogs.set([]);
        this.totalBlogs.set(0);
      }
    } catch (error) {
      console.error('Error loading blogs:', error);
      this.blogs.set([]);
      this.totalBlogs.set(0);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load banner images for Blog listing page.
   * Banner section will be hidden automatically if no banners are returned.
   */
  private async loadBannerData(): Promise<void> {
    try {
      const images = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.BLOGS,
      );
      this.banners.set(images ?? []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading blog banners:', error);
      this.banners.set([]);
    }
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    void this.loadBlogs();
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


