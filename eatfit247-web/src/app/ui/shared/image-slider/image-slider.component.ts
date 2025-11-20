import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface SliderItem {
  id: string;
  imageUrl: string; // Image for left/right section (supports text section)
  backgroundImageUrl?: string; // Background image for entire slide (optional)
  imageAlt?: string;
  imagePosition?: 'left' | 'right'; // Which side has the main image part
  shortDescription?: string; // Two-line short description
  title?: string;
  titleIcon?: string; // Icon name for title
  description?: string; // Two-line description
  primaryActionText?: string;
  primaryActionUrl?: string;
  secondaryActionText?: string;
  secondaryActionUrl?: string;
}

/**
 * Image Slider Component
 * Reusable slider component that accepts data via @Input
 */
@Component({
  selector: 'app-image-slider',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './image-slider.component.html',
  styleUrl: './image-slider.component.scss',
})
export class ImageSliderComponent implements OnInit, OnDestroy {
  @Input() items: SliderItem[] = [];
  @Input() autoPlay: boolean = true;
  @Input() autoPlayInterval: number = 5000; // milliseconds
  @Input() showArrows: boolean = true;
  @Input() showDots: boolean = true;
  @Input() height: string = '500px';
  @Input() transitionDuration: number = 500; // milliseconds

  readonly currentIndex = signal(0);
  readonly isPlaying = signal(false);
  readonly slideKey = signal(0); // Key to force re-render animations
  private autoPlayTimer: any = null;

  readonly currentItem = computed(() => {
    if (this.items.length === 0) return null;
    return this.items[this.currentIndex()];
  });

  readonly totalItems = computed(() => this.items.length);
  readonly hasMultipleItems = computed(() => this.items.length > 1);

  ngOnInit(): void {
    if (this.autoPlay && this.hasMultipleItems()) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  /**
   * Go to next slide
   */
  next(): void {
    if (!this.hasMultipleItems()) return;
    const nextIndex = (this.currentIndex() + 1) % this.items.length;
    this.goToSlide(nextIndex);
  }

  /**
   * Go to previous slide
   */
  previous(): void {
    if (!this.hasMultipleItems()) return;
    const prevIndex =
      this.currentIndex() === 0
        ? this.items.length - 1
        : this.currentIndex() - 1;
    this.goToSlide(prevIndex);
  }

  /**
   * Go to specific slide
   */
  goToSlide(index: number): void {
    if (index >= 0 && index < this.items.length) {
      // Update current index first
      this.currentIndex.set(index);
      // Reset animation key to trigger re-animation after a brief delay
      // This ensures the DOM updates before we trigger animations
      setTimeout(() => {
        this.slideKey.set(Date.now());
      }, 10);
      this.resetAutoPlay();
    }
  }

  /**
   * Start auto-play
   */
  startAutoPlay(): void {
    if (!this.hasMultipleItems()) return;
    if (this.autoPlayTimer) {
      this.stopAutoPlay();
    }
    this.isPlaying.set(true);
    this.autoPlayTimer = setInterval(() => {
      this.next();
    }, this.autoPlayInterval);
  }

  /**
   * Stop auto-play
   */
  stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.isPlaying.set(false);
  }

  /**
   * Reset auto-play timer
   */
  resetAutoPlay(): void {
    if (this.autoPlay && this.items.length > 1) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }

  /**
   * Pause auto-play on hover
   */
  onMouseEnter(): void {
    if (this.autoPlay) {
      this.stopAutoPlay();
    }
  }

  /**
   * Resume auto-play on mouse leave
   */
  onMouseLeave(): void {
    if (this.autoPlay && this.items.length > 1) {
      this.startAutoPlay();
    }
  }

  /**
   * Handle primary action button click
   */
  onPrimaryActionClick(item: SliderItem): void {
    if (item.primaryActionUrl) {
      if (item.primaryActionUrl.startsWith('http')) {
        window.open(item.primaryActionUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.primaryActionUrl;
      }
    }
  }

  /**
   * Handle secondary action button click
   */
  onSecondaryActionClick(item: SliderItem): void {
    if (item.secondaryActionUrl) {
      if (item.secondaryActionUrl.startsWith('http')) {
        window.open(item.secondaryActionUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = item.secondaryActionUrl;
      }
    }
  }

  /**
   * Check if image position is left
   */
  isImageLeft(item: SliderItem): boolean {
    return item.imagePosition === 'left' || !item.imagePosition;
  }

  /**
   * Check if image position is right
   */
  isImageRight(item: SliderItem): boolean {
    return item.imagePosition === 'right';
  }

  /**
   * Handle image loading errors
   */
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Use a placeholder SVG if image fails to load
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2MzY2RjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM5QzI3QjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2cpIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
    img.onerror = null; // Prevent infinite loop
  }
}

