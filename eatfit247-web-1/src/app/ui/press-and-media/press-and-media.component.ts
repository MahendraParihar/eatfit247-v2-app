import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { BreadcrumbsComponent, ICardData, LoaderComponent } from '@shared-ui';
import { PressMediaService } from '../../core/services/press-media.service';

interface PressDisplay {
  id: string | number;
  outlet: string;
  date: string;
  title: string;
  kind: 'Read' | 'Watch' | 'Listen';
  icon: string;
  color: string;
  url: string;
  imageUrl: string | null;
}

interface TipDisplay {
  id: string | number;
  videoId: string;
  title: string;
  cat: string;
  dur: string;
  url: string;
}

@Component({
  standalone: true,
  selector: 'app-press-and-media',
  imports: [CommonModule, LoaderComponent, BreadcrumbsComponent, MatPaginatorModule],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss',
})
export class PressAndMediaComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);

  pressArticles: ICardData[] = [];
  youtubeArticles: ICardData[] = [];
  loading = signal(false);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(6);
  readonly pageSizeOptions = [6, 12, 24, 48];

  readonly pressList = signal<PressDisplay[]>([]);
  readonly tipsList = signal<TipDisplay[]>([]);

  readonly totalLength = computed(() => this.pressList().length);

  readonly pagedPress = computed(() => {
    const list = this.pressList();
    const idx = this.pageIndex();
    const size = this.pageSize();
    return list.slice(idx * size, idx * size + size);
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    try {
      await Promise.all([this.loadPressArticles(), this.loadYouTubeArticles()]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadPressArticles(): Promise<void> {
    try {
      this.pressArticles = await this.pressMediaService.getAllArticles('press');
    } catch {
      this.pressArticles = [];
    }
    const mapped = this.pressArticles.map<PressDisplay>((a, i) => ({
      id: a.id,
      outlet: this.deriveOutlet(a),
      date: this.formatDate(a.date),
      title: a.title,
      kind: 'Read',
      icon: 'description',
      color: this.pickColor(i),
      url: a.linkUrl ?? '#',
      imageUrl: a.imageUrl ?? null,
    }));
    this.pressList.set(mapped);
    this.pageIndex.set(0);
  }

  async loadYouTubeArticles(): Promise<void> {
    try {
      this.youtubeArticles =
        await this.pressMediaService.getAllArticles('youtube');
    } catch {
      this.youtubeArticles = [];
    }
    const mapped = this.youtubeArticles
      .map<TipDisplay | null>((a) => {
        const vid = this.extractVideoId(a.linkUrl);
        if (!vid) return null;
        return {
          id: a.id,
          videoId: vid,
          title: a.title,
          cat: a.category ?? 'Watch',
          dur: '',
          url: a.linkUrl ?? `https://www.youtube.com/watch?v=${vid}`,
        };
      })
      .filter((x): x is TipDisplay => x !== null);
    this.tipsList.set(mapped);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  thumbUrl(videoId: string): string {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  private extractVideoId(url?: string): string | null {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  private deriveOutlet(a: ICardData): string {
    return a.category ?? 'EatFit247 Press';
  }

  private formatDate(d?: string | Date): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  private pickColor(i: number): string {
    const palette = [
      '#3b82f6',
      '#ef4444',
      '#8b5cf6',
      '#1f2937',
      '#0ea5a4',
      '#ec4899',
      '#f59e0b',
      '#0f766e',
      '#1e40af',
      '#db2777',
    ];
    return palette[i % palette.length];
  }
}
