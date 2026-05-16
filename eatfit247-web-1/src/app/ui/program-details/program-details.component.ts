import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BreadcrumbsComponent, EmptyStateComponent, LoaderComponent } from '@shared-ui';
import { JsonLdService, SEOService } from '../../core/services';

interface SessionChip {
  readonly num: string;
  readonly label: string;
}

interface PlanFeature {
  readonly icon: string;
  readonly title: string;
  readonly copy: string;
}

interface TimelineStep {
  readonly icon: string;
  readonly title: string;
  readonly copy: string;
}

interface FaqItem {
  readonly q: string;
  readonly a: string;
  readonly aHtml?: boolean;
}

interface ProgramDetailPlan {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly lead: string;
  readonly icon: string;
  readonly durationLabel: string;
  readonly featured?: boolean;
  readonly sessions: ReadonlyArray<SessionChip>;
  readonly highlights: ReadonlyArray<string>;
  readonly features: ReadonlyArray<PlanFeature>;
  readonly timeline: ReadonlyArray<TimelineStep>;
}

const DEFAULT_TIMELINE: ReadonlyArray<TimelineStep> = [
  { icon: 'chat', title: 'Week 0 · Discovery call', copy: '30 minutes to understand your goals, history and any conditions.' },
  { icon: 'assignment', title: 'Week 1 · Deep assessment', copy: 'Intake questionnaire, recent labs, food log review. Your first plan drops on day 5.' },
  { icon: 'trending_up', title: 'Weeks 2–11 · Weekly coaching', copy: 'Weekly 45-min 1:1 calls, bi-weekly plan adjustments, daily WhatsApp support.' },
  { icon: 'flag', title: 'Week 12 · Maintenance plan', copy: 'A full review, habit consolidation, and a 6-month maintenance roadmap.' },
];

const PLANS: ReadonlyArray<ProgramDetailPlan> = [
  {
    id: 'exclusive-shweta',
    title: 'Exclusively with Shweta Shah',
    subtitle: 'Personalised journey with expert guidance.',
    lead: 'A one-on-one engagement directly with Shweta — for clients who want her undivided attention across every session, plan revision and follow-up.',
    icon: 'diamond',
    durationLabel: 'Personalised',
    sessions: [
      { num: '1', label: 'Session' },
      { num: '6', label: 'Sessions' },
      { num: '8', label: 'Sessions' },
    ],
    highlights: [
      'One-on-one consultation with Shweta Shah',
      'Comprehensive health assessment',
      'Personalized nutrition plan',
      'Detailed dietary recommendations',
      'Follow-up guidelines',
    ],
    features: [
      { icon: 'diamond', title: '1:1 with Shweta', copy: 'Every session is held directly with Shweta Shah — no hand-offs.' },
      { icon: 'assignment_ind', title: 'Personalised plan', copy: 'Built from your medical history, recent labs and food preferences.' },
      { icon: 'restaurant', title: 'Dietary recommendations', copy: 'Practical, family-friendly recommendations that fit your kitchen.' },
      { icon: 'support_agent', title: 'Follow-up guidelines', copy: 'Clear protocols so you always know the next step.' },
    ],
    timeline: DEFAULT_TIMELINE,
  },
  {
    id: 'chief-nutritionist',
    title: 'Plan with Chief Nutritionist',
    subtitle: 'Experience of 16 years.',
    lead: 'Work directly with our Chief Nutritionist for a structured, results-driven journey backed by 16 years of clinical experience.',
    icon: 'spa',
    durationLabel: 'Structured',
    featured: true,
    sessions: [
      { num: '3', label: 'Sessions' },
      { num: '6', label: 'Sessions' },
    ],
    highlights: [
      'One-on-one consultation with Shweta Shah',
      'Comprehensive health assessment',
      'Personalized nutrition plan',
      'Detailed dietary recommendations',
      'Follow-up guidelines',
    ],
    features: [
      { icon: 'verified', title: 'Senior expertise', copy: '16+ years of clinical nutrition experience guiding every decision.' },
      { icon: 'monitoring', title: 'Comprehensive assessment', copy: 'Deep dive into history, labs, lifestyle and goals.' },
      { icon: 'menu_book', title: 'Personalised plan', copy: 'Aligned with your cuisine, schedule and medical context.' },
      { icon: 'tune', title: 'Plan refinements', copy: 'Adjustments built into your sessions as your body responds.' },
    ],
    timeline: DEFAULT_TIMELINE,
  },
  {
    id: 'shweta-and-team',
    title: 'Plan with Shweta + Team',
    subtitle: 'Collaborative approach.',
    lead: 'Get the best of both worlds — start with Shweta, then continue with a dedicated expert team for sustained, high-touch follow-through.',
    icon: 'favorite',
    durationLabel: 'Collaborative',
    sessions: [{ num: '1 + 7', label: 'Sessions' }],
    highlights: [
      'Initial consultation with Shweta',
      '7 follow-up sessions with team',
      'Personalized nutrition plan',
      'Detailed dietary recommendations',
      'Follow-up guidelines',
    ],
    features: [
      { icon: 'diamond', title: 'Kick-off with Shweta', copy: 'Strategy session with Shweta to set direction.' },
      { icon: 'groups', title: 'Expert team', copy: '7 follow-ups with an expert team trained in her methodology.' },
      { icon: 'assignment_ind', title: 'Personalised plan', copy: 'Tailored across nutrition, sleep, movement and stress.' },
      { icon: 'support_agent', title: 'Continuous support', copy: 'Cohesive hand-off so nothing gets lost between sessions.' },
    ],
    timeline: DEFAULT_TIMELINE,
  },
];

