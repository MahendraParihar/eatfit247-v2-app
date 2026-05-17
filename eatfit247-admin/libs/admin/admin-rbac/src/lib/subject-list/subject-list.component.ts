import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminRbacApiService } from '../api.service';
import { IAdminSubject } from '@eatfit247-shared-lib';

@Component({
  selector: 'lib-subject-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './subject-list.html',
  styleUrl: './subject-list.scss',
})
export class SubjectList implements OnInit {
  private apiService = inject(AdminRbacApiService);

  subjects: IAdminSubject[] = [];
  loading = false;
  displayedColumns = ['subjectCode', 'subjectName', 'franchiseScoped', 'active', 'createdAt'];

  async ngOnInit(): Promise<void> {
    this.loading = true;
    try {
      this.subjects = await this.apiService.getSubjectList();
    } finally {
      this.loading = false;
    }
  }
}
