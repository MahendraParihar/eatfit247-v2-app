import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-section',
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styleUrl: './section.component.scss',
})
export class SectionComponent {}

