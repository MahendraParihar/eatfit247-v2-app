import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PressMediaService, PressMediaArticle } from '../../services/press-media.service';
import { BannerService } from '../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum } from 'eatfit247-shared-library';

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
    ImageSliderComponent,
  ],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss',
})
export class PressAndMediaComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);
  private readonly bannerService = inject(BannerService);

  bannerItems: SliderItem[] = [];
  pressArticles: PressMediaArticle[] = [];
  youtubeArticles: PressMediaArticle[] = [];
  loadingPress = false;
  loadingYouTube = false;

  ngOnInit(): void {
    this.loadBannerData();
    this.loadPressArticles();
    this.loadYouTubeArticles();
  }

  /**
   * Load banner slider data
   */
  private loadBannerData(): void {
    this.bannerService.getBannerSlidesForPage(BannerForEnum.MEDIA_PRESS).subscribe({
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
   * Load press articles (type='press')
   */
  loadPressArticles(): void {
    this.loadingPress = true;
    this.pressMediaService.getPressArticles().subscribe({
      next: (articles) => {
        this.pressArticles = articles;
        this.loadingPress = false;
      },
      error: (error) => {
        console.error('Error loading press articles:', error);
        this.pressArticles = [];
        this.loadingPress = false;
      },
    });
  }

  /**
   * Load YouTube articles (type='youtube')
   */
  loadYouTubeArticles(): void {
    this.loadingYouTube = true;
    this.pressMediaService.getYouTubeArticles().subscribe({
      next: (articles) => {
        this.youtubeArticles = articles;
        this.loadingYouTube = false;
      },
      error: (error) => {
        console.error('Error loading YouTube articles:', error);
        this.youtubeArticles = [];
        this.loadingYouTube = false;
      },
    });
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
