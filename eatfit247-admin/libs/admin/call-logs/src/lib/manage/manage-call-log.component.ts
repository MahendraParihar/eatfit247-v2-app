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
  templateUrl: './manage-call-log.component.html',
  styleUrl: './manage-call-log.component.scss'
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
