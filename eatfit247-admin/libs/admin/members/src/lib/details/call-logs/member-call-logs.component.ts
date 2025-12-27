import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'lib-member-call-logs',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Member Call Logs</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Call logs content will be displayed here.</p>
      </mat-card-content>
    </mat-card>
  `,
})
export class MemberCallLogsComponent implements OnInit {
  memberId!: number;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.memberId = +params['id'];
    });
  }
}
