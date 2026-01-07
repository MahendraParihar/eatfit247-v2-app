import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProgramService, Program } from '../../services/program.service';
import { BannerService } from '../../services/banner.service';
import { ImageSliderComponent, SliderItem } from '../shared/image-slider/image-slider.component';
import { BannerForEnum } from 'eatfit247-shared-library';

@Component({
  selector: 'app-our-programs',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    ImageSliderComponent,
  ],
  templateUrl: './our-programs.component.html',
  styleUrl: './our-programs.component.scss',
})
export class OurProgramsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly programService = inject(ProgramService);
  private readonly bannerService = inject(BannerService);

  bannerItems: SliderItem[] = [];
  readonly programs: Program[] = this.programService.getAllPrograms();

  ngOnInit(): void {
    this.loadBannerData();
  }

  /**
   * Load banner slider data
   */
  private loadBannerData(): void {
    this.bannerService.getBannerSlidesForPage(BannerForEnum.OUR_PROGRAM).subscribe({
      next: (items) => {
        this.bannerItems = items;
      },
      error: (error) => {
        console.error('Failed to load banner data:', error);
        this.bannerItems = [];
      },
    });
  }

  onQuickView(program: Program): void {
    // Navigate to program details page
    this.router.navigate(['/our-programs', program.id]);
  }

  onBuyNow(program: Program): void {
    // Navigate to program details page
    this.router.navigate(['/our-programs', program.id]);
  }
}
