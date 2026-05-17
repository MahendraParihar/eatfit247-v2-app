import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BreadcrumbsComponent } from '@shared-ui';

@Component({
  standalone: true,
  selector: 'app-not-found',
  imports: [CommonModule, RouterLink, BreadcrumbsComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
