import { Component, OnInit, inject } from '@angular/core';
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
  private loadBannerData(): void {
    this.bannerService.getBannerSlidesForPage(BannerForEnum.QUIZ_DOSHA).subscribe({
      next: (items) => {
        this.bannerItems = items;
      },
      error: (error) => {
        console.error('Failed to load banner data:', error);
        this.bannerItems = [];
      },
    });
  }
}

