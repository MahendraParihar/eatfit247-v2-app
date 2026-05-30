import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  HostListener,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoaderComponent } from '@shared-ui';
import {
  BannerService,
  ProgramService,
  SeasonalProgramCard,
  SEOService,
} from '../../core/services';
import { IPublicBanner, ISuccessStory } from '@eatfit247-shared-library/core';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { PressMediaService } from '../../core/services/press-media.service';
import { buildMediaUrl } from '../../core/utils/media-url.util';

interface HeroSlide {
  readonly bg: string;
  readonly eyebrowIcon: string;
  readonly eyebrowText: string;
  readonly titleLead: string;
  readonly titleAccent: string;
  readonly sub: string;
  readonly primaryText: string;
  readonly primaryRoute: ReadonlyArray<string>;
  readonly secondaryText: string;
  readonly secondaryRoute?: ReadonlyArray<string>;
  readonly secondaryAnchor?: string;
}

interface SpecialiseCard {
  readonly title: string;
  readonly image: string;
  readonly coverA: string;
  readonly coverB: string;
  readonly conditions: ReadonlyArray<string>;
}

interface TipCard {
  readonly thumb: string;
  readonly title: string;
  readonly url: string;
}

interface TestimonialStory {
  readonly name: string;
  readonly image: string;
  readonly quote: string;
}

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterLink, LoaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly successStoriesService = inject(SuccessStoriesService);
  private readonly programService = inject(ProgramService);
  private readonly bannerService = inject(BannerService);
  private readonly pressMediaService = inject(PressMediaService);
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);

  // -------- Hero banner --------
  readonly heroSlides = signal<ReadonlyArray<HeroSlide>>([]);
  readonly heroIndex = signal(0);
  private heroTimer: ReturnType<typeof setInterval> | null = null;

  // -------- Specialise / Condition programs (used by template) --------
  readonly specialiseCards: ReadonlyArray<SpecialiseCard> = [
    {
      title: "Women's Wellness",
      image: '/programs/women-wellness.png',
      coverA: '#fb7185',
      coverB: '#e11d48',
      conditions: ['PCOS', 'Hormonal Health', 'Endometriosis', 'Fertility'],
    },
    {
      title: 'Lifestyle Disease',
      image: '/programs/lifestyle-disease.png',
      coverA: '#22d3ee',
      coverB: '#0e7490',
      conditions: [
        'Diabetes',
        'Cholesterol',
        'Blood Pressure',
        'Thyroid',
        'Autoimmune disease',
      ],
    },
    {
      title: 'Pregnancy Poshan Program',
      image: '/programs/pregnancy-poshan-program.png',
      coverA: '#f9a8d4',
      coverB: '#be185d',
      conditions: ['Pregnancy', 'Lactation', 'Postpartum Recovery'],
    },
    {
      title: 'Gut Health Programs',
      image: '/programs/gut-health-programs.png',
      coverA: '#fdba74',
      coverB: '#c2410c',
      conditions: ['Gas & bloating', 'IBS', 'Acidity', 'SIBO', 'Fatty Liver'],
    },
  ];

  // -------- Podcasts / tip cards (used by template) --------
  readonly tipCards = signal<ReadonlyArray<TipCard>>([]);

  readonly youtubeChannelUrl = 'https://www.youtube.com/@eatfit247';

  // -------- Seasonal plans --------
  readonly seasonalPlans = signal<SeasonalProgramCard[]>([]);
  coverStyle(plan: SeasonalProgramCard): Record<string, string> {
    return plan.coverImg ? { '--cover-img': `url('${plan.coverImg}')` } : {};
  }

  // -------- Testimonials --------
  stories: ISuccessStory[] = [];

  readonly testimonialStories = computed<ReadonlyArray<TestimonialStory>>(
    () => {
      if (this.stories?.length) {
        return this.stories.map((s) => ({
          name: s.name,
          image: s.imagePath?.[0]?.webUrl,
          quote: s.description ?? '',
          metric: s.title ?? undefined,
        }));
      }
      return [];
    },
  );

  readonly carouselIndex = signal(0);
  readonly perView = signal(1);
  readonly pageCount = computed(() =>
    Math.max(1, this.testimonialStories().length - this.perView() + 1),
  );
  readonly pageDots = computed(() =>
    Array.from({ length: this.pageCount() }, (_, i) => i),
  );
  readonly carouselTransform = computed(() => {
    const i = this.carouselIndex();
    const pv = this.perView();
    return `translateX(calc(${(-i * 100) / pv}% - ${i} * var(--space-5)))`;
  });

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'EatFit247 — Personalized Nutrition & Wellness',
      description:
        'Transform your health with EatFit247. Personalized diet plans, expert nutrition coaching by Shweta Shah, and holistic wellness programs.',
      url: '/',
    });
    this.loading.set(true);
    try {
      await Promise.all([
        this.loadStories(),
        this.loadSeasonalPlans(),
        this.loadBanners(),
        this.loadTipCards(),
      ]);
    } finally {
      this.loading.set(false);
    }
    this.recomputePerView();
    this.startHeroTimer();
  }

  // -------- Banner --------
  private async loadBanners(): Promise<void> {
    try {
      const banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.HOME,
      );
      const mapped = this.mapBannersToSlides(banners);
      if (mapped.length > 0) {
        this.heroSlides.set(mapped);
      }
    } catch {
      // keep fallback
    }
  }

  private mapBannersToSlides(banners: IPublicBanner[]): HeroSlide[] {
    const slides: HeroSlide[] = [];
    for (const b of banners) {
      const bg = buildMediaUrl(b.imagePath?.[0]?.webUrl);
      if (!bg) continue;
      const titleParts = this.splitTitle(b.title ?? '');
      slides.push({
        bg,
        eyebrowIcon: b.titleIcon || 'star',
        eyebrowText: b.subTitle ?? '',
        titleLead: titleParts.lead,
        titleAccent: titleParts.accent,
        sub: b.description ?? '',
        primaryText: b.primaryActionText || 'Learn more',
        primaryRoute: b.primaryActionUrl
          ? [b.primaryActionUrl]
          : ['/contact-us'],
        secondaryText: b.secondaryActionText || 'Read more',
        secondaryRoute: b.secondaryActionUrl
          ? [b.secondaryActionUrl]
          : undefined,
      });
    }
    return slides;
  }

  private splitTitle(title: string): { lead: string; accent: string } {
    const trimmed = title.trim();
    if (!trimmed) return { lead: '', accent: '' };
    const words = trimmed.split(/\s+/);
    if (words.length < 3) return { lead: trimmed, accent: '' };
    const accentCount = Math.max(1, Math.round(words.length / 3));
    const accent = words.slice(-accentCount).join(' ');
    const lead = words.slice(0, -accentCount).join(' ');
    return { lead, accent };
  }

  heroGoTo(i: number): void {
    const len = this.heroSlides().length;
    if (len === 0) return;
    this.heroIndex.set(((i % len) + len) % len);
    this.restartHeroTimer();
  }
  heroNext(): void {
    this.heroGoTo(this.heroIndex() + 1);
  }
  heroPrev(): void {
    this.heroGoTo(this.heroIndex() - 1);
  }
  private startHeroTimer(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.stopHeroTimer();
    this.heroTimer = setInterval(() => {
      const len = this.heroSlides().length;
      if (len === 0) return;
      this.heroIndex.set((this.heroIndex() + 1) % len);
    }, 6000);
  }
  private stopHeroTimer(): void {
    if (this.heroTimer) {
      clearInterval(this.heroTimer);
      this.heroTimer = null;
    }
  }
  private restartHeroTimer(): void {
    this.stopHeroTimer();
    this.startHeroTimer();
  }
  heroMouseEnter(): void {
    this.stopHeroTimer();
  }
  heroMouseLeave(): void {
    this.startHeroTimer();
  }

  // -------- Testimonial carousel --------
  @HostListener('window:resize')
  onResize(): void {
    this.recomputePerView();
  }

  private recomputePerView(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const w = window.innerWidth;
    this.perView.set(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    if (this.carouselIndex() >= this.pageCount()) {
      this.carouselIndex.set(Math.max(0, this.pageCount() - 1));
    }
  }

  carouselNext(): void {
    this.carouselIndex.set((this.carouselIndex() + 1) % this.pageCount());
  }
  carouselPrev(): void {
    const next = this.carouselIndex() - 1;
    this.carouselIndex.set(next < 0 ? this.pageCount() - 1 : next);
  }
  carouselGoTo(i: number): void {
    this.carouselIndex.set(i);
  }

  // -------- Data loaders --------
  async loadStories(): Promise<void> {
    try {
      this.stories = await this.successStoriesService.loadStories();
    } catch {
      this.stories = [];
    }
  }

  async loadTipCards(): Promise<void> {
    try {
      const articles = await this.pressMediaService.getAllArticles('youtube', 4);
      const mapped = articles
        .map<TipCard | null>((a) => {
          const url = a.linkUrl ?? '';
          const videoId = this.extractYouTubeId(url);
          const thumb =
            a.imageUrl ||
            (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
          if (!thumb || !url) return null;
          return { thumb, title: a.title, url };
        })
        .filter((x): x is TipCard => x !== null);
      this.tipCards.set(mapped);
    } catch {
      this.tipCards.set([]);
    }
  }

  private extractYouTubeId(url: string): string | null {
    if (!url) return null;
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  async loadSeasonalPlans(): Promise<void> {
    const all = await this.programService.getSeasonalPrograms();
    const priority: Record<SeasonalProgramCard['status'], number> = {
      live: 0,
      soon: 1,
      closed: 2,
    };
    const sorted = [...all].sort(
      (a, b) => priority[a.status] - priority[b.status],
    );
    this.seasonalPlans.set(sorted.slice(0, 3));
  }
}
