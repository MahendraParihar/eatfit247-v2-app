import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent, EmptyStateAction, EmptyStateComponent } from '@shared-ui';
import { IPublicFaq } from '@eatfit247-shared-library/core';
import { FaqService, ProgramService, SeasonalProgramCard, SeasonalStatus, SEOService } from '../../core/services';

interface StatusGroup {
  status: SeasonalStatus;
  modifier: 'live' | 'soon' | 'closed';
  heading: string;
  blurb: string;
  plans: SeasonalProgramCard[];
}

@Component({
  standalone: true,
  selector: 'app-seasonal-plans',
  imports: [CommonModule, RouterLink, BreadcrumbsComponent, EmptyStateComponent],
  templateUrl: './seasonal-plans.component.html',
  styleUrl: './seasonal-plans.component.scss',
})
export class SeasonalPlansComponent implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly programService = inject(ProgramService);
  private readonly faqService = inject(FaqService);

  readonly SEASONAL_PLAN_FAQ_CATEGORY_ID = 10;

  readonly programs = signal<SeasonalProgramCard[]>([]);
  readonly faqs = signal<IPublicFaq[]>([]);

  readonly groups = computed<StatusGroup[]>(() => {
    const all = this.programs();
    return [
      {
        status: 'live',
        modifier: 'live',
        heading: 'Open for enrolment now',
        blurb: '',
        plans: all.filter((p) => p.status === 'live'),
      },
      {
        status: 'soon',
        modifier: 'soon',
        heading: 'Coming up — join the waitlist',
        blurb:
          "Enrolment opens closer to the batch start. Add yourself to the waitlist now and we'll notify you the moment it opens.",
        plans: all.filter((p) => p.status === 'soon'),
      },
      {
        status: 'closed',
        modifier: 'closed',
        heading: 'Off-season — next batch later',
        blurb:
          "These plans run only at certain times of year. Drop your details and we'll WhatsApp you when the next batch opens.",
        plans: all.filter((p) => p.status === 'closed'),
      },
    ];
  });

  readonly allGroupsEmpty = computed<boolean>(() => this.groups().every((g) => g.plans.length === 0));

  readonly sectionEmptyActions: EmptyStateAction[] = [
    { label: 'Tell us your interest', link: '/contact-us', variant: 'filled' },
    { label: 'Explore one-on-one programs', link: '/our-programs', variant: 'outlined' },
  ];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Seasonal & Group Plans | EatFit247',
      description:
        'Cohort-based seasonal diet plans with fixed start dates. Flat pricing. Reserve your spot.',
      url: '/seasonal-plans',
    });
    const [programs, faqs] = await Promise.all([
      this.programService.getSeasonalPrograms(),
      this.faqService.getFaqsByCategoryId(this.SEASONAL_PLAN_FAQ_CATEGORY_ID),
    ]);
    this.programs.set(programs);
    this.faqs.set(faqs);
  }

  coverStyle(plan: SeasonalProgramCard): Record<string, string> {
    return plan.coverImg ? { '--cover-img': `url('${plan.coverImg}')` } : {};
  }

  detailsListItems(html: string): string[] {
    if (!html) return [];
    const matches = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)];
    return matches
      .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim())
      .filter((s) => s.length > 0);
  }

  detailsHasList(html: string): boolean {
    return this.detailsListItems(html).length > 0;
  }
}
