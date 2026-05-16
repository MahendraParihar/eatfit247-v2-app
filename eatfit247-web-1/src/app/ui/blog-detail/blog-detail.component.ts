import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService, JsonLdService, SEOService } from '../../core/services';
import { buildMediaUrl } from '../../core/utils/media-url.util';
import { IPublicBlog } from '@eatfit247-shared-library/core';
import { ICardData, LoaderComponent } from '@shared-ui';

/**
 * Interface for blog details data used on this page.
 * NOTE: This is a local interface and intentionally does NOT use IBLOG from shared library.
 */
interface IBlogDetails {
  id: string;
  title: string;
  contentHtml: string;
  safeContentHtml: SafeHtml;
  excerpt: string;
  category?: string;
  categoryId?: number;
  imageUrl?: string;
  imageAlt?: string;
  slug: string;
  readTimeMinutes?: number;
  publishedAt?: Date;
  formattedDate?: string;
}

interface ICategoryItem {
  name: string;
  count: number;
}

@Component({
  standalone: true,
  selector: 'app-blog-details',
  imports: [
    CommonModule,
    RouterModule,
    LoaderComponent
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss'
})
export class BlogDetailsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly seoService = inject(SEOService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();
  blog: IBlogDetails | null = null;
  relatedArticles: ICardData[] = [];
  recentArticles: ICardData[] = [];
  categories: ICategoryItem[] = [];
  loading = signal(true);
  error = signal(false);
  /** Tracks the "copied!" pulse on the share-row's copy button. */
  readonly linkCopied = signal(false);
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadBlogDetails(slug);
      }
    });
  }

  /**
   * Load blog details by slug from public API.
   */
  private async loadBlogDetails(slug: string): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      const apiBlog = await this.blogService.getBlogBySlug(slug);
      if (!apiBlog) {
        this.blog = null;
        this.error.set(true);
        return;
      }
      this.blog = this.mapApiBlogToDetails(apiBlog);
      // Update SEO using SEO service with article-specific details
      this.seoService.updateSEO({
        title: this.blog.title,
        description: this.blog.excerpt,
        image: this.blog.imageUrl,
        url: `/blog/${this.blog.slug}`,
        type: 'article'
      });
      // Inject BlogPosting + BreadcrumbList structured data
      this.jsonLdService.setPageSchema([
        {
          '@type': 'BlogPosting',
          headline: this.blog.title,
          description: this.blog.excerpt,
          articleBody: this.blog.contentHtml?.replace(/<[^>]*>/g, '').substring(0, 5000),
          image: this.blog.imageUrl,
          datePublished: this.blog.publishedAt?.toISOString(),
          author: { '@type': 'Person', name: 'Shweta Shah' },
          publisher: {
            '@type': 'Organization',
            name: 'EatFit247',
            logo: { '@type': 'ImageObject', url: 'https://eatfit24by7.com/logo-white.svg' },
          },
          url: `https://eatfit24by7.com/blog/${this.blog.slug}`,
        },
        this.jsonLdService.buildBreadcrumb([
          { name: 'Home', url: 'https://eatfit24by7.com/' },
          { name: 'Blog', url: 'https://eatfit24by7.com/blog' },
          { name: this.blog.title, url: `https://eatfit24by7.com/blog/${this.blog.slug}` },
        ]),
      ]);
      await Promise.all([
        this.loadRelatedArticles(apiBlog.blogCategoryId, apiBlog.blogId),
        this.loadRecentAndCategories(apiBlog.blogId, this.blog.category),
      ]);
    } catch (err) {
      console.error('Error loading blog details:', err);
      this.blog = null;
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Map API blog object to IBlogDetails interface.
   */
  private mapApiBlogToDetails(apiBlog: IPublicBlog): IBlogDetails {
    const rawDescription: string = apiBlog.description ?? '';
    // Build excerpt from HTML description
    const plainText = rawDescription.replace(/<[^>]*>/g, ' ').trim();
    const excerpt =
      plainText.length > 0 ? `${plainText.substring(0, 200).trim()}...` : '';
    // Estimate read time (200 words per minute)
    const wordCount =
      plainText.length > 0 ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const readTimeMinutes =
      wordCount > 0 ? Math.ceil(wordCount / 200) : undefined;
    // Featured image handling (uses media URL utility for proxy)
    const firstImage =
      apiBlog.imagePath &&
      Array.isArray(apiBlog.imagePath) &&
      apiBlog.imagePath.length > 0
        ? apiBlog.imagePath[0]
        : null;
    const imageUrl = firstImage?.webUrl
      ? buildMediaUrl(firstImage.webUrl)
      : undefined;
    // Date formatting with ordinal (e.g., 10th May, 2025)
    const writtenAt: Date | undefined = apiBlog.writtenAt
      ? new Date(apiBlog.writtenAt)
      : undefined;
    const formattedDate = writtenAt
      ? this.formatDateWithOrdinal(writtenAt)
      : undefined;
    const slug: string =
      apiBlog.seo?.url ||
      (apiBlog.title || '').toString().toLowerCase().replace(/\s+/g, '-');
    const contentHtml: string = rawDescription;
    const safeContentHtml: SafeHtml =
      this.sanitizer.bypassSecurityTrustHtml(contentHtml);
    return {
      id: apiBlog.blogId?.toString?.() ?? '',
      title: apiBlog.title ?? '',
      contentHtml,
      safeContentHtml,
      excerpt,
      category: apiBlog.blogCategory || undefined,
      categoryId: apiBlog.blogCategoryId,
      imageUrl,
      imageAlt: apiBlog.title ?? '',
      slug,
      readTimeMinutes,
      publishedAt: writtenAt,
      formattedDate
    };
  }

  /**
   * Load related articles, prioritizing same category where possible.
   */
  private async loadRelatedArticles(
    categoryId?: number,
    currentBlogId?: number
  ): Promise<void> {
    try {
      const relatedBlogs = await this.blogService.getRelatedBlogs(
        categoryId,
        currentBlogId,
        4
      );
      this.relatedArticles = relatedBlogs
        .map((blog) => this.mapBlogToRelatedCard(blog));
    } catch (err) {
      console.error('Error loading related articles:', err);
      this.relatedArticles = [];
    }
  }

  /**
   * Load recent posts and category list (counts by category).
   */
  private async loadRecentAndCategories(
    currentBlogId?: number,
    currentCategory?: string
  ): Promise<void> {
    try {
      const response = await this.blogService.getBlogs(0, 50);
      const all: IPublicBlog[] = response?.tableData ?? [];
      // Recent: newest 4 (exclude current)
      this.recentArticles = all
        .filter((b) => b.blogId !== currentBlogId)
        .sort((a, b) => {
          const da = a.writtenAt ? new Date(a.writtenAt).getTime() : 0;
          const db = b.writtenAt ? new Date(b.writtenAt).getTime() : 0;
          return db - da;
        })
        .slice(0, 4)
        .map((b) => this.mapBlogToRelatedCard(b));
      // Categories: counts by blogCategory
      const counts = new Map<string, number>();
      for (const blog of all) {
        const cat = blog.blogCategory;
        if (cat) {
          counts.set(cat, (counts.get(cat) ?? 0) + 1);
        }
      }
      // Ensure current category appears even if all-list missed it
      if (currentCategory && !counts.has(currentCategory)) {
        counts.set(currentCategory, 1);
      }
      this.categories = Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    } catch (err) {
      console.error('Error loading recent posts / categories:', err);
      this.recentArticles = [];
      this.categories = [];
    }
  }

  /**
   * Map API blog object to related article card data.
   */
  private mapBlogToRelatedCard(blog: IPublicBlog): ICardData {
    const firstImage =
      blog.imagePath &&
      Array.isArray(blog.imagePath) &&
      blog.imagePath.length > 0
        ? blog.imagePath[0]
        : null;
    const imageUrl = firstImage?.webUrl
      ? buildMediaUrl(firstImage.webUrl)
      : undefined;
    const plainText = (blog.description ?? '').replace(/<[^>]*>/g, ' ').trim();
    const summary =
      plainText.length > 0 ? `${plainText.substring(0, 120).trim()}...` : '';
    const writtenAt: Date | undefined = blog.writtenAt
      ? new Date(blog.writtenAt)
      : undefined;
    const wordCount =
      plainText.length > 0 ? plainText.split(/\s+/).filter(Boolean).length : 0;
    const readTime = wordCount > 0 ? Math.ceil(wordCount / 200) : undefined;
    const slug: string =
      blog.seo?.url ||
      (blog.title || '').toString().toLowerCase().replace(/\s+/g, '-');
    return {
      id: blog.blogId,
      title: blog.title ?? '',
      summary,
      linkUrl: `/blog/${slug}`,
      imageUrl,
      imageAlt: blog.title ?? '',
      category: blog.blogCategory || undefined,
      date: writtenAt,
      readTime
    };
  }

  /**
   * Format date like "10th May, 2025".
   */
  private formatDateWithOrdinal(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const getOrdinal = (n: number): string => {
      if (n > 3 && n < 21) {
        return 'th';
      }
      switch (n % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };
    return `${day}${getOrdinal(day)} ${month}, ${year}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Copy current page URL to clipboard and flash the "copied" success state
   * for ~1.6s so the green check icon is visible (matches the design).
   */
  async copyShareLink(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      this.linkCopied.set(true);
      if (this.copyResetTimer) {
        clearTimeout(this.copyResetTimer);
      }
      this.copyResetTimer = setTimeout(() => {
        this.linkCopied.set(false);
        this.copyResetTimer = null;
      }, 1600);
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    }
  }

  /**
   * Utility to build share URLs for social platforms.
   */
  getShareLink(
    platform: 'facebook' | 'twitter' | 'pinterest' | 'linkedin' | 'telegram' | 'whatsapp'
  ): string {
    if (!this.blog || !isPlatformBrowser(this.platformId)) {
      return '#';
    }
    const url = encodeURIComponent(
      `${window.location.origin}/blog/${this.blog.slug}`
    );
    const text = encodeURIComponent(this.blog.title);
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
      case 'pinterest':
        return `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'telegram':
        return `https://t.me/share/url?url=${url}&text=${text}`;
      case 'whatsapp':
        return `https://wa.me/?text=${text}%20${url}`;
      default:
        return '#';
    }
  }
}
