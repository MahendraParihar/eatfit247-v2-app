import { Component } from '@angular/core';

@Component({
  selector: 'app-section',
  standalone: true,
  template: `<ng-content />`,
  styleUrl: './section.component.scss',
})
export class SectionComponent {}

