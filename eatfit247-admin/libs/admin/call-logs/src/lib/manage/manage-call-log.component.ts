import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { IconComponent } from '@shared';

@Component({
  selector: 'lib-manage-call-log',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, IconComponent],
  template: `
    <mat-card class="form-card">
      <mat-card-header>
        <mat-card-title>{{ pageTitle }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Call Log manage component - Coming Soon</p>
        <button mat-raised-button (click)="onCancel()">
          <shared-ui-icon name="arrow_back" size="small"></shared-ui-icon>
          Back
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: ['.form-card { margin: 20px; }']
})
export class ManageCallLog implements OnInit {
  pageTitle = 'Create Call Log';
  isEditMode = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.pageTitle = 'Edit Call Log';
    }
  }

  onCancel(): void {
    this.router.navigate(['/call-logs']);
  }
}
