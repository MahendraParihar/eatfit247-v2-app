import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent } from '@shared-ui';
import { IPublicFaq } from '@eatfit247-shared-library/core';
import { FaqService, ProgramService, SeasonalProgramCard, SeasonalStatus, SEOService } from '../../core/services';

interface StatusGroup {
  status: SeasonalStatus;
  modifier: 'live' | 'soon' | 'closed';
  heading: string;
  blurb: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyCopy: string;
  emptyCtaLabel: string;
  plans: SeasonalProgramCard[];
}

@Component({
  standalone: true,
  selector: 'app-seasonal-plans',
  imports: [CommonModule, RouterLink, BreadcrumbsComponent],
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
        emptyIcon: 'event_busy',
        emptyTitle: 'No plans are open for enrolment right now.',
        emptyCopy:
          "Most seasonal plans run only at a specific time of year. Add your interest below and we'll WhatsApp you the moment the next batch opens.",
        emptyCtaLabel: 'Tell us your interest',
        plans: all.filter((p) => p.status === 'live'),
      },
      {
        status: 'soon',
        modifier: 'soon',
        heading: 'Coming up — join the waitlist',
        blurb:
          "Enrolment opens closer to the batch start. Add yourself to the waitlist now and we'll notify you the moment it opens.",
        emptyIcon: 'event_upcoming',
        emptyTitle: 'Nothing on the calendar just yet.',
        emptyCopy:
          'Upcoming batches will appear here as soon as dates are confirmed. Drop your details to be first in line.',
        emptyCtaLabel: 'Get notified',
        plans: all.filter((p) => p.status === 'soon'),
      },
      {
        status: 'closed',
        modifier: 'closed',
        heading: 'Off-season — next batch later',
        blurb:
          "These plans run only at certain times of year. Drop your details and we'll WhatsApp you when the next batch opens.",
        emptyIcon: 'event_available',
        emptyTitle: 'No off-season plans archived right now.',
        emptyCopy:
          'Plans that have wrapped up for the year will show here so you can request a re-run.',
        emptyCtaLabel: 'Request a plan',
        plans: all.filter((p) => p.status === 'closed'),
      },
    ];
  });

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