const FAQS: ReadonlyArray<FaqItem> = [
  {
    q: 'How are sessions delivered?',
    a: 'All consultations happen online — secure video calls plus daily WhatsApp support. You can join from anywhere; you only need a phone or laptop with a stable connection.',
  },
  {
    q: 'How quickly can I start after enrolling?',
    a: 'Your discovery call is scheduled within 48 hours. Your first personalised plan is delivered by day 3–5 once we have your intake and any recent labs.',
  },
  {
    q: 'What if I have a medical condition like PCOS, thyroid or diabetes?',
    a: "Most conditions are well-managed alongside our programs. We'll review your reports, coordinate with your physician where useful, and never ask you to stop prescribed medication.",
  },
  {
    q: 'Do I need to cook separate meals from my family?',
    a: "No. Plans are built around what you already eat — Indian, vegetarian, vegan, eggetarian or non-vegetarian. We optimise portions, timing and small swaps; we don't replace your kitchen.",
  },
  {
    q: 'Can I switch programs mid-way?',
    a: 'Yes — at any point. Your progress, notes and history carry over and we credit unused sessions toward the new program.',
  },
  {
    q: 'What if I miss a session?',
    a: 'Reschedule up to 4 hours in advance. Missed sessions can be made up within the same month at no extra cost.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Payments are non-refundable & non-transferable; however, we may approve a pause of up to 20 days in genuine cases. Reach out to our team and we will review case by case.',
  },
  {
    q: 'Is my health data private?',
    a: 'All health data is encrypted in transit and at rest, and only your dedicated care team can access it. Full details on our privacy page.',
  },
];

@Component({
  standalone: true,
  selector: 'app-program-details',
  imports: [CommonModule, RouterLink, LoaderComponent, EmptyStateComponent, BreadcrumbsComponent],
  templateUrl: './program-details.component.html',
  styleUrl: './program-details.component.scss',
})
export class ProgramDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);

  readonly loading = signal(true);
  readonly plan = signal<ProgramDetailPlan | null>(null);

  readonly faqs = FAQS;
  readonly relatedPlans = PLANS;
  readonly relatedPlansFiltered = computed<ReadonlyArray<ProgramDetailPlan>>(() => {
    const current = this.plan();
    return current ? PLANS.filter((rp) => rp.id !== current.id) : PLANS;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const found = PLANS.find((p) => p.id === id) ?? null;
    this.plan.set(found);
    this.loading.set(false);

    if (found) {
      this.seoService.updateSEO({
        title: found.title,
        description: found.subtitle,
        url: `/our-programs/${found.id}`,
      });
      this.jsonLdService.setPageSchema([
        {
          '@type': 'Service',
          name: found.title,
          description: found.subtitle,
          provider: { '@type': 'Organization', name: 'EatFit247', url: 'https://eatfit24by7.com' },
          areaServed: 'Worldwide',
          url: `https://eatfit24by7.com/our-programs/${found.id}`,
        },
        this.jsonLdService.buildBreadcrumb([
          { name: 'Home', url: 'https://eatfit24by7.com/' },
          { name: 'Programs', url: 'https://eatfit24by7.com/our-programs' },
          { name: found.title, url: `https://eatfit24by7.com/our-programs/${found.id}` },
        ]),
        this.jsonLdService.buildFaqPage(FAQS.map((f) => ({ question: f.q, answer: f.a }))),
      ]);
    }
  }

  goToPrograms(): void {
    this.router.navigate(['/our-programs']);
  }
}
