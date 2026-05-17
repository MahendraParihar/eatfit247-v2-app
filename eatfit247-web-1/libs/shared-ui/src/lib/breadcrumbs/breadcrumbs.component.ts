import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'app-breadcrumbs', 'aria-label': 'Breadcrumb' },
})
export class BreadcrumbsComponent {
  @Input({ required: true }) crumbs: ReadonlyArray<BreadcrumbItem> = [];
}
