import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { LoaderComponent, EmptyStateComponent } from '@shared-ui';
import { Program } from '../../core/interfaces/program.interface';
import { JsonLdService, SEOService } from '../../core/services';

const ALL_PROGRAMS: Program[] = [
  {
    id: 'exclusive-shweta',
    name: 'Exclusively with Shweta Shah',
    subtitle: 'Personalised journey with celebrity expert guidance',
    prices: [
      { programPlanId: 263, label: '1 Session', value: '₹20,000', note: '' },
      { programPlanId: 261, label: '6 Sessions', value: '₹67,500', note: 'Save ₹52,500' },
      { programPlanId: 262, label: '8 Sessions', value: '₹90,000', note: 'Save ₹70,000' },
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
    name: 'Plan with Chief Nutritionist',
    subtitle: '16 years of clinical nutrition experience',
    prices: [
      { programPlanId: 239, label: '3 Sessions', value: '₹15,000', note: '' },
      { programPlanId: 266, label: '6 Sessions', value: '₹30,000', note: 'Save ₹60,000' },
    ],
    features: [
      'One-on-one consultation with a Chief Nutritionist',
      'Comprehensive health assessment',
      'Personalized nutrition plan',
      'Detailed dietary recommendations',
      'Follow-up guidelines',
    ],
  },
  {
    id: 'shweta-and-team',
    name: 'Plan with Shweta + Team',
    subtitle: 'Collaborative, comprehensive approach',
    prices: [
      { programPlanId: 264, label: '1+7 Sessions', value: '₹55,000', note: '' },
    ],
    features: [
      'Initial consultation with Shweta Shah',
      '7 follow-up sessions with the expert team',
      'Personalized nutrition plan',
      'Detailed dietary recommendations',
      'Follow-up guidelines',
    ],
  },
];

const OUTCOMES: string[] = [
  'Sustainable weight management',
  'Improved gut health and digestion',
  'Better energy and sleep quality',
  'Balanced hormones and metabolism',
  'Reduced inflammation and bloating',
  'Science-backed, Ayurvedic nutrition approach',
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Are sessions conducted online or in person?',
    answer:
      'All sessions are conducted online via video call, so you can join from anywhere in the world.',
  },
  {
    question: 'What happens if I need to reschedule?',
    answer:
      'You can reschedule a session with at least 24 hours\' notice. Our team will help you find a convenient new time.',
  },
  {
    question: 'Can this plan work for specific conditions like PCOD or thyroid?',
    answer:
      'Yes. Our plans are customised for your health history. Please share your medical details during the initial consultation.',
  },
  {
    question: 'How soon will I see results?',
    answer:
      'Most clients notice positive changes within 2–3 weeks of following the plan consistently. Long-term results depend on adherence and individual response.',
  },
];

@Component({
  standalone: true,
  selector: 'app-program-details',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    LoaderComponent,
    EmptyStateComponent,
  ],
  templateUrl: './program-details.component.html',
  styleUrl: './program-details.component.scss',
})
export class ProgramDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);

  readonly loading = signal(true);
  readonly program = signal<Program | null>(null);

  readonly outcomes = OUTCOMES;
  readonly faqs = FAQS;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const found = ALL_PROGRAMS.find((p) => p.id === id) ?? null;
    this.program.set(found);
    this.loading.set(false);

    if (found) {
      this.seoService.updateSEO({ title: found.name, description: found.subtitle, url: `/our-programs/${found.id}` });
      this.jsonLdService.setPageSchema([
        {
          '@type': 'Service',
          name: found.name,
          description: found.subtitle,
          provider: { '@type': 'Organization', name: 'EatFit247', url: 'https://eatfit24by7.com' },
          areaServed: 'Worldwide',
          url: `https://eatfit24by7.com/our-programs/${found.id}`,
        },
        this.jsonLdService.buildBreadcrumb([
          { name: 'Home', url: 'https://eatfit24by7.com/' },
          { name: 'Programs', url: 'https://eatfit24by7.com/our-programs' },
          { name: found.name, url: `https://eatfit24by7.com/our-programs/${found.id}` },
        ]),
        this.jsonLdService.buildFaqPage(FAQS),
      ]);
    }
  }

  bookNow(programPlanId: number): void {
    this.router.navigate(['/checkout'], { queryParams: { plan: programPlanId } });
  }

  goToPrograms(): void {
    this.router.navigate(['/our-programs']);
  }
}
