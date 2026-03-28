import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Program } from '../../core/interfaces/program.interface';
import { Router, RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-common-program',
  imports: [CommonModule, MatIcon, MatButton, RouterLink],
  templateUrl: './common-program.component.html',
  styleUrl: './common-program.component.scss',
})
export class CommonProgramComponent implements OnInit {
  private readonly router = inject(Router);
  readonly title = 'Nutritional Consultations & Wellness Programs';
  readonly tagline = 'Personalised • Natural • Sustainable';
  readonly programs: Program[] = [
    {
      id: 'exclusive-shweta',
      name: 'Exclusively with Shweta Shah',
      subtitle: 'Personalised journey with expert guidance',
      prices: [
        {
          programPlanId: 263,
          label: '1 session',
          value: '₹20,000',
          note: '',
        },
        {
          programPlanId: 261,
          label: '6 Sessions',
          value: '₹67,500',
          note: 'Best Value',
        },
        {
          programPlanId: 262,
          label: '8 Sessions',
          value: '₹90,000',
          note: '',
        },
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
      subtitle: 'Experience of 16 years',
      badge: 'Most Popular',
      prices: [
        {
          programPlanId: 239,
          label: '3 Sessions',
          value: '₹15,000',
          note: '',
        },
        {
          programPlanId: 266,
          label: '6 Sessions',
          value: '₹30,000',
          note: '',
        },
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
      id: 'shweta-and-team',
      name: 'Plan with Shweta + Team',
      subtitle: 'Collaborative approach',
      prices: [
        {
          programPlanId: 264,
          label: '1+7 Sessions',
          value: '₹55,000',
          note: '',
        },
      ],
      features: [
        'Initial consultation with Shweta',
        '7 follow-up Sessions with team',
        'Personalized nutrition plan',
        'Detailed dietary recommendations',
        'Follow-up guidelines',
      ],
    },
  ];
  @Input() showFeature = false;
  @Input() showReadMoreBtn = false;

  ngOnInit(): void {}

  buyNow(programPlanId: number): void {
    const queryParams: any = {
      plan: programPlanId,
    };
    this.router.navigate(['/checkout'], { queryParams });
  }
}
