import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent, BreadcrumbsComponent } from '@shared-ui';
import { BannerService } from '../../core/services/banner.service';
import { BannerForEnum } from '@eatfit247-shared-library/enum';
import { IPublicBanner } from '@eatfit247-shared-library/core';
import { JsonLdService, SEOService } from '../../core/services';

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

interface FaqItem {
  readonly q: string;
  readonly a: string;
  readonly aHtml?: boolean;
  readonly link?: { readonly route: string; readonly label: string; readonly before: string; readonly after: string };
}

@Component({
  standalone: true,
  selector: 'app-our-programs',
  imports: [CommonModule, RouterLink, BannerComponent, BreadcrumbsComponent],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss',
})
export class OurProgramsComponent implements OnInit {
  private readonly bannerService = inject(BannerService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);

  banners: IPublicBanner[] = [];

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
      sessions: [
        { num: '1 + 7', label: 'Sessions' },
      ],
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

  readonly faqs: ReadonlyArray<FaqItem> = [
    {
      q: 'Which program is right for me?',
      a: "If you've never worked with a dietitian, start with <strong>Weight Loss</strong> or a single-session consult. For lasting change across nutrition, sleep and stress, choose <strong>Complete Wellness</strong>. For PCOS, thyroid or hormonal issues, the <strong>PCOS &amp; Hormonal Care</strong> track is purpose-built.",
      aHtml: true,
    },
    {
      q: 'How are the plans personalised?',
      a: 'Every client completes a detailed intake covering medical history, recent labs, food preferences, lifestyle and goals. Your dietitian designs the first plan from this and adjusts every two weeks based on progress.',
    },
    {
      q: 'Are sessions online or in-person?',
      a: 'All programs are delivered online — secure video calls and daily WhatsApp support — so you can access the same team from anywhere in the world.',
    },
    {
      q: 'How long before I see results?',
      a: 'Most clients notice better energy and digestion within 7–10 days. Measurable body composition and biomarker changes typically begin in week 3–4.',
    },
    {
      q: 'Can I switch programs mid-way?',
      a: 'Yes, at any time. Your progress, plan history and notes carry over, and we credit unused days toward the new program.',
    },
    {
      q: 'I have a medical condition. Can I still join?',
      a: "Most conditions — PCOS, thyroid, diabetes, hypertension, IBS — are manageable alongside our programs. We'll ask for recent labs and coordinate with your doctor where useful.",
    },
    {
      q: 'Do you offer refunds?',
      a: "Payments are non-refundable; however we offer the ability to pause for genuine reasons. Please reach out to our team for case-by-case support.",
    },
    {
      q: 'Can I buy a program as a gift?',
      a: '',
      link: {
        before: 'Absolutely. ',
        route: '/contact-us',
        label: 'Reach out',
        after: " and we'll arrange a gift voucher your recipient can redeem when they're ready to start.",
      },
    },
  ];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'Our Nutrition & Wellness Programs',
      description:
        'Explore EatFit247 personalized nutrition programs for weight management, detox, PCOS, and holistic wellness.',
      url: '/our-programs',
    });
    await this.loadBannerData();
    this.jsonLdService.setPageSchema(
      this.jsonLdService.buildBreadcrumb([
        { name: 'Home', url: 'https://eatfit24by7.com/' },
        { name: 'Programs', url: 'https://eatfit24by7.com/our-programs' },
      ]),
    );
  }

  private async loadBannerData(): Promise<void> {
    try {
      this.banners = await this.bannerService.getBannerMediaForPage(BannerForEnum.OUR_PROGRAM);
    } catch (error) {
      console.error('Failed to load banner data for Our Programs page:', error);
      this.banners = [];
    }
  }
}
