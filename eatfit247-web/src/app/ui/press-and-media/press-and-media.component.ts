import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PressMediaService, PressMediaArticle } from '../../services/press-media.service';

/**
 * Press & Media Component
 * Displays press coverage and media articles about EatFit24By7
 */
@Component({
  selector: 'app-press-and-media',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss',
})
export class PressAndMediaComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);

  articles: PressMediaArticle[] = [];
  categories: PressMediaArticle['category'][] = [];
  selectedCategory: PressMediaArticle['category'] | null = null;

  ngOnInit(): void {
    this.loadArticles();
    this.categories = this.pressMediaService.getAllCategories();
  }

  /**
   * Load articles based on selected category
   */
  loadArticles(): void {
    if (this.selectedCategory) {
      this.articles = this.pressMediaService.getArticlesByCategory(
        this.selectedCategory
      );
    } else {
      this.articles = this.pressMediaService.getAllArticles();
    }
  }

  /**
   * Filter articles by category
   */
  filterByCategory(category: PressMediaArticle['category'] | null): void {
    this.selectedCategory = category;
    this.loadArticles();
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
   * Open article URL in new tab
   */
  openArticle(article: PressMediaArticle): void {
    if (article.articleUrl) {
      window.open(article.articleUrl, '_blank', 'noopener,noreferrer');
    }
  }
}
