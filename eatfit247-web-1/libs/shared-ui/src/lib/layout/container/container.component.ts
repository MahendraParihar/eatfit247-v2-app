import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-container',
  imports: [CommonModule],
  template: `<ng-content></ng-content>`,
  styleUrl: './container.component.scss',
})
export class ContainerComponent {}

