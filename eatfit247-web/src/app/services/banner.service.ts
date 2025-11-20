import { Injectable } from '@angular/core';
import { SliderItem } from '../ui/shared/image-slider/image-slider.component';

/**
 * Service to manage banner/slider data
 * Generic service for homepage banner content
 */
@Injectable({
  providedIn: 'root',
})
export class BannerService {
  private readonly baseImageUrl = 'https://eatfit24by7.com/wp-content/uploads';

  /**
   * Get banner slides for homepage
   */
  getBannerSlides(): SliderItem[] {
    return [
      {
        id: 'banner-1',
        backgroundImageUrl: `${this.baseImageUrl}/2022/04/organic-sld-1.jpg`,
        imageUrl: ``,
        imageAlt: 'EatFit24By7 - Your Health & Wellness Partner',
        imagePosition: 'left',
        shortDescription: 'Are you ready to take charge? Every day can be the first day of the rest of your life.',
        title: 'EatFit24By7',
        titleIcon: 'favorite',
        description: 'A well-balanced diet that leads to a well-balanced life. Transform your health journey with personalized nutrition plans.',
        primaryActionText: 'Get Started',
        primaryActionUrl: '/our-programs',
        secondaryActionText: 'Learn More',
        secondaryActionUrl: '/about-us',
      },
      {
        id: 'banner-2',
        backgroundImageUrl: `${this.baseImageUrl}/revslider/dummy-corp-slide-1.jpg`,
        imageUrl: ``,
        imageAlt: 'Shweta Shah - Celebrity Nutritionist',
        imagePosition: 'right',
        shortDescription: 'Confused about taking that leap into healthy eating? You have come to the right place.',
        title: 'Hop on to the health wagon!',
        titleIcon: 'local_dining',
        description: 'Shweta Shah has helped 2000+ Clients In 18 Years. Get expert guidance from a celebrity nutritionist.',
        primaryActionText: 'Book Appointment',
        primaryActionUrl: '/contact-us',
        secondaryActionText: 'Success Stories',
        secondaryActionUrl: '/success-stories',
      },
      {
        id: 'banner-3',
        backgroundImageUrl: `${this.baseImageUrl}/2022/04/health-adviser.jpg`,
        imageUrl: ``,
        imageAlt: 'Personalized Nutrition Plans',
        imagePosition: 'left',
        shortDescription: 'Are you ready to meet the best version of yourself?',
        title: 'With EatFit Plan Your Health Fitness',
        titleIcon: 'fitness_center',
        description: 'Get Guidance for Weight Loss / Weight Gain Diets, Sports & Workout Nutrition Diets for PCOD, Diabetes, Hypertension, Pre / Post Pregnancy & Kids',
        primaryActionText: 'View Programs',
        primaryActionUrl: '/our-programs',
        secondaryActionText: 'Take Quiz',
        secondaryActionUrl: '/know-your-body-dosha',
      },
    ];
  }
}

