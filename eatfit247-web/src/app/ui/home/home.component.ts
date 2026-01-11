import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BlogSectionComponent } from '../shared/blog-section/blog-section.component';
import { BannerService } from '../../services/banner.service';
import { JourneyStepsComponent } from './journey-steps/journey-steps.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { ProductShowcaseComponent } from './product-showcase/product-showcase.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, ImageSliderComponent, BlogSectionComponent, JourneyStepsComponent, TestimonialsComponent, ProductShowcaseComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
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
  private async loadBannerData(): Promise<void> {
    try {
      this.sliderItems = await this.bannerService.getBannerSlides();
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.sliderItems = []; // Set empty array on error
    }
  }
}
