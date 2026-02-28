import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IRateQuote } from 'eatfit247-shared-library';

@Component({
  selector: 'lib-provider-step',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './provider-step.component.html',
  styleUrl: './provider-step.component.scss',
})
export class ProviderStepComponent {
  @Input() selectedRate: IRateQuote | null = null;
}
