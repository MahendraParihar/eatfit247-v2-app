import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { BlogService, BlogPost } from '../../services/blog.service';
import { SEOService } from '../../services/seo.service';

/**
 * Blog Detail Component
 * Displays full blog post content with sidebar
 */
@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
  ],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seoService = inject(SEOService);

  blogPost: BlogPost | undefined;
  recentPosts: BlogPost[] = [];
  relatedPosts: BlogPost[] = [];
  slug: string | null = null;
  loading = true;
  notFound = false;
  sanitizedContent: SafeHtml | null = null;
  private routeSubscription?: Subscription;

  ngOnInit(): void {
    // Subscribe to route parameter changes to handle navigation between blog posts
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');

      if (slug) {
        // Decode URL-encoded slug if needed (Angular router may already decode, but handle edge cases)
        try {
          this.slug = decodeURIComponent(slug);
        } catch (error) {
          // If decoding fails, use the slug as-is (it might already be decoded)
          this.slug = slug;
        }
        this.loadBlogPost(this.slug);
      } else {
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  /**
   * Load blog post by slug (URL)
   */
  private async loadBlogPost(slug: string): Promise<void> {
    // Reset state when loading a new blog post
    this.loading = true;
    this.notFound = false;
    this.blogPost = undefined;
    this.recentPosts = [];
    this.relatedPosts = [];
    this.sanitizedContent = null;

    try {
      // Slug is already decoded in ngOnInit, pass it directly to the service
      const post = await this.blogService.getPostBySlug(slug);
      console.log(post)

      if (!post) {
        this.notFound = true;
        this.loading = false;
        return;
      }

      this.blogPost = post;

      // Sanitize HTML content
      if (this.blogPost.content) {
        this.sanitizedContent = this.sanitizer.sanitize(
          1,
          this.blogPost.content
        ) as SafeHtml;
      } else {
        // Use excerpt as content if no full content available
        this.sanitizedContent = this.sanitizer.sanitize(
          1,
          `<p>${this.blogPost.excerpt}</p>`
        ) as SafeHtml;
      }

      // Load recent posts (excluding current)
      try {
        this.recentPosts = await this.blogService.getRecentPosts(this.blogPost.id, 5);
      } catch (error) {
        console.error('Error loading recent posts:', error);
        this.recentPosts = [];
      }

      // Load related posts (same category, excluding current)
      try {
        if (this.blogPost.categoryId) {
          const categoryPosts = await this.blogService.getPostsByCategory(this.blogPost.categoryId);
          this.relatedPosts = categoryPosts
            .filter((p) => p.id !== this.blogPost!.id)
            .slice(0, 3);
        } else {
          this.relatedPosts = [];
        }
      } catch (error) {
        console.error('Error loading related posts:', error);
        this.relatedPosts = [];
      }

      // Update SEO
      this.updateSEO();

      this.loading = false;
    } catch (error) {
      console.error('Error loading blog post:', error);
      this.notFound = true;
      this.loading = false;
    }
  }

  /**
   * Update SEO meta tags
   */
  private updateSEO(): void {
    if (!this.blogPost) return;

    this.seoService.updateSEO({
      title: `${this.blogPost.title} | EatFit24By7 Blog`,
      description: this.blogPost.excerpt,
      keywords:
        this.blogPost.tags && Array.isArray(this.blogPost.tags)
          ? this.blogPost.tags?.join(', ')
          : this.blogPost.title,
    });

    // Add article structured data
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: this.blogPost.title,
      description: this.blogPost.excerpt,
      author: {
        '@type': 'Person',
        name: this.blogPost.author,
      },
      datePublished: this.blogPost.publishDate.toISOString(),
      dateModified: this.blogPost.publishDate.toISOString(),
      image: this.blogPost.imageUrl || undefined,
      publisher: {
        '@type': 'Organization',
        name: 'EatFit24By7',
        logo: {
          '@type': 'ImageObject',
          url: 'https://eatfit24by7.com/assets/images/logo.png',
        },
      },
    };
    this.seoService.addStructuredData(articleData);
  }

  /**
   * Navigate back to blog list
   */
  goBack(): void {
    this.router.navigate(['/blog']);
  }

  /**
   * Get blog post URL
   */
  getPostUrl(post: BlogPost): string {
    return `/blog/${post.slug}`;
  }

  /**
   * Share on social media
   */
  shareOnSocial(platform: string): void {
    if (!this.blogPost) return;

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.blogPost.title);
    const text = encodeURIComponent(this.blogPost.excerpt);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${title}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

