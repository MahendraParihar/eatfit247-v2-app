import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  BreadcrumbsComponent,
  EmptyStateComponent,
  LoaderComponent,
  StoryCardComponent,
} from '@shared-ui';
import { JsonLdService, SEOService } from '../../core/services';
import {
  ISuccessStory,
  SuccessStoryMediaType,
} from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { buildMediaUrl } from '../../core/utils/media-url.util';

interface CelebView {
  id: string | number;
  name: string;
  date: string;
  posterUrl?: string;
  quote: string;
  mediaType: SuccessStoryMediaType;
  videoSrc?: string;
  youtubeId?: string;
}

@Component({
  standalone: true,
  selector: 'app-success-stories',
  imports: [
    CommonModule,
    MatPaginatorModule,
    LoaderComponent,
    EmptyStateComponent,
    BreadcrumbsComponent,
    StoryCardComponent,
  ],
  templateUrl: './success-stories.component.html',
  styleUrl: './success-stories.component.scss',
})
export class SuccessStoriesComponent implements OnInit {
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);

  private readonly allStories = signal<CelebView[]>([]);
  readonly pageSize = signal(6);
  readonly currentPage = signal(0);

  readonly totalStories = computed<number>(() => this.allStories().length);
  readonly hasStories = computed(() => this.totalStories() > 0);

  readonly celebs = computed<CelebView[]>(() => {
    const list = this.allStories();
    const size = this.pageSize();
    if (size === 0) {
      return list;
    }
    const start = this.currentPage() * size;
    return list.slice(start, start + size);
  });

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Celebrity Testimonials',
      description:
        'Real transformation stories from EatFit247 clients who achieved their health and wellness goals.',
      url: '/success-stories',
    });
    this.loading.set(true);
    try {
      await this.loadStories();
    } finally {
      this.loading.set(false);
    }
  }

  async loadStories(): Promise<void> {
    let allStories: ISuccessStory[] = [];
    try {
      allStories = await this.successStoriesService.loadStories();
    } catch {
      allStories = [];
    }

    const mapped: CelebView[] = allStories.map((s) => this.toCelebView(s));

    this.allStories.set(mapped);

    this.jsonLdService.setPageSchema({
      '@type': 'ItemList',
      name: 'Success Stories — EatFit247',
      itemListElement: mapped.slice(0, 10).map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
      })),
    } as Record<string, unknown>);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.scrollToGrid();
  }

  private formatMonthYear(d?: string | Date): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  private toCelebView(s: ISuccessStory): CelebView {
    const mediaType: SuccessStoryMediaType = s.mediaType ?? 'image';
    const media = s.imagePath ?? [];
    const posterItem = media.find((m) => m.mimetype?.startsWith('image/'));
    const videoItem = media.find((m) => m.mimetype?.startsWith('video/'));
    const posterUrl = buildMediaUrl(posterItem?.webUrl);
    const videoUrl = buildMediaUrl(videoItem?.webUrl ?? media[0]?.webUrl);

    if (mediaType === 'youtube') {
      const youtubeId = this.extractYouTubeId(s.youtubeUrl ?? '');
      const thumb =
        posterUrl ||
        (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '');
      return {
        id: s.successStoryId,
        name: s.name,
        date: this.formatMonthYear(s.date),
        posterUrl: thumb,
        quote: s.description,
        mediaType,
        youtubeId,
      };
    }

    if (mediaType === 'video') {
      return {
        id: s.successStoryId,
        name: s.name,
        date: this.formatMonthYear(s.date),
        posterUrl,
        quote: s.description,
        mediaType,
        videoSrc: videoUrl,
      };
    }

    return {
      id: s.successStoryId,
      name: s.name,
      date: this.formatMonthYear(s.date),
      posterUrl: posterUrl || buildMediaUrl(media[0]?.webUrl),
      quote: s.description,
      mediaType: 'image',
    };
  }

  private extractYouTubeId(url: string): string | undefined {
    if (!url) return undefined;
    const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
    return m ? m[1] : undefined;
  }

  private scrollToGrid(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const grid = document.getElementById('stories-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
