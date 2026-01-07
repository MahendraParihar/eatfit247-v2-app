import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BlogService, BlogPost } from '../../services/blog.service';
import { BannerService } from '../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum, IBlogCategory } from 'eatfit247-shared-library';

/**
 * Blog Listing Component
 * Displays blog posts with pagination and sidebar
 */
@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    ImageSliderComponent,
  ],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
})
export class BlogComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly bannerService = inject(BannerService);

  // Banner items
  bannerItems: SliderItem[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 9;
  totalPosts = 0;
  totalPages = 0;

  // Blog data
  blogPosts: BlogPost[] = [];
  recentPosts: BlogPost[] = [];
  categories: IBlogCategory[] = [];
  selectedCategoryId: number | null = null; // null means "All Posts" is selected
  
  // Loading states
  loading = false;
  loadingRecent = false;
  loadingCategories = false;

  ngOnInit(): void {
    this.loadBannerData();
    this.loadBlogPosts();
    this.loadRecentPosts();
    this.loadCategories();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.BLOGS);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }

  /**
   * Load blog posts with pagination
   */
  private async loadBlogPosts(): Promise<void> {
    this.loading = true;
    try {
      const result = await this.blogService.getPaginatedPosts(
        this.currentPage - 1,
        this.pageSize,
        this.selectedCategoryId || undefined
      );
      console.log('Blog posts loaded:', result);
      this.blogPosts = result.posts;
      this.totalPosts = result.total;
      this.totalPages = result.totalPages;
    } catch (error) {
      console.error('Error loading blog posts:', error);
      this.blogPosts = [];
      this.totalPosts = 0;
      this.totalPages = 0;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load recent posts for sidebar
   */
  private async loadRecentPosts(): Promise<void> {
    this.loadingRecent = true;
    try {
      this.recentPosts = await this.blogService.getRecentPosts(undefined, 5);
    } catch (error) {
      console.error('Error loading recent posts:', error);
      this.recentPosts = [];
    } finally {
      this.loadingRecent = false;
    }
  }

  /**
   * Load all categories
   */
  private async loadCategories(): Promise<void> {
    this.loadingCategories = true;
    try {
      this.categories = await this.blogService.getAllCategories();
    } catch (error) {
      console.error('Error loading categories:', error);
      this.categories = [];
    } finally {
      this.loadingCategories = false;
    }
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    
    // Reload posts with current category filter
    this.loadPostsForCurrentFilter();
    
    // Scroll to top of blog section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Load posts based on current filter and pagination
   */
  private async loadPostsForCurrentFilter(): Promise<void> {
    await this.loadBlogPosts();
  }

  /**
   * Filter posts by category
   */
  async filterByCategory(categoryId: number | null): Promise<void> {
    this.selectedCategoryId = categoryId;
    this.currentPage = 1;
    await this.loadPostsForCurrentFilter();
  }

  /**
   * Get blog post URL
   */
  getPostUrl(post: BlogPost): string {
    return `/blog/${post.slug}`;
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Use a placeholder SVG if image fails to load
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2RjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM5QzI3QjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    img.onerror = null; // Prevent infinite loop
  }
}
