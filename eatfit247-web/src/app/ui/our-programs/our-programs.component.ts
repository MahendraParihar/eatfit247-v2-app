import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProgramService, Program } from '../../services/program.service';

@Component({
  selector: 'app-our-programs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss',
})
export class OurProgramsComponent {
  private readonly router = inject(Router);
  private readonly programService = inject(ProgramService);

  readonly programs: Program[] = this.programService.getAllPrograms();

  onQuickView(program: Program): void {
    // Navigate to program details page
    this.router.navigate(['/our-programs', program.id]);
  }

  onBuyNow(program: Program): void {
    // Navigate to program details page
    this.router.navigate(['/our-programs', program.id]);
  }
}
