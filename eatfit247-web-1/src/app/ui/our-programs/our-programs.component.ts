import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent, BreadcrumbsComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { IPublicBanner, IPublicFaq } from '@eatfit247-shared-library/core';
import { FaqService, JsonLdService, SEOService } from '../../core/services';

interface SessionChip {
  readonly num: string;
  readonly label: string;
}

interface PlanCard {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly featured?: boolean;
  readonly sessions: ReadonlyArray<SessionChip>;
  readonly features: ReadonlyArray<string>;
}

interface HowItWorksStep {
  readonly num: string;
  readonly icon: string;
  readonly title: string;
  readonly copy: string;
}

@Component({
  standalone: true,
  selector: 'app-our-programs',
  imports: [CommonModule, RouterLink, BannerComponent, BreadcrumbsComponent],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss',
})
export class OurProgramsComponent implements OnInit {
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  private readonly faqService = inject(FaqService);
  PROGRAM_FAQ_CATEGORY_ID = 4;
  banners: IPublicBanner[] = [];
  readonly faqs: WritableSignal<IPublicFaq[]> = signal<IPublicFaq[]>([]);

  readonly plans: ReadonlyArray<PlanCard> = [
    {
      id: 'exclusive-shweta',
      title: 'Exclusively with Shweta Shah',
      subtitle: 'Personalised journey with expert guidance.',
      sessions: [
        { num: '1', label: 'Session' },
        { num: '6', label: 'Sessions' },
        { num: '8', label: 'Sessions' },
      ],
      features: [
        'One-on-one consultation with Shweta Shah',
        'Comprehensive health assessment',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
    {
      id: 'chief-nutritionist',
      title: 'Plan with Chief Nutritionist',
      subtitle: 'Experience of 16 years.',
      featured: true,
      sessions: [
        { num: '3', label: 'Sessions' },
        { num: '6', label: 'Sessions' },
      ],
      features: [
        'One-on-one consultation with Shweta Shah',
        'Comprehensive health assessment',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
    {
      id: 'shweta-and-team',
      title: 'Plan with Shweta + Team',
      subtitle: 'Collaborative approach.',
      sessions: [{ num: '1 + 7', label: 'Sessions' }],
      features: [
        'Initial consultation with Shweta',
        '7 follow-up sessions with team',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
  ];

  readonly howItWorksSteps: ReadonlyArray<HowItWorksStep> = [
    {
      num: '01',
      icon: 'event_available',
      title: 'Book a 1:1 Appointment',
      copy: 'Schedule a one-on-one consultation at a time that suits you and tell us about your goals, history and lifestyle.',
    },
    {
      num: '02',
      icon: 'assignment_ind',
      title: 'Get Your Custom Plan',
      copy: 'Receive a fully personalised nutrition plan built around your body type, food preferences and medical context.',
    },
    {
      num: '03',
      icon: 'trending_up',
      title: 'Transform Your Journey',
      copy: 'Follow your guided plan with regular follow-ups, weekly check-ins and adjustments that move with your progress.',
    },
    {
      num: '04',
      icon: 'support_agent',
      title: 'End-to-End Support',
      copy: 'The Nutrinist team stays by your side throughout — answering questions, troubleshooting plateaus and keeping you on track.',
    },
  ];
  readonly termsAndConditions: ReadonlyArray<string> = [
    'Payments are non-refundable & non-transferable.',
    'Program is valid only for the registered individual.',
    'Pause up to 20 days may be approved in genuine cases.',
    'Prices are valid till 31st Dec, 2026.',
    '**Prices are exclusive of tax — tax will be charged on the final payment.',
  ];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Our Nutrition & Wellness Programs',
      description:
        'Explore EatFit247 personalized nutrition programs for weight management, detox, PCOS, and holistic wellness.',
      url: '/our-programs',
    });
    const programFaqs = await this.faqService.getFaqsByCategoryId(
      this.PROGRAM_FAQ_CATEGORY_ID,
    );
    this.faqs.set(programFaqs);
    this.jsonLdService.setPageSchema(
      this.jsonLdService.buildBreadcrumb([
        { name: 'Home', url: 'https://eatfit24by7.com/' },
        { name: 'Programs', url: 'https://eatfit24by7.com/our-programs' },
      ]),
    );
  }
}
