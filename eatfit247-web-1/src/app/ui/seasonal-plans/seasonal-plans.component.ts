import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent } from '@shared-ui';
import { SEOService } from '../../core/services';

type SeasonalStatus = 'live' | 'soon' | 'closed';

interface SeasonalStat {
  num: string;
  label: string;
}

interface SeasonalPlanCard {
  slug: string;
  title: string;
  subtitle: string;
  word: string;
  status: SeasonalStatus;
  statusLabel: string;
  datePill: string;
  stats: SeasonalStat[];
  bullets: string[];
  price: string;
  priceSuffix?: string;
  primaryLabel: string;
  primaryIcon: string;
  primaryIntent: 'reserve' | 'waitlist';
  primaryVariant: 'filled' | 'outlined';
  featured?: boolean;
  coverA?: string;
  coverB?: string;
  coverImg: string;
  coverMode?: 'tinted' | 'full';
  coverBg?: string;
  coverPos?: string;
}

interface StatusGroup {
  status: SeasonalStatus;
  modifier: 'live' | 'soon' | 'closed';
  heading: string;
  blurb: string;
  emptyIcon: string;
  emptyTitle: string;
  emptyCopy: string;
  emptyCtaLabel: string;
  plans: SeasonalPlanCard[];
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

  readonly groups: StatusGroup[] = [
    {
      status: 'live',
      modifier: 'live',
      heading: 'Open for enrolment now',
      blurb:
        "Currently accepting reservations. Reserve free — our team will confirm via WhatsApp and share UPI / bank details.",
      emptyIcon: 'event_busy',
      emptyTitle: 'No plans are open for enrolment right now.',
      emptyCopy:
        "Most seasonal plans run only at a specific time of year. Add your interest below and we'll WhatsApp you the moment the next batch opens.",
      emptyCtaLabel: 'Tell us your interest',
      plans: [
        {
          slug: 'diabetic',
          title: 'Diabetic Care Plan',
          subtitle:
            'Two 10-day sessions back-to-back, each with its own diet rotation — stabilise sugar levels and rebuild meal-time habits.',
          word: 'DIABETIC',
          status: 'live',
          statusLabel: 'Open now',
          datePill: 'New batch monthly',
          stats: [
            { num: '2', label: 'Sessions' },
            { num: '10+10', label: 'Days' },
            { num: '20', label: 'Diets' },
          ],
          bullets: [
            'Two distinct 10-day diet rotations',
            'Low-GI, fibre-rich, portion-mapped',
            'Daily check-ins on glucose patterns',
          ],
          price: '₹2,000',
          priceSuffix: 'flat',
          primaryLabel: 'Reserve Spot',
          primaryIcon: 'arrow_forward',
          primaryIntent: 'reserve',
          primaryVariant: 'filled',
          featured: true,
          coverA: '#14b8a6',
          coverB: '#0f766e',
          coverImg:
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80&auto=format&fit=crop',
        },
        {
          slug: 'monsoon',
          title: 'Monsoon Detox',
          subtitle:
            'A 10-day light-cooking plan to fix bloating, sluggish digestion and the monsoon-cold loop — one warm, gut-friendly diet a day.',
          word: 'MONSOON',
          status: 'live',
          statusLabel: 'Open now',
          datePill: 'Starts Jul 15, 2026',
          stats: [
            { num: '1', label: 'Session' },
            { num: '10', label: 'Days' },
            { num: '10', label: 'Diets' },
          ],
          bullets: [
            'Gut-rest meals, herbal infusions',
            'Immunity-boost spice rotations',
            'Daily prep notes & reminders',
          ],
          price: '₹1,800',
          priceSuffix: 'flat',
          primaryLabel: 'Reserve Spot',
          primaryIcon: 'arrow_forward',
          primaryIntent: 'reserve',
          primaryVariant: 'filled',
          coverA: '#06b6d4',
          coverB: '#0e7490',
          coverImg:
            'https://images.unsplash.com/photo-1547573854-74d2a71d0826?w=800&q=80&auto=format&fit=crop',
        },
        {
          slug: 'postpartum',
          title: 'Postpartum Recovery',
          subtitle:
            'A 30-day plan in three 10-day sessions — recovery, lactation support and gentle reset, each with its own diet rotation.',
          word: 'POSTPARTUM',
          status: 'live',
          statusLabel: 'Open now',
          datePill: 'Rolling start',
          stats: [
            { num: '3', label: 'Sessions' },
            { num: '30', label: 'Days' },
            { num: '30', label: 'Diets' },
          ],
          bullets: [
            'Three distinct 10-day rotations',
            'Lactation-supportive ingredients',
            'Calorie-mapped for new moms',
          ],
          price: '₹3,500',
          priceSuffix: 'flat',
          primaryLabel: 'Reserve Spot',
          primaryIcon: 'arrow_forward',
          primaryIntent: 'reserve',
          primaryVariant: 'filled',
          coverA: '#f472b6',
          coverB: '#db2777',
          coverImg:
            'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80&auto=format&fit=crop',
        },
      ],
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
      plans: [
        {
          slug: 'navratri',
          title: 'Navratri Special',
          subtitle:
            'A 10-day fasting-friendly plan with a different sattvic diet each day — keep your energy up through the nine nights.',
          word: 'NAVRATRI',
          status: 'soon',
          statusLabel: 'Opens Sep 1',
          datePill: 'Starts Oct 11, 2026',
          stats: [
            { num: '1', label: 'Session' },
            { num: '10', label: 'Days' },
            { num: '10', label: 'Diets' },
          ],
          bullets: [
            'Different sattvic plan every day',
            'Vrat-compliant & gluten-free options',
            'Daily WhatsApp meal-prep notes',
          ],
          price: '₹1,500',
          priceSuffix: 'flat',
          primaryLabel: 'Notify Me',
          primaryIcon: 'notifications_active',
          primaryIntent: 'waitlist',
          primaryVariant: 'filled',
          coverImg: '/seasonal-navratri.avif',
          coverMode: 'full',
          coverBg: '#fff7e8',
          coverPos: 'left center',
        },
        {
          slug: 'winter',
          title: 'Winter Immunity',
          subtitle:
            'A warming 14-day diet built on seasonal Indian produce, ghee-laced grains and immunity-first spice combinations — one rotation a day.',
          word: 'WINTER',
          status: 'soon',
          statusLabel: 'Opens Oct 15',
          datePill: 'Starts Dec 1, 2026',
          stats: [
            { num: '1', label: 'Session' },
            { num: '14', label: 'Days' },
            { num: '14', label: 'Diets' },
          ],
          bullets: [
            'Warm, ghee-based morning meals',
            'Spice blends to match the cold',
            'Family-friendly, easy to scale',
          ],
          price: '₹2,200',
          priceSuffix: 'flat',
          primaryLabel: 'Notify Me',
          primaryIcon: 'notifications_active',
          primaryIntent: 'waitlist',
          primaryVariant: 'filled',
          coverA: '#dc2626',
          coverB: '#991b1b',
          coverImg:
            'https://images.unsplash.com/photo-1574484184081-afea8a62f9c2?w=800&q=80&auto=format&fit=crop',
        },
      ],
    },
    {
      status: 'closed',
      modifier: 'closed',
      heading: 'Off-season — next batch in 2027',
      blurb:
        "These plans run only at certain times of year. Drop your details and we'll WhatsApp you when the next batch opens.",
      emptyIcon: 'event_available',
      emptyTitle: 'No off-season plans archived right now.',
      emptyCopy:
        'Plans that have wrapped up for the year will show here so you can request a re-run.',
      emptyCtaLabel: 'Request a plan',
      plans: [
        {
          slug: 'summer',
          title: 'Summer Cool-Down',
          subtitle:
            'A 10-day hydrating plan with cooling thalis, coolers and electrolyte staples — beat the heat without losing energy.',
          word: 'SUMMER',
          status: 'closed',
          statusLabel: 'Off-season',
          datePill: 'Next batch · Apr 2027',
          stats: [
            { num: '1', label: 'Session' },
            { num: '10', label: 'Days' },
            { num: '10', label: 'Diets' },
          ],
          bullets: [
            'Cooling thalis & coolers daily',
            'Electrolyte & hydration mapping',
            'Travel/work-day friendly portions',
          ],
          price: '₹1,500',
          priceSuffix: 'flat',
          primaryLabel: 'Join Waitlist',
          primaryIcon: 'arrow_forward',
          primaryIntent: 'waitlist',
          primaryVariant: 'outlined',
          coverA: '#fbbf24',
          coverB: '#f97316',
          coverImg:
            'https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80&auto=format&fit=crop',
        },
      ],
    },
  ];

  ngOnInit(): void {
    this.seoService.updateSEO({
      title: 'Seasonal & Group Plans | EatFit247',
      description:
        'Cohort-based seasonal diet plans — Navratri, Diabetic Care, Monsoon Detox, Winter Immunity. Fixed start dates. Flat pricing. Reserve your spot.',
      url: '/seasonal-plans',
    });
  }

  coverStyle(plan: SeasonalPlanCard): Record<string, string> {
    const style: Record<string, string> = {
      '--cover-img': `url('${plan.coverImg}')`,
    };
    if (plan.coverA) style['--cover-a'] = plan.coverA;
    if (plan.coverB) style['--cover-b'] = plan.coverB;
    if (plan.coverBg) style['--cover-bg'] = plan.coverBg;
    if (plan.coverPos) style['--cover-pos'] = plan.coverPos;
    return style;
  }
}
