import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BannerService } from '../../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../../shared/image-slider/image-slider.component';
import { BannerForEnum } from 'eatfit247-shared-library';

@Component({
  selector: 'app-know-your-body-dosha',
  standalone: true,
  imports: [CommonModule, ImageSliderComponent],
  templateUrl: './know-your-body-dosha.component.html',
  styleUrl: './know-your-body-dosha.component.scss',
})
export class KnowYourBodyDoshaComponent implements OnInit {
  private readonly bannerService = inject(BannerService);

  bannerItems: SliderItem[] = [];

  ngOnInit(): void {
    this.loadBannerData();
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.QUIZ_DOSHA);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }
}

