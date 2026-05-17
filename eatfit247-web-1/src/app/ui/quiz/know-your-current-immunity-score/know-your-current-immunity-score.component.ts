import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent, BreadcrumbsComponent } from '@shared-ui';
import { BannerService, SEOService } from '../../../core/services';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';

interface ImmunityOption {
  label: string;
  score: number;
}

interface ImmunityQuestion {
  id: number;
  prompt: string;
  options: ImmunityOption[];
}

@Component({
  standalone: true,
  selector: 'app-know-your-current-immunity-score',
  imports: [CommonModule, RouterLink, BannerComponent, BreadcrumbsComponent],
  templateUrl: './know-your-current-immunity-score.component.html',
  styleUrl: './know-your-current-immunity-score.component.scss',
})
export class KnowYourCurrentImmunityScoreComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly seoService = inject(SEOService);
  banners: IPublicBanner[] = [];

  readonly questions: ImmunityQuestion[] = [
    {
      id: 1,
      prompt: 'How often do you fall sick (cold, flu) in a year?',
      options: [
        { label: 'Rarely (0-1 times)', score: 3 },
        { label: 'Sometimes (2-3 times)', score: 2 },
        { label: 'Often (4+ times)', score: 1 },
      ],
    },
    {
      id: 2,
      prompt: 'How many hours of sleep do you get on average?',
      options: [
        { label: '7-9 hours', score: 3 },
        { label: '5-7 hours', score: 2 },
        { label: 'Less than 5 hours', score: 1 },
      ],
    },
    {
      id: 3,
      prompt: 'How often do you eat fresh fruits and vegetables?',
      options: [
        { label: 'Daily', score: 3 },
        { label: 'A few times a week', score: 2 },
        { label: 'Rarely', score: 1 },
      ],
    },
    {
      id: 4,
      prompt: 'How would you rate your stress levels?',
      options: [
        { label: 'Low and manageable', score: 3 },
        { label: 'Moderate', score: 2 },
        { label: 'High most days', score: 1 },
      ],
    },
    {
      id: 5,
      prompt: 'How often do you exercise?',
      options: [
        { label: '4+ times a week', score: 3 },
        { label: '1-3 times a week', score: 2 },
        { label: 'Rarely', score: 1 },
      ],
    },
  ];

  readonly answers = signal<Record<number, number>>({});
  readonly submitted = signal(false);

  readonly answeredCount = computed(() => Object.keys(this.answers()).length);
  readonly canSubmit = computed(() => this.answeredCount() === this.questions.length);

  readonly score = computed(() => {
    const total = Object.values(this.answers()).reduce((a, b) => a + b, 0);
    const max = this.questions.length * 3;
    const percent = Math.round((total / max) * 100);
    let band: 'Strong' | 'Moderate' | 'Needs Care' = 'Needs Care';
    if (percent >= 75) band = 'Strong';
    else if (percent >= 50) band = 'Moderate';
    return { total, max, percent, band };
  });

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Know Your Current Immunity Score',
      description:
        'Assess your immunity level with our interactive quiz and get personalized tips to boost your immune system.',
      url: '/know-your-current-immunity-score',
    });
    await this.loadBannerData();
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(
        BannerForEnum.QUIZ_IMMUNITY,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'Failed to load banner data for Know Your Current Immunity Score page:',
        error,
      );
      this.banners = [];
    }
  }

  selectOption(questionId: number, score: number): void {
    this.answers.update((curr) => ({ ...curr, [questionId]: score }));
  }

  isSelected(questionId: number, score: number): boolean {
    return this.answers()[questionId] === score;
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
}
