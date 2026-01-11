import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BannerService } from '../../services/banner.service';
import { ProgramPlanService, ProgramPlan } from '../../services/program-plan.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum, IFaq } from 'eatfit247-shared-library';
import { FaqService } from '../../services/faq.service';
import { FaqItemComponent } from '../shared/faq-item/faq-item.component';
import { SectionFaqComponent } from '../shared/section-faq/section-faq.component';

interface Plan {
  id: string;
  title: string;
  price: number;
  description: string;
  features: string[];
  fees: { fees: number; currencyCode: string }[];
}

@Component({
  selector: 'app-our-programs',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    ImageSliderComponent,
    SectionFaqComponent
  ],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss'
})
export class OurProgramsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly bannerService = inject(BannerService);
  private readonly programPlanService = inject(ProgramPlanService);
  bannerItems: SliderItem[] = [];
  plans: Plan[] = [];
  loading = true;
  faqs: IFaq[] = [];

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadBannerData(), this.loadProgramPlans()]);
    this.loading = false;
  }

  /**
   * Load banner slider data
   */
  private async loadBannerData(): Promise<void> {
    try {
      this.bannerItems = await this.bannerService.getBannerSlidesForPage(BannerForEnum.OUR_PROGRAM);
    } catch (error) {
      console.error('Failed to load banner data:', error);
      this.bannerItems = [];
    }
  }

  /**
   * Load program plans from API
   */
  private async loadProgramPlans(): Promise<void> {
    try {
      const programPlans = await this.programPlanService.getAllProgramPlans();
      this.plans = programPlans.map((plan: ProgramPlan) => this.mapProgramPlanToPlan(plan));
    } catch (error) {
      console.error('Failed to load program plans:', error);
      this.plans = [];
    }
  }

  /**
   * Map ProgramPlan from API to Plan interface
   */
  private mapProgramPlanToPlan(programPlan: ProgramPlan): Plan {
    // Filter fees for INR currency code (default currency)
    const inrFees = programPlan.programPlanFees?.filter((fee) => fee.currencyCode === 'INR') || [];
    // Get INR price from programPlanFees, fallback to first fee or 0
    let price = 0;
    const inrFee = programPlan.programPlanFees?.find((fee) => fee.currencyCode === 'INR');
    if (inrFee) {
      price = inrFee.fees;
    } else if (programPlan.programPlanFees && programPlan.programPlanFees.length > 0) {
      price = programPlan.programPlanFees[0].fees;
    }
    // Strip HTML tags from description
    let description = programPlan.details || '';
    if (description) {
      description = description.replace(/<[^>]*>/g, '').trim();
      // Limit description length
      if (description.length > 150) {
        description = description.substring(0, 150) + '...';
      }
    }
    // Create features array from plan details
    const features: string[] = [];
    if (programPlan.noOfCycle) {
      features.push(`${programPlan.noOfCycle} cycle${programPlan.noOfCycle > 1 ? 's' : ''}`);
    }
    if (programPlan.noOfDaysInCycle) {
      features.push(`${programPlan.noOfDaysInCycle} days per cycle`);
    }
    if (programPlan.isOnline !== undefined) {
      features.push(programPlan.isOnline ? 'Online consultation' : 'In-person consultation');
    }
    if (programPlan.programPlanType) {
      features.push(programPlan.programPlanType);
    }
    return {
      id: programPlan.programPlanId.toString(),
      title: programPlan.plan,
      price: price,
      description: description || 'Nutrition plan tailored to your needs.',
      features:
        features.length > 0
          ? features
          : ['Personalized nutrition plan', 'Expert guidance', 'Regular follow-ups'],
      fees: inrFees
    };
  }

  /**
   * Navigate to checkout page
   */
  viewPlan(plan: Plan): void {
    this.router.navigate(['/checkout'], { queryParams: { plan: plan.id } });
  }
}
