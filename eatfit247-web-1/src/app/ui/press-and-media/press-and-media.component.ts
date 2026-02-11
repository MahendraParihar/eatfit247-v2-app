import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BannerService, SliderItem } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { PressMediaService } from '../../core/services/press-media.service';
import { ICardData, CardComponent, BannerComponent, LoaderComponent } from '@shared-ui';
import { IMediaUpload } from '@eatfit247-shared-library/core';

@Component({
  standalone: true,
  selector: 'app-press-and-media',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    CardComponent,
    BannerComponent,
    LoaderComponent,
  ],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss',
})
export class PressAndMediaComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);
  private readonly bannerService = inject(BannerService);
  private readonly sanitizer = inject(DomSanitizer);
  banners: IMediaUpload[] = [];
  pressArticles: ICardData[] = [];
  youtubeArticles: ICardData[] = [];
  loadingPress = false;
  loadingYouTube = false;

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadBannerData(),
      this.loadPressArticles(),
      this.loadYouTubeArticles(),
    ]);
  }

  /**
   * Load banner slider data for Press & Media page
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.MEDIA_PRESS
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load banner data:', error);
      this.banners = [];
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
      // eslint-disable-next-line no-console
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
      this.youtubeArticles = await this.pressMediaService.getAllArticles(
        'youtube'
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading YouTube articles:', error);
      this.youtubeArticles = [];
    } finally {
      this.loadingYouTube = false;
    }
  }

  /**
   * Get gallery item size based on index for grid layout
   * Pattern: [large, small, small, large, small, small, ...]
   */
  getGalleryItemSize(index: number): 'small' | 'medium' | 'large' | 'wide' {
    const positionInGroup = index % 3;
    if (positionInGroup === 0) {
      return 'large';
    }
    return 'small';
  }

  /**
   * Get safe YouTube embed URL for iframe
   */
  getSafeYoutubeUrl(article: ICardData): SafeResourceUrl | null {
    if (!article.linkUrl) {
      return null;
    }
    const embedUrl = this.getEmbedUrl(article.linkUrl);
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Convert YouTube URL to embed format
   */
  private getEmbedUrl(url: string): string {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  }
}

