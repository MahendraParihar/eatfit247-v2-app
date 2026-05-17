import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, Input, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ISuccessStory } from '@eatfit247-shared-library/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-home-hall-of-fame',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home-hall-of-fame.component.html',
  styleUrl: './home-hall-of-fame.component.scss',
})
export class HomeHallOfFameComponent implements OnInit, OnDestroy {
  @Input() stories: ISuccessStory[] = [];

  currentIndex = 0;
  visibleCount = 3;
  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  private readonly autoPlayInterval = 5000;
  private readonly platformId = inject(PLATFORM_ID);

  get totalDots(): number {
    return Math.max(this.stories.length - this.visibleCount + 1, 1);
  }

  get dots(): number[] {
    return Array.from({ length: this.totalDots }, (_, i) => i);
  }

  get translateX(): number {
    const cardWidthPercent = 100 / this.visibleCount;
    return -(this.currentIndex * cardWidthPercent);
  }

  get canGoPrev(): boolean {
    return this.currentIndex > 0;
  }

  get canGoNext(): boolean {
    return this.currentIndex < this.stories.length - this.visibleCount;
  }

  ngOnInit(): void {
    this.updateVisibleCount();
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateVisibleCount();
  }

  next(): void {
    if (this.canGoNext) {
      this.currentIndex++;
      this.resetAutoPlay();
    }
  }

  prev(): void {
    if (this.canGoPrev) {
      this.currentIndex--;
      this.resetAutoPlay();
    }
  }

  goTo(index: number): void {
    this.currentIndex = Math.min(index, this.stories.length - this.visibleCount);
    this.resetAutoPlay();
  }

  onCarouselHover(): void {
    this.stopAutoPlay();
  }

  onCarouselLeave(): void {
    this.startAutoPlay();
  }

  getStoryImage(story: ISuccessStory): string {
    return story.imagePath && story.imagePath.length > 0
      ? story.imagePath[0].webUrl
      : 'assets/images/placeholder-avatar.png';
  }

  getPlainText(html: string): string {
    if (!html) return '';
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  }

  private updateVisibleCount(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.visibleCount = 3;
      return;
    }
    const width = window.innerWidth;
    if (width <= 640) {
      this.visibleCount = 1;
    } else if (width <= 1024) {
      this.visibleCount = 2;
    } else {
      this.visibleCount = 3;
    }
    // Clamp currentIndex if needed after resize
    const maxIndex = Math.max(this.stories.length - this.visibleCount, 0);
    if (this.currentIndex > maxIndex) {
      this.currentIndex = maxIndex;
    }
  }

  private startAutoPlay(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.stopAutoPlay();
    this.autoPlayTimer = setInterval(() => {
      if (this.canGoNext) {
        this.currentIndex++;
      } else {
        this.currentIndex = 0;
      }
    }, this.autoPlayInterval);
  }

  private stopAutoPlay(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  private resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
