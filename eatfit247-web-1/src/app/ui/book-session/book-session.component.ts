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
import {
  HttpService,
  ProgramService,
  SEOService,
  SeasonalProgramCard,
} from '../../core/services';
import { RecaptchaService } from '../../core/services/recaptcha.service';
import { CONTACT_NUMBER } from '../../core/utils/constants';

type ContactPreference = 'whatsapp' | 'call' | 'email' | 'any';

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
  private readonly programService = inject(ProgramService);
  private readonly httpService = inject(HttpService);
  private readonly recaptchaService = inject(RecaptchaService);

  readonly contactNumber = CONTACT_NUMBER;

  readonly plans = signal<SeasonalProgramCard[]>([]);
  readonly loadingPlans = signal(true);

  readonly form = {
    plan: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    message: '',
    contact: 'whatsapp' as ContactPreference,
    consent: false,
  };

  readonly isWaitlist = signal(false);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submittedName = signal('there');
  readonly submittedPlanName = signal('your plan');
  readonly errorMessage = signal('');

  readonly selectedPlan = computed<SeasonalProgramCard | undefined>(() =>
    this.plans().find((p) => p.slug === this.form.plan),
  );

  async ngOnInit(): Promise<void> {
    this.seoService.updateSEO({
      title: this.isWaitlist()
        ? 'Join Waitlist | EatFit247'
        : 'Reserve your spot | EatFit247',
      description:
        "Reserve your seat in an upcoming EatFit247 seasonal plan. Free reservation — our team WhatsApps you to confirm and shares offline payment details.",
      url: '/book-session',
    });

    const params = this.route.snapshot.queryParamMap;
    const planSlug = params.get('plan');
    this.isWaitlist.set(params.get('intent') === 'waitlist');

    this.loadingPlans.set(true);
    try {
      const programs = await this.programService.getSeasonalPrograms();
      this.plans.set(programs);
      if (planSlug && programs.some((p) => p.slug === planSlug)) {
        this.form.plan = planSlug;
      }
    } finally {
      this.loadingPlans.set(false);
    }
  }

  onPlanChange(): void {
    const plan = this.selectedPlan();
    if (plan) {
      this.isWaitlist.set(plan.ctaIntent === 'waitlist');
    }
  }

  async onSubmit(formValid: boolean): Promise<void> {
    if (!formValid || this.submitting()) return;
    const plan = this.selectedPlan();
    if (!plan) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    try {
      let recaptchaToken: string | undefined;
      if (this.recaptchaService.isAvailable()) {
        try {
          recaptchaToken = await this.recaptchaService.getToken(
            'contact_form_submit',
          );
        } catch {
          this.errorMessage.set(
            'Failed to verify reCAPTCHA. Please refresh the page and try again.',
          );
          this.submitting.set(false);
          return;
        }
      }

      const payload = this.buildContactPayload(plan);
      const headers: Record<string, string> = {};
      if (recaptchaToken) headers['X-Recaptcha-Token'] = recaptchaToken;

      await this.httpService.post<{ contactFormId: number; message: string }>(
        'contact/submit',
        payload,
        { headers },
      );

      const firstName =
        (this.form.name || 'there').trim().split(/\s+/)[0] || 'there';
      this.submittedName.set(firstName);
      this.submittedPlanName.set(plan.title);
      this.submitted.set(true);

      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      const msg = (error as { message?: string })?.message;
      this.errorMessage.set(
        msg || 'Failed to submit. Please try again in a moment.',
      );
    } finally {
      this.submitting.set(false);
    }
  }

  private buildContactPayload(plan: SeasonalProgramCard): {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message?: string;
  } {
    const name = this.form.name.trim();
    const email = this.form.email.trim();
    const phone = this.form.phone.trim();
    const city = this.form.city.trim();
    const userMessage = this.form.message.trim();
    const intent = this.isWaitlist() ? 'Waitlist' : 'Reservation';
    const contactLabel = this.contactLabel(this.form.contact);

    const subject = `[Seasonal Plan ${intent}] ${plan.title}`.slice(0, 200);

    const lines: string[] = [
      `Enquiry type: Seasonal plan ${intent.toLowerCase()}`,
      `Plan: ${plan.title} (${plan.statusLabel})`,
      `Schedule: ${plan.datePill}`,
    ];
    if (city) lines.push(`City: ${city}`);
    lines.push(`Preferred contact: ${contactLabel}`);
    if (userMessage) {
      lines.push('');
      lines.push('Message from user:');
      lines.push(userMessage);
    }

    return {
      name,
      email,
      phone: phone || undefined,
      subject,
      message: lines.join('\n').slice(0, 1000),
    };
  }

  private contactLabel(pref: ContactPreference): string {
    switch (pref) {
      case 'whatsapp':
        return 'WhatsApp';
      case 'call':
        return 'Phone call';
      case 'email':
        return 'Email';
      default:
        return 'Any of the above';
    }
  }
}
