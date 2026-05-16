import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BlogService, JsonLdService, SEOService } from '../../core/services';
import {
  BreadcrumbsComponent,
  EmptyStateComponent,
  ICardData,
  LoaderComponent,
} from '@shared-ui';

interface IBlogTag {
  key: string;
  label: string;
}

@Component({
  standalone: true,
  selector: 'app-blog',
  imports: [
    CommonModule,
    RouterLink,
    MatPaginatorModule,
    LoaderComponent,
    EmptyStateComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);
  private readonly allBlogs = signal<ICardData[]>([]);
  readonly loading = signal(false);
  readonly pageSize = signal(6);
  readonly currentPage = signal(0);

  /** Tag filter — `all` shows every blog. */
  readonly activeTag = signal<string>('all');
  readonly blogTags: readonly IBlogTag[] = [
    { key: 'all', label: 'All' },
    { key: 'Weight', label: 'Weight' },
    { key: 'PCOS', label: 'PCOS' },
    { key: 'Diabetes', label: 'Diabetes' },
    { key: 'Mindful', label: 'Mindful eating' },
    { key: 'Recipes', label: 'Recipes' },
  ];

  /** Blogs after the active tag filter is applied. */
  readonly filteredBlogs = computed<ICardData[]>(() => {
    const tag = this.activeTag();
    const all = this.allBlogs();
    if (tag === 'all') {
      return all;
    }
    const needle = tag.toLowerCase();
    return all.filter((b) => (b.category || '').toLowerCase().includes(needle));
  });

  /** Visible page slice (after filter + pagination). */
  readonly blogs = computed<ICardData[]>(() => {
    const list = this.filteredBlogs();
    const size = this.pageSize();
    if (size === 0) {
      return list;
    }
    const start = this.currentPage() * size;
    return list.slice(start, start + size);
  });

  readonly totalBlogs = computed<number>(() => this.filteredBlogs().length);

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Health & Nutrition Blog',
      description:
        'Discover nutrition tips, healthy recipes, and wellness insights from EatFit247 experts.',
      url: '/blog',
    });
    // Preselect tag from `?tag=` query param (set by blog-detail category links).
    this.route.queryParamMap.subscribe((params) => {
      const tagParam = params.get('tag');
      if (tagParam) {
        const match = this.blogTags.find(
          (t) =>
            t.key.toLowerCase() === tagParam.toLowerCase() ||
            t.label.toLowerCase() === tagParam.toLowerCase(),
        );
        this.activeTag.set(match ? match.key : tagParam);
        this.currentPage.set(0);
      }
    });
    void this.loadBlogs();
  }

  setTag(tag: string): void {
    this.activeTag.set(tag);
    this.currentPage.set(0);
  }

  /**
   * Load blogs from API. Fetch a single large page; filtering and pagination
   * happen client-side so tag filters stay snappy.
   */
  async loadBlogs(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.blogService.getBlogs(0, 1000);
      if (response) {
        this.allBlogs.set(this.blogService.mapBlogsToCards(response.tableData));
        // Inject ItemList JSON-LD for blog listing
        this.jsonLdService.setPageSchema({
          '@type': 'ItemList',
          name: 'EatFit247 Blog Articles',
          itemListElement: response.tableData
            .slice(0, 10)
            .map((blog: any, i: number) => {
              const slug =
                blog.seo?.url || blog.title?.toLowerCase().replace(/\s+/g, '-');
              const image = blog.imagePath?.[0]?.webUrl;
              return {
                '@type': 'ListItem',
                position: i + 1,
                item: {
                  '@type': 'BlogPosting',
                  headline: blog.title,
                  url: `https://eatfit24by7.com/blog/${slug}`,
                  ...(image ? { image } : {}),
                  ...(blog.writtenAt
                    ? { datePublished: new Date(blog.writtenAt).toISOString() }
                    : {}),
                },
              };
            }),
        } as Record<string, unknown>);
      } else {
        this.allBlogs.set([]);
      }
    } catch (error) {
      this.allBlogs.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.scrollToTop();
  }

  /**
   * Handle page-size dropdown change (3 / 6 / 9 / 12 / All)
   */
  onPageSizeChange(value: string): void {
    const next = parseInt(value, 10);
    this.pageSize.set(isNaN(next) ? 6 : next);
    this.currentPage.set(0);
    this.scrollToTop();
  }

  /**
   * Format a date or string into "MMM dd, yyyy" e.g. May 22, 2026
   */
  formatDate(date: string | Date | undefined): string {
    if (!date) {
      return '';
    }
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  }

  private scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    // Mirror design: scroll the grid into view, not the whole page.
    const grid = document.getElementById('grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
