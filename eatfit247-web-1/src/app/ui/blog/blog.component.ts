import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BannerService, BlogService, JsonLdService, SEOService } from '../../core/services';
import { BannerComponent, CardComponent, EmptyStateComponent, ICardData, LoaderComponent } from '@shared-ui';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-blog',
  imports: [
    CommonModule,
    MatPaginatorModule,
    CardComponent,
    LoaderComponent,
    EmptyStateComponent,
    BannerComponent
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss'
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly bannerService = inject(BannerService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly blogs = signal<ICardData[]>([]);
  readonly loading = signal(false);
  readonly totalBlogs = signal(0);
  readonly pageSize = signal(6);
  readonly currentPage = signal(0);
  readonly banners = signal<IPublicBanner[]>([]);

  ngOnInit(): void {
    this.seoService.updateSEO({ title: 'Health & Nutrition Blog', description: 'Discover nutrition tips, healthy recipes, and wellness insights from EatFit247 experts.', url: '/blog' });
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
        // Inject ItemList JSON-LD for blog listing
        this.jsonLdService.setPageSchema({
          '@type': 'ItemList',
          name: 'EatFit247 Blog Articles',
          itemListElement: response.tableData.slice(0, 10).map((blog: any, i: number) => {
            const slug = blog.seo?.url || blog.title?.toLowerCase().replace(/\s+/g, '-');
            const image = blog.imagePath?.[0]?.webUrl;
            return {
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'BlogPosting',
                headline: blog.title,
                url: `https://eatfit24by7.com/blog/${slug}`,
                ...(image ? { image } : {}),
                ...(blog.writtenAt ? { datePublished: new Date(blog.writtenAt).toISOString() } : {}),
              },
            };
          }),
        } as Record<string, unknown>);
      } else {
        this.blogs.set([]);
        this.totalBlogs.set(0);
      }
    } catch (error) {
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
        BannerForEnum.BLOGS
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
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}


