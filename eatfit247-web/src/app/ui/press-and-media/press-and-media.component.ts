import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { PressMediaService } from '../../services/press-media.service';
import { BannerService } from '../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum, IPublicPressMedia } from 'eatfit247-shared-library';

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
    ImageSliderComponent
  ],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss'
})
export class PressAndMediaComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);
  private readonly bannerService = inject(BannerService);
  private readonly sanitizer = inject(DomSanitizer);
  bannerItems: SliderItem[] = [];
  pressArticles: IPublicPressMedia[] = [];
  youtubeArticles: IPublicPressMedia[] = [];
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
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.MEDIA_PRESS);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }

  /**
   * Load press articles (type='press')
   */
  async loadPressArticles(): Promise<void> {
    this.loadingPress = true;
    try {
      this.pressArticles = await this.pressMediaService.getAllArticles('press');
    } catch (error) {
      console.error('Error loading press articles:', error);
      this.pressArticles = [];
    } finally {
      this.loadingPress = false;
    }
  }

  /**
   * Load YouTube articles (type='youtube')
   */
  async loadYouTubeArticles(): Promise<void> {
    this.loadingYouTube = true;
    try {
      this.youtubeArticles = await this.pressMediaService.getAllArticles('youtube');
    } catch (error) {
      console.error('Error loading YouTube articles:', error);
      this.youtubeArticles = [];
    } finally {
      this.loadingYouTube = false;
    }
  }

  /**
   * Get image URL from imagePath array
   */
  getImageUrl(article: IPublicPressMedia): string | null {
    if (article.imagePath && article.imagePath.length > 0) {
      return 'http://localhost:3001/'+article.imagePath[0].webUrl;
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
   * Get gallery item size based on index for grid layout
   * Creates a pattern: 1 big + 2 small in each row
   * Pattern: [big, small, small, big, small, small, ...]
   */
  getGalleryItemSize(index: number): 'small' | 'medium' | 'large' | 'wide' {
    // Pattern repeats every 3 items: big, small, small
    const positionInGroup = index % 3;

    if (positionInGroup === 0) {
      return 'large'; // Big item (spans 2 columns, 2 rows)
    } else {
      return 'small'; // Small items (span 1 column, 1 row each)
    }
  }

  /**
   * Get safe YouTube embed URL for iframe
   */
  getSafeYoutubeUrl(article: IPublicPressMedia): SafeResourceUrl | null {
    if (!article.link) {
      return null;
    }
    const embedUrl = this.getEmbedUrl(article.link);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Convert YouTube URL to embed format
   */
  private getEmbedUrl(url: string): string {
    // Handle different YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }
}
