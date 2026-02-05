import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteHeaderComponent } from '../header/site-header.component';
import { SiteFooterComponent } from '../footer/site-footer.component';

@Component({
  standalone: true,
  selector: 'app-base-layout',
  imports: [CommonModule, RouterOutlet, SiteHeaderComponent, SiteFooterComponent],
  templateUrl: './base-layout.component.html',
  styleUrl: './base-layout.component.scss',
})
export class BaseLayoutComponent {}


