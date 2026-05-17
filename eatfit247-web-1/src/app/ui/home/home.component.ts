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
import { ProgramService, SeasonalProgramCard, SEOService } from '../../core/services';
import { ISuccessStory } from '@eatfit247-shared-library/core';
import { SuccessStoriesService } from '../../core/services/success-stories.service';
import { CONTACT_NUMBER } from '../../core/utils/constants';

interface FeatureCard {
  icon: string;
  title: string;
  body: string;
}

interface Credential {
  icon: string;
  title: string;
  subtitle: string;
}

interface TestimonialStory {
  name: string;
  image: string;
  quote: string;
  metric?: string;
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
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly loading = signal(false);
  readonly contactNumber = CONTACT_NUMBER;
  stories: ISuccessStory[] = [];
  readonly seasonalPlans = signal<SeasonalProgramCard[]>([]);

  readonly features: FeatureCard[] = [
    {
      icon: 'restaurant_menu',
      title: 'Personalized Meal Plans',
      body: 'Weekly menus built around your preferences, culture, allergies, budget and schedule.',
    },
    {
      icon: 'monitoring',
      title: 'Data-Backed Progress',
      body: 'Track weight, energy, sleep and mood. Plans adapt every two weeks based on outcomes.',
    },
    {
      icon: 'support_agent',
      title: '1:1 Coaching',
      body: 'Direct messaging with your dietitian between sessions. Never hit a plateau alone.',
    },
    {
      icon: 'self_improvement',
      title: 'Body & Mind',
      body: 'Nutrition paired with mindful habits, sleep hygiene and stress-management practices.',
    },
  ];

  coverStyle(plan: SeasonalProgramCard): Record<string, string> {
    return plan.coverImg ? { '--cover-img': `url('${plan.coverImg}')` } : {};
  }

  readonly credentials: Credential[] = [
    { icon: 'school', title: 'M.Sc. Clinical Nutrition', subtitle: 'SNDT University, Mumbai' },
    { icon: 'workspace_premium', title: 'Registered Dietitian (IDA)', subtitle: 'Indian Dietetic Association' },
    { icon: 'groups', title: '12,000+ clients', subtitle: 'Across 28 countries' },
    { icon: 'menu_book', title: 'Published author', subtitle: 'Featured in Vogue, TOI' },
  ];

  readonly fallbackTestimonials: TestimonialStory[] = [
    {
      name: 'Priya R.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80&auto=format&fit=crop',
      quote: "I'd tried every fad diet out there. Shweta's plan finally felt like something I could do forever — and the weight just kept coming off.",
      metric: '−9 kg in 14 weeks',
    },
    {
      name: 'Anjali K.',
      image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80&auto=format&fit=crop',
      quote: 'My cycles are regular for the first time in six years. The fact that the plan respects Gujarati food culture made it so much easier to stick to.',
    },
    {
      name: 'Vikram D.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80&auto=format&fit=crop',
      quote: 'I expected a diet. I got a lifestyle rewire. Sleep, stress, meals — everything clicks together now. Best investment I have made in myself.',
      metric: 'Energy up, fog gone',
    },
    {
      name: 'Sneha M.',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80&auto=format&fit=crop',
      quote: 'Six months in and my reports look like a different person. Practical food, no punishing rules — my family eats the same meals.',
      metric: 'Thyroid stable',
    },
    {
      name: 'Rohit S.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80&auto=format&fit=crop',
      quote: 'I dropped 12kg in 5 months and — most importantly — it stayed off. The check-ins kept me honest without being a chore.',
      metric: '−12 kg · sustained 1 yr',
    },
  ];

  readonly testimonialStories = computed<TestimonialStory[]>(() => {
    if (this.stories?.length) {
      return this.stories.map((s) => ({
        name: s.name,
        image: s.imagePath?.[0]?.webUrl ?? this.fallbackTestimonials[0].image,
        quote: s.description ?? '',
        metric: s.title ?? undefined,
      }));
    }
    return this.fallbackTestimonials;
  });

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
    return `translateX(calc(${-i * 100 / pv}% - ${i} * var(--space-5)))`;
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
      await Promise.all([this.loadStories(), this.loadSeasonalPlans()]);
    } finally {
      this.loading.set(false);
    }
    this.recomputePerView();
  }

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

  async loadStories(): Promise<void> {
    try {
      this.stories = await this.successStoriesService.loadStories();
    } catch {
      this.stories = [];
    }
  }

  async loadSeasonalPlans(): Promise<void> {
    const all = await this.programService.getSeasonalPrograms();
    const priority: Record<SeasonalProgramCard['status'], number> = { live: 0, soon: 1, closed: 2 };
    const sorted = [...all].sort((a, b) => priority[a.status] - priority[b.status]);
    this.seasonalPlans.set(sorted.slice(0, 3));
  }
}
