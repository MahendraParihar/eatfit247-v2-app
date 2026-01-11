import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Journey Steps Component
 * Displays a split-screen layout with steps to a healthier journey
 */
@Component({
  selector: 'app-journey-steps',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './journey-steps.component.html',
  styleUrl: './journey-steps.component.scss',
})
export class JourneyStepsComponent {
  // Steps data
  readonly steps = [
    {
      number: '01',
      title: 'Personal Consultation',
      description:
        'Our journey starts with a one-on-one consultation where we get to know you, your lifestyle, goals, and challenges.',
    },
    {
      number: '02',
      title: 'Personalized Plan',
      description:
        'I create an individual nutrition plan for you based on your preferences, lifestyle, and wishes.',
    },
    {
      number: '03',
      title: 'Guidance and Progress',
      description:
        'Within a few days you will notice how your eating habits change and your well-being improves.',
    },
  ];

  // Image URL - can be made configurable via @Input if needed
  readonly imageUrl = '/assets/images/home/steps.png';
  readonly imageAlt = 'Steps';

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Hide the image on error, the gradient background will show
    img.style.display = 'none';
    img.onerror = null;
  }
}

