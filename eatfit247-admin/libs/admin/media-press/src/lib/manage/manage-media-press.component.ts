import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'lib-manage-media-press',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ pageTitle }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Media & Press manage component - Coming Soon</p>
        <button mat-raised-button (click)="onCancel()">
          <mat-icon>arrow_back</mat-icon>
          Back
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: ['.form-card { margin: 20px; }']
})
export class ManageMediaPress implements OnInit {
  pageTitle = 'Create Media & Press';
  isEditMode = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Media & Press';
    }
  }

  onCancel(): void {
    this.router.navigate(['/media-press']);
  }
}
