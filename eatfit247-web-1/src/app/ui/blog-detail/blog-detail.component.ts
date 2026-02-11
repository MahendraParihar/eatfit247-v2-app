import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BlogService, SEOService } from '../../core/services';
import { buildMediaUrl } from '../../core/utils/media-url.util';
import { IPublicBlog } from '@eatfit247-shared-library/core';
import {
  ICardData,
  LoaderComponent,
  SocialSiteComponent,
  SocialSiteItem
} from '@shared-ui';
import { MatButton } from '@angular/material/button';

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

@Component({
  standalone: true,
  selector: 'app-blog-details',
  imports: [
    CommonModule,
    RouterModule,
    LoaderComponent,
    SocialSiteComponent,
    MatButton
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss'
})
export class BlogDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly blogService = inject(BlogService);
  private readonly seoService = inject(SEOService);
  private readonly sanitizer = inject(DomSanitizer);
  blog: IBlogDetails | null = null;
  relatedArticles: ICardData[] = [];
  loading = signal(true);
  error = signal(false);

  /**
   * Social share items for this blog, derived from `getShareLink`.
   */
  get shareItems(): SocialSiteItem[] {
    if (!this.blog) {
      return [];
    }
    return [
      {
        link: this.getShareLink('facebook'),
        icon: 'facebook',
        type: 'external'
      },
      {
        link: this.getShareLink('instagram'),
        icon: 'instagram',
        type: 'external'
      },
      {
        link: this.getShareLink('pinterest'),
        icon: 'pinterest',
        type: 'external'
      },
      {
        link: this.getShareLink('linkedin'),
        icon: 'linkedin',
        type: 'external'
      },
      {
        link: this.getShareLink('telegram'),
        icon: 'telegram',
        type: 'external'
      }
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
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
      await this.loadRelatedArticles(apiBlog.blogCategoryId, apiBlog.blogId);
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

  /**
   * Handle native share where available, falls back to copying URL/opening links.
   */
  async shareArticle(): Promise<void> {
    if (!this.blog) {
      return;
    }
    const shareUrl = `${window.location.origin}/blog/${this.blog.slug}`;
    const shareTitle = this.blog.title;
    const shareText = this.blog.excerpt;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as any).share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.error('Native share failed:', err);
        // Fall through to link-based sharing
      }
    }
    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Optional: we can add a toast here in future
    } catch (err) {
      console.error('Failed to copy share URL:', err);
    }
  }

  /**
   * Utility to build share URLs for social platforms.
   */
  getShareLink(
    platform: 'facebook' | 'instagram' | 'pinterest' | 'linkedin' | 'telegram'
  ): string {
    if (!this.blog) {
      return '#';
    }
    const url = encodeURIComponent(
      `${window.location.origin}/blog/${this.blog.slug}`
    );
    const text = encodeURIComponent(this.blog.title);
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'instagram':
        return `https://www.instagram.com/sharer/sharer.php?u=${url}`;
      case 'pinterest':
        return `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'telegram':
        return `https://t.me/share/url?url=${url}&text=${text}`;
      default:
        return '#';
    }
  }
}


