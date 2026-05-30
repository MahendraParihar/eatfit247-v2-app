import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export type StoryCardMediaType = 'image' | 'video' | 'youtube';

@Component({
  selector: 'app-story-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-card.component.html',
  styleUrl: './story-card.component.scss',
})
export class StoryCardComponent {
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) name = '';
  @Input() title?: string;
  @Input() date?: string;
  @Input() quote?: string;
  @Input() mediaType: StoryCardMediaType = 'image';
  @Input() posterUrl?: string;
  @Input() videoSrc?: string;
  @Input() youtubeId?: string;
  @Input() index = 0;

  protected readonly playing = signal(false);

  protected readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    if (this.mediaType !== 'youtube' || !this.youtubeId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.youtubeId}?autoplay=1&rel=0&modestbranding=1`,
    );
  });

  protected get isPlayable(): boolean {
    return this.mediaType === 'video' || this.mediaType === 'youtube';
  }

  protected get hasMeta(): boolean {
    return !!(this.title || this.date);
  }

  protected play(): void {
    if (!this.isPlayable) return;
    this.playing.set(true);
  }
}
