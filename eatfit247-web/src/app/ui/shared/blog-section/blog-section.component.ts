import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { BlogPost, BlogService } from '../../../services/blog.service';

/**
 * Blog Section Component
 * Reusable component to display a section of blogs with title and description
 * Displays 3 blogs per row by default
 */
@Component({
  selector: 'app-blog-section',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './blog-section.component.html',
  styleUrl: './blog-section.component.scss',
})
export class BlogSectionComponent implements OnInit {
  private readonly blogService = inject(BlogService);
  private readonly router = inject(Router);

  // Section configuration
  @Input() sectionTitle: string = 'Latest Blogs';
  @Input() sectionDescription: string = 'Discover expert insights, success stories, and wellness tips';
  @Input() blogsToShow: number = 3; // Number of blogs to display
  @Input() blogs: BlogPost[] | null = null; // Optional: provide blogs directly
  @Input() showViewAll: boolean = false; // Show "View All" button
  @Input() viewAllUrl: string = '/blog'; // URL for "View All" button

  displayedBlogs: BlogPost[] = [];
  loading = false;

  ngOnInit(): void {
    if (this.blogs) {
      // Use provided blogs
      this.displayedBlogs = this.blogs.slice(0, this.blogsToShow);
    } else {
      // Fetch blogs from service
      this.loadBlogs();
    }
  }

  /**
   * Load blogs from service
   */
  private async loadBlogs(): Promise<void> {
    this.loading = true;
    try {
      const result = await this.blogService.getPaginatedPosts(0, this.blogsToShow);
      this.displayedBlogs = result.posts;
    } catch (error) {
      console.error('Error loading blogs:', error);
      this.displayedBlogs = [];
    } finally {
      this.loading = false;
    }
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

  /**
   * Navigate to View All Blogs page and scroll to top
   */
  navigateToViewAll(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.router.navigate([this.viewAllUrl]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

