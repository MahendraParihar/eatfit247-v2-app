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
import { BannerForEnum } from 'eatfit247-shared-library';

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
  pageSize = 6;
  totalPosts = 0;
  totalPages = 0;

  // Blog data
  blogPosts: BlogPost[] = [];
  recentPosts: BlogPost[] = [];
  categories: string[] = [];
  selectedCategory: string | null = null;

  ngOnInit(): void {
    this.loadBannerData();
    this.loadBlogPosts();
    this.loadRecentPosts();
    this.loadCategories();
  }

  /**
   * Load banner slider data
   */
  private loadBannerData(): void {
    this.bannerService.getBannerSlidesForPage(BannerForEnum.BLOGS).subscribe({
      next: (items) => {
        this.bannerItems = items;
      },
      error: (error) => {
        console.error('Failed to load banner data:', error);
        this.bannerItems = [];
      },
    });
  }

  /**
   * Load blog posts with pagination
   */
  private loadBlogPosts(): void {
    this.blogService.getPaginatedPosts(this.currentPage - 1, this.pageSize).subscribe({
      next: (result) => {
        this.blogPosts = result.posts;
        this.totalPosts = result.total;
        this.totalPages = result.totalPages;
      },
      error: (error) => {
        console.error('Error loading blog posts:', error);
        this.blogPosts = [];
        this.totalPosts = 0;
        this.totalPages = 0;
      },
    });
  }

  /**
   * Load recent posts for sidebar
   */
  private loadRecentPosts(): void {
    this.blogService.getRecentPosts(undefined, 5).subscribe({
      next: (posts) => {
        this.recentPosts = posts;
      },
      error: (error) => {
        console.error('Error loading recent posts:', error);
        this.recentPosts = [];
      },
    });
  }

  /**
   * Load all categories
   */
  private loadCategories(): void {
    this.blogService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories = cats;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
      },
    });
  }

  /**
   * Handle page change event
   */
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBlogPosts();
    // Scroll to top of blog section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Filter posts by category
   */
  filterByCategory(category: string | null): void {
    this.selectedCategory = category;
    this.currentPage = 1;

    if (category) {
      this.blogService.getPostsByCategory(category).subscribe({
        next: (categoryPosts) => {
          this.totalPosts = categoryPosts.length;
          this.totalPages = Math.ceil(this.totalPosts / this.pageSize);
          const startIndex = 0;
          const endIndex = this.pageSize;
          this.blogPosts = categoryPosts.slice(startIndex, endIndex);
        },
        error: (error) => {
          console.error('Error loading category posts:', error);
          this.blogPosts = [];
          this.totalPosts = 0;
          this.totalPages = 0;
        },
      });
    } else {
      this.loadBlogPosts();
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }

  /**
   * Get blog post URL
   */
  getPostUrl(post: BlogPost): string {
    return `/blog/${post.slug}`;
  }
}
