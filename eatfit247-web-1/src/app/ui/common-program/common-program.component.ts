import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Program } from '../../core/interfaces/program.interface';

@Component({
  standalone: true,
  selector: 'app-common-program',
  imports: [CommonModule],
  templateUrl: './common-program.component.html',
  styleUrl: './common-program.component.scss',
})
export class CommonProgramComponent {
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
          note: '',
        },
        {
          programPlanId: 261,
          label: '6 Sessions',
          note: '',
        },
        {
          programPlanId: 262,
          label: '8 Sessions',
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
          note: '',
        },
        {
          programPlanId: 266,
          label: '6 Sessions',
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

  getPlanCount(label: string): string {
    return label.split(' ')[0];
  }

  getPlanUnit(label: string): string {
    return label.split(' ').slice(1).join(' ');
  }
}
