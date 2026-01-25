import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PressMediaService } from '../../../services/press-media.service';
import { IPublicPressMedia } from 'eatfit247-shared-library';

/**
 * Press & Media Section Component
 * Compact version for home page - displays logos in a grid or slider
 */
@Component({
  selector: 'app-press-media-section',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './press-media-section.component.html',
  styleUrl: './press-media-section.component.scss',
})
export class PressMediaSectionComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);

  pressArticles: IPublicPressMedia[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadPressArticles();
  }

  /**
   * Load press articles (logo grid)
   */
  private async loadPressArticles(): Promise<void> {
    this.loading = true;
    try {
      const articles = await this.pressMediaService.getAllArticles('press');
      // Show max 8 logos on home page
      this.pressArticles = articles.slice(0, 8);
    } catch (error) {
      console.error('Error loading press articles:', error);
      this.pressArticles = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Get image URL from imagePath array
   */
  getImageUrl(article: IPublicPressMedia): string | null {
    if (article.imagePath && article.imagePath.length > 0) {
      return article.imagePath[0].webUrl || null;
    }
    return null;
  }

  /**
   * Open article URL in new tab
   */
  openArticle(article: IPublicPressMedia): void {
    if (article.link) {
      window.open(article.link, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.logo-placeholder')) {
      const placeholder = document.createElement('div');
      placeholder.className = 'logo-placeholder';
      placeholder.innerHTML = '<mat-icon>article</mat-icon><span>Media</span>';
      parent.appendChild(placeholder);
    }
  }
}

