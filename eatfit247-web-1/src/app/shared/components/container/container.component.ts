import { Component } from '@angular/core';

@Component({
  selector: 'app-container',
  standalone: true,
  template: `<ng-content />`,
  styleUrl: './container.component.scss',
})
export class ContainerComponent {}

