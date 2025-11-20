import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerService } from '../../services/banner.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, ImageSliderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly bannerService = inject(BannerService);

  sliderItems: SliderItem[] = [];

  ngOnInit(): void {
    this.loadBannerData();
  }

  /**
   * Load banner slider data
   */
  private loadBannerData(): void {
    this.sliderItems = this.bannerService.getBannerSlides();
  }
}
