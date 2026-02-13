import { Component, computed, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { MatButton } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-banner',
  imports: [CommonModule, MatIconModule, MatButton],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent implements OnInit, OnDestroy {
  @Input() banners: IPublicBanner[] = [];
  @Input() autoPlay: boolean = true;
  @Input() autoPlayInterval: number = 5000; // milliseconds
  @Input() showArrows: boolean = true;
  @Input() showDots: boolean = true;
  @Input() height: string = '400px';
  @Input() transitionDuration: number = 500; // milliseconds

  readonly currentIndex = signal(0);
  private autoPlayTimer: any = null;

  readonly hasMultipleItems = computed(() => this.banners.length > 1);
  readonly currentBanner = computed(() => {
    if (this.banners.length === 0) return null;
    return this.banners[this.currentIndex()];
  });

  ngOnInit(): void {
    if (this.autoPlay && this.hasMultipleItems()) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  next(): void {
    if (this.banners.length === 0) return;
    this.currentIndex.update((index) => (index + 1) % this.banners.length);
    this.resetAutoPlay();
  }

  previous(): void {
    if (this.banners.length === 0) return;
    this.currentIndex.update((index) =>
      index === 0 ? this.banners.length - 1 : index - 1
    );
    this.resetAutoPlay();
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.banners.length) {
      this.currentIndex.set(index);
      this.resetAutoPlay();
    }
  }

  onMouseEnter(): void {
    this.stopAutoPlay();
  }

  onMouseLeave(): void {
    if (this.autoPlay && this.hasMultipleItems()) {
      this.startAutoPlay();
    }
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.hasMultipleItems()) {
      this.autoPlayTimer = setInterval(() => {
        this.next();
      }, this.autoPlayInterval);
    }
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private resetAutoPlay(): void {
    if (this.autoPlay && this.hasMultipleItems()) {
      this.startAutoPlay();
    }
  }
}

