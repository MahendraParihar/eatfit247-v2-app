import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BannerComponent,
  BreadcrumbsComponent,
  ICardData,
  LoaderComponent,
} from '@shared-ui';
import { PressMediaService } from '../../core/services/press-media.service';
import { IPublicBanner } from '@eatfit247-shared-library/core';

interface PressDisplay {
  id: string | number;
  outlet: string;
  date: string;
  title: string;
  kind: 'Read' | 'Watch' | 'Listen';
  icon: string;
  color: string;
  url: string;
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
  imports: [
    CommonModule,
    BannerComponent,
    LoaderComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './press-and-media.component.html',
  styleUrl: './press-and-media.component.scss',
})
export class PressAndMediaComponent implements OnInit {
  private readonly pressMediaService = inject(PressMediaService);

  banners: IPublicBanner[] = [];
  pressArticles: ICardData[] = [];
  youtubeArticles: ICardData[] = [];
  loading = signal(false);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(6);
  readonly pageSizeOptions = [6, 9, 12, 24];

  private readonly pressFallback: PressDisplay[] = [
    {
      id: 'f1',
      outlet: 'The Times',
      date: 'April 2026',
      title: 'The quiet rise of personalised nutrition in India',
      kind: 'Read',
      icon: 'description',
      color: '#3b82f6',
      url: '#',
    },
    {
      id: 'f2',
      outlet: 'NDTV Good Morning',
      date: 'March 2026',
      title: "Shweta on women's hormonal health post-35",
      kind: 'Watch',
      icon: 'live_tv',
      color: '#ef4444',
      url: '#',
    },
    {
      id: 'f3',
      outlet: 'The Wellness Hour',
      date: 'February 2026',
      title: 'Ep 142 · The science of sustainable fat loss',
      kind: 'Listen',
      icon: 'podcasts',
      color: '#8b5cf6',
      url: '#',
    },
    {
      id: 'f4',
      outlet: 'Vogue India',
      date: 'January 2026',
      title: 'What five nutritionists eat in a day',
      kind: 'Read',
      icon: 'description',
      color: '#1f2937',
      url: '#',
    },
    {
      id: 'f5',
      outlet: 'Mint Lounge',
      date: 'November 2025',
      title: "Why India's diabetes crisis needs a dietary reset",
      kind: 'Read',
      icon: 'description',
      color: '#0ea5a4',
      url: '#',
    },
    {
      id: 'f6',
      outlet: 'Femina',
      date: 'September 2025',
      title: "The PCOS plate — a dietitian's breakdown",
      kind: 'Read',
      icon: 'description',
      color: '#ec4899',
      url: '#',
    },
    {
      id: 'f7',
      outlet: 'Mid-Day',
      date: 'August 2025',
      title: "Mumbai's most-talked-about nutritionist on burnout food",
      kind: 'Read',
      icon: 'description',
      color: '#f59e0b',
      url: '#',
    },
    {
      id: 'f8',
      outlet: 'Forbes India',
      date: 'July 2025',
      title: 'The business of bespoke nutrition',
      kind: 'Read',
      icon: 'description',
      color: '#0f766e',
      url: '#',
    },
    {
      id: 'f9',
      outlet: 'CNBC TV18',
      date: 'May 2025',
      title: "India's wellness wave — what's sustainable, what's spin",
      kind: 'Watch',
      icon: 'live_tv',
      color: '#ef4444',
      url: '#',
    },
    {
      id: 'f10',
      outlet: 'The Hindu',
      date: 'April 2025',
      title: 'Decoding intermittent fasting for Indian palates',
      kind: 'Read',
      icon: 'description',
      color: '#1e40af',
      url: '#',
    },
    {
      id: 'f11',
      outlet: 'Grazia',
      date: 'March 2025',
      title: 'The wellness edit — what nutritionists actually recommend',
      kind: 'Read',
      icon: 'description',
      color: '#db2777',
      url: '#',
    },
    {
      id: 'f12',
      outlet: 'Cure.Fit Podcast',
      date: 'February 2025',
      title: 'Ep 87 · Eating for energy after 35',
      kind: 'Listen',
      icon: 'podcasts',
      color: '#8b5cf6',
      url: '#',
    },
  ];

  private readonly tipsFallback: TipDisplay[] = [
    {
      id: 'y1',
      videoId: 'dQw4w9WgXcQ',
      title: '5 minutes a day — the seed cycling routine',
      dur: '4:21',
      cat: 'Hormones',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      id: 'y2',
      videoId: 'jNQXAC9IVRw',
      title: 'How to actually hit your protein target on dal-rice',
      dur: '6:08',
      cat: 'Nutrition',
      url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
    },
    {
      id: 'y3',
      videoId: 'aqz-KE-bpKQ',
      title: 'The honest truth about ghee, butter & oils',
      dur: '8:14',
      cat: 'Myths',
      url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    },
    {
      id: 'y4',
      videoId: '9bZkp7q19f0',
      title: 'Mid-meal cravings? Try this 30-second hack',
      dur: '2:47',
      cat: 'Habits',
      url: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
    },
    {
      id: 'y5',
      videoId: 'kJQP7kiw5Fk',
      title: 'PCOS-friendly breakfast in 7 minutes',
      dur: '7:33',
      cat: 'PCOS',
      url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    },
    {
      id: 'y6',
      videoId: 'L_jWHffIx5E',
      title: 'Why your gut hates skipped meals',
      dur: '5:16',
      cat: 'Gut health',
      url: 'https://www.youtube.com/watch?v=L_jWHffIx5E',
    },
    {
      id: 'y7',
      videoId: 'fJ9rUzIMcZQ',
      title: 'The truth about "detox" teas — a dietitian reacts',
      dur: '9:02',
      cat: 'Myths',
      url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    },
    {
      id: 'y8',
      videoId: 'hT_nvWreIhg',
      title: 'My 3-step rule for sustainable fat loss',
      dur: '6:55',
      cat: 'Fat loss',
      url: 'https://www.youtube.com/watch?v=hT_nvWreIhg',
    },
  ];

  readonly pressList = signal<PressDisplay[]>([]);
  readonly tipsList = signal<TipDisplay[]>([]);

  readonly totalLength = computed(() => this.pressList().length);

  readonly pagedPress = computed(() => {
    const list = this.pressList();
    const idx = this.pageIndex();
    const size = this.pageSize();
    return list.slice(idx * size, idx * size + size);
  });

  readonly totalPages = computed(() => {
    const total = this.totalLength();
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
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
    }));
    this.pressList.set(mapped.length > 0 ? mapped : this.pressFallback);
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
    this.tipsList.set(mapped.length > 0 ? mapped : this.tipsFallback);
  }

  setPageIndex(idx: number): void {
    const max = this.totalPages() - 1;
    this.pageIndex.set(Math.max(0, Math.min(max, idx)));
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.pageIndex.set(0);
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
