import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgramPlan, ProgramPlanService } from '../../../services/program-plan.service';

interface Plan {
  id: number;
  title: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  url: string;
  isPopular?: boolean;
}

/**
 * Program Plans Section Component
 * Displays program plans in a card grid, highlighting popular plans
 */
@Component({
  selector: 'app-program-plans-section',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './program-plans-section.component.html',
  styleUrl: './program-plans-section.component.scss',
})
export class ProgramPlansSectionComponent implements OnInit {
  private readonly programPlanService = inject(ProgramPlanService);
  private readonly router = inject(Router);

  plans: Plan[] = [];
  loading = false;

  ngOnInit(): void {
    this.loadProgramPlans();
  }

  /**
   * Load program plans from API
   */
  private async loadProgramPlans(): Promise<void> {
    this.loading = true;
    try {
      const programPlans = await this.programPlanService.getAllProgramPlans();
      this.plans = programPlans
        .slice(0, 6) // Show max 6 plans on home page
        .map((plan: ProgramPlan, index: number) => this.mapProgramPlanToPlan(plan, index));
    } catch (error) {
      console.error('Failed to load program plans:', error);
      this.plans = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Map ProgramPlan from API to Plan interface
   */
  private mapProgramPlanToPlan(programPlan: ProgramPlan, index: number): Plan {
    // Filter fees for INR currency code (default currency)
    const inrFees = programPlan.programPlanFees?.filter((fee) => fee.currencyCode === 'INR');
    const price = inrFees && inrFees.length > 0 ? inrFees[0].fees : 0;
    const currency = inrFees && inrFees.length > 0 ? inrFees[0].currencyCode : 'INR';

    // Extract features from details (simple parsing)
    const features = this.extractFeatures(programPlan.details || '');

    // Mark first plan as popular (or can be based on API flag if available)
    const isPopular = index === 0;

    return {
      id: programPlan.programPlanId,
      title: programPlan.plan,
      description: programPlan.details || '',
      price: price,
      currency: currency,
      features: features,
      url: programPlan.url || `/program/${programPlan.programPlanId}`,
      isPopular: isPopular,
    };
  }

  /**
   * Extract features from description text
   */
  private extractFeatures(description: string): string[] {
    if (!description) return [];

    // Simple feature extraction - split by common delimiters
    const lines = description.split(/[•\-\n]/).filter(line => line.trim().length > 0);
    return lines.slice(0, 4).map(line => line.trim()); // Max 4 features
  }

  /**
   * Navigate to program plan details
   */
  viewPlan(plan: Plan): void {
    if (plan.url) {
      if (plan.url.startsWith('http')) {
        window.open(plan.url, '_blank', 'noopener,noreferrer');
      } else {
        this.router.navigate([plan.url]);
      }
    }
  }
}

