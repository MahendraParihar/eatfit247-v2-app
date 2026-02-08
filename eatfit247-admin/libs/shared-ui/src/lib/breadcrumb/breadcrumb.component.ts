/**
 * Breadcrumb Component
 * 
 * ⚠️ DESIGN SYSTEM: See DESIGN_SYSTEM.md
 * Displays breadcrumb navigation based on current route
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { BreadcrumbService } from '@core';
import { BreadcrumbItem } from '@core';

@Component({
  selector: 'shared-ui-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  breadcrumbs: BreadcrumbItem[] = [];

  ngOnInit(): void {
    this.breadcrumbService.breadcrumbs$.subscribe((breadcrumbs) => {
      this.breadcrumbs = breadcrumbs;
    });
  }
}

