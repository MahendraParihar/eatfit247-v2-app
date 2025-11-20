import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { ProgramService, ProgramDetails } from '../../services/program.service';

/**
 * Program Details Component
 * Dynamic component that displays detailed information for any program
 * Loads program data based on route parameter (id)
 */
@Component({
  selector: 'app-program-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
  ],
  templateUrl: './program-details.component.html',
  styleUrl: './program-details.component.scss',
})
export class ProgramDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly programService = inject(ProgramService);

  program: ProgramDetails | undefined;
  programId: string | null = null;
  loading = true;
  notFound = false;

  ngOnInit(): void {
    // Get program ID from route parameter
    this.programId = this.route.snapshot.paramMap.get('id');

    if (this.programId) {
      this.loadProgram(this.programId);
    } else {
      this.loading = false;
      this.notFound = true;
    }
  }

  /**
   * Load program details by ID
   */
  private loadProgram(id: string): void {
    this.program = this.programService.getProgramById(id);

    if (!this.program) {
      this.notFound = true;
    }

    this.loading = false;
  }

  /**
   * Navigate back to programs list
   */
  goBack(): void {
    this.router.navigate(['/our-programs']);
  }

  /**
   * Handle buy now action
   */
  onBuyNow(): void {
    // TODO: Implement buy now functionality
    console.log('Buy now:', this.program);
  }

  /**
   * Handle add to cart action
   */
  onAddToCart(): void {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', this.program);
  }
}

