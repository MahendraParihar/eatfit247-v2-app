import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { BreadcrumbsComponent } from '@shared-ui';
import { IPublicFaq } from '@eatfit247-shared-library/core';
import { FaqService, JsonLdService, SEOService } from '../../../core/services';
import { WHATSAPP_LINK } from '../../../core/utils/constants';

interface ProgramPlan {
  readonly sessions: string;
  readonly sessionsLabel: string;
  readonly features: ReadonlyArray<string>;
  readonly price: string;
}

@Component({
  standalone: true,
  selector: 'app-about-chief-nutritionist',
  imports: [CommonModule, BreadcrumbsComponent],
  templateUrl: './about-chief-nutritionist.component.html',
  styleUrl: './about-chief-nutritionist.component.scss',
})
export class AboutChiefNutritionistComponent implements OnInit {
  private readonly seoService = inject(SEOService);
  private readonly jsonLdService = inject(JsonLdService);
  private readonly faqService = inject(FaqService);

  // Reuse the program FAQ category — same source as our-programs
  readonly FAQ_CATEGORY_ID = 4;
  readonly faqs: WritableSignal<IPublicFaq[]> = signal<IPublicFaq[]>([]);
  readonly whatsappLink = WHATSAPP_LINK;

  readonly plans: ReadonlyArray<ProgramPlan> = [
    {
      sessions: '3',
      sessionsLabel: 'Session',
      features: [
        '3 Consultations',
        '__Plan Duration:__ 1 month',
        '__Call Duration:__ 1st call (30 min). Follow up call 3 — (20-30 min)',
        '__Audio Call Only__',
        'Diet Plans Crafted 100% by chief nutritionist & supervised by Shweta Shah',
        '__Vata–Pitta–Kapha Analysis__',
        '1 consultation after every 10 days',
        'Hidden imbalances & the root cause of your health issue',
        '__Follow-Up Session By chief nutritionist__',
        'Herbal teas, decoctions & remedies',
        'Breathwork • Exercise • Home Remedies',
      ],
      price: '₹13,000',
    },
    {
      sessions: '6',
      sessionsLabel: 'Session',
      features: [
        '6 Consultations',
        '__Plan Duration:__ 2 month',
        '__Call Duration:__ 1st call (30 min). Follow up call 3 — (20-30 min)',
        '__Audio Call Only__',
        'Diet Plans Crafted 100% by chief nutritionist & supervised by Shweta Shah',
        '__Vata–Pitta–Kapha Analysis__',
        '1 consultation after every 10 days',
        'Hidden imbalances & the root cause of your health issue',
        '__Follow-Up Session By chief nutritionist__',
        'Herbal teas, decoctions & remedies',
        'Breathwork • Exercise • Home Remedies',
      ],
      price: '₹44,000',
    },
  ];

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: 'About Birangi Shah — Chief Nutritionist',
      description:
        "Birangi Shah, EatFit247's Chief Nutritionist — 16 years beside Shweta Shah, blending Ayurvedic Prakriti analysis with modern nutrition.",
      url: '/about-chief-nutritionist',
    });
    this.jsonLdService.setPageSchema({
      '@type': 'Person',
      name: 'Birangi Shah',
      jobTitle: 'Chief Nutritionist',
      url: 'https://eatfit24by7.com/about-chief-nutritionist',
      description:
        "EatFit247's Chief Nutritionist with 16 years of experience, trained under Shweta Shah and following the same Ayurveda-rooted philosophy.",
      worksFor: {
        '@type': 'Organization',
        name: 'EatFit247',
        url: 'https://eatfit24by7.com',
      },
    } as Record<string, unknown>);
    await this.loadFaqs();
  }

  private async loadFaqs(): Promise<void> {
    try {
      const list = await this.faqService.getFaqsByCategoryId(
        this.FAQ_CATEGORY_ID,
      );
      this.faqs.set(list);
    } catch {
      this.faqs.set([]);
    }
  }

  // Render bold segments wrapped in __ ... __ as <strong>
  renderFeature(text: string): string {
    return text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  }
}
