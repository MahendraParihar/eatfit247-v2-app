import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent, BreadcrumbsComponent } from '@shared-ui';
import { BannerService } from '../../../core/services/banner.service';
import { SEOService } from '../../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';

interface DoshaOption {
  label: string;
  value: 'vata' | 'pitta' | 'kapha';
}

interface DoshaQuestion {
  id: number;
  prompt: string;
  options: DoshaOption[];
}

@Component({
  standalone: true,
  selector: 'app-know-your-body-dosha',
  imports: [CommonModule, RouterLink, BannerComponent, BreadcrumbsComponent],
  templateUrl: './know-your-body-dosha.component.html',
  styleUrl: './know-your-body-dosha.component.scss',
})
export class KnowYourBodyDoshaComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly seoService = inject(SEOService);
  banners: IPublicBanner[] = [];

  readonly questions: DoshaQuestion[] = [
    {
      id: 1,
      prompt: 'How would you describe your body frame?',
      options: [
        { label: 'Thin and light', value: 'vata' },
        { label: 'Medium and muscular', value: 'pitta' },
        { label: 'Heavy and well-built', value: 'kapha' },
      ],
    },
    {
      id: 2,
      prompt: 'How is your skin most of the time?',
      options: [
        { label: 'Dry and rough', value: 'vata' },
        { label: 'Warm and reddish', value: 'pitta' },
        { label: 'Oily and smooth', value: 'kapha' },
      ],
    },
    {
      id: 3,
      prompt: 'How is your appetite?',
      options: [
        { label: 'Irregular, varies a lot', value: 'vata' },
        { label: 'Strong, cannot skip meals', value: 'pitta' },
        { label: 'Steady, can skip easily', value: 'kapha' },
      ],
    },
    {
      id: 4,
      prompt: 'How do you handle stress?',
      options: [
        { label: 'Worry and anxiety', value: 'vata' },
        { label: 'Anger and frustration', value: 'pitta' },
        { label: 'Calm but withdraw', value: 'kapha' },
      ],
    },
    {
      id: 5,
      prompt: 'How is your sleep?',
      options: [
        { label: 'Light and easily disturbed', value: 'vata' },
        { label: 'Sound, moderate duration', value: 'pitta' },
        { label: 'Deep and long', value: 'kapha' },
      ],
    },
  ];

  readonly answers = signal<Record<number, DoshaOption['value']>>({});
  readonly submitted = signal(false);

  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly canSubmit = computed(() => this.answeredCount() === this.questions.length);

  readonly result = computed(() => {
    const counts: Record<DoshaOption['value'], number> = { vata: 0, pitta: 0, kapha: 0 };
    Object.values(this.answers()).forEach((v) => (counts[v] += 1));
    const dominant = (Object.keys(counts) as DoshaOption['value'][]).reduce((a, b) =>
      counts[a] >= counts[b] ? a : b,
    );
    return { counts, dominant };
  });

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Know Your Body Dosha',
      description:
        'Discover your Ayurvedic body type with our interactive dosha quiz and get personalized nutrition recommendations.',
      url: '/know-your-body-dosha',
    });
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.QUIZ_DOSHA,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Know Your Body Dosha page:',
        error,
      );
      this.banners = [];
    }
  }

  selectOption(questionId: number, value: DoshaOption['value']): void {
    this.answers.update((curr) => ({ ...curr, [questionId]: value }));
  }

  isSelected(questionId: number, value: DoshaOption['value']): boolean {
    return this.answers()[questionId] === value;
  }

  submitQuiz(): void {
    if (this.canSubmit()) {
      this.submitted.set(true);
    }
  }

  resetQuiz(): void {
    this.answers.set({});
    this.submitted.set(false);
  }

  doshaLabel(v: DoshaOption['value']): string {
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
}
