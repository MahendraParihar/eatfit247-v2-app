import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { LoaderComponent } from '@shared-ui';
import { JsonLdService } from '../../core/services';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  category: string;
  icon: string;
  items: FaqItem[];
}

@Component({
  standalone: true,
  selector: 'app-faq',
  imports: [CommonModule, MatButtonModule, MatExpansionModule, MatIconModule, RouterLink, LoaderComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FaqComponent implements OnInit {
  private readonly jsonLdService = inject(JsonLdService);
  readonly loading = signal(false);

  readonly faqCategories: FaqCategory[] = [
    {
      category: 'Diet Consultancy & Programs',
      icon: 'restaurant_menu',
      items: [
        {
          question: 'What is included in a nutrition consultation with Shweta Shah?',
          answer:
            'Each session includes a comprehensive health assessment, a personalised nutrition plan tailored to your body type and goals, detailed dietary recommendations, and follow-up guidelines. Shweta uses an Ayurvedic and science-backed approach to help you achieve sustainable results.',
        },
        {
          question: 'How many sessions do I need to see results?',
          answer:
            'Most clients see meaningful changes within 4–6 weeks. We recommend starting with at least 3 sessions to allow your nutritionist to assess your response to the plan and make targeted adjustments. Our multi-session packages are designed to give you the best outcome at the best value.',
        },
        {
          question: 'Are the programs done online or in person?',
          answer:
            'All programs are conducted online via video consultation, so you can connect with Shweta and the team from the comfort of your home — anywhere in the world.',
        },
        {
          question: 'Can I book a single session before committing to a package?',
          answer:
            'Yes. We offer single-session consultations so you can experience the EatFit247 approach before choosing a multi-session package. Visit our Programs page to see all available options.',
        },
        {
          question: 'Are the diet plans customised for medical conditions (diabetes, thyroid, PCOD)?',
          answer:
            'Absolutely. Our nutritionists are experienced in managing chronic conditions including diabetes, hypothyroidism, PCOD/PCOS, gut disorders, and more. Your plan will be designed around your specific health history and goals.',
        },
      ],
    },
    {
      category: 'Debloat Powder',
      icon: 'spa',
      items: [
        {
          question: 'What is Debloat powder and how does it work?',
          answer:
            'Debloat is a 100% natural digestive wellness powder formulated with Ayurvedic herbs. It works by supporting healthy gut motility, reducing gas and bloating, and restoring digestive balance. Simply mix it with warm water as directed for best results.',
        },
        {
          question: 'How long does one pack last and how often should I use it?',
          answer:
            'One pack is designed to last approximately 30 days with the recommended daily dosage. Consistency is key — most users report noticeable improvement within 10–14 days of regular use.',
        },
        {
          question: 'Is Debloat safe for everyone?',
          answer:
            'Debloat is made from natural, Ayurvedic ingredients and is generally safe for adults. However, if you are pregnant, breastfeeding, or have a known medical condition, please consult your doctor before use. It is not intended for children under 12.',
        },
        {
          question: 'How do I track my order?',
          answer:
            'Once your order is placed and confirmed, you will receive a tracking link via email and SMS. Orders are typically dispatched within 1–2 business days and delivered within 3–7 business days depending on your location.',
        },
        {
          question: 'What is the return/refund policy for Debloat?',
          answer:
            'We accept returns on unopened products within 7 days of delivery. If your product arrives damaged, please contact us immediately at info@eatfit24by7.com with a photo of the packaging. Refunds are processed within 5–7 business days.',
        },
      ],
    },
    {
      category: 'Payments & Checkout',
      icon: 'payment',
      items: [
        {
          question: 'What payment methods are accepted?',
          answer:
            'We accept all major credit/debit cards, UPI, net banking, and popular wallets through our secure Razorpay-powered checkout. All transactions are encrypted and PCI-DSS compliant.',
        },
        {
          question: 'Is my payment information safe?',
          answer:
            'Yes. We use industry-standard SSL encryption and do not store your card details on our servers. Payments are processed securely through Razorpay, one of India\'s leading payment gateways.',
        },
        {
          question: 'Can I get a GST invoice for my purchase?',
          answer:
            'Yes. A GST invoice is generated automatically for all purchases and sent to your registered email address. You can also access your invoice from the order confirmation page.',
        },
      ],
    },
    {
      category: 'General',
      icon: 'help_outline',
      items: [
        {
          question: 'Who is Shweta Shah?',
          answer:
            'Shweta Shah is a celebrity nutritionist with over 16 years of experience in holistic nutrition and wellness. She is known for her evidence-based, Ayurvedic approach to health and has helped thousands of clients across India and internationally achieve sustainable transformations.',
        },
        {
          question: 'How can I contact the EatFit247 team?',
          answer:
            'You can reach us via the Contact Us page on our website, by emailing info@eatfit24by7.com, or by calling during business hours. We typically respond within 24 hours on working days.',
        },
        {
          question: 'Do you offer corporate wellness programs?',
          answer:
            'Yes. We provide customised corporate wellness workshops and group nutrition programs. Please reach out to us via the Contact Us page or email us directly to discuss a tailored solution for your organisation.',
        },
      ],
    },
  ];

  ngOnInit(): void {
    const allFaqs = this.faqCategories.flatMap((c) => c.items);
    this.jsonLdService.setPageSchema(this.jsonLdService.buildFaqPage(allFaqs));
  }
}
