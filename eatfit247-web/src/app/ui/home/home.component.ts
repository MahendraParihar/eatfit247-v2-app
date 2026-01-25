import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BlogSectionComponent } from '../shared/blog-section/blog-section.component';
import { BannerService } from '../../services/banner.service';
import { AboutProductComponent } from './about-product/about-product.component';
import { ProgramPlansSectionComponent } from './program-plans-section/program-plans-section.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { PressMediaSectionComponent } from './press-media-section/press-media-section.component';
import { ContactFormSectionComponent } from './contact-form-section/contact-form-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    ImageSliderComponent,
    BlogSectionComponent,
    AboutProductComponent,
    ProgramPlansSectionComponent,
    TestimonialsComponent,
    PressMediaSectionComponent,
    ContactFormSectionComponent,
  ],
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
