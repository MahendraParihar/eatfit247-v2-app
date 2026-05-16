import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbsComponent } from '@shared-ui';
import { SEOService } from '../../core/services';
import { CONTACT_NUMBER } from '../../core/utils/constants';

interface PlanMeta {
  slug: string;
  name: string;
  sessions: string;
  days: string;
  diets: string;
  price: string;
  start: string;
  selectLabel: string;
}

@Component({
  standalone: true,
  selector: 'app-book-session',
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbsComponent],
  templateUrl: './book-session.component.html',
  styleUrl: './book-session.component.scss',
})
export class BookSessionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SEOService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly contactNumber = CONTACT_NUMBER;

  readonly plans: PlanMeta[] = [
    {
      slug: 'navratri',
      name: 'Navratri Special',
      sessions: '1',
      days: '10',
      diets: '10',
      price: '₹1,500',
      start: 'Oct 3, 2026',
      selectLabel: 'Navratri Special — 1 session × 10 days · ₹1,500',
    },
    {
      slug: 'diabetic',
      name: 'Diabetic Care Plan',
      sessions: '2',
      days: '10 + 10',
      diets: '20',
      price: '₹2,000',
      start: 'Next batch monthly',
      selectLabel: 'Diabetic Care Plan — 2 sessions × 10 days · ₹2,000',
    },
    {
      slug: 'monsoon',
      name: 'Monsoon Detox',
      sessions: '1',
      days: '10',
      diets: '10',
      price: '₹1,800',
      start: 'Jul 15, 2026',
      selectLabel: 'Monsoon Detox — 1 session × 10 days · ₹1,800',
    },
    {
      slug: 'winter',
      name: 'Winter Immunity',
      sessions: '1',
      days: '14',
      diets: '14',
      price: '₹2,200',
      start: 'Dec 1, 2026',
      selectLabel: 'Winter Immunity — 1 session × 14 days · ₹2,200',
    },
    {
      slug: 'summer',
      name: 'Summer Cool-Down',
      sessions: '1',
      days: '10',
      diets: '10',
      price: '₹1,500',
      start: 'Apr 10, 2026',
      selectLabel: 'Summer Cool-Down — 1 session × 10 days · ₹1,500',
    },
    {
      slug: 'postpartum',
      name: 'Postpartum Recovery',
      sessions: '3',
      days: '30',
      diets: '30',
      price: '₹3,500',
      start: 'Rolling start',
      selectLabel: 'Postpartum Recovery — 3 sessions × 10 days · ₹3,500',
    },
  ];

  readonly form = {
    plan: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    message: '',
    contact: 'whatsapp',
    consent: false,
  };

  readonly isWaitlist = signal(false);
  readonly submitted = signal(false);
  readonly submittedName = signal('there');
  readonly submittedPlanName = signal('your plan');

  readonly selectedPlan = computed<PlanMeta | undefined>(() =>
    this.plans.find((p) => p.slug === this.form.plan),
  );

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const planSlug = params.get('plan');
    if (planSlug && this.plans.some((p) => p.slug === planSlug)) {
      this.form.plan = planSlug;
    }
    this.isWaitlist.set(params.get('intent') === 'waitlist');

    this.seoService.updateSEO({
      title: this.isWaitlist()
        ? 'Join Waitlist | EatFit247'
        : 'Reserve your spot | EatFit247',
      description:
        "Reserve your seat in an upcoming EatFit247 seasonal plan. Free reservation — our team WhatsApps you to confirm and shares offline payment details.",
      url: '/book-session',
    });
  }

  onPlanChange(): void {
    // selectedPlan is computed; nothing else to do here
  }

  onSubmit(formValid: boolean): void {
    if (!formValid) return;
    const plan = this.selectedPlan();
    const firstName = (this.form.name || 'there').trim().split(/\s+/)[0] || 'there';
    this.submittedName.set(firstName);
    this.submittedPlanName.set(plan ? plan.name : 'your plan');
    this.submitted.set(true);
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
