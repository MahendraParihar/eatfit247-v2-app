import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

/**
 * About Product Component
 * Displays product features in a 2-column layout with icons and text
 */
@Component({
  selector: 'app-about-product',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './about-product.component.html',
  styleUrl: './about-product.component.scss',
})
export class AboutProductComponent {
  // Features data - can be moved to API later
  readonly features: Feature[] = [
    {
      icon: 'restaurant_menu',
      title: 'Personalized Meal Plans',
      description: 'Custom nutrition plans tailored to your body type, lifestyle, and health goals.',
    },
    {
      icon: 'fitness_center',
      title: 'Expert Guidance',
      description: 'Get support from certified nutritionists and wellness experts throughout your journey.',
    },
    {
      icon: 'schedule',
      title: 'Flexible Scheduling',
      description: 'Plan your meals and consultations at times that work best for your schedule.',
    },
    {
      icon: 'track_changes',
      title: 'Progress Tracking',
      description: 'Monitor your health metrics and see real improvements in your wellness journey.',
    },
  ];
}

