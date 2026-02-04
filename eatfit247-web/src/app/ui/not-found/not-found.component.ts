import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SEOService } from '../../services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent implements OnInit {
  private seoService = inject(SEOService);
  private router = inject(Router);

  ngOnInit(): void {
    // Update SEO for 404 page
    this.seoService.updateSEO({
      title: '404 - Page Not Found | EatFit24By7',
      description: 'The page you are looking for could not be found. Return to EatFit24By7 homepage to explore our health and wellness programs.',
    });
  }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    window.history.back();
  }
}

