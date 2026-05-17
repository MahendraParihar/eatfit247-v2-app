import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent, LoaderComponent } from '@shared-ui';
import { JsonLdService, SEOService } from '../../core/services';

export interface FaqItem {
  question: string;
  answer: string;
  /** Optional HTML answer with embedded markup. When set it is rendered as innerHTML. */
  answerHtml?: string;
}

export interface FaqCategory {
  key: string;
  category: string;
  icon: string;
  items: FaqItem[];
}

interface FaqCategoryView extends FaqCategory {
  items: FaqItem[];
  visibleCount: number;
}

@Component({
  standalone: true,
  selector: 'app-faq',
  imports: [CommonModule, FormsModule, RouterLink, LoaderComponent, BreadcrumbsComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements OnInit {
  private readonly jsonLdService = inject(JsonLdService);
  private readonly seoService = inject(SEOService);
  readonly loading = signal(false);

  readonly searchQuery = signal('');
  readonly activeCategory = signal<string>('all');

  readonly faqCategories: FaqCategory[] = [
    {
      key: 'programs',
      category: 'Programs',
      icon: 'fitness_center',
      items: [
        {
          question: 'What programs do you offer?',
          answer:
            'We offer three flagship programs — Kickstart (4 weeks), Transform (12 weeks) and Elite (6 months) — plus specialised tracks for PCOS, diabetes, postpartum and children\'s nutrition.',
        },
        {
          question: 'Which program is right for me?',
          answer:
            'If you\'re new, start with Kickstart. If you want measurable, lasting change, Transform is our most-chosen program. Elite is for those needing direct access to Shweta and concierge care.',
        },
        {
          question: 'Can I switch programs mid-way?',
          answer:
            'Yes — any time. Your progress, notes and plan history carry over. We\'ll credit unused days toward the new program.',
        },
        {
          question: 'Do you help with children\'s nutrition?',
          answer:
            'Yes — our Child & Teen tracks focus on growth, energy and academic performance, and involve the whole family\'s eating environment.',
        },
        {
          question: 'Do you work with athletes?',
          answer:
            'Yes — we design fueling strategies for endurance, strength and team sports. Our Elite program is best-suited for competitive athletes.',
        },
        {
          question: 'Can I buy programs as a gift?',
          answer: 'Absolutely. Contact us and we\'ll arrange a gift voucher redeemable by your recipient.',
        },
      ],
    },
    {
      key: 'process',
      category: 'Process & Plans',
      icon: 'route',
      items: [
        {
          question: 'How are your plans personalised?',
          answer:
            'Every client completes a detailed intake covering medical history, current labs, food preferences, lifestyle, schedule and goals. Your dietitian designs an initial plan from this data and adjusts it every two weeks based on progress.',
        },
        {
          question: 'Do I need to cook special meals?',
          answer:
            'No — we design around what you already eat. We optimise portions, timing, and add small upgrades. You shouldn\'t have to cook a separate meal from your family.',
        },
        {
          question: 'How long before I see results?',
          answer:
            'Most clients notice better energy and digestion within 7–10 days. Measurable body composition changes typically start in week 3–4.',
        },
        {
          question: 'What if my plan isn\'t working?',
          answer:
            'We adjust. Plans are living documents — we review progress weekly and update based on your biomarkers, feedback and adherence.',
        },
        {
          question: 'Do you provide recipes and grocery lists?',
          answer:
            'Yes — Transform and Elite include a recipe library and auto-generated weekly grocery lists in the app.',
        },
      ],
    },
    {
      key: 'billing',
      category: 'Billing & Refunds',
      icon: 'credit_card',
      items: [
        {
          question: 'Do you offer refunds?',
          answer:
            'Yes — if you\'ve been on a program for 14 days, followed the plan, and haven\'t seen results, we\'ll refund in full. We also offer month-by-month billing.',
        },
        {
          question: 'How do I pay?',
          answer:
            'We accept all major cards, UPI, net-banking and international wire. Monthly plans auto-renew until cancelled.',
        },
        {
          question: 'Can I pause my subscription?',
          answer:
            'Yes — pause for up to 60 days from your account dashboard. Your plan and progress resume exactly where you left off.',
        },
        {
          question: 'Is GST included?',
          answer:
            'All prices displayed include applicable GST for Indian residents. International clients see pre-tax pricing.',
        },
      ],
    },
    {
      key: 'health',
      category: 'Medical & Health',
      icon: 'health_and_safety',
      items: [
        {
          question: 'Can I continue my medication while on a program?',
          answer:
            'Absolutely. We never ask anyone to stop prescribed medication. Our dietitians collaborate with your physician.',
        },
        {
          question: 'I have a medical condition. Can I still join?',
          answer:
            'Most conditions are manageable alongside our programs — PCOS, thyroid, diabetes, hypertension, IBS. We\'ll ask for recent labs and may coordinate with your doctor.',
        },
        {
          question: 'Do you work with PCOS?',
          answer:
            'PCOS is one of our specialisations. We have protocols for insulin sensitivity, androgen markers, cycle regularity and related skin concerns.',
        },
        {
          question: 'Is this safe during pregnancy?',
          answer:
            'Our pregnancy and postpartum track is designed by practitioners with maternal-nutrition training and follows medical guidelines.',
        },
        {
          question: 'Do I need recent blood tests?',
          answer:
            'Not to start, but they help us personalise. Transform and Elite include a lab-review protocol and we can order tests where permitted.',
        },
      ],
    },
    {
      key: 'support',
      category: 'Support & Access',
      icon: 'support_agent',
      items: [
        {
          question: 'Is the consultation online or in-person?',
          answer:
            'All programs are delivered online via video call and chat. This lets you access the same team from anywhere in the world.',
        },
        {
          question: 'How often do I speak with my dietitian?',
          answer:
            'Kickstart: 2 calls per month. Transform: weekly 45-min 1:1 calls. Elite: weekly calls with Shweta plus bi-weekly lab reviews.',
        },
        {
          question: 'What are your support hours?',
          answer:
            'WhatsApp and chat: Mon–Sat, 9am–7pm IST. Response SLA within 4 working hours on Transform and Elite.',
        },
        {
          question: 'Is my data private?',
          answer:
            'Yes — all health data is encrypted in transit and at rest. Only your dedicated care team can access it. Full policy on our privacy page.',
          answerHtml:
            'Yes — all health data is encrypted in transit and at rest. Only your dedicated care team can access it. Full policy on our <a href="/privacy-policy">privacy page</a>.',
        },
      ],
    },
  ];

  readonly totalCount = computed(() =>
    this.faqCategories.reduce((sum, c) => sum + c.items.length, 0),
  );

  readonly categoryCounts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const map = new Map<string, number>();
    let total = 0;
    for (const cat of this.faqCategories) {
      const count = cat.items.filter((i) => this.matches(i, query)).length;
      map.set(cat.key, count);
      total += count;
    }
    map.set('all', total);
    return map;
  });

  readonly visibleGroups = computed<FaqCategoryView[]>(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const active = this.activeCategory();
    return this.faqCategories
      .filter((c) => active === 'all' || active === c.key)
      .map((c) => {
        const items = c.items.filter((i) => this.matches(i, query));
        return { ...c, items, visibleCount: items.length };
      })
      .filter((c) => c.visibleCount > 0);
  });

  readonly hasResults = computed(() => this.visibleGroups().length > 0);

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Frequently Asked Questions',
      description:
        'Find answers to common questions about EatFit247 nutrition plans, diet programs, and wellness services.',
      url: '/faq',
    });
    const allFaqs = this.faqCategories.flatMap((c) => c.items);
    this.jsonLdService.setPageSchema(this.jsonLdService.buildFaqPage(allFaqs));
  }

  setCategory(key: string): void {
    this.activeCategory.set(key);
  }

  countFor(key: string): number {
    return this.categoryCounts().get(key) ?? 0;
  }

  private matches(item: FaqItem, query: string): boolean {
    if (!query) {
      return true;
    }
    return (
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  }
}
